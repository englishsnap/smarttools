import { useEffect, useRef, useState } from "react";
import { createWorker } from "tesseract.js";
import "./ImageToText.css";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const ImageToText = () => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const [error, setError] = useState("");

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");

  const [extractedText, setExtractedText] = useState("");
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef(null);
  const workerRef = useRef(null);
  const previewUrlRef = useRef("");

  /* ----------------------------------
     SEO
  ---------------------------------- */

  useEffect(() => {
    document.title = "Image to Text Converter Online Free | Smart Tools";

    const description =
      "Convert images to text online for free with OCR. Extract editable text from JPG, JPEG, and PNG images using Smart Tools.";

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

  /* ----------------------------------
     Cleanup on component unmount
  ---------------------------------- */

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = "";
      }

      if (workerRef.current) {
        workerRef.current
          .terminate()
          .catch(() => {});

        workerRef.current = null;
      }
    };
  }, []);

  /* ----------------------------------
     Format file size
  ---------------------------------- */

  const formatFileSize = (bytes) => {
    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  /* ----------------------------------
     Validate file
  ---------------------------------- */

  const validateFile = (selectedFile) => {
    if (!selectedFile) {
      return "Please select an image.";
    }

    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];

    const validExtensions = [
      ".jpg",
      ".jpeg",
      ".png",
    ];

    const fileName = selectedFile.name.toLowerCase();

    const validType = validTypes.includes(selectedFile.type);

    const validExtension = validExtensions.some((extension) =>
      fileName.endsWith(extension)
    );

    if (!validType && !validExtension) {
      return "Please upload a JPG, JPEG, or PNG image.";
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      return "Image size must be 10 MB or smaller.";
    }

    return "";
  };

  /* ----------------------------------
     Clear preview URL
  ---------------------------------- */

  const clearPreviewUrl = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = "";
    }

    setPreviewUrl("");
  };

  /* ----------------------------------
     Select file
  ---------------------------------- */

  const handleFileSelect = (selectedFile) => {
    setError("");
    setCopied(false);
    setExtractedText("");
    setProgress(0);
    setStatus("");

    const validationError = validateFile(selectedFile);

    if (validationError) {
      setError(validationError);
      return;
    }

    clearPreviewUrl();

    const objectUrl = URL.createObjectURL(selectedFile);

    previewUrlRef.current = objectUrl;

    setFile(selectedFile);
    setPreviewUrl(objectUrl);
  };

  /* ----------------------------------
     File input
  ---------------------------------- */

  const handleInputChange = (event) => {
    const selectedFile = event.target.files?.[0];

    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  /* ----------------------------------
     Browse button
  ---------------------------------- */

  const handleBrowseClick = () => {
    if (!isProcessing) {
      fileInputRef.current?.click();
    }
  };

  /* ----------------------------------
     Drag and Drop
  ---------------------------------- */

  const handleDragOver = (event) => {
    event.preventDefault();

    if (!isProcessing) {
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

    if (isProcessing) {
      return;
    }

    const droppedFile = event.dataTransfer.files?.[0];

    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  /* ----------------------------------
     OCR
  ---------------------------------- */

  const extractText = async () => {
    if (!file) {
      setError("Please upload an image first.");
      return;
    }

    if (isProcessing) {
      return;
    }

    setError("");
    setCopied(false);
    setExtractedText("");
    setProgress(0);
    setStatus("Starting OCR engine...");
    setIsProcessing(true);

    let worker = null;

    try {
      /*
        Tesseract.js current worker API:
        createWorker(language, OEM, options)
      */

      worker = await createWorker("eng", 1, {
        logger: (message) => {
          console.log("Tesseract:", message);

          if (
            message &&
            message.status === "recognizing text" &&
            typeof message.progress === "number"
          ) {
            const percentage = Math.round(
              message.progress * 100
            );

            setProgress(percentage);
            setStatus("Recognizing text...");
            return;
          }

          if (message && message.status) {
            let readableStatus = message.status
              .replace(/_/g, " ")
              .replace(/\b\w/g, (letter) =>
                letter.toUpperCase()
              );

            setStatus(`${readableStatus}...`);
          }
        },
      });

      workerRef.current = worker;

      setStatus("OCR engine ready...");
      setProgress(5);

      /*
        Recognize the selected image.
      */

      const result = await worker.recognize(file);

      const text = result?.data?.text?.trim() || "";

      if (!text) {
        throw new Error(
          "No readable text was found in this image. Try a clearer or higher-resolution image."
        );
      }

      setExtractedText(text);
      setProgress(100);
      setStatus("Text extraction completed.");
    } catch (ocrError) {
      console.error("OCR error:", ocrError);

      let errorMessage =
        "Unable to extract text from this image. Please try another image.";

      if (ocrError?.message) {
        errorMessage = ocrError.message;
      }

      setError(errorMessage);
      setProgress(0);
      setStatus("");
    } finally {
      if (worker) {
        try {
          await worker.terminate();
        } catch (terminateError) {
          console.warn(
            "Tesseract worker cleanup error:",
            terminateError
          );
        }
      }

      workerRef.current = null;
      setIsProcessing(false);
    }
  };

  /* ----------------------------------
     Copy extracted text
  ---------------------------------- */

  const copyText = async () => {
    if (!extractedText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(extractedText);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (copyError) {
      console.error("Copy error:", copyError);

      setError(
        "Unable to copy the text automatically. Please select and copy it manually."
      );
    }
  };

  /* ----------------------------------
     Download TXT
  ---------------------------------- */

  const downloadText = () => {
    if (!extractedText) {
      return;
    }

    const blob = new Blob([extractedText], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);

    const originalName = file?.name || "image";

    const withoutExtension = originalName.replace(
      /\.(jpg|jpeg|png)$/i,
      ""
    );

    const downloadName = `${withoutExtension}-text.txt`;

    const link = document.createElement("a");

    link.href = url;
    link.download = downloadName;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  /* ----------------------------------
     Clear everything
  ---------------------------------- */

  const clearAll = async () => {
    if (workerRef.current) {
      try {
        await workerRef.current.terminate();
      } catch {
        // Ignore cleanup errors.
      }

      workerRef.current = null;
    }

    clearPreviewUrl();

    setFile(null);
    setError("");
    setIsDragging(false);

    setIsProcessing(false);
    setProgress(0);
    setStatus("");

    setExtractedText("");
    setCopied(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /* ----------------------------------
     Render
  ---------------------------------- */

  return (
    <main className="image-to-text-section">
      <div className="container">

        {/* Header */}

        <div className="image-to-text-header">

          <span className="image-to-text-badge">
            FREE OCR TOOL
          </span>

          <h1>
            Image to Text Converter
          </h1>

          <p>
            Extract editable text from JPG, JPEG, and PNG
            images using OCR. Upload your image and convert
            it into text quickly and easily.
          </p>

        </div>

        {/* Main Tool */}

        <div className="image-to-text-tool">

          {/* Upload */}

          {!file && (
            <div
              className={`image-to-text-upload ${
                isDragging
                  ? "image-to-text-upload-active"
                  : ""
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleBrowseClick}
            >

              <div className="image-to-text-upload-icon">
                🖼️
              </div>

              <h2>
                Upload an Image
              </h2>

              <p>
                Drag & drop your image here or click to browse
              </p>

              <button
                type="button"
                className="image-to-text-browse-btn"
                onClick={(event) => {
                  event.stopPropagation();
                  handleBrowseClick();
                }}
              >
                Choose Image
              </button>

              <div className="image-to-text-upload-note">
                Supported formats: JPG, JPEG, PNG • Maximum
                size: 10 MB
              </div>

            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            onChange={handleInputChange}
            hidden
          />

          {/* Error */}

          {error && (
            <div className="image-to-text-error">
              <span>⚠️</span>

              <span>
                {error}
              </span>
            </div>
          )}

          {/* Workspace */}

          {file && (
            <div className="image-to-text-workspace">

              {/* Image Preview */}

              <div className="image-to-text-preview-panel">

                <div className="image-to-text-panel-header">

                  <h2>
                    Image Preview
                  </h2>

                  <button
                    type="button"
                    className="image-to-text-remove"
                    onClick={clearAll}
                    disabled={isProcessing}
                  >
                    Remove
                  </button>

                </div>

                <div className="image-to-text-preview">

                  <img
                    src={previewUrl}
                    alt="Selected image for text extraction"
                  />

                </div>

                <div className="image-to-text-file-info">

                  <strong>
                    {file.name}
                  </strong>

                  <span>
                    {formatFileSize(file.size)}
                  </span>

                </div>

              </div>

              {/* Output */}

              <div className="image-to-text-output-panel">

                <div className="image-to-text-panel-header">

                  <h2>
                    Extracted Text
                  </h2>

                  {extractedText && (
                    <button
                      type="button"
                      className="image-to-text-copy"
                      onClick={copyText}
                    >
                      {copied
                        ? "Copied!"
                        : "Copy Text"}
                    </button>
                  )}

                </div>

                {/* Empty state */}

                {!extractedText &&
                  !isProcessing && (
                    <div className="image-to-text-empty">

                      <div className="image-to-text-empty-icon">
                        Aa
                      </div>

                      <h3>
                        Ready to extract text
                      </h3>

                      <p>
                        Click the button below to scan the
                        image and extract readable text.
                      </p>

                    </div>
                  )}

                {/* Progress */}

                {isProcessing && (
                  <div className="image-to-text-progress">

                    <div className="image-to-text-progress-header">

                      <span>
                        {status || "Processing..."}
                      </span>

                      <strong>
                        {progress}%
                      </strong>

                    </div>

                    <div className="image-to-text-progress-track">

                      <div
                        className="image-to-text-progress-bar"
                        style={{
                          width: `${progress}%`,
                        }}
                      />

                    </div>

                    <p>
                      OCR may take a little longer for large
                      or detailed images.
                    </p>

                  </div>
                )}

                {/* Extracted text */}

                {extractedText &&
                  !isProcessing && (
                    <textarea
                      className="image-to-text-result-textarea"
                      value={extractedText}
                      onChange={(event) =>
                        setExtractedText(
                          event.target.value
                        )
                      }
                      aria-label="Extracted text"
                    />
                  )}

              </div>

            </div>
          )}

          {/* Extract button */}

          {file &&
            !extractedText && (
              <div className="image-to-text-actions">

                <button
                  type="button"
                  className="image-to-text-button"
                  onClick={extractText}
                  disabled={isProcessing}
                >
                  {isProcessing
                    ? "Extracting Text..."
                    : "Extract Text"}
                </button>

              </div>
            )}

          {/* Result actions */}

          {extractedText &&
            !isProcessing && (
              <div className="image-to-text-result-actions">

                <button
                  type="button"
                  className="image-to-text-download"
                  onClick={downloadText}
                >
                  Download Text File
                </button>

                <button
                  type="button"
                  className="image-to-text-start-over"
                  onClick={clearAll}
                >
                  Start Over
                </button>

              </div>
            )}

        </div>

        {/* Privacy */}

        <section className="image-to-text-privacy">

          <div className="image-to-text-info-card">

            <div className="image-to-text-info-icon">
              🔒
            </div>

            <div>

              <h3>
                Your image is processed in your browser
              </h3>

              <p>
                Smart Tools is designed to process your image
                directly in your browser using OCR technology.
                Your image is not intentionally uploaded to a
                Smart Tools server for text extraction.
              </p>

            </div>

          </div>

        </section>

        {/* How It Works */}

        <section className="image-to-text-content-section">

          <div className="image-to-text-content-header">

            <span>
              HOW IT WORKS
            </span>

            <h2>
              How to Convert an Image to Text
            </h2>

            <p>
              Extract text from an image in just a few simple
              steps.
            </p>

          </div>

          <div className="image-to-text-steps">

            <div className="image-to-text-step">

              <div className="image-to-text-step-number">
                1
              </div>

              <h3>
                Upload Your Image
              </h3>

              <p>
                Select a JPG, JPEG, or PNG image from your
                device or drag it into the upload area.
              </p>

            </div>

            <div className="image-to-text-step">

              <div className="image-to-text-step-number">
                2
              </div>

              <h3>
                Extract the Text
              </h3>

              <p>
                Our browser-based OCR engine analyzes the
                image and recognizes readable text.
              </p>

            </div>

            <div className="image-to-text-step">

              <div className="image-to-text-step-number">
                3
              </div>

              <h3>
                Copy or Download
              </h3>

              <p>
                Review and edit the extracted text, then
                copy or download it as a text file.
              </p>

            </div>

          </div>

        </section>

        {/* OCR Explanation */}

        <section className="image-to-text-light-section">

          <article className="image-to-text-article">

            <h2>
              What Is Image to Text OCR?
            </h2>

            <p>
              OCR stands for Optical Character Recognition.
              It is a technology that analyzes characters in
              an image and converts recognizable text into
              editable digital text.
            </p>

            <p>
              An image-to-text converter can be useful when
              you have screenshots, scanned documents,
              photographs of printed pages, receipts, notes,
              or other images containing text.
            </p>

            <p>
              Smart Tools uses Tesseract.js to perform OCR
              directly in the browser. After extraction, you
              can review and edit the recognized text before
              copying or downloading it.
            </p>

          </article>

        </section>

        {/* Important Information */}

        <section className="image-to-text-light-section">

          <article className="image-to-text-article">

            <h2>
              Important Information
            </h2>

            <ul>

              <li>
                OCR accuracy depends on image quality,
                resolution, lighting, and text clarity.
              </li>

              <li>
                Clear, printed text usually produces better
                results than blurry or distorted text.
              </li>

              <li>
                Handwritten text may not be recognized
                accurately.
              </li>

              <li>
                Complex tables, multiple columns, unusual
                layouts, and decorative fonts may produce
                imperfect results.
              </li>

              <li>
                The first OCR run may take longer because
                the browser needs to initialize the OCR engine
                and language data.
              </li>

              <li>
                Very large or highly detailed images can
                require more browser memory and processing
                time.
              </li>

            </ul>

          </article>

        </section>

        {/* FAQ */}

        <section className="image-to-text-faq">

          <div className="image-to-text-content-header">

            <span>
              FAQ
            </span>

            <h2>
              Frequently Asked Questions
            </h2>

          </div>

          <div className="image-to-text-faq-list">

            <details>

              <summary>
                Is the Image to Text converter free?
              </summary>

              <p>
                Yes. Smart Tools provides this
                image-to-text converter as a free online tool.
              </p>

            </details>

            <details>

              <summary>
                Which image formats are supported?
              </summary>

              <p>
                The tool currently supports JPG, JPEG, and
                PNG images up to 10 MB.
              </p>

            </details>

            <details>

              <summary>
                Are my images uploaded to a server?
              </summary>

              <p>
                The OCR process is designed to run in your
                browser. Your image is not intentionally
                uploaded to a Smart Tools server for OCR
                processing.
              </p>

            </details>

            <details>

              <summary>
                Can it extract text from handwritten notes?
              </summary>

              <p>
                Handwritten text may produce inaccurate
                results. The tool is primarily intended for
                recognizable printed or digital text.
              </p>

            </details>

            <details>

              <summary>
                Why is my extracted text inaccurate?
              </summary>

              <p>
                OCR accuracy can be affected by blurry
                images, low resolution, poor lighting,
                unusual fonts, rotated text, complex layouts,
                and other image quality issues.
              </p>

            </details>

            <details>

              <summary>
                Can I edit the extracted text?
              </summary>

              <p>
                Yes. Once the OCR process is complete, the
                extracted text appears in an editable text
                box.
              </p>

            </details>

            <details>

              <summary>
                Can I download the extracted text?
              </summary>

              <p>
                Yes. You can download the extracted content
                as a plain text TXT file.
              </p>

            </details>

          </div>

        </section>

      </div>
    </main>
  );
};

export default ImageToText;