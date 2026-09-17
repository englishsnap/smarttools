import { useEffect, useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";
import "./JPGPNGToPDF.css";

const MAX_TOTAL_SIZE = 25 * 1024 * 1024;
const MAX_IMAGES = 50;

const PAGE_SIZES = {
  a4: {
    label: "A4",
    width: 595.28,
    height: 841.89,
  },
  letter: {
    label: "Letter",
    width: 612,
    height: 792,
  },
  original: {
    label: "Original Size",
  },
};

const MARGIN_VALUES = {
  none: 0,
  small: 18,
  medium: 36,
  large: 54,
};

const QUALITY_VALUES = {
  high: 0.95,
  recommended: 0.85,
  smaller: 0.7,
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

const getImageDimensions = (file) => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(url);

      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(
        new Error(
          `Unable to read ${file.name}.`
        )
      );
    };

    image.src = url;
  });
};

const convertImageToJpeg = (
  file,
  quality
) => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);

    image.onload = () => {
      try {
        const canvas =
          document.createElement(
            "canvas"
          );

        canvas.width =
          image.naturalWidth;
        canvas.height =
          image.naturalHeight;

        const context =
          canvas.getContext("2d");

        if (!context) {
          throw new Error(
            "Unable to create image canvas."
          );
        }

        /*
         * White background prevents transparent
         * PNG areas from becoming black when
         * converted to JPEG.
         */
        context.fillStyle = "#ffffff";
        context.fillRect(
          0,
          0,
          canvas.width,
          canvas.height
        );

        context.drawImage(
          image,
          0,
          0
        );

        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(
              url
            );

            if (!blob) {
              reject(
                new Error(
                  `Unable to convert ${file.name} to JPEG.`
                )
              );

              return;
            }

            resolve(blob);
          },
          "image/jpeg",
          quality
        );
      } catch (conversionError) {
        URL.revokeObjectURL(url);
        reject(conversionError);
      }
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);

      reject(
        new Error(
          `Unable to read ${file.name}.`
        )
      );
    };

    image.src = url;
  });
};

