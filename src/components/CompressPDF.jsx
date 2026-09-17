import { useEffect, useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist/build/pdf.mjs";
import "./CompressPDF.css";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).toString();

function CompressPDF() {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");

  const [compressionLevel, setCompressionLevel] =
    useState("recommended");

  const [isCompressing, setIsCompressing] =
    useState(false);

  const [progress, setProgress] = useState(0);

  const [compressedFile, setCompressedFile] =
    useState(null);

  const [originalSize, setOriginalSize] =
    useState(0);

  const [compressedSize, setCompressedSize] =
    useState(0);

  const [pageCount, setPageCount] =
    useState(0);

  const [compressionMessage, setCompressionMessage] =
    useState("");

  const fileInputRef = useRef(null);
  const compressedUrlRef = useRef(null);

  const MAX_FILE_SIZE = 25 * 1024 * 1024;
  const MAX_PAGE_COUNT = 100;

  const compressionSettings = {
    high: {
      label: "High Quality",
      description:
        "Preserves more visual quality with a moderate reduction in file size.",
      jpegQuality: 0.85,
      renderScale: 1.7,
    },

    recommended: {
      label: "Recommended",
      description:
        "A balanced option for file size and document quality.",
      jpegQuality: 0.70,
      renderScale: 1.5,
    },

    strong: {
      label: "Strong Compression",
      description:
        "Creates a smaller PDF with more noticeable image compression.",
      jpegQuality: 0.55,
      renderScale: 1.25,
    },
  };

  useEffect(() => {
    document.title =
      "Compress PDF Online Free | Smart Tools";

    const description =
      "Compress PDF files online for free. Reduce PDF file size while keeping documents easy to read and share.";

    let metaDescription =
      document.querySelector(
        'meta[name="description"]'
      );

    if (!metaDescription) {
      metaDescription =
        document.createElement("meta");

      metaDescription.setAttribute(
        "name",
        "description"
      );

      document.head.appendChild(
        metaDescription
      );
    }

    metaDescription.setAttribute(
      "content",
      description
    );

    return () => {
      if (compressedUrlRef.current) {
        URL.revokeObjectURL(
          compressedUrlRef.current
        );
      }
    };
  }, []);

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getOutputFileName = (fileName) => {
    const nameWithoutExtension =
      fileName.replace(
        /\.pdf$/i,
        ""
      );

    const cleanedName =
      nameWithoutExtension.replace(
        /-compressed$/i,
        ""
      );

    return `${cleanedName}-compressed.pdf`;
  };

  const validateAndSetFile = (
    selectedFile
  ) => {
    setError("");
    setCompressedFile(null);
    setProgress(0);
    setPageCount(0);
    setCompressionMessage("");

    if (compressedUrlRef.current) {
      URL.revokeObjectURL(
        compressedUrlRef.current
      );

      compressedUrlRef.current = null;
    }

    if (!selectedFile) {
      return;
    }

    const isPDF =
      selectedFile.type ===
        "application/pdf" ||
      selectedFile.name
        .toLowerCase()
        .endsWith(".pdf");

    if (!isPDF) {
      setError(
        "Please select a valid PDF file."
      );
      return;
    }

    if (
      selectedFile.size >
      MAX_FILE_SIZE
    ) {
      setError(
        "PDF file size must be 25 MB or less."
      );
      return;
    }

    setFile(selectedFile);
    setOriginalSize(
      selectedFile.size
    );
    setCompressedSize(0);
  };

  const handleFileChange = (
    event
  ) => {
    const selectedFile =
      event.target.files?.[0];

    if (selectedFile) {
      validateAndSetFile(
        selectedFile
      );
    }

    event.target.value = "";
  };

  const handleDragOver = (
    event
  ) => {
    event.preventDefault();

    if (!isCompressing) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (
    event
  ) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (
    event
  ) => {
    event.preventDefault();
    setIsDragging(false);

    if (isCompressing) {
      return;
    }

    const droppedFile =
      event.dataTransfer.files?.[0];

    if (droppedFile) {
      validateAndSetFile(
        droppedFile
      );
    }
  };

  const handleRemoveFile = () => {
    if (isCompressing) {
      return;
    }

    setFile(null);
    setError("");
    setCompressedFile(null);
    setProgress(0);
    setOriginalSize(0);
    setCompressedSize(0);
    setPageCount(0);
    setCompressionMessage("");

    if (compressedUrlRef.current) {
      URL.revokeObjectURL(
        compressedUrlRef.current
      );

      compressedUrlRef.current = null;
    }
  };

  const compressPDF = async () => {
    if (!file || isCompressing) {
      return;
    }

    setError("");
    setIsCompressing(true);
    setProgress(0);
    setCompressedFile(null);
    setCompressionMessage("");

    if (compressedUrlRef.current) {
      URL.revokeObjectURL(
        compressedUrlRef.current
      );

      compressedUrlRef.current = null;
    }

    try {
      const settings =
        compressionSettings[
          compressionLevel
        ];

      const fileArrayBuffer =
        await file.arrayBuffer();

      const loadingTask =
        pdfjsLib.getDocument({
          data: new Uint8Array(
            fileArrayBuffer
          ),
        });

      const pdf =
        await loadingTask.promise;

      const totalPages =
        pdf.numPages;

      setPageCount(totalPages);

      if (
        totalPages >
        MAX_PAGE_COUNT
      ) {
        throw new Error(
          `This PDF contains ${totalPages} pages. For browser stability, PDFs with more than ${MAX_PAGE_COUNT} pages are not currently supported.`
        );
      }

      const outputPdf =
        await PDFDocument.create();

      for (
        let pageNumber = 1;
        pageNumber <= totalPages;
        pageNumber++
      ) {
        const page =
          await pdf.getPage(
            pageNumber
          );

        const viewport =
          page.getViewport({
            scale:
              settings.renderScale,
          });

        const canvas =
          document.createElement(
            "canvas"
          );

        const context =
          canvas.getContext(
            "2d",
            {
              alpha: false,
            }
          );

        if (!context) {
          throw new Error(
            "Your browser could not create the required rendering canvas."
          );
        }

        canvas.width =
          Math.ceil(
            viewport.width
          );

        canvas.height =
          Math.ceil(
            viewport.height
          );

        context.fillStyle =
          "#ffffff";

        context.fillRect(
          0,
          0,
          canvas.width,
          canvas.height
        );

        await page.render({
          canvasContext:
            context,
          viewport,
        }).promise;

        const jpegDataUrl =
          canvas.toDataURL(
            "image/jpeg",
            settings.jpegQuality
          );

        const jpegBase64 =
          jpegDataUrl.split(
            ","
          )[1];

        const jpegBytes =
          Uint8Array.from(
            atob(jpegBase64),
            (character) =>
              character.charCodeAt(
                0
              )
          );

        const embeddedImage =
          await outputPdf.embedJpg(
            jpegBytes
          );

        const pageWidth =
          viewport.width;

        const pageHeight =
          viewport.height;

        const outputPage =
          outputPdf.addPage([
            pageWidth,
            pageHeight,
          ]);

        outputPage.drawImage(
          embeddedImage,
          {
            x: 0,
            y: 0,
            width: pageWidth,
            height: pageHeight,
          }
        );

        const currentProgress =
          Math.round(
            (pageNumber /
              totalPages) *
              90
          );

        setProgress(
          currentProgress
        );

        page.cleanup();

        canvas.width = 1;
        canvas.height = 1;

        await new Promise(
          (resolve) => {
            setTimeout(
              resolve,
              0
            );
          }
        );
      }

      setProgress(95);

      const compressedBytes =
        await outputPdf.save({
          useObjectStreams: true,
        });

      const compressedBlob =
        new Blob(
          [compressedBytes],
          {
            type: "application/pdf",
          }
        );

      const outputFileName =
        getOutputFileName(
          file.name
        );

      const finalFile =
        new File(
          [compressedBlob],
          outputFileName,
          {
            type: "application/pdf",
          }
        );

      const downloadUrl =
        URL.createObjectURL(
          compressedBlob
        );

      compressedUrlRef.current =
        downloadUrl;

      setCompressedFile({
        file: finalFile,
        url: downloadUrl,
      });

      setCompressedSize(
        compressedBlob.size
      );

      if (
        compressedBlob.size <
        file.size
      ) {
        setCompressionMessage(
          "Your PDF was successfully reduced in size."
        );
      } else {
        setCompressionMessage(
          "This PDF was already well optimized, so there was no significant size reduction."
        );
      }

      setProgress(100);
    } catch (
      compressionError
    ) {
      console.error(
        "PDF compression error:",
        compressionError
      );

      let message =
        "We could not compress this PDF.";

      if (
        compressionError?.message
      ) {
        if (
          compressionError.message.includes(
            "password"
          ) ||
          compressionError.message.includes(
            "encrypted"
          )
        ) {
          message =
            "This PDF appears to be password-protected or encrypted. Please use an unlocked PDF.";
        } else if (
          compressionError.message.includes(
            "pages"
          )
        ) {
          message =
            compressionError.message;
        } else if (
          compressionError.message.includes(
            "canvas"
          )
        ) {
          message =
            "Your browser could not process this PDF. Please try a different browser or a smaller PDF.";
        }
      }

      setError(message);
      setCompressedFile(null);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleDownload = () => {
    if (!compressedFile?.url) {
      return;
    }

    const link =
      document.createElement(
        "a"
      );

    link.href =
      compressedFile.url;

    link.download =
      compressedFile.file.name;

    document.body.appendChild(
      link
    );

    link.click();

    document.body.removeChild(
      link
    );
  };

  const getReductionPercentage =
    () => {
      if (
        !originalSize ||
        !compressedSize
      ) {
        return 0;
      }

      if (
        compressedSize >=
        originalSize
      ) {
        return 0;
      }

      return (
        (
          (
            originalSize -
            compressedSize
          ) /
          originalSize
        ) *
        100
      ).toFixed(1);
    };

  const getSavedSize = () => {
    if (
      !originalSize ||
      !compressedSize ||
      compressedSize >=
        originalSize
    ) {
      return 0;
    }

    return (
      originalSize -
      compressedSize
    );
  };

  return (
    <>
      <section className="compress-pdf-section">
        <div className="container">
          <div className="compress-pdf-header">
            <h1>
              Compress PDF Online
            </h1>

            <p>
              Reduce PDF file size online
              while keeping your document
              easy to read, store, and share.
            </p>
          </div>

          {!file && (
            <div
              className={`compress-pdf-upload ${
                isDragging
                  ? "compress-pdf-upload-active"
                  : ""
              }`}
              onDragOver={
                handleDragOver
              }
              onDragLeave={
                handleDragLeave
              }
              onDrop={handleDrop}
            >
              <div className="compress-pdf-upload-icon">
                📄
              </div>

              <h2>
                Upload your PDF
              </h2>

              <p>
                Drag & drop your PDF here
                or choose a file from your
                device.
              </p>

              <button
                type="button"
                className="compress-pdf-browse-btn"
                onClick={
                  handleBrowseClick
                }
              >
                Choose PDF
              </button>

              <input
                ref={
                  fileInputRef
                }
                type="file"
                accept="application/pdf,.pdf"
                onChange={
                  handleFileChange
                }
                hidden
              />

              <span className="compress-pdf-upload-note">
                Maximum file size: 25 MB
              </span>
            </div>
          )}

          {error && (
            <div
              className="compress-pdf-error"
              role="alert"
            >
              {error}
            </div>
          )}

          {file && (
            <div className="compress-pdf-file">
              <div className="compress-pdf-file-icon">
                📄
              </div>

              <div className="compress-pdf-file-info">
                <strong>
                  {file.name}
                </strong>

                <span>
                  {formatFileSize(
                    file.size
                  )}

                  {pageCount >
                    0 &&
                    ` • ${pageCount} pages`}
                </span>
              </div>

              {!isCompressing && (
                <button
                  type="button"
                  className="compress-pdf-remove"
                  onClick={
                    handleRemoveFile
                  }
                >
                  Remove
                </button>
              )}
            </div>
          )}

          {file &&
            !compressedFile && (
              <div className="compress-pdf-options">
                <h2>
                  Choose compression
                  level
                </h2>

                <div className="compress-pdf-levels">
                  {Object.entries(
                    compressionSettings
                  ).map(
                    ([
                      key,
                      option,
                    ]) => (
                      <button
                        key={key}
                        type="button"
                        className={`compress-pdf-level ${
                          compressionLevel ===
                          key
                            ? "compress-pdf-level-active"
                            : ""
                        }`}
                        onClick={() =>
                          setCompressionLevel(
                            key
                          )
                        }
                        disabled={
                          isCompressing
                        }
                      >
                        <span className="compress-pdf-level-radio">
                          {compressionLevel ===
                          key
                            ? "✓"
                            : ""}
                        </span>

                        <span className="compress-pdf-level-content">
                          <strong>
                            {
                              option.label
                            }
                          </strong>

                          <small>
                            {
                              option.description
                            }
                          </small>
                        </span>
                      </button>
                    )
                  )}
                </div>

                {!isCompressing && (
                  <button
                    type="button"
                    className="compress-pdf-button"
                    onClick={
                      compressPDF
                    }
                  >
                    Compress PDF
                  </button>
                )}

                {isCompressing && (
                  <div className="compress-pdf-progress">
                    <div className="compress-pdf-progress-header">
                      <span>
                        Compressing PDF...
                      </span>

                      <strong>
                        {progress}%
                      </strong>
                    </div>

                    <div className="compress-pdf-progress-track">
                      <div
                        className="compress-pdf-progress-bar"
                        style={{
                          width: `${progress}%`,
                        }}
                      />
                    </div>

                    <p>
                      Processing{" "}
                      {pageCount >
                      0
                        ? `${pageCount} pages`
                        : "your PDF"}
                      . Please keep
                      this page open.
                    </p>
                  </div>
                )}
              </div>
            )}

          {compressedFile && (
            <div className="compress-pdf-result">
              <div className="compress-pdf-success-icon">
                ✓
              </div>

              <h2>
                Your PDF is ready
              </h2>

              <p>
                {compressionMessage}
              </p>

              <div className="compress-pdf-stats">
                <div>
                  <span>
                    Original size
                  </span>

                  <strong>
                    {formatFileSize(
                      originalSize
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Compressed size
                  </span>

                  <strong>
                    {formatFileSize(
                      compressedSize
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Size reduction
                  </span>

                  <strong>
                    {
                      getReductionPercentage()
                    }
                    %
                  </strong>
                </div>
              </div>

              {getSavedSize() >
                0 && (
                <div className="compress-pdf-saved">
                  You saved{" "}
                  <strong>
                    {formatFileSize(
                      getSavedSize()
                    )}
                  </strong>{" "}
                  of storage space.
                </div>
              )}

              <button
                type="button"
                className="compress-pdf-download"
                onClick={
                  handleDownload
                }
              >
                Download Compressed PDF
              </button>

              <button
                type="button"
                className="compress-pdf-start-over"
                onClick={
                  handleRemoveFile
                }
              >
                Compress Another PDF
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Privacy / Client-Side Processing */}
      <section className="compress-pdf-privacy">
        <div className="container">
          <div className="compress-pdf-info-card">
            <div className="compress-pdf-info-icon">
              🔒
            </div>

            <div>
              <h2>
                Your PDF stays in your
                browser
              </h2>

              <p>
                This browser-based tool
                processes your PDF locally
                on your device. Your file is
                not intentionally uploaded to
                a Smart Tools server for
                compression.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="compress-pdf-content-section">
        <div className="container">
          <div className="compress-pdf-content-header">
            <h2>
              How to Compress a PDF
            </h2>

            <p>
              Reduce the size of your PDF in
              just a few simple steps.
            </p>
          </div>

          <div className="compress-pdf-steps">
            <div className="compress-pdf-step">
              <span>1</span>

              <h3>
                Upload your PDF
              </h3>

              <p>
                Select a PDF file from your
                device or drag it into the
                upload area.
              </p>
            </div>

            <div className="compress-pdf-step">
              <span>2</span>

              <h3>
                Choose compression
              </h3>

              <p>
                Select High Quality,
                Recommended, or Strong
                Compression based on your
                needs.
              </p>
            </div>

            <div className="compress-pdf-step">
              <span>3</span>

              <h3>
                Compress and download
              </h3>

              <p>
                Let the tool process your
                document and download the
                resulting PDF.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Compression */}
      <section className="compress-pdf-content-section compress-pdf-light-section">
        <div className="container">
          <div className="compress-pdf-article">
            <h2>
              What Does PDF Compression
              Do?
            </h2>

            <p>
              PDF compression reduces the
              amount of data required to store
              a PDF. This can make documents
              easier to upload, email, store,
              and share.
            </p>

            <p>
              The amount of reduction depends
              on how the original PDF was
              created. PDFs containing scanned
              pages and large images often have
              more room for size reduction than
              PDFs that have already been
              optimized.
            </p>

            <h3>
              Which compression level
              should I choose?
            </h3>

            <p>
              For most documents, the
              Recommended setting is a good
              starting point. Choose High
              Quality when visual detail is
              more important, or Strong
              Compression when minimizing file
              size is your priority.
            </p>
          </div>
        </div>
      </section>

      {/* Important Limitations */}
      <section className="compress-pdf-content-section">
        <div className="container">
          <div className="compress-pdf-article">
            <h2>
              Important Information
            </h2>

            <p>
              This version of the compressor
              rebuilds PDF pages using
              compressed images. Because of
              this, some original PDF features
              may not be preserved.
            </p>

            <ul>
              <li>
                Selectable text may become
                image-based.
              </li>

              <li>
                Interactive forms may not be
                preserved.
              </li>

              <li>
                Some annotations and links may
                not be retained.
              </li>

              <li>
                Complex PDF features may not
                work in the rebuilt document.
              </li>

              <li>
                Password-protected PDFs are
                currently not supported.
              </li>
            </ul>

            <p>
              For documents where these
              features are important, keep the
              original PDF as your master copy.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="compress-pdf-faq">
        <div className="container">
          <div className="compress-pdf-content-header">
            <h2>
              Frequently Asked Questions
            </h2>
          </div>

          <div className="compress-pdf-faq-list">
            <details>
              <summary>
                Is this PDF compressor free?
              </summary>

              <p>
                Yes. Smart Tools is designed
                to provide this PDF compression
                tool without requiring payment
                for normal use.
              </p>
            </details>

            <details>
              <summary>
                What is the maximum PDF size?
              </summary>

              <p>
                The current upload limit is
                25 MB. Browser processing is
                also limited to PDFs containing
                up to 100 pages.
              </p>
            </details>

            <details>
              <summary>
                Will my PDF be uploaded to a
                server?
              </summary>

              <p>
                The current compression process
                runs in your browser. The tool
                does not intentionally send your
                PDF to a Smart Tools server for
                compression.
              </p>
            </details>

            <details>
              <summary>
                Which compression level is
                best?
              </summary>

              <p>
                Recommended is the best starting
                point for most documents. High
                Quality prioritizes visual
                quality, while Strong Compression
                prioritizes a smaller file.
              </p>
            </details>

            <details>
              <summary>
                Can every PDF be made smaller?
              </summary>

              <p>
                No. Some PDFs are already highly
                optimized. In those cases, the
                resulting file may have little or
                no size reduction.
              </p>
            </details>

            <details>
              <summary>
                Will compressed PDF text remain
                selectable?
              </summary>

              <p>
                Not necessarily. The current
                browser-based method rebuilds
                pages as images, so text may no
                longer behave like the original
                selectable PDF text.
              </p>
            </details>
          </div>
        </div>
      </section>
    </>
  );
}

export default CompressPDF;