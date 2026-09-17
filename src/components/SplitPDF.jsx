import { useEffect, useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";
import "./SplitPDF.css";

function SplitPDF() {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const [pageCount, setPageCount] = useState(0);
  const [isReadingPDF, setIsReadingPDF] = useState(false);

  const [splitMethod, setSplitMethod] = useState("every-page");
  const [selectedPages, setSelectedPages] = useState("");
  const [pagesPerFile, setPagesPerFile] = useState(2);

  const [isSplitting, setIsSplitting] = useState(false);
  const [outputFiles, setOutputFiles] = useState([]);

  const fileInputRef = useRef(null);

  const MAX_FILE_SIZE = 25 * 1024 * 1024;

  /* =========================================
     SEO
  ========================================= */

  useEffect(() => {
    document.title = "Split PDF Online Free | Smart Tools";

    let metaDescription = document.querySelector(
      'meta[name="description"]'
    );

    if (!metaDescription) {
      metaDescription = document.createElement("meta");
      metaDescription.name = "description";
      document.head.appendChild(metaDescription);
    }

    metaDescription.setAttribute(
      "content",
      "Split PDF files online for free. Extract selected pages, split every page, or divide a PDF into smaller files. Fast, simple, and secure."
    );
  }, []);

  /* =========================================
     CLEAN UP OBJECT URLS
  ========================================= */

  useEffect(() => {
    return () => {
      outputFiles.forEach((outputFile) => {
        URL.revokeObjectURL(outputFile.url);
      });
    };
  }, [outputFiles]);

  /* =========================================
     OPEN FILE BROWSER
  ========================================= */

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  /* =========================================
     READ PDF PAGE COUNT
  ========================================= */

  const getPDFPageCount = async (selectedFile) => {
    const arrayBuffer = await selectedFile.arrayBuffer();

    const pdf = await PDFDocument.load(arrayBuffer);

    return pdf.getPageCount();
  };

  /* =========================================
     VALIDATE AND SET FILE
  ========================================= */

  const validateAndSetFile = async (selectedFile) => {
    setError("");

    if (!selectedFile) {
      return;
    }

    const isPDF =
      selectedFile.type === "application/pdf" ||
      selectedFile.name.toLowerCase().endsWith(".pdf");

    if (!isPDF) {
      setError("Please select a valid PDF file.");
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError("PDF file size must be 25 MB or less.");
      return;
    }

    setIsReadingPDF(true);

    try {
      const totalPages = await getPDFPageCount(selectedFile);

      if (totalPages === 0) {
        setError("The selected PDF does not contain any pages.");
        return;
      }

      // Remove previous generated object URLs
      outputFiles.forEach((outputFile) => {
        URL.revokeObjectURL(outputFile.url);
      });

      setFile(selectedFile);
      setPageCount(totalPages);

      setSplitMethod("every-page");
      setSelectedPages("");
      setPagesPerFile(2);
      setOutputFiles([]);
    } catch (err) {
      console.error(err);

      setError(
        "Unable to read this PDF. The file may be damaged, encrypted, or unsupported."
      );
    } finally {
      setIsReadingPDF(false);
    }
  };

  /* =========================================
     FILE INPUT
  ========================================= */

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];

    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }

    // Allows selecting the same file again
    event.target.value = "";
  };

  /* =========================================
     DRAG AND DROP
  ========================================= */

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);

    const droppedFile = event.dataTransfer.files?.[0];

    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  };

  /* =========================================
     REMOVE FILE
  ========================================= */

  const handleRemoveFile = () => {
    outputFiles.forEach((outputFile) => {
      URL.revokeObjectURL(outputFile.url);
    });

    setFile(null);
    setPageCount(0);
    setError("");
    setSelectedPages("");
    setSplitMethod("every-page");
    setPagesPerFile(2);
    setOutputFiles([]);
  };

  /* =========================================
     FORMAT FILE SIZE
  ========================================= */

  const formatFileSize = (bytes) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  /* =========================================
     PARSE PAGE RANGES
     
     Examples:
     1
     1,3,5
     1-3
     1-3,5,8-10
  ========================================= */

  const parsePageRanges = (input) => {
    const pages = [];

    if (!input.trim()) {
      throw new Error("Please enter the pages you want to extract.");
    }

    const parts = input.split(",");

    for (const part of parts) {
      const value = part.trim();

      if (!value) {
        continue;
      }

      // Page range
      if (value.includes("-")) {
        const rangeParts = value.split("-");

        if (rangeParts.length !== 2) {
          throw new Error(`Invalid page range: ${value}`);
        }

        const start = Number(rangeParts[0].trim());
        const end = Number(rangeParts[1].trim());

        if (
          !Number.isInteger(start) ||
          !Number.isInteger(end) ||
          start < 1 ||
          end < 1
        ) {
          throw new Error(`Invalid page range: ${value}`);
        }

        if (start > end) {
          throw new Error(`Invalid page range: ${value}`);
        }

        if (end > pageCount) {
          throw new Error(
            `Page ${end} does not exist. This PDF has ${pageCount} pages.`
          );
        }

        for (let page = start; page <= end; page++) {
          pages.push(page - 1);
        }
      } else {
        // Single page
        const page = Number(value);

        if (!Number.isInteger(page) || page < 1) {
          throw new Error(`Invalid page number: ${value}`);
        }

        if (page > pageCount) {
          throw new Error(
            `Page ${page} does not exist. This PDF has ${pageCount} pages.`
          );
        }

        pages.push(page - 1);
      }
    }

    // Remove duplicate pages and sort
    return [...new Set(pages)].sort((a, b) => a - b);
  };

  /* =========================================
     VALIDATE SPLIT OPTIONS
  ========================================= */

  const validateSplitOptions = () => {
    if (!file) {
      setError("Please select a PDF file first.");
      return false;
    }

    if (splitMethod === "selected-pages") {
      try {
        parsePageRanges(selectedPages);
      } catch (err) {
        setError(err.message);
        return false;
      }
    }

    if (splitMethod === "every-n-pages") {
      const number = Number(pagesPerFile);

      if (!Number.isInteger(number) || number < 1) {
        setError("Please enter a valid number of pages per file.");
        return false;
      }

      if (number > pageCount) {
        setError(
          `Pages per file cannot be greater than the total number of pages (${pageCount}).`
        );
        return false;
      }
    }

    setError("");

    return true;
  };

  /* =========================================
     CREATE PDF FILE
  ========================================= */

  const createPDFFile = async (
    sourcePDF,
    pageIndexes,
    fileName
  ) => {
    const newPDF = await PDFDocument.create();

    const copiedPages = await newPDF.copyPages(
      sourcePDF,
      pageIndexes
    );

    copiedPages.forEach((page) => {
      newPDF.addPage(page);
    });

    const pdfBytes = await newPDF.save();

    const blob = new Blob([pdfBytes], {
      type: "application/pdf",
    });

    const url = URL.createObjectURL(blob);

    return {
      name: fileName,
      url,
      size: blob.size,
    };
  };

  /* =========================================
     SPLIT PDF
  ========================================= */

  const handleSplitPDF = async () => {
    if (!validateSplitOptions()) {
      return;
    }

    setIsSplitting(true);
    setError("");

    // Remove old generated files
    outputFiles.forEach((outputFile) => {
      URL.revokeObjectURL(outputFile.url);
    });

    setOutputFiles([]);

    try {
      const arrayBuffer = await file.arrayBuffer();

      const sourcePDF = await PDFDocument.load(arrayBuffer);

      const generatedFiles = [];

      /* ---------------------------------------
         METHOD 1
         SPLIT EVERY PAGE
      --------------------------------------- */

      if (splitMethod === "every-page") {
        for (let i = 0; i < pageCount; i++) {
          const generatedFile = await createPDFFile(
            sourcePDF,
            [i],
            `page-${i + 1}.pdf`
          );

          generatedFiles.push(generatedFile);
        }
      }

      /* ---------------------------------------
         METHOD 2
         SELECTED PAGES
      --------------------------------------- */

      if (splitMethod === "selected-pages") {
        const pageIndexes = parsePageRanges(selectedPages);

        const generatedFile = await createPDFFile(
          sourcePDF,
          pageIndexes,
          "selected-pages.pdf"
        );

        generatedFiles.push(generatedFile);
      }

      /* ---------------------------------------
         METHOD 3
         EVERY N PAGES
      --------------------------------------- */

      if (splitMethod === "every-n-pages") {
        const numberOfPages = Number(pagesPerFile);

        let partNumber = 1;

        for (
          let start = 0;
          start < pageCount;
          start += numberOfPages
        ) {
          const end = Math.min(
            start + numberOfPages,
            pageCount
          );

          const pageIndexes = [];

          for (let i = start; i < end; i++) {
            pageIndexes.push(i);
          }

          const generatedFile = await createPDFFile(
            sourcePDF,
            pageIndexes,
            `part-${partNumber}.pdf`
          );

          generatedFiles.push(generatedFile);

          partNumber++;
        }
      }

      setOutputFiles(generatedFiles);
    } catch (err) {
      console.error(err);

      setError(
        "Something went wrong while splitting the PDF. Please try again."
      );
    } finally {
      setIsSplitting(false);
    }
  };

  /* =========================================
     DOWNLOAD ONE FILE
  ========================================= */

  const handleDownload = (outputFile) => {
    const link = document.createElement("a");

    link.href = outputFile.url;
    link.download = outputFile.name;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
  };

  /* =========================================
     DOWNLOAD ALL FILES
  ========================================= */

  const handleDownloadAll = () => {
    outputFiles.forEach((outputFile, index) => {
      setTimeout(() => {
        handleDownload(outputFile);
      }, index * 200);
    });
  };

  /* =========================================
     JSX
  ========================================= */

  return (
    <section className="split-pdf-section">
      <div className="container">

        {/* PAGE HEADER */}
        <div className="split-pdf-header">
          <h1>Split PDF</h1>

          <p>
            Split your PDF into separate files by page,
            selected pages, or a specific number of pages.
          </p>
        </div>

        {/* UPLOAD AREA */}
        {!file && (
          <div
            className={`split-pdf-upload ${
              isDragging
                ? "split-pdf-upload-active"
                : ""
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="split-pdf-upload-icon">
              📄
            </div>

            <h2>Upload your PDF</h2>

            <p>
              Drag & drop your PDF here or choose a
              file from your device.
            </p>

            <button
              type="button"
              className="split-pdf-browse-btn"
              onClick={handleBrowseClick}
              disabled={isReadingPDF}
            >
              Choose PDF
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              onChange={handleFileChange}
              hidden
            />

            <span className="split-pdf-upload-note">
              Maximum file size: 25 MB
            </span>
          </div>
        )}

        {/* READING PDF */}
        {isReadingPDF && (
          <div className="split-pdf-reading">
            <div className="split-pdf-spinner"></div>

            <p>Reading your PDF...</p>
          </div>
        )}

        {/* ERROR */}
        {error && !file && (
          <div
            className="split-pdf-error"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* SELECTED FILE */}
        {file && !isReadingPDF && (
          <div className="split-pdf-file">

            <div className="split-pdf-file-icon">
              📄
            </div>

            <div className="split-pdf-file-info">
              <strong>{file.name}</strong>

              <span>
                {formatFileSize(file.size)} •{" "}
                {pageCount}{" "}
                {pageCount === 1
                  ? "page"
                  : "pages"}
              </span>
            </div>

            <button
              type="button"
              className="split-pdf-remove"
              onClick={handleRemoveFile}
              disabled={isSplitting}
            >
              Remove
            </button>
          </div>
        )}

        {/* SPLIT OPTIONS */}
        {file && !isReadingPDF && (
          <div className="split-pdf-options">

            <h2>
              Choose how to split your PDF
            </h2>

            {/* EVERY PAGE */}
            <label className="split-pdf-option">

              <input
                type="radio"
                name="splitMethod"
                value="every-page"
                checked={
                  splitMethod === "every-page"
                }
                onChange={(event) => {
                  setSplitMethod(
                    event.target.value
                  );
                  setError("");
                }}
                disabled={isSplitting}
              />

              <span className="split-pdf-radio"></span>

              <span className="split-pdf-option-content">
                <strong>
                  Split every page
                </strong>

                <small>
                  Create a separate PDF file
                  for each page.
                </small>
              </span>
            </label>

            {/* SELECTED PAGES */}
            <label className="split-pdf-option">

              <input
                type="radio"
                name="splitMethod"
                value="selected-pages"
                checked={
                  splitMethod ===
                  "selected-pages"
                }
                onChange={(event) => {
                  setSplitMethod(
                    event.target.value
                  );
                  setError("");
                }}
                disabled={isSplitting}
              />

              <span className="split-pdf-radio"></span>

              <span className="split-pdf-option-content">
                <strong>
                  Extract selected pages
                </strong>

                <small>
                  Enter individual pages or
                  page ranges.
                </small>
              </span>
            </label>

            {/* SELECTED PAGE INPUT */}
            {splitMethod === "selected-pages" && (
              <div className="split-pdf-input-wrapper">

                <label htmlFor="selectedPages">
                  Pages
                </label>

                <input
                  id="selectedPages"
                  type="text"
                  value={selectedPages}
                  onChange={(event) => {
                    setSelectedPages(
                      event.target.value
                    );
                    setError("");
                  }}
                  placeholder="Example: 1-3, 5, 8-10"
                  disabled={isSplitting}
                />

                <span>
                  Example:{" "}
                  <strong>
                    1-3, 5, 8-10
                  </strong>
                </span>
              </div>
            )}

            {/* EVERY N PAGES */}
            <label className="split-pdf-option">

              <input
                type="radio"
                name="splitMethod"
                value="every-n-pages"
                checked={
                  splitMethod ===
                  "every-n-pages"
                }
                onChange={(event) => {
                  setSplitMethod(
                    event.target.value
                  );
                  setError("");
                }}
                disabled={isSplitting}
              />

              <span className="split-pdf-radio"></span>

              <span className="split-pdf-option-content">
                <strong>
                  Split every N pages
                </strong>

                <small>
                  Create a new PDF after
                  every specified number of
                  pages.
                </small>
              </span>
            </label>

            {/* PAGES PER FILE INPUT */}
            {splitMethod === "every-n-pages" && (
              <div className="split-pdf-input-wrapper">

                <label htmlFor="pagesPerFile">
                  Pages per file
                </label>

                <input
                  id="pagesPerFile"
                  type="number"
                  min="1"
                  max={pageCount}
                  value={pagesPerFile}
                  onChange={(event) => {
                    setPagesPerFile(
                      event.target.value
                    );
                    setError("");
                  }}
                  disabled={isSplitting}
                />

                <span>
                  This PDF contains{" "}
                  <strong>
                    {pageCount}
                  </strong>{" "}
                  {pageCount === 1
                    ? "page"
                    : "pages"}
                  .
                </span>
              </div>
            )}

            {/* OPTIONS ERROR */}
            {error && (
              <div
                className="split-pdf-options-error"
                role="alert"
              >
                {error}
              </div>
            )}

            {/* SPLIT BUTTON */}
            <button
              type="button"
              className="split-pdf-button"
              onClick={handleSplitPDF}
              disabled={isSplitting}
            >
              {isSplitting ? (
                <>
                  <span className="split-pdf-button-spinner"></span>
                  Splitting PDF...
                </>
              ) : (
                "Split PDF"
              )}
            </button>
          </div>
        )}

        {/* SUCCESS + RESULTS */}
        {outputFiles.length > 0 && (
          <>
            {/* SUCCESS MESSAGE */}
            <div className="split-pdf-success">

              <div className="split-pdf-success-icon">
                ✓
              </div>

              <div>
                <strong>
                  PDF split successfully
                </strong>

                <span>
                  Your{" "}
                  {outputFiles.length}{" "}
                  {outputFiles.length === 1
                    ? "file is"
                    : "files are"}{" "}
                  ready to download.
                </span>
              </div>
            </div>

            {/* RESULTS */}
            <div className="split-pdf-results">

              <div className="split-pdf-results-header">

                <div>
                  <h2>
                    Split files ready
                  </h2>

                  <p>
                    {outputFiles.length}{" "}
                    {outputFiles.length === 1
                      ? "file is"
                      : "files are"}{" "}
                    ready to download.
                  </p>
                </div>

                {outputFiles.length > 1 && (
                  <button
                    type="button"
                    className="split-pdf-download-all"
                    onClick={
                      handleDownloadAll
                    }
                  >
                    Download All
                  </button>
                )}
              </div>

              <div className="split-pdf-results-list">

                {outputFiles.map(
                  (outputFile, index) => (
                    <div
                      className="split-pdf-result-item"
                      key={`${outputFile.name}-${index}`}
                    >

                      <div className="split-pdf-result-icon">
                        📄
                      </div>

                      <div className="split-pdf-result-info">

                        <strong>
                          {outputFile.name}
                        </strong>

                        <span>
                          {formatFileSize(
                            outputFile.size
                          )}
                        </span>
                      </div>

                      <button
                        type="button"
                        className="split-pdf-download"
                        onClick={() =>
                          handleDownload(
                            outputFile
                          )
                        }
                      >
                        Download
                      </button>
                    </div>
                  )
                )}
              </div>
            </div>
          </>
        )}

        {/* SEO CONTENT */}
        <section className="split-pdf-info">

          <div className="split-pdf-info-inner">

            <h2>
              Split PDF Files Online
            </h2>

            <p>
              Split PDF files into smaller
              documents quickly and easily with
              Smart Tools. You can separate every
              page into its own PDF, extract
              specific pages, or divide a large PDF
              into smaller files.
            </p>

            <h3>
              How to Split a PDF
            </h3>

            <ol>
              <li>
                Upload your PDF file using the
                upload box above.
              </li>

              <li>
                Choose how you want to split the
                document.
              </li>

              <li>
                Select the pages or number of pages
                per file if required.
              </li>

              <li>
                Click the Split PDF button.
              </li>

              <li>
                Download your newly created PDF
                files.
              </li>
            </ol>

            <h3>
              Different Ways to Split a PDF
            </h3>

            <p>
              Smart Tools provides several ways to
              split your PDF. You can create one PDF
              for every page, extract selected pages
              such as 1-3 or 5, or divide the
              document after a specific number of
              pages.
            </p>

            <h3>
              Is My PDF Uploaded to a Server?
            </h3>

            <p>
              PDF processing is performed directly
              in your browser. Your PDF does not
              need to be uploaded to a remote server
              for the splitting process.
            </p>

          </div>
        </section>

      </div>
    </section>
  );
}

export default SplitPDF;