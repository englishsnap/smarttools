import { useEffect, useRef, useState } from "react";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  PageBreak,
} from "docx";
import * as pdfjsLib from "pdfjs-dist/build/pdf.mjs";
import "./PDFToWord.css";

/* =========================================
   PDF.JS WORKER
   ========================================= */

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).toString();

/* =========================================
   CONSTANTS
   ========================================= */

const MAX_FILE_SIZE = 25 * 1024 * 1024;

/* =========================================
   TEXT RECONSTRUCTION
   ========================================= */

const reconstructPageText = (items) => {
  const textItems = items
    .filter(
      (item) =>
        typeof item.str === "string" &&
        item.str.trim().length > 0 &&
        Array.isArray(item.transform)
    )
    .map((item) => {
      const x = item.transform[4];
      const y = item.transform[5];
      const fontSize = Math.abs(item.transform[3]) || 10;

      return {
        text: item.str.trim(),
        x,
        y,
        width: item.width || 0,
        fontSize,
      };
    });

  if (textItems.length === 0) {
    return "";
  }

  const lines = [];

  textItems.forEach((item) => {
    const tolerance = Math.max(3, item.fontSize * 0.35);

    let matchingLine = null;

    for (const line of lines) {
      if (Math.abs(line.y - item.y) <= tolerance) {
        matchingLine = line;
        break;
      }
    }

    if (matchingLine) {
      matchingLine.items.push(item);

      const totalY = matchingLine.items.reduce(
        (sum, currentItem) => sum + currentItem.y,
        0
      );

      matchingLine.y =
        totalY / matchingLine.items.length;
    } else {
      lines.push({
        y: item.y,
        items: [item],
      });
    }
  });

  /* Sort lines from top to bottom */
  lines.sort((a, b) => b.y - a.y);

  const reconstructedLines = [];

  lines.forEach((line) => {
    /* Sort text from left to right */
    line.items.sort((a, b) => a.x - b.x);

    let lineText = "";

    line.items.forEach((item, index) => {
      if (index === 0) {
        lineText = item.text;
        return;
      }

      const previousItem = line.items[index - 1];

      const previousRight =
        previousItem.x + previousItem.width;

      const gap = item.x - previousRight;

      if (gap <= Math.max(8, item.fontSize * 0.6)) {
        lineText += ` ${item.text}`;
      } else {
        lineText += `    ${item.text}`;
      }
    });

    reconstructedLines.push(lineText.trim());
  });

  /* Remove unnecessary empty lines */
  while (
    reconstructedLines.length > 0 &&
    !reconstructedLines[0]
  ) {
    reconstructedLines.shift();
  }

  while (
    reconstructedLines.length > 0 &&
    !reconstructedLines[reconstructedLines.length - 1]
  ) {
    reconstructedLines.pop();
  }

  return reconstructedLines.join("\n");
};

/* =========================================
   MAIN COMPONENT
   ========================================= */

