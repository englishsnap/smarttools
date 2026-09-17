import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist/build/pdf.mjs";
import "./PDFToJPGPNG.css";

/*
  PDF.js worker configuration for Vite
*/
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).toString();

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
const MAX_PAGES = 100;

const PDFToJPGPNG = () => {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const [error, setError] = useState("");

  const [pageCount, setPageCount] = useState(0);
  const [isReading, setIsReading] = useState(false);

  const [outputFormat, setOutputFormat] = useState("jpg");
  const [jpgQuality, setJpgQuality] = useState("0.85");

  const [pageMode, setPageMode] = useState("all");
  const [selectedPages, setSelectedPages] = useState("");

  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);

  const [convertedFiles, setConvertedFiles] = useState([]);

  const fileInputRef = useRef(null);
  const downloadUrlsRef = useRef([]);

  /*
    SEO
  */
  useEffect(() => {
    document.title = "PDF to JPG PNG Converter Online Free | Smart Tools";

    const description =
      "Convert PDF pages to JPG or PNG images online for free. Choose pages, adjust image quality, and download your converted images with Smart Tools.";

    let metaDescription = document.querySelector(
      'meta[name="description"]'
    );

    if (!metaDescription) {
      metaDescription = document.createElement("meta");
      metaDescription.setAttribute("name", "description");
      document.head.appendChild(metaDescription);
    }

    metaDescription.setAttribute("content", description);

    return () => {
      document.title = "Smart Tools";
    };
  }, []);

  /*
    Clean up generated object URLs when component unmounts
  */
  useEffect(() => {
    return () => {
      downloadUrlsRef.current.forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, []);

  /*
    Format file size
  */
  const formatFileSize = (bytes) => {
    if (!bytes) return "0 Bytes";

    const sizes = ["Bytes", "KB", "MB", "GB"];
    const index = Math.floor(Math.log(bytes) / Math.log(1024));

    return `${(bytes / Math.pow(1024, index)).toFixed(2)} ${
      sizes[index]
    }`;
  };

  /*
    Clear generated download URLs
  */
  const clearDownloadUrls = () => {
    downloadUrlsRef.current.forEach((url) => {
      URL.revokeObjectURL(url);
    });

    downloadUrlsRef.current = [];

    setConvertedFiles([]);
  };

  /*
    Validate PDF
  */
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
      return "The maximum PDF file size is 25 MB.";
    }

    if (selectedFile.size === 0) {
      return "The selected PDF file appears to be empty.";
    }

    return "";
  };

  /*
    Read PDF and determine page count
  */
  const readPDF = async (selectedFile) => {
    setIsReading(true);
    setError("");
    setPageCount(0);

    let loadingTask = null;
    let pdf = null;

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();

      if (!arrayBuffer || arrayBuffer.byteLength === 0) {
        throw new Error("The PDF file contains no readable data.");
      }

      /*
        Create a fresh Uint8Array for PDF.js.
      */
      const pdfData = new Uint8Array(arrayBuffer);

      loadingTask = pdfjsLib.getDocument({
        data: pdfData,
      });

      pdf = await loadingTask.promise;

      const totalPages = pdf.numPages;

      if (!totalPages || totalPages < 1) {
        throw new Error("The PDF does not contain any readable pages.");
      }

      if (totalPages > MAX_PAGES) {
        throw new Error(
          `This PDF contains ${totalPages} pages. For browser stability, the maximum is ${MAX_PAGES} pages.`
        );
      }

      setPageCount(totalPages);

      /*
        Important:
        Do NOT destroy the PDF here.

        The PDF document will be used again during conversion.
      */
    } catch (err) {
      console.error("PDF.js error while reading PDF:", err);

      let message =
        err?.message ||
        "Unable to read this PDF. Please try another PDF file.";

      const lowerMessage = message.toLowerCase();

      if (
        lowerMessage.includes("password") ||
        lowerMessage.includes("encrypted")
      ) {
        message =
          "This PDF appears to be password-protected or encrypted. Please use an unlocked PDF.";
      } else if (lowerMessage.includes("invalid pdf")) {
        message =
          "This PDF appears to be invalid or damaged. Please try another PDF.";
      } else if (
        lowerMessage.includes("invalidpdf") ||
        lowerMessage.includes("invalid pdf structure")
      ) {
        message =
          "This PDF appears to have an invalid structure. Please try another PDF.";
      } else if (lowerMessage.includes("maximum is")) {
        message = message;
      } else if (
        lowerMessage.includes("worker") ||
        lowerMessage.includes("fake worker")
      ) {
        message =
          "PDF processing could not start correctly. Please refresh the page and try again.";
      } else if (
        lowerMessage.includes("missing pdf") ||
        lowerMessage.includes("unexpected server response")
      ) {
        message =
          "The PDF could not be loaded correctly. Please refresh the page and try again.";
      }

      setError(message);
      setFile(null);
      setPageCount(0);
    } finally {
      /*
        Destroy only the loading task if it failed before
        the PDF document was successfully created.
      */
      if (loadingTask && !pdf) {
        try {
          await loadingTask.destroy();
        } catch (destroyError) {
          console.warn(
            "PDF loading task cleanup warning:",
            destroyError
          );
        }
      }

      setIsReading(false);
    }
  };

  /*
    Handle selected file
  */
  const handleFileSelect = async (selectedFile) => {
    if (!selectedFile) return;

    clearDownloadUrls();

    setError("");
    setFile(null);
    setPageCount(0);
    setProgress(0);
    setCurrentPage(0);
    setSelectedPages("");

    const validationError = validateFile(selectedFile);

    if (validationError) {
      setError(validationError);
      return;
    }

    setFile(selectedFile);

    await readPDF(selectedFile);
  };

  /*
    Browse button
  */
  const handleBrowseClick = () => {
    if (isReading || isConverting) return;

    fileInputRef.current?.click();
  };

  /*
    File input
  */
  const handleInputChange = (event) => {
    const selectedFile = event.target.files?.[0];

    if (selectedFile) {
      handleFileSelect(selectedFile);
    }

    /*
      Allows selecting the same file again
    */
    event.target.value = "";
  };

  /*
    Drag events
  */
  const handleDragOver = (event) => {
    event.preventDefault();

    if (!isReading && !isConverting) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (event) => {
    event.preventDefault();

    setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();

    setIsDragging(false);

    if (isReading || isConverting) return;

    const droppedFile = event.dataTransfer.files?.[0];

    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  /*
    Remove current PDF
  */
  const handleRemoveFile = () => {
    if (isReading || isConverting) return;

    clearDownloadUrls();

    setFile(null);
    setError("");
    setPageCount(0);
    setProgress(0);
    setCurrentPage(0);
    setSelectedPages("");
  };

  /*
    Parse page selection

    Examples:
    1
    1,3,5
    1-3
    1,3,5-7
  */
  const parsePageSelection = (value) => {
    if (!value.trim()) {
      throw new Error("Please enter the page numbers you want to convert.");
    }

    const parts = value
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);

    const pages = new Set();

    for (const part of parts) {
      if (part.includes("-")) {
        const rangeParts = part.split("-").map((item) => item.trim());

        if (rangeParts.length !== 2) {
          throw new Error(
            "Please enter page numbers like 1, 3, 5-7."
          );
        }

        const start = Number(rangeParts[0]);
        const end = Number(rangeParts[1]);

        if (
          !Number.isInteger(start) ||
          !Number.isInteger(end) ||
          start < 1 ||
          end < 1 ||
          start > end
        ) {
          throw new Error(
            "Please enter valid page ranges such as 1-3."
          );
        }

        if (start > pageCount || end > pageCount) {
          throw new Error(
            `Please select pages between 1 and ${pageCount}.`
          );
        }

        for (let page = start; page <= end; page++) {
          pages.add(page);
        }
      } else {
        const page = Number(part);

        if (!Number.isInteger(page) || page < 1) {
          throw new Error(
            "Please enter valid page numbers such as 1, 3, 5."
          );
        }

        if (page > pageCount) {
          throw new Error(
            `Please select pages between 1 and ${pageCount}.`
          );
        }

        pages.add(page);
      }
    }

    return Array.from(pages).sort((a, b) => a - b);
  };

  /*
    Convert PDF pages to images
  */
  const convertPDF = async () => {
    if (!file) {
      setError("Please select a PDF file first.");
      return;
    }

    if (!pageCount) {
      setError("The PDF page count could not be determined.");
      return;
    }

    let pagesToConvert = [];

    try {
      if (pageMode === "all") {
        pagesToConvert = Array.from(
          { length: pageCount },
          (_, index) => index + 1
        );
      } else {
        pagesToConvert = parsePageSelection(selectedPages);
      }
    } catch (err) {
      setError(err.message);
      return;
    }

    if (pagesToConvert.length === 0) {
      setError("Please select at least one page.");
      return;
    }

    clearDownloadUrls();

    setError("");
    setIsConverting(true);
    setProgress(0);
    setCurrentPage(0);

    let loadingTask = null;
    let pdf = null;

    try {
      const arrayBuffer = await file.arrayBuffer();

      if (!arrayBuffer || arrayBuffer.byteLength === 0) {
        throw new Error("The PDF file contains no readable data.");
      }

      const pdfData = new Uint8Array(arrayBuffer);

      loadingTask = pdfjsLib.getDocument({
        data: pdfData,
      });

      pdf = await loadingTask.promise;

      if (pdf.numPages > MAX_PAGES) {
        throw new Error(
          `This PDF contains ${pdf.numPages} pages. For browser stability, the maximum is ${MAX_PAGES} pages.`
        );
      }

      const results = [];

      for (let index = 0; index < pagesToConvert.length; index++) {
        const pageNumber = pagesToConvert[index];

        setCurrentPage(pageNumber);

        const page = await pdf.getPage(pageNumber);

        /*
          Scale 2 provides a good balance between image quality
          and browser memory usage.
        */
        const viewport = page.getViewport({
          scale: 2,
        });

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        if (!context) {
          throw new Error(
            "Your browser could not create a canvas for PDF conversion."
          );
        }

        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);

        /*
          White background for JPG.
          PNG does not require this, but keeping a white background
          provides consistent rendering.
        */
        context.save();
        context.fillStyle = "#ffffff";
        context.fillRect(
          0,
          0,
          canvas.width,
          canvas.height
        );
        context.restore();

        await page.render({
          canvasContext: context,
          viewport,
        }).promise;

        const mimeType =
          outputFormat === "png"
            ? "image/png"
            : "image/jpeg";

        const quality =
          outputFormat === "jpg"
            ? Number(jpgQuality)
            : undefined;

        const blob = await new Promise((resolve, reject) => {
          canvas.toBlob(
            (result) => {
              if (result) {
                resolve(result);
              } else {
                reject(
                  new Error(
                    "The browser could not create the output image."
                  )
                );
              }
            },
            mimeType,
            quality
          );
        });

        const url = URL.createObjectURL(blob);

        downloadUrlsRef.current.push(url);

        const extension =
          outputFormat === "png" ? "png" : "jpg";

        results.push({
          pageNumber,
          url,
          size: blob.size,
          extension,
        });

        /*
          Release page/canvas resources as soon as possible.
        */
        page.cleanup();

        canvas.width = 1;
        canvas.height = 1;

        context.clearRect(0, 0, 1, 1);

        const percentage = Math.round(
          ((index + 1) / pagesToConvert.length) * 100
        );

        setProgress(percentage);
      }

      setConvertedFiles(results);
    } catch (err) {
      console.error("PDF conversion error:", err);

      let message =
        err?.message ||
        "Unable to convert this PDF. Please try again.";

      const lowerMessage = message.toLowerCase();

      if (
        lowerMessage.includes("password") ||
        lowerMessage.includes("encrypted")
      ) {
        message =
          "This PDF appears to be password-protected or encrypted. Please use an unlocked PDF.";
      } else if (
        lowerMessage.includes("invalid pdf") ||
        lowerMessage.includes("invalid pdf structure")
      ) {
        message =
          "This PDF appears to be invalid or damaged. Please try another PDF.";
      } else if (lowerMessage.includes("maximum is")) {
        message = message;
      } else if (
        lowerMessage.includes("worker") ||
        lowerMessage.includes("fake worker")
      ) {
        message =
          "PDF processing could not start correctly. Please refresh the page and try again.";
      }

      setError(message);
      setConvertedFiles([]);
      setProgress(0);
      setCurrentPage(0);
    } finally {
      /*
        Destroy the PDF document only AFTER conversion is finished.
      */
      if (pdf) {
        try {
          await pdf.destroy();
        } catch (destroyError) {
          console.warn(
            "PDF cleanup warning:",
            destroyError
          );
        }
      } else if (loadingTask) {
        try {
          await loadingTask.destroy();
        } catch (destroyError) {
          console.warn(
            "PDF loading cleanup warning:",
            destroyError
          );
        }
      }

      setIsConverting(false);
    }
  };

  /*
    Download individual image
  */
  const downloadImage = (item) => {
    const link = document.createElement("a");

    const baseName = file?.name
      ? file.name.replace(/\.pdf$/i, "")
      : "converted-page";

    link.href = item.url;
    link.download = `${baseName}-page-${item.pageNumber}.${item.extension}`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /*
    Start over
  */
  const handleStartOver = () => {
    clearDownloadUrls();

    setFile(null);
    setError("");
    setPageCount(0);
    setIsReading(false);
    setOutputFormat("jpg");
    setJpgQuality("0.85");
    setPageMode("all");
    setSelectedPages("");
    setIsConverting(false);
    setProgress(0);
    setCurrentPage(0);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <section className="pdf-to-jpg-png-section">
      <div className="container">
        {/* Header */}
        <div className="pdf-to-jpg-png-header text-center">
          <span className="pdf-to-jpg-png-badge">
            FREE ONLINE TOOL
          </span>

          <h1>PDF to JPG/PNG Converter</h1>

          <p>
            Convert PDF pages into high-quality JPG or PNG
            images directly in your browser.
          </p>
        </div>

        <div className="pdf-to-jpg-png-tool">
          {/* Upload */}
          {!file && (
            <div
              className={`pdf-to-jpg-png-upload ${
                isDragging
                  ? "pdf-to-jpg-png-upload-active"
                  : ""
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="pdf-to-jpg-png-upload-icon">
                📄
              </div>

              <h2>Upload your PDF</h2>

              <p>
                Drag and drop your PDF here or choose a file
                from your computer.
              </p>

              <button
                type="button"
                className="pdf-to-jpg-png-browse-btn"
                onClick={handleBrowseClick}
                disabled={isReading || isConverting}
              >
                Choose PDF
              </button>

              <div className="pdf-to-jpg-png-upload-note">
                Maximum file size: 25 MB
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                onChange={handleInputChange}
                hidden
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              className="pdf-to-jpg-png-error"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Selected File */}
          {file && (
            <div className="pdf-to-jpg-png-file">
              <div className="pdf-to-jpg-png-file-icon">
                📄
              </div>

              <div className="pdf-to-jpg-png-file-info">
                <strong>{file.name}</strong>

                <span>
                  {formatFileSize(file.size)}
                  {pageCount > 0 &&
                    ` • ${pageCount} ${
                      pageCount === 1 ? "page" : "pages"
                    }`}
              </span>
              </div>

              <button
                type="button"
                className="pdf-to-jpg-png-remove"
                onClick={handleRemoveFile}
                disabled={isReading || isConverting}
              >
                Remove
              </button>
            </div>
          )}

          {/* Reading PDF */}
          {isReading && (
            <div className="pdf-to-jpg-png-reading">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">
                  Reading PDF...
                </span>
              </div>

              <p>Reading your PDF...</p>
            </div>
          )}

          {/* Options */}
          {file && pageCount > 0 && !isReading && (
            <div className="pdf-to-jpg-png-options">
              {/* Output format */}
              <div className="pdf-to-jpg-png-option-group">
                <h3>Output Format</h3>

                <div className="pdf-to-jpg-png-choice-row">
                  <button
                    type="button"
                    className={`pdf-to-jpg-png-choice ${
                      outputFormat === "jpg"
                        ? "pdf-to-jpg-png-choice-active"
                        : ""
                    }`}
                    onClick={() => setOutputFormat("jpg")}
                    disabled={isConverting}
                  >
                    <span className="pdf-to-jpg-png-choice-radio">
                      {outputFormat === "jpg" ? "✓" : ""}
                    </span>

                    <span>
                      <strong>JPG</strong>
                      <small>
                        Smaller file size
                      </small>
                    </span>
                  </button>

                  <button
                    type="button"
                    className={`pdf-to-jpg-png-choice ${
                      outputFormat === "png"
                        ? "pdf-to-jpg-png-choice-active"
                        : ""
                    }`}
                    onClick={() => setOutputFormat("png")}
                    disabled={isConverting}
                  >
                    <span className="pdf-to-jpg-png-choice-radio">
                      {outputFormat === "png" ? "✓" : ""}
                    </span>

                    <span>
                      <strong>PNG</strong>
                      <small>
                        Higher quality
                      </small>
                    </span>
                  </button>
                </div>
              </div>

              {/* JPG quality */}
              {outputFormat === "jpg" && (
                <div className="pdf-to-jpg-png-option-group">
                  <h3>JPG Quality</h3>

                  <div className="pdf-to-jpg-png-quality-row">
                    <button
                      type="button"
                      className={`pdf-to-jpg-png-quality ${
                        jpgQuality === "0.95"
                          ? "pdf-to-jpg-png-quality-active"
                          : ""
                      }`}
                      onClick={() => setJpgQuality("0.95")}
                      disabled={isConverting}
                    >
                      High
                    </button>

                    <button
                      type="button"
                      className={`pdf-to-jpg-png-quality ${
                        jpgQuality === "0.85"
                          ? "pdf-to-jpg-png-quality-active"
                          : ""
                      }`}
                      onClick={() => setJpgQuality("0.85")}
                      disabled={isConverting}
                    >
                      Recommended
                    </button>

                    <button
                      type="button"
                      className={`pdf-to-jpg-png-quality ${
                        jpgQuality === "0.70"
                          ? "pdf-to-jpg-png-quality-active"
                          : ""
                      }`}
                      onClick={() => setJpgQuality("0.70")}
                      disabled={isConverting}
                    >
                      Smaller
                    </button>
                  </div>
                </div>
              )}

              {/* Page selection */}
              <div className="pdf-to-jpg-png-option-group">
                <h3>Pages to Convert</h3>

                <div className="pdf-to-jpg-png-page-options">
                  <button
                    type="button"
                    className={`pdf-to-jpg-png-page-option ${
                      pageMode === "all"
                        ? "pdf-to-jpg-png-page-option-active"
                        : ""
                    }`}
                    onClick={() => setPageMode("all")}
                    disabled={isConverting}
                  >
                    All Pages
                  </button>

                  <button
                    type="button"
                    className={`pdf-to-jpg-png-page-option ${
                      pageMode === "selected"
                        ? "pdf-to-jpg-png-page-option-active"
                        : ""
                    }`}
                    onClick={() => setPageMode("selected")}
                    disabled={isConverting}
                  >
                    Selected Pages
                  </button>
                </div>

                {pageMode === "selected" && (
                  <input
                    type="text"
                    className="pdf-to-jpg-png-page-input"
                    placeholder="Example: 1, 3, 5-7"
                    value={selectedPages}
                    onChange={(event) =>
                      setSelectedPages(event.target.value)
                    }
                    disabled={isConverting}
                  />
                )}

                <small>
                  {pageMode === "all"
                    ? `All ${pageCount} pages will be converted.`
                    : "Enter page numbers or ranges separated by commas."}
                </small>
              </div>

              {/* Convert button */}
              <button
                type="button"
                className="pdf-to-jpg-png-button"
                onClick={convertPDF}
                disabled={isConverting}
              >
                {isConverting
                  ? "Converting..."
                  : `Convert to ${
                      outputFormat === "jpg" ? "JPG" : "PNG"
                    }`}
              </button>
            </div>
          )}

          {/* Progress */}
          {isConverting && (
            <div className="pdf-to-jpg-png-progress">
              <div className="pdf-to-jpg-png-progress-header">
                <span>
                  Converting page {currentPage} of{" "}
                  {pageCount}
                </span>

                <strong>{progress}%</strong>
              </div>

              <div className="pdf-to-jpg-png-progress-track">
                <div
                  className="pdf-to-jpg-png-progress-bar"
                  style={{
                    width: `${progress}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Results */}
          {convertedFiles.length > 0 && (
            <div className="pdf-to-jpg-png-result">
              <div className="pdf-to-jpg-png-success-icon">
                ✓
              </div>

              <h2>Conversion Complete</h2>

              <p>
                Your PDF pages have been converted
                successfully.
              </p>

              <div className="pdf-to-jpg-png-results-grid">
                {convertedFiles.map((item) => (
                  <div
                    className="pdf-to-jpg-png-result-item"
                    key={`${item.pageNumber}-${item.url}`}
                  >
                    <img
                      src={item.url}
                      alt={`PDF page ${item.pageNumber}`}
                    />

                    <div className="pdf-to-jpg-png-result-item-info">
                      <strong>
                        Page {item.pageNumber}
                      </strong>

                      <span>
                        {item.extension.toUpperCase()} •{" "}
                        {formatFileSize(item.size)}
                      </span>

                      <button
                        type="button"
                        className="pdf-to-jpg-png-download"
                        onClick={() =>
                          downloadImage(item)
                        }
                      >
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="pdf-to-jpg-png-start-over"
                onClick={handleStartOver}
              >
                Convert Another PDF
              </button>
            </div>
          )}
        </div>

        {/* Privacy */}
        <div className="pdf-to-jpg-png-privacy">
          <div className="pdf-to-jpg-png-info-card">
            <div className="pdf-to-jpg-png-info-icon">
              🔒
            </div>

            <div>
              <h3>Your files are processed in your browser</h3>

              <p>
                Smart Tools is designed to process PDF files
                directly in your browser. Your PDF is not
                intentionally uploaded to a Smart Tools
                server for conversion.
              </p>
            </div>
          </div>
        </div>

        {/* How to */}
        <section className="pdf-to-jpg-png-content-section">
          <div className="pdf-to-jpg-png-content-header">
            <h2>How to Convert PDF to JPG or PNG</h2>

            <p>
              Convert PDF pages to image files in just a few
              simple steps.
            </p>
          </div>

          <div className="pdf-to-jpg-png-steps">
            <div className="pdf-to-jpg-png-step">
              <div className="pdf-to-jpg-png-step-number">
                1
              </div>

              <h3>Upload your PDF</h3>

              <p>
                Select a PDF file from your computer or drag
                and drop it into the upload area.
              </p>
            </div>

            <div className="pdf-to-jpg-png-step">
              <div className="pdf-to-jpg-png-step-number">
                2
              </div>

              <h3>Choose your settings</h3>

              <p>
                Select JPG or PNG, choose JPG quality if
                needed, and select the pages you want to
                convert.
              </p>
            </div>

            <div className="pdf-to-jpg-png-step">
              <div className="pdf-to-jpg-png-step-number">
                3
              </div>

              <h3>Download your images</h3>

              <p>
                Convert the selected pages and download the
                resulting JPG or PNG images.
              </p>
            </div>
          </div>
        </section>

        {/* Explanation */}
        <section className="pdf-to-jpg-png-light-section">
          <div className="pdf-to-jpg-png-article">
            <h2>What Does PDF to JPG/PNG Conversion Do?</h2>

            <p>
              PDF to JPG or PNG conversion turns each
              selected PDF page into an image. This can be
              useful when you need to share a PDF page as an
              image, use a document page in a presentation,
              upload a page to a website, or work with
              applications that accept image files instead of
              PDFs.
            </p>

            <p>
              Smart Tools renders PDF pages in your browser
              and creates an image from the rendered page.
              You can choose JPG for smaller image files or
              PNG when you prefer lossless image output.
            </p>
          </div>
        </section>

        {/* Important information */}
        <section className="pdf-to-jpg-png-content-section">
          <div className="pdf-to-jpg-png-important">
            <h2>Important Information</h2>

            <ul className="pdf-to-jpg-png-important-list">
              <li>
                The maximum supported PDF size is 25 MB.
              </li>

              <li>
                For browser stability, PDFs are limited to
                100 pages.
              </li>

              <li>
                Each selected PDF page is rendered as an
                image.
              </li>

              <li>
                JPG quality settings affect image quality
                and file size.
              </li>

              <li>
                PNG files generally have larger file sizes
                than JPG files.
              </li>

              <li>
                Password-protected or encrypted PDFs may not
                be supported.
              </li>

              <li>
                Very large or complex PDFs may require more
                browser memory.
              </li>
            </ul>
          </div>
        </section>

        {/* FAQ */}
        <section className="pdf-to-jpg-png-content-section">
          <div className="pdf-to-jpg-png-faq">
            <div className="pdf-to-jpg-png-content-header">
              <h2>Frequently Asked Questions</h2>
            </div>

            <div className="pdf-to-jpg-png-faq-list">
              <details>
                <summary>
                  Is the PDF to JPG/PNG converter free?
                </summary>

                <p>
                  Yes. Smart Tools is designed to provide
                  this PDF to image conversion tool online
                  for free.
                </p>
              </details>

              <details>
                <summary>
                  Can I convert only specific PDF pages?
                </summary>

                <p>
                  Yes. Select "Selected Pages" and enter
                  individual pages or ranges such as
                  1, 3, 5-7.
                </p>
              </details>

              <details>
                <summary>
                  Should I use JPG or PNG?
                </summary>

                <p>
                  JPG is generally useful when you want
                  smaller image files. PNG can be useful when
                  you prefer lossless image output.
                </p>
              </details>

              <details>
                <summary>
                  Are my PDF files uploaded to a server?
                </summary>

                <p>
                  The conversion is designed to happen
                  directly in your browser. Smart Tools does
                  not intentionally upload your PDF to its
                  server for conversion.
                </p>
              </details>

              <details>
                <summary>
                  What is the maximum PDF size?
                </summary>

                <p>
                  The maximum supported PDF file size is
                  25 MB, with a maximum of 100 pages for
                  browser stability.
                </p>
              </details>

              <details>
                <summary>
                  Can I convert a password-protected PDF?
                </summary>

                <p>
                  Password-protected or encrypted PDFs may
                  not be supported. Use an unlocked PDF if
                  the converter cannot read your file.
                </p>
              </details>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
};

export default PDFToJPGPNG;