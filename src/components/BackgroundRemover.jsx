import { useEffect, useRef, useState } from "react";
// import imglyRemoveBackground from "@imgly/background-removal";

import { removeBackground as imglyRemoveBackground } from "@imgly/background-removal";
import "./BackgroundRemover.css";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const BackgroundRemover = () => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [resultUrl, setResultUrl] = useState("");

  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");

  const [error, setError] = useState("");

  const fileInputRef = useRef(null);

  const previewUrlRef = useRef("");
  const resultUrlRef = useRef("");

  /* ----------------------------------
     SEO
  ---------------------------------- */

  useEffect(() => {
    document.title =
      "Background Remover Online Free | Smart Tools";

    const description =
      "Remove image backgrounds online for free. Upload a JPG, PNG, or WebP image and download a transparent PNG using Smart Tools.";

    let metaDescription = document.querySelector(
      'meta[name="description"]'
    );

    if (!metaDescription) {
      metaDescription = document.createElement("meta");
      metaDescription.setAttribute("name", "description");
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

  /* ----------------------------------
     Cleanup on unmount
  ---------------------------------- */

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }

      if (resultUrlRef.current) {
        URL.revokeObjectURL(resultUrlRef.current);
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
      "image/webp",
    ];

    const validExtensions = [
      ".jpg",
      ".jpeg",
      ".png",
      ".webp",
    ];

    const fileName = selectedFile.name.toLowerCase();

    const validType = validTypes.includes(
      selectedFile.type
    );

    const validExtension = validExtensions.some(
      (extension) => fileName.endsWith(extension)
    );

    if (!validType && !validExtension) {
      return "Please upload a JPG, JPEG, PNG, or WebP image.";
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
     Clear result URL
  ---------------------------------- */

  const clearResultUrl = () => {
    if (resultUrlRef.current) {
      URL.revokeObjectURL(resultUrlRef.current);
      resultUrlRef.current = "";
    }

    setResultUrl("");
  };

  /* ----------------------------------
     Handle file
  ---------------------------------- */

  const handleFileSelect = (selectedFile) => {
    setError("");
    setStatus("");
    setProgress(0);

    const validationError =
      validateFile(selectedFile);

    if (validationError) {
      setError(validationError);
      return;
    }

    clearPreviewUrl();
    clearResultUrl();

    const objectUrl =
      URL.createObjectURL(selectedFile);

    previewUrlRef.current = objectUrl;

    setFile(selectedFile);
    setPreviewUrl(objectUrl);
  };

  /* ----------------------------------
     File input
  ---------------------------------- */

  const handleInputChange = (event) => {
    const selectedFile =
      event.target.files?.[0];

    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  /* ----------------------------------
     Browse
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

    const droppedFile =
      event.dataTransfer.files?.[0];

    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  /* ----------------------------------
     Remove Background
  ---------------------------------- */

  const removeBackground = async () => {
    if (!file) {
      setError("Please upload an image first.");
      return;
    }

    if (isProcessing) {
      return;
    }

    setError("");
    setProgress(0);
    setStatus("Preparing image...");
    setIsProcessing(true);

    clearResultUrl();

    try {
      const resultBlob =
        await imglyRemoveBackground(file, {
          progress: (
            key,
            current,
            total
          ) => {
            if (
              typeof current === "number" &&
              typeof total === "number" &&
              total > 0
            ) {
              const percentage = Math.round(
                (current / total) * 100
              );

              setProgress(
                Math.min(100, Math.max(0, percentage))
              );
            }

            if (key) {
              const cleanStatus = key
                .replace(/:/g, " ")
                .replace(/_/g, " ")
                .replace(/\b\w/g, (letter) =>
                  letter.toUpperCase()
                );

              setStatus(cleanStatus);
            }
          },
        });

      if (!resultBlob) {
        throw new Error(
          "Background removal did not return an image."
        );
      }

      const outputUrl =
        URL.createObjectURL(resultBlob);

      resultUrlRef.current = outputUrl;

      setResultUrl(outputUrl);
      setProgress(100);
      setStatus(
        "Background removed successfully."
      );
    } catch (processingError) {
      console.error(
        "Background removal error:",
        processingError
      );

      setError(
        processingError?.message ||
          "Unable to remove the image background. Please try another image."
      );

      setProgress(0);
      setStatus("");
    } finally {
      setIsProcessing(false);
    }
  };

  /* ----------------------------------
     Download
  ---------------------------------- */

  const downloadResult = () => {
    if (!resultUrl) {
      return;
    }

    const originalName =
      file?.name || "image";

    const withoutExtension =
      originalName.replace(
        /\.(jpg|jpeg|png|webp)$/i,
        ""
      );

    const downloadName =
      `${withoutExtension}-no-background.png`;

    const link =
      document.createElement("a");

    link.href = resultUrl;
    link.download = downloadName;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
  };

  /* ----------------------------------
     Start Over
  ---------------------------------- */

  const startOver = () => {
    clearPreviewUrl();
    clearResultUrl();

    setFile(null);
    setError("");
    setIsDragging(false);

    setIsProcessing(false);
    setProgress(0);
    setStatus("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <main className="background-remover-section">
      <div className="container">

        {/* Header */}

        <div className="background-remover-header">

          <span className="background-remover-badge">
            FREE IMAGE TOOL
          </span>

          <h1>
            Background Remover
          </h1>

          <p>
            Remove backgrounds from images online for
            free. Upload your image and create a
            transparent PNG in your browser.
          </p>

        </div>

        {/* Main Tool */}

        <div className="background-remover-tool">

          {/* Upload */}

          {!file && (
            <div
              className={`background-remover-upload ${
                isDragging
                  ? "background-remover-upload-active"
                  : ""
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleBrowseClick}
            >

              <div className="background-remover-upload-icon">
                ✨
              </div>

              <h2>
                Upload an Image
              </h2>

              <p>
                Drag & drop your image here or click
                to browse
              </p>

              <button
                type="button"
                className="background-remover-browse-btn"
                onClick={(event) => {
                  event.stopPropagation();
                  handleBrowseClick();
                }}
              >
                Choose Image
              </button>

              <div className="background-remover-upload-note">
                Supported formats: JPG, JPEG, PNG,
                WebP • Maximum size: 10 MB
              </div>

            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleInputChange}
            hidden
          />

          {/* Error */}

          {error && (
            <div className="background-remover-error">

              <span>
                ⚠️
              </span>

              <span>
                {error}
              </span>

            </div>
          )}

          {/* Workspace */}

          {file && (
            <div className="background-remover-workspace">

              {/* Original */}

              <div className="background-remover-panel">

                <div className="background-remover-panel-header">

                  <h2>
                    Original Image
                  </h2>

                  <button
                    type="button"
                    className="background-remover-remove"
                    onClick={startOver}
                    disabled={isProcessing}
                  >
                    Remove
                  </button>

                </div>

                <div className="background-remover-preview">

                  <img
                    src={previewUrl}
                    alt="Original image"
                  />

                </div>

                <div className="background-remover-file-info">

                  <strong>
                    {file.name}
                  </strong>

                  <span>
                    {formatFileSize(file.size)}
                  </span>

                </div>

              </div>

              {/* Result */}

              <div className="background-remover-panel">

                <div className="background-remover-panel-header">

                  <h2>
                    Background Removed
                  </h2>

                </div>

                {!resultUrl &&
                  !isProcessing && (
                    <div className="background-remover-empty">

                      <div className="background-remover-empty-icon">
                        ✨
                      </div>

                      <h3>
                        Ready to remove background
                      </h3>

                      <p>
                        Click the button below to
                        automatically remove the
                        background.
                      </p>

                    </div>
                  )}

                {isProcessing && (
                  <div className="background-remover-progress">

                    <div className="background-remover-progress-header">

                      <span>
                        {status ||
                          "Processing image..."}
                      </span>

                      <strong>
                        {progress}%
                      </strong>

                    </div>

                    <div className="background-remover-progress-track">

                      <div
                        className="background-remover-progress-bar"
                        style={{
                          width: `${progress}%`,
                        }}
                      />

                    </div>

                    <p>
                      The first run may take longer
                      while the AI model is loaded.
                    </p>

                  </div>
                )}

                {resultUrl &&
                  !isProcessing && (
                    <div className="background-remover-result">

                      <img
                        src={resultUrl}
                        alt="Image with background removed"
                      />

                    </div>
                  )}

              </div>

            </div>
          )}

          {/* Remove Background Button */}

          {file &&
            !resultUrl && (
              <div className="background-remover-actions">

                <button
                  type="button"
                  className="background-remover-button"
                  onClick={removeBackground}
                  disabled={isProcessing}
                >
                  {isProcessing
                    ? "Removing Background..."
                    : "Remove Background"}
                </button>

              </div>
            )}

          {/* Result Actions */}

          {resultUrl &&
            !isProcessing && (
              <div className="background-remover-result-actions">

                <button
                  type="button"
                  className="background-remover-download"
                  onClick={downloadResult}
                >
                  Download PNG
                </button>

                <button
                  type="button"
                  className="background-remover-start-over"
                  onClick={startOver}
                >
                  Start Over
                </button>

              </div>
            )}

        </div>

        {/* Privacy */}

        <section className="background-remover-privacy">

          <div className="background-remover-info-card">

            <div className="background-remover-info-icon">
              🔒
            </div>

            <div>

              <h3>
                Your image is processed in your browser
              </h3>

              <p>
                Smart Tools is designed to perform
                background removal directly in your
                browser. Your image is not intentionally
                uploaded to a Smart Tools server for
                background removal.
              </p>

              <p>
                The background-removal model and browser
                runtime may be downloaded separately when
                the tool is first used.
              </p>

            </div>

          </div>

        </section>

        {/* How It Works */}

        <section className="background-remover-content-section">

          <div className="background-remover-content-header">

            <span>
              HOW IT WORKS
            </span>

            <h2>
              How to Remove an Image Background
            </h2>

            <p>
              Remove the background from an image in
              three simple steps.
            </p>

          </div>

          <div className="background-remover-steps">

            <div className="background-remover-step">

              <div className="background-remover-step-number">
                1
              </div>

              <h3>
                Upload Your Image
              </h3>

              <p>
                Select a JPG, JPEG, PNG, or WebP image
                from your device.
              </p>

            </div>

            <div className="background-remover-step">

              <div className="background-remover-step-number">
                2
              </div>

              <h3>
                Remove the Background
              </h3>

              <p>
                The AI-powered browser tool analyzes
                the image and separates the foreground
                from its background.
              </p>

            </div>

            <div className="background-remover-step">

              <div className="background-remover-step-number">
                3
              </div>

              <h3>
                Download Your PNG
              </h3>

              <p>
                Download the processed image as a
                transparent PNG file.
              </p>

            </div>

          </div>

        </section>

        {/* Explanation */}

        <section className="background-remover-light-section">

          <article className="background-remover-article">

            <h2>
              What Does a Background Remover Do?
            </h2>

            <p>
              A background remover separates the main
              subject of an image from the surrounding
              background. This can be useful for product
              photos, profile pictures, marketing graphics,
              social media images, and other creative
              projects.
            </p>

            <p>
              Smart Tools uses an AI-based image
              segmentation model to identify the
              foreground and create transparency around
              the detected subject.
            </p>

            <p>
              The result is provided as a PNG image so
              transparent areas can remain transparent
              when you use the image in another design
              or application.
            </p>

          </article>

        </section>

        {/* Important Information */}

        <section className="background-remover-light-section">

          <article className="background-remover-article">

            <h2>
              Important Information
            </h2>

            <ul>

              <li>
                Background-removal accuracy depends on
                the image and how clearly the subject is
                separated from the background.
              </li>

              <li>
                Images with clear subjects and good
                contrast generally produce better results.
              </li>

              <li>
                Hair, fur, transparent objects, shadows,
                reflections, and very complex backgrounds
                can be challenging.
              </li>

              <li>
                The first processing attempt may take
                longer because the AI model and browser
                runtime need to be downloaded and
                initialized.
              </li>

              <li>
                Large images may require more browser
                memory and processing time.
              </li>

              <li>
                The output is a PNG image with
                transparency.
              </li>

            </ul>

          </article>

        </section>

        {/* FAQ */}

        <section className="background-remover-faq">

          <div className="background-remover-content-header">

            <span>
              FAQ
            </span>

            <h2>
              Frequently Asked Questions
            </h2>

          </div>

          <div className="background-remover-faq-list">

            <details>

              <summary>
                Is the background remover free?
              </summary>

              <p>
                Smart Tools provides this background
                removal tool as a free online tool.
              </p>

            </details>

            <details>

              <summary>
                Which image formats are supported?
              </summary>

              <p>
                The tool supports JPG, JPEG, PNG, and
                WebP images up to 10 MB.
              </p>

            </details>

            <details>

              <summary>
                Are my images uploaded to a server?
              </summary>

              <p>
                The background-removal processing is
                designed to run in your browser. Your
                image is not intentionally uploaded to a
                Smart Tools server for processing.
              </p>

            </details>

            <details>

              <summary>
                What format is the result?
              </summary>

              <p>
                The processed image is provided as a PNG
                with transparent background areas.
              </p>

            </details>

            <details>

              <summary>
                Why does the first image take longer?
              </summary>

              <p>
                The browser may need to download and
                initialize the AI model and supporting
                runtime the first time you use the tool.
                Later processing can be faster because
                browser caching may be available.
              </p>

            </details>

            <details>

              <summary>
                Will the background always be removed perfectly?
              </summary>

              <p>
                No. AI background removal can produce
                imperfect results, especially around hair,
                fur, transparent objects, reflections,
                shadows, and complicated backgrounds.
              </p>

            </details>

          </div>

        </section>

      </div>
    </main>
  );
};

export default BackgroundRemover;