const PDFToWord = () => {
  /* =========================================
     STATE
     ========================================= */

  const [file, setFile] = useState(null);

  const [isDragging, setIsDragging] =
    useState(false);

  const [error, setError] = useState("");

  const [isExtracting, setIsExtracting] =
    useState(false);

  const [extractionProgress, setExtractionProgress] =
    useState(0);

  const [currentPage, setCurrentPage] =
    useState(0);

  const [totalPages, setTotalPages] =
    useState(0);

  const [extractedText, setExtractedText] =
    useState("");

  const [pageTexts, setPageTexts] =
    useState([]);

  const [isGenerating, setIsGenerating] =
    useState(false);

  const [downloadUrl, setDownloadUrl] =
    useState("");

  const [outputFileName, setOutputFileName] =
    useState("");

  const fileInputRef = useRef(null);

  /* =========================================
     SEO
     ========================================= */

  useEffect(() => {
    document.title =
      "PDF to Word Converter Online Free | Smart Tools";

    const description =
      "Convert PDF files to editable Word documents online for free. Extract text from PDF files and download it as a DOCX document.";

    let metaDescription = document.querySelector(
      'meta[name="description"]'
    );

    if (!metaDescription) {
      metaDescription =
        document.createElement("meta");

      metaDescription.setAttribute(
        "name",
        "description"
      );

      document.head.appendChild(metaDescription);
    }

    metaDescription.setAttribute(
      "content",
      description
    );

    return () => {
      document.title = "Smart Tools";
    };
  }, []);

  /* =========================================
     CLEAN UP DOWNLOAD URL
     ========================================= */

  useEffect(() => {
    return () => {
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [downloadUrl]);

  /* =========================================
     FORMAT FILE SIZE
     ========================================= */

  const formatFileSize = (bytes) => {
    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  /* =========================================
     VALIDATE FILE
     ========================================= */

  const validateFile = (selectedFile) => {
    if (!selectedFile) {
      return "Please select a PDF file.";
    }

    const isPDF =
      selectedFile.type === "application/pdf" ||
      selectedFile.name.toLowerCase().endsWith(".pdf");

    if (!isPDF) {
      return "Please select a valid PDF file.";
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      return "The PDF file is too large. Maximum file size is 25 MB.";
    }

    return "";
  };

  /* =========================================
     CLEAR DOWNLOAD URL
     ========================================= */

  const clearDownloadUrl = () => {
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
    }

    setDownloadUrl("");
    setOutputFileName("");
  };

  /* =========================================
     HANDLE FILE SELECTION
     ========================================= */

  const handleFileSelect = (selectedFile) => {
    setError("");

    if (!selectedFile) {
      return;
    }

    const validationError =
      validateFile(selectedFile);

    if (validationError) {
      setError(validationError);
      return;
    }

    clearDownloadUrl();

    setFile(selectedFile);
    setExtractedText("");
    setPageTexts([]);
    setExtractionProgress(0);
    setCurrentPage(0);
    setTotalPages(0);
  };

  /* =========================================
     FILE INPUT
     ========================================= */

  const handleInputChange = (event) => {
    const selectedFile =
      event.target.files?.[0];

    handleFileSelect(selectedFile);

    event.target.value = "";
  };

  /* =========================================
     BROWSE BUTTON
     ========================================= */

  const openFilePicker = () => {
    if (isExtracting || isGenerating) {
      return;
    }

    fileInputRef.current?.click();
  };

  /* =========================================
     DRAG EVENTS
     ========================================= */

  const handleDragOver = (event) => {
    event.preventDefault();

    if (isExtracting || isGenerating) {
      return;
    }

    setIsDragging(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();

    setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();

    setIsDragging(false);

    if (isExtracting || isGenerating) {
      return;
    }

    const droppedFile =
      event.dataTransfer.files?.[0];

    handleFileSelect(droppedFile);
  };

  /* =========================================
     REMOVE FILE
     ========================================= */

  const removeFile = () => {
    if (isExtracting || isGenerating) {
      return;
    }

    clearDownloadUrl();

    setFile(null);
    setError("");
    setExtractedText("");
    setPageTexts([]);
    setExtractionProgress(0);
    setCurrentPage(0);
    setTotalPages(0);
  };

  /* =========================================
     EXTRACT PDF TEXT
     ========================================= */

  const extractPDFText = async () => {
    if (!file) {
      setError("Please select a PDF file first.");
      return;
    }

    setError("");
    setIsExtracting(true);
    setExtractionProgress(0);
    setCurrentPage(0);
    setTotalPages(0);
    setExtractedText("");
    setPageTexts([]);
    clearDownloadUrl();

    try {
      const arrayBuffer =
        await file.arrayBuffer();

      const loadingTask =
        pdfjsLib.getDocument({
          data: new Uint8Array(arrayBuffer),
        });

      const pdf =
        await loadingTask.promise;

      const total =
        pdf.numPages;

      setTotalPages(total);

      const extractedPages = [];

      for (
        let pageNumber = 1;
        pageNumber <= total;
        pageNumber++
      ) {
        setCurrentPage(pageNumber);

        const page =
          await pdf.getPage(pageNumber);

        const textContent =
          await page.getTextContent();

        const pageText =
          reconstructPageText(
            textContent.items
          );

        extractedPages.push(pageText);

        page.cleanup();

        const progress =
          Math.round(
            (pageNumber / total) * 100
          );

        setExtractionProgress(
          progress
        );

        /*
         * Allow the browser UI to update
         * between pages.
         */
        await new Promise((resolve) =>
          setTimeout(resolve, 0)
        );
      }

      const combinedText =
        extractedPages
          .filter(
            (text) =>
              text &&
              text.trim().length > 0
          )
          .join("\n\n");

      if (!combinedText.trim()) {
        throw new Error(
          "No selectable text was found in this PDF. It may be a scanned or image-only PDF."
        );
      }

      setPageTexts(
        extractedPages
      );

      setExtractedText(
        combinedText
      );
    } catch (conversionError) {
      console.error(
        "PDF text extraction error:",
        conversionError
      );

      let message =
        "Unable to extract text from this PDF.";

      if (
        conversionError?.message?.toLowerCase().includes(
          "password"
        )
      ) {
        message =
          "This PDF appears to be password-protected or encrypted. Please use an unlocked PDF.";
      } else if (
        conversionError?.message?.toLowerCase().includes(
          "no selectable text"
        )
      ) {
        message =
          "No selectable text was found. Scanned or image-only PDFs are not supported by this version.";
      } else if (
        conversionError?.message
      ) {
        message =
          conversionError.message;
      }

      setError(message);
      setExtractedText("");
      setPageTexts([]);
    } finally {
      setIsExtracting(false);
    }
  };

  /* =========================================
     CREATE WORD FILE NAME
     ========================================= */

  const createWordFileName = () => {
    const originalName =
      file?.name || "document.pdf";

    const withoutExtension =
      originalName.replace(
        /\.pdf$/i,
        ""
      );

    return `${withoutExtension}.docx`;
  };

  /* =========================================
     CREATE WORD PARAGRAPHS
     ========================================= */

  const createWordParagraphs = () => {
    const paragraphs = [];

    pageTexts.forEach(
      (pageText, pageIndex) => {
        const lines = pageText
          .split("\n")
          .map((line) =>
            line.trim()
          )
          .filter(Boolean);

        let currentParagraph = [];

        const addCurrentParagraph =
          () => {
            if (
              currentParagraph.length ===
              0
            ) {
              return;
            }

            const paragraphText =
              currentParagraph
                .join(" ")
                .trim();

            if (paragraphText) {
              paragraphs.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: paragraphText,
                      size: 22,
                    }),
                  ],
                  spacing: {
                    after: 180,
                    line: 276,
                  },
                })
              );
            }

            currentParagraph = [];
          };

        lines.forEach(
          (line, lineIndex) => {
            const previousLine =
              lines[lineIndex - 1];

            const endsSentence =
              /[.!?:;]$/.test(
                line
              );

            const isShortLine =
              line.length < 80;

            currentParagraph.push(
              line
            );

            if (
              endsSentence &&
              !isShortLine
            ) {
              addCurrentParagraph();
            }

            if (
              lineIndex > 0 &&
              isShortLine &&
              previousLine &&
              previousLine.length < 80
            ) {
              addCurrentParagraph();
            }
          }
        );

        addCurrentParagraph();

        /*
         * Preserve page separation
         * inside the generated Word file.
         */
        if (
          pageIndex <
          pageTexts.length - 1
        ) {
          paragraphs.push(
            new Paragraph({
              children: [
                new PageBreak(),
              ],
            })
          );
        }
      }
    );

    return paragraphs;
  };

  /* =========================================
     GENERATE WORD DOCUMENT
     ========================================= */

  const generateWordDocument =
    async () => {
      if (
        !file ||
        pageTexts.length === 0
      ) {
        setError(
          "Please extract text from a PDF before generating the Word document."
        );

        return;
      }

      setError("");
      setIsGenerating(true);
      clearDownloadUrl();

      try {
        const paragraphs =
          createWordParagraphs();

        if (
          paragraphs.length === 0
        ) {
          throw new Error(
            "There is no extracted text available to create the Word document."
          );
        }

        const document =
          new Document({
            creator:
              "Smart Tools",

            title:
              file.name.replace(
                /\.pdf$/i,
                ""
              ),

            description:
              "Word document created from a PDF using Smart Tools.",

            sections: [
              {
                properties: {},
                children:
                  paragraphs,
              },
            ],
          });

        const blob =
          await Packer.toBlob(
            document
          );

        const url =
          URL.createObjectURL(
            blob
          );

        setDownloadUrl(url);
        setOutputFileName(
          createWordFileName()
        );
      } catch (generationError) {
        console.error(
          "Word generation error:",
          generationError
        );

        setError(
          "Unable to generate the Word document. Please try again."
        );
      } finally {
        setIsGenerating(false);
      }
    };

  /* =========================================
     START OVER
     ========================================= */

  const startOver = () => {
    if (isGenerating) {
      return;
    }

    clearDownloadUrl();

    setFile(null);
    setError("");
    setIsExtracting(false);
    setExtractionProgress(0);
    setCurrentPage(0);
    setTotalPages(0);
    setExtractedText("");
    setPageTexts([]);
    setIsGenerating(false);
  };

  /* =========================================
     RENDER
     ========================================= */

  return (
    <section className="pdf-to-word-section">
      <div className="pdf-to-word-container">

        {/* =====================================
            HEADER
            ===================================== */}

        <div className="pdf-to-word-header">
          <h1>
            PDF to Word Converter
          </h1>

          <p>
            Convert PDF files into
            editable Word documents
            quickly and easily.
          </p>
        </div>

        {/* =====================================
            UPLOAD AREA
            ===================================== */}

        {!file && (
          <>
            <div
              className={`pdf-to-word-upload ${
                isDragging
                  ? "pdf-to-word-upload-active"
                  : ""
              }`}
              onDragOver={
                handleDragOver
              }
              onDragLeave={
                handleDragLeave
              }
              onDrop={handleDrop}
              onClick={
                openFilePicker
              }
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (
                  event.key ===
                    "Enter" ||
                  event.key ===
                    " "
                ) {
                  openFilePicker();
                }
              }}
            >
              <div className="pdf-to-word-upload-icon">
                📄
              </div>

              <h3>
                Drop your PDF here
              </h3>

              <p>
                or select a PDF file
                from your device
              </p>

              <button
                type="button"
                className="pdf-to-word-browse-btn"
                onClick={(event) => {
                  event.stopPropagation();
                  openFilePicker();
                }}
              >
                Choose PDF File
              </button>

              <div className="pdf-to-word-upload-note">
                Maximum file size: 25 MB
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              onChange={
                handleInputChange
              }
              style={{
                display: "none",
              }}
            />
          </>
        )}

        {/* =====================================
            ERROR
            ===================================== */}

        {error && (
          <div className="pdf-to-word-error">
            {error}
          </div>
        )}

        {/* =====================================
            FILE INFORMATION
            ===================================== */}

        {file && (
          <div className="pdf-to-word-file">
            <div className="pdf-to-word-file-icon">
              📄
            </div>

            <div className="pdf-to-word-file-info">
              <strong>
                {file.name}
              </strong>

              <span>
                {formatFileSize(
                  file.size
                )}
              </span>
            </div>

            <button
              type="button"
              className="pdf-to-word-remove"
              onClick={
                removeFile
              }
              disabled={
                isExtracting ||
                isGenerating
              }
              aria-label="Remove PDF"
              title="Remove PDF"
            >
              ✕
            </button>
          </div>
        )}

        {/* =====================================
            EXTRACTION OPTION
            ===================================== */}

        {file &&
          !extractedText &&
          !isExtracting && (
            <>
              <div className="pdf-to-word-options">
                <h3>
                  PDF Text Extraction
                </h3>

                <p>
                  Smart Tools will
                  extract selectable
                  text from your PDF
                  and prepare it for
                  conversion to an
                  editable Word
                  document.
                </p>
              </div>

              <button
                type="button"
                className="pdf-to-word-convert"
                onClick={
                  extractPDFText
                }
                disabled={
                  !file ||
                  isExtracting
                }
              >
                Extract PDF Text
              </button>
            </>
          )}

        {/* =====================================
            EXTRACTION PROGRESS
            ===================================== */}

        {isExtracting && (
          <div className="pdf-to-word-progress">
            <div className="pdf-to-word-progress-header">
              <strong>
                Extracting PDF text...
              </strong>

              <span>
                {extractionProgress}%
              </span>
            </div>

            <div className="pdf-to-word-progress-track">
              <div
                className="pdf-to-word-progress-bar"
                style={{
                  width: `${extractionProgress}%`,
                }}
              />
            </div>

            {totalPages > 0 && (
              <div
                style={{
                  marginTop:
                    "10px",
                  color:
                    "#64748b",
                  fontSize:
                    "0.85rem",
                }}
              >
                Processing page{" "}
                {currentPage} of{" "}
                {totalPages}
              </div>
            )}
          </div>
        )}

        {/* =====================================
            TEXT PREVIEW
            ===================================== */}

        {extractedText &&
          !isExtracting && (
            <div className="pdf-to-word-preview">
              <h3>
                Extracted Text Preview
              </h3>

              <div className="pdf-to-word-preview-text">
                {extractedText}
              </div>
            </div>
          )}

        {/* =====================================
            GENERATE WORD
            ===================================== */}

        {extractedText &&
          !downloadUrl &&
          !isExtracting && (
            <div className="pdf-to-word-generate">
              <button
                type="button"
                className="pdf-to-word-generate-button"
                onClick={
                  generateWordDocument
                }
                disabled={
                  isGenerating
                }
              >
                {isGenerating
                  ? "Generating Word Document..."
                  : "Generate Word Document"}
              </button>

              {isGenerating && (
                <div className="pdf-to-word-generating-message">
                  Creating your editable
                  DOCX file. Please wait...
                </div>
              )}
            </div>
          )}

        {/* =====================================
            DOWNLOAD RESULT
            ===================================== */}

        {downloadUrl && (
          <div className="pdf-to-word-download-box">
            <div className="pdf-to-word-word-icon">
              📝
            </div>

            <div className="pdf-to-word-download-info">
              <strong>
                Word document is ready!
              </strong>

              <span>
                {outputFileName}
              </span>
            </div>

            <a
              href={downloadUrl}
              download={
                outputFileName
              }
              className="pdf-to-word-download"
            >
              Download Word Document
            </a>

            <button
              type="button"
              className="pdf-to-word-start-over"
              onClick={
                startOver
              }
            >
              Convert Another PDF
            </button>
          </div>
        )}

        {/* =====================================
            PRIVACY
            ===================================== */}

        <div className="pdf-to-word-privacy">
          <div className="pdf-to-word-info-card">
            <div className="pdf-to-word-info-icon">
              🔒
            </div>

            <div>
              <h3>
                Your files are processed
                in your browser
              </h3>

              <p>
                Smart Tools is designed
                to process PDF files
                directly in your browser.
                Your PDF is not
                intentionally uploaded
                to a Smart Tools server
                for conversion.
              </p>
            </div>
          </div>
        </div>

        {/* =====================================
            HOW TO CONVERT
            ===================================== */}

        <section className="pdf-to-word-content-section">
          <div className="pdf-to-word-content-header">
            <h2>
              How to Convert PDF to Word
            </h2>

            <p>
              Convert your PDF document
              into an editable Word file
              in just a few simple steps.
            </p>
          </div>

          <div className="pdf-to-word-steps">
            <div className="pdf-to-word-step">
              <div className="pdf-to-word-step-number">
                1
              </div>

              <h3>
                Upload your PDF
              </h3>

              <p>
                Select a PDF file from
                your device or drag and
                drop it into the upload
                area.
              </p>
            </div>

            <div className="pdf-to-word-step">
              <div className="pdf-to-word-step-number">
                2
              </div>

              <h3>
                Extract the text
              </h3>

              <p>
                Smart Tools reads the
                text contained in your PDF
                and prepares it for
                conversion.
              </p>
            </div>

            <div className="pdf-to-word-step">
              <div className="pdf-to-word-step-number">
                3
              </div>

              <h3>
                Download your Word file
              </h3>

              <p>
                Generate the DOCX document
                and download the editable
                Word file to your device.
              </p>
            </div>
          </div>
        </section>

        {/* =====================================
            EXPLANATORY ARTICLE
            ===================================== */}

        <section className="pdf-to-word-content-section">
          <div className="pdf-to-word-article">
            <h2>
              What Does PDF to Word
              Conversion Do?
            </h2>

            <p>
              A PDF to Word converter
              extracts text from a PDF
              document and creates an
              editable Microsoft
              Word-compatible DOCX file.
              This can be useful when you
              need to edit text, reuse
              information, or work with
              content that is difficult to
              modify directly in a PDF.
            </p>

            <p>
              Smart Tools extracts text
              page by page and creates a
              Word document containing
              the extracted content. The
              conversion is performed
              directly in your browser.
            </p>

            <h3>
              When should you convert
              a PDF to Word?
            </h3>

            <p>
              Converting a PDF to Word
              can be useful for editing
              reports, updating documents,
              copying written content, or
              preparing text for further
              editing.
            </p>
          </div>
        </section>

        {/* =====================================
            IMPORTANT INFORMATION
            ===================================== */}

        <section className="pdf-to-word-content-section">
          <div className="pdf-to-word-light-section">
            <h2>
              Important Information
            </h2>

            <p>
              This PDF to Word converter
              focuses primarily on
              extracting text and
              creating an editable Word
              document. PDF documents can
              contain complex layouts and
              elements that cannot always
              be reproduced perfectly in
              Word.
            </p>

            <ul>
              <li>
                Text-based PDFs generally
                provide the best results.
              </li>

              <li>
                Scanned or image-only PDFs
                are not supported by the
                current converter because
                they require OCR.
              </li>

              <li>
                Complex tables, columns,
                graphics, and specialized
                layouts may not be
                reproduced exactly.
              </li>

              <li>
                Fonts, spacing, images,
                headers, footers, and other
                advanced PDF formatting may
                differ from the original
                document.
              </li>

              <li>
                Password-protected or
                encrypted PDFs may not be
                supported.
              </li>
            </ul>
          </div>
        </section>

        {/* =====================================
            FAQ
            ===================================== */}

        <section className="pdf-to-word-faq">
          <h2>
            PDF to Word Converter FAQ
          </h2>

          <div className="pdf-to-word-faq-list">

            <details>
              <summary>
                Is the PDF to Word
                converter free?
              </summary>

              <p>
                Yes. Smart Tools provides
                this PDF to Word conversion
                tool without requiring
                payment to convert a PDF
                file.
              </p>
            </details>

            <details>
              <summary>
                Can I convert a PDF to
                an editable Word document?
              </summary>

              <p>
                Yes. The tool extracts
                text from supported PDF
                files and creates an
                editable DOCX Word document.
              </p>
            </details>

            <details>
              <summary>
                Are my PDF files uploaded
                to a server?
              </summary>

              <p>
                The conversion is designed
                to run directly in your
                browser. Smart Tools does
                not intentionally upload
                your PDF to a server for
                the conversion process.
              </p>
            </details>

            <details>
              <summary>
                Can I convert a scanned
                PDF?
              </summary>

              <p>
                The current PDF to Word
                converter works with PDFs
                containing selectable text.
                Scanned or image-only PDFs
                require OCR and are not
                supported by this version.
              </p>
            </details>

            <details>
              <summary>
                Will the original PDF
                layout be preserved?
              </summary>

              <p>
                The converter focuses on
                extracting text rather than
                perfectly reproducing the
                original PDF design. Simple
                text-based documents
                generally produce better
                results, while complex
                layouts, columns, tables,
                and graphics may require
                additional editing.
              </p>
            </details>

            <details>
              <summary>
                What Word format does the
                converter create?
              </summary>

              <p>
                The converter creates a
                DOCX file, which can be
                opened and edited using
                Microsoft Word and other
                compatible word-processing
                applications.
              </p>
            </details>

          </div>
        </section>

      </div>
    </section>
  );
};

export default PDFToWord;