const JPGPNGToPDF = () => {
  const [images, setImages] =
    useState([]);

  const [isDragging, setIsDragging] =
    useState(false);

  const [error, setError] =
    useState("");

  const [pageSize, setPageSize] =
    useState("a4");

  const [orientation, setOrientation] =
    useState("portrait");

  const [margin, setMargin] =
    useState("small");

  const [quality, setQuality] =
    useState("recommended");

  const [isGenerating, setIsGenerating] =
    useState(false);

  const [progress, setProgress] =
    useState(0);

  const [downloadUrl, setDownloadUrl] =
    useState("");

  const [outputFileName, setOutputFileName] =
    useState("");

  const fileInputRef =
    useRef(null);

  useEffect(() => {
    document.title =
      "JPG PNG to PDF Converter Online Free | Smart Tools";

    const description =
      "Convert JPG, JPEG and PNG images to PDF online for free. Combine multiple images into one PDF document with Smart Tools.";

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
      document.title =
        "Smart Tools";
    };
  }, []);

  useEffect(() => {
    return () => {
      if (downloadUrl) {
        URL.revokeObjectURL(
          downloadUrl
        );
      }
    };
  }, [downloadUrl]);

  const clearDownloadUrl = () => {
    if (downloadUrl) {
      URL.revokeObjectURL(
        downloadUrl
      );
    }

    setDownloadUrl("");
    setOutputFileName("");
  };

  const isSupportedImage = (
    file
  ) => {
    if (!file) {
      return false;
    }

    const fileName =
      file.name.toLowerCase();

    return (
      file.type === "image/jpeg" ||
      file.type === "image/png" ||
      fileName.endsWith(".jpg") ||
      fileName.endsWith(".jpeg") ||
      fileName.endsWith(".png")
    );
  };

  const addImages = async (
    selectedFiles
  ) => {
    setError("");

    const files = Array.from(
      selectedFiles || []
    );

    if (files.length === 0) {
      return;
    }

    if (
      images.length + files.length >
      MAX_IMAGES
    ) {
      setError(
        `You can add a maximum of ${MAX_IMAGES} images.`
      );

      return;
    }

    const invalidFile =
      files.find(
        (file) =>
          !isSupportedImage(file)
      );

    if (invalidFile) {
      setError(
        `${invalidFile.name} is not supported. Please select JPG, JPEG or PNG images.`
      );

      return;
    }

    const existingSize =
      images.reduce(
        (total, image) =>
          total + image.file.size,
        0
      );

    const newFilesSize =
      files.reduce(
        (total, file) =>
          total + file.size,
        0
      );

    if (
      existingSize +
        newFilesSize >
      MAX_TOTAL_SIZE
    ) {
      setError(
        "The total image size is too large. Maximum total size is 25 MB."
      );

      return;
    }

    try {
      const newImages = [];

      for (const file of files) {
        const dimensions =
          await getImageDimensions(
            file
          );

        newImages.push({
          id: `${file.name}-${file.lastModified}-${Math.random()}`,
          file,
          previewUrl:
            URL.createObjectURL(
              file
            ),
          width:
            dimensions.width,
          height:
            dimensions.height,
        });
      }

      clearDownloadUrl();

      setImages((current) => [
        ...current,
        ...newImages,
      ]);
    } catch (imageError) {
      console.error(
        "Image loading error:",
        imageError
      );

      setError(
        imageError?.message ||
          "Unable to load one or more images."
      );
    }
  };

  const handleInputChange = (
    event
  ) => {
    addImages(
      event.target.files
    );

    event.target.value = "";
  };

  const openFilePicker = () => {
    if (isGenerating) {
      return;
    }

    fileInputRef.current?.click();
  };

  const handleDragOver = (
    event
  ) => {
    event.preventDefault();

    if (isGenerating) {
      return;
    }

    setIsDragging(true);
  };

  const handleDragLeave = (
    event
  ) => {
    event.preventDefault();

    setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();

    setIsDragging(false);

    if (isGenerating) {
      return;
    }

    addImages(
      event.dataTransfer.files
    );
  };

  const removeImage = (id) => {
    if (isGenerating) {
      return;
    }

    setImages((current) => {
      const imageToRemove =
        current.find(
          (image) =>
            image.id === id
        );

      if (
        imageToRemove
          ?.previewUrl
      ) {
        URL.revokeObjectURL(
          imageToRemove.previewUrl
        );
      }

      return current.filter(
        (image) =>
          image.id !== id
      );
    });

    clearDownloadUrl();
  };

  const moveImage = (
    index,
    direction
  ) => {
    if (isGenerating) {
      return;
    }

    setImages((current) => {
      const newImages = [
        ...current,
      ];

      const targetIndex =
        index + direction;

      if (
        targetIndex < 0 ||
        targetIndex >=
          newImages.length
      ) {
        return current;
      }

      [
        newImages[index],
        newImages[targetIndex],
      ] = [
        newImages[targetIndex],
        newImages[index],
      ];

      return newImages;
    });

    clearDownloadUrl();
  };

  const clearAll = () => {
    if (isGenerating) {
      return;
    }

    images.forEach((image) => {
      if (image.previewUrl) {
        URL.revokeObjectURL(
          image.previewUrl
        );
      }
    });

    clearDownloadUrl();

    setImages([]);
    setError("");
    setProgress(0);
  };

  const getPageDimensions = (
    image
  ) => {
    if (
      pageSize ===
      "original"
    ) {
      return {
        width: image.width,
        height: image.height,
      };
    }

    let width =
      PAGE_SIZES[pageSize]
        .width;

    let height =
      PAGE_SIZES[pageSize]
        .height;

    if (
      orientation ===
      "landscape"
    ) {
      [
        width,
        height,
      ] = [height, width];
    }

    return {
      width,
      height,
    };
  };

  const getOutputFileName =
    () => {
      const firstImage =
        images[0]?.file?.name ||
        "images";

      const baseName =
        firstImage
          .replace(
            /\.(jpg|jpeg|png)$/i,
            ""
          )
          .trim() ||
        "images";

      return `${baseName}-converted.pdf`;
    };

  const generatePDF =
    async () => {
      if (images.length === 0) {
        setError(
          "Please add at least one JPG or PNG image."
        );

        return;
      }

      setError("");
      setIsGenerating(true);
      setProgress(0);
      clearDownloadUrl();

      try {
        const pdfDoc =
          await PDFDocument.create();

        const selectedQuality =
          QUALITY_VALUES[
            quality
          ];

        for (
          let index = 0;
          index < images.length;
          index++
        ) {
          const image =
            images[index];

          let imageBytes;

          /*
           * JPEG images can be embedded directly.
           * PNG images are converted to JPEG so
           * quality settings work consistently.
           */
          if (
            image.file.type ===
              "image/jpeg" ||
            image.file.name
              .toLowerCase()
              .endsWith(".jpg") ||
            image.file.name
              .toLowerCase()
              .endsWith(".jpeg")
          ) {
            imageBytes =
              await image.file.arrayBuffer();
          } else {
            const jpegBlob =
              await convertImageToJpeg(
                image.file,
                selectedQuality
              );

            imageBytes =
              await jpegBlob.arrayBuffer();
          }

          let embeddedImage;

          const isJPEG =
            image.file.type ===
              "image/jpeg" ||
            image.file.name
              .toLowerCase()
              .endsWith(".jpg") ||
            image.file.name
              .toLowerCase()
              .endsWith(".jpeg");

          if (isJPEG) {
            embeddedImage =
              await pdfDoc.embedJpg(
                imageBytes
              );
          } else {
            /*
             * PNGs converted to JPEG above.
             */
            const jpegBlob =
              await convertImageToJpeg(
                image.file,
                selectedQuality
              );

            const jpegBytes =
              await jpegBlob.arrayBuffer();

            embeddedImage =
              await pdfDoc.embedJpg(
                jpegBytes
              );
          }

          const pageDimensions =
            getPageDimensions(
              image
            );

          const page =
            pdfDoc.addPage([
              pageDimensions.width,
              pageDimensions.height,
            ]);

          const marginValue =
            MARGIN_VALUES[
              margin
            ];

          const availableWidth =
            Math.max(
              1,
              pageDimensions.width -
                marginValue * 2
            );

          const availableHeight =
            Math.max(
              1,
              pageDimensions.height -
                marginValue * 2
            );

          const imageScale =
            Math.min(
              availableWidth /
                embeddedImage.width,
              availableHeight /
                embeddedImage.height
            );

          const drawWidth =
            embeddedImage.width *
            imageScale;

          const drawHeight =
            embeddedImage.height *
            imageScale;

          const x =
            (pageDimensions.width -
              drawWidth) /
            2;

          const y =
            (pageDimensions.height -
              drawHeight) /
            2;

          page.drawImage(
            embeddedImage,
            {
              x,
              y,
              width: drawWidth,
              height: drawHeight,
            }
          );

          const currentProgress =
            Math.round(
              ((index + 1) /
                images.length) *
                100
            );

          setProgress(
            currentProgress
          );

          await new Promise(
            (resolve) =>
              setTimeout(
                resolve,
                0
              )
          );
        }

        const pdfBytes =
          await pdfDoc.save({
            useObjectStreams: true,
          });

        const blob =
          new Blob(
            [pdfBytes],
            {
              type: "application/pdf",
            }
          );

        const url =
          URL.createObjectURL(
            blob
          );

        setDownloadUrl(url);
        setOutputFileName(
          getOutputFileName()
        );
      } catch (generationError) {
        console.error(
          "JPG/PNG to PDF generation error:",
          generationError
        );

        setError(
          "Unable to create the PDF. Please try again with different images."
        );
      } finally {
        setIsGenerating(false);
      }
    };

  const startOver = () => {
    if (isGenerating) {
      return;
    }

    images.forEach((image) => {
      if (image.previewUrl) {
        URL.revokeObjectURL(
          image.previewUrl
        );
      }
    });

    clearDownloadUrl();

    setImages([]);
    setError("");
    setProgress(0);
  };

  const totalSize =
    images.reduce(
      (total, image) =>
        total + image.file.size,
      0
    );

  return (
    <section className="jpg-png-to-pdf-section">
      <div className="jpg-png-to-pdf-container">

        <div className="jpg-png-to-pdf-header">
          <h1>
            JPG PNG to PDF Converter
          </h1>

          <p>
            Convert JPG, JPEG and PNG
            images into a PDF document
            quickly and easily.
          </p>
        </div>

        <div
          className={`jpg-png-to-pdf-upload ${
            isDragging
              ? "jpg-png-to-pdf-upload-active"
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
              event.key === " "
            ) {
              openFilePicker();
            }
          }}
        >
          <div className="jpg-png-to-pdf-upload-icon">
            🖼️
          </div>

          <h3>
            Drop your images here
          </h3>

          <p>
            or select JPG, JPEG or
            PNG files from your device
          </p>

          <button
            type="button"
            className="jpg-png-to-pdf-browse-btn"
            onClick={(event) => {
              event.stopPropagation();
              openFilePicker();
            }}
          >
            Choose Images
          </button>

          <div className="jpg-png-to-pdf-upload-note">
            JPG, JPEG and PNG • Up to{" "}
            {MAX_IMAGES} images •
            25 MB total
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,.jpg,.jpeg,.png"
          multiple
          onChange={
            handleInputChange
          }
          style={{
            display: "none",
          }}
        />

        {error && (
          <div className="jpg-png-to-pdf-error">
            {error}
          </div>
        )}

        {images.length > 0 && (
          <>
            <div className="jpg-png-to-pdf-file-summary">
              <div>
                <strong>
                  {images.length}{" "}
                  {images.length ===
                  1
                    ? "image"
                    : "images"}{" "}
                  selected
                </strong>

                <span>
                  Total size:{" "}
                  {formatFileSize(
                    totalSize
                  )}
                </span>
              </div>

              <button
                type="button"
                className="jpg-png-to-pdf-clear"
                onClick={
                  clearAll
                }
                disabled={
                  isGenerating
                }
              >
                Clear All
              </button>
            </div>

            <div className="jpg-png-to-pdf-image-list">
              {images.map(
                (
                  image,
                  index
                ) => (
                  <div
                    className="jpg-png-to-pdf-image-card"
                    key={image.id}
                  >
                    <div className="jpg-png-to-pdf-image-number">
                      {index + 1}
                    </div>

                    <div className="jpg-png-to-pdf-thumbnail">
                      <img
                        src={
                          image.previewUrl
                        }
                        alt={
                          image.file
                            .name
                        }
                      />
                    </div>

                    <div className="jpg-png-to-pdf-image-info">
                      <strong>
                        {
                          image.file
                            .name
                        }
                      </strong>

                      <span>
                        {formatFileSize(
                          image.file
                            .size
                        )}
                      </span>

                      <span>
                        {
                          image.width
                        }{" "}
                        ×{" "}
                        {
                          image.height
                        }{" "}
                        px
                      </span>
                    </div>

                    <div className="jpg-png-to-pdf-image-actions">
                      <button
                        type="button"
                        onClick={() =>
                          moveImage(
                            index,
                            -1
                          )
                        }
                        disabled={
                          index ===
                            0 ||
                          isGenerating
                        }
                        aria-label="Move image up"
                        title="Move up"
                      >
                        ↑
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          moveImage(
                            index,
                            1
                          )
                        }
                        disabled={
                          index ===
                            images.length -
                              1 ||
                          isGenerating
                        }
                        aria-label="Move image down"
                        title="Move down"
                      >
                        ↓
                      </button>

                      <button
                        type="button"
                        className="jpg-png-to-pdf-remove"
                        onClick={() =>
                          removeImage(
                            image.id
                          )
                        }
                        disabled={
                          isGenerating
                        }
                        aria-label={`Remove ${image.file.name}`}
                        title="Remove image"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>

            <div className="jpg-png-to-pdf-options">
              <h3>
                PDF Settings
              </h3>

              <div className="jpg-png-to-pdf-settings-grid">

                <div className="jpg-png-to-pdf-setting">
                  <label htmlFor="pdf-page-size">
                    Page Size
                  </label>

                  <select
                    id="pdf-page-size"
                    value={pageSize}
                    onChange={(event) =>
                      setPageSize(
                        event.target
                          .value
                      )
                    }
                    disabled={
                      isGenerating
                    }
                  >
                    <option value="a4">
                      A4
                    </option>

                    <option value="letter">
                      Letter
                    </option>

                    <option value="original">
                      Original Size
                    </option>
                  </select>
                </div>

                {pageSize !==
                  "original" && (
                  <div className="jpg-png-to-pdf-setting">
                    <label htmlFor="pdf-orientation">
                      Orientation
                    </label>

                    <select
                      id="pdf-orientation"
                      value={
                        orientation
                      }
                      onChange={(
                        event
                      ) =>
                        setOrientation(
                          event.target
                            .value
                        )
                      }
                      disabled={
                        isGenerating
                      }
                    >
                      <option value="portrait">
                        Portrait
                      </option>

                      <option value="landscape">
                        Landscape
                      </option>
                    </select>
                  </div>
                )}

                <div className="jpg-png-to-pdf-setting">
                  <label htmlFor="pdf-margin">
                    Margins
                  </label>

                  <select
                    id="pdf-margin"
                    value={margin}
                    onChange={(event) =>
                      setMargin(
                        event.target
                          .value
                      )
                    }
                    disabled={
                      isGenerating
                    }
                  >
                    <option value="none">
                      None
                    </option>

                    <option value="small">
                      Small
                    </option>

                    <option value="medium">
                      Medium
                    </option>

                    <option value="large">
                      Large
                    </option>
                  </select>
                </div>

                <div className="jpg-png-to-pdf-setting">
                  <label htmlFor="pdf-quality">
                    Image Quality
                  </label>

                  <select
                    id="pdf-quality"
                    value={quality}
                    onChange={(event) =>
                      setQuality(
                        event.target
                          .value
                      )
                    }
                    disabled={
                      isGenerating
                    }
                  >
                    <option value="high">
                      High Quality
                    </option>

                    <option value="recommended">
                      Recommended
                    </option>

                    <option value="smaller">
                      Smaller File
                    </option>
                  </select>
                </div>

              </div>
            </div>

            {isGenerating && (
              <div className="jpg-png-to-pdf-progress">
                <div className="jpg-png-to-pdf-progress-header">
                  <strong>
                    Creating PDF...
                  </strong>

                  <span>
                    {progress}%
                  </span>
                </div>

                <div className="jpg-png-to-pdf-progress-track">
                  <div
                    className="jpg-png-to-pdf-progress-bar"
                    style={{
                      width: `${progress}%`,
                    }}
                  />
                </div>

                <div className="jpg-png-to-pdf-progress-text">
                  Processing image{" "}
                  {Math.max(
                    1,
                    Math.ceil(
                      (progress /
                        100) *
                        images.length
                    )
                  )}{" "}
                  of{" "}
                  {images.length}
                </div>
              </div>
            )}

            {!downloadUrl && (
              <button
                type="button"
                className="jpg-png-to-pdf-convert"
                onClick={
                  generatePDF
                }
                disabled={
                  isGenerating ||
                  images.length ===
                    0
                }
              >
                {isGenerating
                  ? "Creating PDF..."
                  : "Convert to PDF"}
              </button>
            )}
          </>
        )}

        {downloadUrl && (
          <div className="jpg-png-to-pdf-download-box">
            <div className="jpg-png-to-pdf-pdf-icon">
              📄
            </div>

            <div className="jpg-png-to-pdf-download-info">
              <strong>
                PDF is ready!
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
              className="jpg-png-to-pdf-download"
            >
              Download PDF
            </a>

            <button
              type="button"
              className="jpg-png-to-pdf-start-over"
              onClick={
                startOver
              }
            >
              Create Another PDF
            </button>
          </div>
        )}

        <div className="jpg-png-to-pdf-privacy">
          <div className="jpg-png-to-pdf-info-card">
            <div className="jpg-png-to-pdf-info-icon">
              🔒
            </div>

            <div>
              <h3>
                Your images are
                processed in your
                browser
              </h3>

              <p>
                Smart Tools is
                designed to process
                your images directly
                in your browser.
                Your images are not
                intentionally
                uploaded to a Smart
                Tools server for
                conversion.
              </p>
            </div>
          </div>
        </div>

        <section className="jpg-png-to-pdf-content-section">
          <div className="jpg-png-to-pdf-content-header">
            <h2>
              How to Convert JPG or
              PNG to PDF
            </h2>

            <p>
              Turn your images into a
              PDF document in just a few
              simple steps.
            </p>
          </div>

          <div className="jpg-png-to-pdf-steps">

            <div className="jpg-png-to-pdf-step">
              <div className="jpg-png-to-pdf-step-number">
                1
              </div>

              <h3>
                Upload your images
              </h3>

              <p>
                Select JPG, JPEG or PNG
                images from your device,
                or drag and drop them into
                the upload area.
              </p>
            </div>

            <div className="jpg-png-to-pdf-step">
              <div className="jpg-png-to-pdf-step-number">
                2
              </div>

              <h3>
                Arrange and customize
              </h3>

              <p>
                Reorder your images and
                choose the page size,
                orientation, margins, and
                image quality.
              </p>
            </div>

            <div className="jpg-png-to-pdf-step">
              <div className="jpg-png-to-pdf-step-number">
                3
              </div>

              <h3>
                Download your PDF
              </h3>

              <p>
                Convert your images into
                one PDF document and
                download the finished file.
              </p>
            </div>

          </div>
        </section>

        <section className="jpg-png-to-pdf-content-section">
          <div className="jpg-png-to-pdf-article">

            <h2>
              What Does JPG to PDF
              Conversion Do?
            </h2>

            <p>
              A JPG to PDF converter
              combines one or more image
              files into a PDF document.
              This is useful when you want
              to share photographs,
              scanned documents, receipts,
              forms, or collections of
              images as a single file.
            </p>

            <p>
              Smart Tools allows you to
              add multiple JPG, JPEG, and
              PNG images, arrange their
              order, and create one PDF
              containing each image on its
              own page.
            </p>

            <h3>
              Why convert images to PDF?
            </h3>

            <p>
              PDF files are convenient for
              sharing and printing because
              they can keep multiple pages
              together in one document.
              Converting images to PDF can
              also make it easier to submit
              collections of images as a
              single file.
            </p>

          </div>
        </section>

        <section className="jpg-png-to-pdf-content-section">
          <div className="jpg-png-to-pdf-light-section">

            <h2>
              Important Information
            </h2>

            <p>
              Image-to-PDF conversion
              creates a PDF document
              containing your images. The
              result is image-based rather
              than a text-editable document.
            </p>

            <ul>
              <li>
                JPG, JPEG, and PNG images
                are supported.
              </li>

              <li>
                Multiple images can be
                combined into one PDF.
              </li>

              <li>
                Each image is placed on
                its own PDF page.
              </li>

              <li>
                Images are automatically
                scaled to fit within the
                selected page size and
                margins.
              </li>

              <li>
                PNG transparency is placed
                over a white background
                when image compression
                requires JPEG conversion.
              </li>

              <li>
                The current tool supports
                up to 50 images and 25 MB
                total input size.
              </li>

              <li>
                The resulting PDF contains
                the images and does not
                automatically perform OCR or
                create selectable text.
              </li>
            </ul>

          </div>
        </section>

        <section className="jpg-png-to-pdf-faq">
          <h2>
            JPG PNG to PDF Converter FAQ
          </h2>

          <div className="jpg-png-to-pdf-faq-list">

            <details>
              <summary>
                Is the JPG to PDF
                converter free?
              </summary>

              <p>
                Yes. Smart Tools provides
                this image-to-PDF conversion
                tool without requiring
                payment to create a PDF.
              </p>
            </details>

            <details>
              <summary>
                Can I convert multiple
                images into one PDF?
              </summary>

              <p>
                Yes. You can select
                multiple JPG, JPEG, or PNG
                images and combine them into
                a single PDF document.
              </p>
            </details>

            <details>
              <summary>
                Can I change the image
                order?
              </summary>

              <p>
                Yes. Use the up and down
                controls beside each image
                to arrange the pages before
                creating the PDF.
              </p>
            </details>

            <details>
              <summary>
                Can I convert PNG images
                to PDF?
              </summary>

              <p>
                Yes. PNG images are
                supported along with JPG and
                JPEG files.
              </p>
            </details>

            <details>
              <summary>
                Can I choose A4 or Letter
                size?
              </summary>

              <p>
                Yes. You can choose A4,
                Letter, or Original Size.
                A4 and Letter documents can
                also use portrait or
                landscape orientation.
              </p>
            </details>

            <details>
              <summary>
                Are my images uploaded to a
                server?
              </summary>

              <p>
                The conversion is designed
                to run directly in your
                browser. Smart Tools does
                not intentionally upload
                your images to a server for
                the conversion process.
              </p>
            </details>

            <details>
              <summary>
                Will the PDF contain
                selectable text?
              </summary>

              <p>
                No. This tool converts the
                images into PDF pages. It
                does not perform OCR or
                automatically turn text
                inside an image into
                selectable PDF text.
              </p>
            </details>

          </div>
        </section>

      </div>
    </section>
  );
};

export default JPGPNGToPDF;