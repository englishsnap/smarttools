import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist/build/pdf.mjs";
import * as XLSX from "xlsx";
import "./PDFToExcel.css";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).toString();

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const MAX_PAGES = 100;

const getTextItems = (items) => {
  return items
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
};

const groupItemsIntoRows = (items) => {
  const rows = [];

  items.forEach((item) => {
    const tolerance = Math.max(3, item.fontSize * 0.45);

    let matchingRow = null;

    for (const row of rows) {
      if (Math.abs(row.y - item.y) <= tolerance) {
        matchingRow = row;
        break;
      }
    }

    if (matchingRow) {
      matchingRow.items.push(item);

      const totalY = matchingRow.items.reduce(
        (sum, currentItem) => sum + currentItem.y,
        0
      );

      matchingRow.y =
        totalY / matchingRow.items.length;
    } else {
      rows.push({
        y: item.y,
        items: [item],
      });
    }
  });

  rows.sort((a, b) => b.y - a.y);

  rows.forEach((row) => {
    row.items.sort((a, b) => a.x - b.x);
  });

  return rows;
};

const convertRowsToTable = (rows) => {
  if (!rows.length) {
    return [];
  }

  const table = [];

  rows.forEach((row) => {
    const cells = [];

    row.items.forEach((item, index) => {
      if (index === 0) {
        cells.push({
          text: item.text,
          x: item.x,
          right: item.x + item.width,
        });

        return;
      }

      const previousCell =
        cells[cells.length - 1];

      const gap =
        item.x - previousCell.right;

      /*
       * Small gaps usually mean the text belongs
       * to the same cell. Larger gaps indicate a
       * new column.
       */
      const columnGap = Math.max(
        12,
        item.fontSize * 1.2
      );

      if (gap > columnGap) {
        cells.push({
          text: item.text,
          x: item.x,
          right: item.x + item.width,
        });
      } else {
        previousCell.text += ` ${item.text}`;
        previousCell.right =
          item.x + item.width;
      }
    });

    table.push(
      cells.map((cell) => cell.text.trim())
    );
  });

  return table;
};

const normalizeTable = (table) => {
  if (!table.length) {
    return [];
  }

  const maxColumns = Math.max(
    ...table.map((row) => row.length)
  );

  return table.map((row) => {
    const normalizedRow = [...row];

    while (
      normalizedRow.length < maxColumns
    ) {
      normalizedRow.push("");
    }

    return normalizedRow;
  });
};

const removeEmptyRows = (table) => {
  return table.filter((row) =>
    row.some(
      (cell) =>
        String(cell).trim().length > 0
    )
  );
};

const PDFToExcel = () => {
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

  const [pageTables, setPageTables] =
    useState([]);

  const [previewPage, setPreviewPage] =
    useState(0);

  const [isGenerating, setIsGenerating] =
    useState(false);

  const [downloadUrl, setDownloadUrl] =
    useState("");

  const [outputFileName, setOutputFileName] =
    useState("");

  const fileInputRef = useRef(null);

  useEffect(() => {
    document.title =
      "PDF to Excel Converter Online Free | Smart Tools";

    const description =
      "Convert PDF tables and text into editable Excel spreadsheets online for free. Extract PDF data into XLSX files using Smart Tools.";

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
      document.title = "Smart Tools";
    };
  }, []);

  useEffect(() => {
    return () => {
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [downloadUrl]);

  const formatFileSize = (bytes) => {
    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(
      bytes /
      (1024 * 1024)
    ).toFixed(2)} MB`;
  };

  const validateFile = (selectedFile) => {
    if (!selectedFile) {
      return "Please select a PDF file.";
    }

    const isPDF =
      selectedFile.type ===
        "application/pdf" ||
      selectedFile.name
        .toLowerCase()
        .endsWith(".pdf");

    if (!isPDF) {
      return "Please select a valid PDF file.";
    }

    if (
      selectedFile.size >
      MAX_FILE_SIZE
    ) {
      return "The PDF file is too large. Maximum file size is 25 MB.";
    }

    return "";
  };

  const clearDownloadUrl = () => {
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
    }

    setDownloadUrl("");
    setOutputFileName("");
  };

  const handleFileSelect = (
    selectedFile
  ) => {
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
    setPageTables([]);
    setPreviewPage(0);
    setExtractionProgress(0);
    setCurrentPage(0);
    setTotalPages(0);
  };

  const handleInputChange = (
    event
  ) => {
    const selectedFile =
      event.target.files?.[0];

    handleFileSelect(selectedFile);

    event.target.value = "";
  };

  const openFilePicker = () => {
    if (
      isExtracting ||
      isGenerating
    ) {
      return;
    }

    fileInputRef.current?.click();
  };

  const handleDragOver = (
    event
  ) => {
    event.preventDefault();

    if (
      isExtracting ||
      isGenerating
    ) {
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

    if (
      isExtracting ||
      isGenerating
    ) {
      return;
    }

    const droppedFile =
      event.dataTransfer.files?.[0];

    handleFileSelect(
      droppedFile
    );
  };

  const removeFile = () => {
    if (
      isExtracting ||
      isGenerating
    ) {
      return;
    }

    clearDownloadUrl();

    setFile(null);
    setError("");
    setPageTables([]);
    setPreviewPage(0);
    setExtractionProgress(0);
    setCurrentPage(0);
    setTotalPages(0);
  };

  const extractPDFTables = async () => {
    if (!file) {
      setError(
        "Please select a PDF file first."
      );

      return;
    }

    setError("");
    setIsExtracting(true);
    setExtractionProgress(0);
    setCurrentPage(0);
    setTotalPages(0);
    setPageTables([]);
    setPreviewPage(0);

    try {
      const arrayBuffer =
        await file.arrayBuffer();

      const loadingTask =
        pdfjsLib.getDocument({
          data: new Uint8Array(
            arrayBuffer
          ),
        });

      const pdf =
        await loadingTask.promise;

      const total =
        pdf.numPages;

      if (total > MAX_PAGES) {
        throw new Error(
          `This PDF contains ${total} pages. For browser performance, the maximum supported page count is ${MAX_PAGES}.`
        );
      }

      setTotalPages(total);

      const extractedTables = [];

      for (
        let pageNumber = 1;
        pageNumber <= total;
        pageNumber++
      ) {
        setCurrentPage(
          pageNumber
        );

        const page =
          await pdf.getPage(
            pageNumber
          );

        const textContent =
          await page.getTextContent();

        const items =
          getTextItems(
            textContent.items
          );

        const rows =
          groupItemsIntoRows(
            items
          );

        let table =
          convertRowsToTable(
            rows
          );

        table =
          removeEmptyRows(
            table
          );

        table =
          normalizeTable(
            table
          );

        extractedTables.push({
          pageNumber,
          rows: table,
        });

        page.cleanup();

        const progress =
          Math.round(
            (pageNumber /
              total) *
              100
          );

        setExtractionProgress(
          progress
        );

        await new Promise(
          (resolve) =>
            setTimeout(
              resolve,
              0
            )
        );
      }

      const hasData =
        extractedTables.some(
          (page) =>
            page.rows.length >
            0
        );

      if (!hasData) {
        throw new Error(
          "No selectable text or table data was found in this PDF. It may be a scanned or image-only PDF."
        );
      }

      setPageTables(
        extractedTables
      );
      setPreviewPage(0);
    } catch (extractionError) {
      console.error(
        "PDF to Excel extraction error:",
        extractionError
      );

      let message =
        "Unable to extract data from this PDF.";

      const errorMessage =
        extractionError?.message?.toLowerCase() ||
        "";

      if (
        errorMessage.includes(
          "password"
        )
      ) {
        message =
          "This PDF appears to be password-protected or encrypted. Please use an unlocked PDF.";
      } else if (
        errorMessage.includes(
          "scanned"
        ) ||
        errorMessage.includes(
          "no selectable"
        )
      ) {
        message =
          "No selectable text was found. Scanned or image-only PDFs require OCR and are not supported by this version.";
      } else if (
        extractionError?.message
      ) {
        message =
          extractionError.message;
      }

      setError(message);
      setPageTables([]);
    } finally {
      setIsExtracting(false);
    }
  };

  const createExcelFileName =
    () => {
      const originalName =
        file?.name ||
        "document.pdf";

      const withoutExtension =
        originalName.replace(
          /\.pdf$/i,
          ""
        );

      return `${withoutExtension}.xlsx`;
    };

  const createWorksheetName = (
    pageNumber
  ) => {
    return `Page ${pageNumber}`;
  };

  const generateExcelDocument =
    async () => {
      if (
        !file ||
        pageTables.length === 0
      ) {
        setError(
          "Please extract PDF data before generating the Excel file."
        );

        return;
      }

      setError("");
      setIsGenerating(true);
      clearDownloadUrl();

      try {
        const workbook =
          XLSX.utils.book_new();

        pageTables.forEach(
          (pageData) => {
            let rows =
              pageData.rows;

            if (
              !rows ||
              rows.length === 0
            ) {
              rows = [
                [
                  `No table data found on page ${pageData.pageNumber}`,
                ],
              ];
            }

            const worksheet =
              XLSX.utils.aoa_to_sheet(
                rows
              );

            const columnCount =
              Math.max(
                ...rows.map(
                  (row) =>
                    row.length
                )
              );

            worksheet["!cols"] =
              Array.from(
                {
                  length:
                    columnCount,
                },
                (_, columnIndex) => {
                  let maxLength = 10;

                  rows.forEach(
                    (row) => {
                      const value =
                        row[
                          columnIndex
                        ];

                      if (
                        value !==
                          undefined &&
                        value !==
                          null
                      ) {
                        maxLength =
                          Math.max(
                            maxLength,
                            String(
                              value
                            ).length
                          );
                      }
                    }
                  );

                  return {
                    wch: Math.min(
                      Math.max(
                        maxLength +
                          2,
                        10
                      ),
                      50
                    ),
                  };
                }
              );

            XLSX.utils.book_append_sheet(
              workbook,
              worksheet,
              createWorksheetName(
                pageData.pageNumber
              )
            );
          }
        );

        const workbookArray =
          XLSX.write(
            workbook,
            {
              bookType: "xlsx",
              type: "array",
            }
          );

        const blob =
          new Blob(
            [workbookArray],
            {
              type:
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            }
          );

        const url =
          URL.createObjectURL(
            blob
          );

        setDownloadUrl(url);
        setOutputFileName(
          createExcelFileName()
        );
      } catch (generationError) {
        console.error(
          "Excel generation error:",
          generationError
        );

        setError(
          "Unable to generate the Excel file. Please try again."
        );
      } finally {
        setIsGenerating(false);
      }
    };

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
    setPageTables([]);
    setPreviewPage(0);
    setIsGenerating(false);
  };

  const currentTable =
    pageTables[previewPage];

  return (
    <section className="pdf-to-excel-section">
      <div className="pdf-to-excel-container">

        <div className="pdf-to-excel-header">
          <h1>
            PDF to Excel Converter
          </h1>

          <p>
            Convert PDF tables and
            text into editable Excel
            spreadsheets quickly and
            easily.
          </p>
        </div>

        {!file && (
          <>
            <div
              className={`pdf-to-excel-upload ${
                isDragging
                  ? "pdf-to-excel-upload-active"
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
              <div className="pdf-to-excel-upload-icon">
                📊
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
                className="pdf-to-excel-browse-btn"
                onClick={(event) => {
                  event.stopPropagation();
                  openFilePicker();
                }}
              >
                Choose PDF File
              </button>

              <div className="pdf-to-excel-upload-note">
                Maximum file size:
                {" "}
                25 MB
              </div>
            </div>

            <input
              ref={
                fileInputRef
              }
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

        {error && (
          <div className="pdf-to-excel-error">
            {error}
          </div>
        )}

        {file && (
          <div className="pdf-to-excel-file">
            <div className="pdf-to-excel-file-icon">
              📄
            </div>

            <div className="pdf-to-excel-file-info">
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
              className="pdf-to-excel-remove"
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

        {file &&
          pageTables.length === 0 &&
          !isExtracting && (
            <>
              <div className="pdf-to-excel-options">
                <h3>
                  PDF Data Extraction
                </h3>

                <p>
                  Smart Tools will
                  analyze selectable
                  text in your PDF,
                  detect rows and
                  columns, and prepare
                  the extracted data
                  for an Excel
                  spreadsheet.
                </p>

                <div className="pdf-to-excel-option-note">
                  Best results are
                  expected from
                  text-based PDFs
                  containing tables
                  or structured data.
                </div>
              </div>

              <button
                type="button"
                className="pdf-to-excel-convert"
                onClick={
                  extractPDFTables
                }
                disabled={
                  !file ||
                  isExtracting
                }
              >
                Extract PDF Data
              </button>
            </>
          )}

        {isExtracting && (
          <div className="pdf-to-excel-progress">
            <div className="pdf-to-excel-progress-header">
              <strong>
                Extracting PDF data...
              </strong>

              <span>
                {extractionProgress}%
              </span>
            </div>

            <div className="pdf-to-excel-progress-track">
              <div
                className="pdf-to-excel-progress-bar"
                style={{
                  width: `${extractionProgress}%`,
                }}
              />
            </div>

            {totalPages >
              0 && (
              <div className="pdf-to-excel-progress-page">
                Processing page{" "}
                {currentPage} of{" "}
                {totalPages}
              </div>
            )}
          </div>
        )}

        {pageTables.length > 0 &&
          !isExtracting && (
            <div className="pdf-to-excel-preview">
              <div className="pdf-to-excel-preview-header">
                <div>
                  <h3>
                    Extracted Data
                  </h3>

                  <p>
                    Review the
                    extracted data
                    before creating
                    your Excel file.
                  </p>
                </div>

                {pageTables.length >
                  1 && (
                  <div className="pdf-to-excel-page-selector">
                    <label htmlFor="pdf-excel-page">
                      Preview page:
                    </label>

                    <select
                      id="pdf-excel-page"
                      value={
                        previewPage
                      }
                      onChange={(event) =>
                        setPreviewPage(
                          Number(
                            event.target
                              .value
                          )
                        )
                      }
                      disabled={
                        isGenerating
                      }
                    >
                      {pageTables.map(
                        (
                          pageData,
                          index
                        ) => (
                          <option
                            key={
                              pageData.pageNumber
                            }
                            value={
                              index
                            }
                          >
                            Page{" "}
                            {
                              pageData.pageNumber
                            }
                          </option>
                        )
                      )}
                    </select>
                  </div>
                )}
              </div>

              {currentTable &&
                currentTable.rows.length >
                  0 && (
                  <div className="pdf-to-excel-table-wrapper">
                    <table className="pdf-to-excel-table">
                      <tbody>
                        {currentTable.rows
                          .slice(
                            0,
                            50
                          )
                          .map(
                            (
                              row,
                              rowIndex
                            ) => (
                              <tr
                                key={
                                  rowIndex
                                }
                              >
                                {row.map(
                                  (
                                    cell,
                                    cellIndex
                                  ) => (
                                    <td
                                      key={
                                        cellIndex
                                      }
                                    >
                                      {
                                        cell
                                      }
                                    </td>
                                  )
                                )}
                              </tr>
                            )
                          )}
                      </tbody>
                    </table>
                  </div>
                )}

              {currentTable &&
                currentTable.rows.length >
                  50 && (
                  <div className="pdf-to-excel-preview-note">
                    Showing the first
                    50 rows in the
                    preview. The full
                    extracted data
                    will be included
                    in the Excel file.
                  </div>
                )}

              <div className="pdf-to-excel-data-summary">
                <span>
                  {pageTables.length}{" "}
                  {pageTables.length ===
                  1
                    ? "worksheet"
                    : "worksheets"}{" "}
                  will be created
                </span>

                <span>
                  Page{" "}
                  {
                    currentTable?.pageNumber
                  }{" "}
                  contains{" "}
                  {
                    currentTable?.rows
                      ?.length || 0
                  }{" "}
                  rows
                </span>
              </div>
            </div>
          )}

        {pageTables.length > 0 &&
          !downloadUrl &&
          !isExtracting && (
            <div className="pdf-to-excel-generate">
              <button
                type="button"
                className="pdf-to-excel-generate-button"
                onClick={
                  generateExcelDocument
                }
                disabled={
                  isGenerating
                }
              >
                {isGenerating
                  ? "Generating Excel File..."
                  : "Generate Excel File"}
              </button>

              {isGenerating && (
                <div className="pdf-to-excel-generating-message">
                  Creating your XLSX
                  spreadsheet. Please
                  wait...
                </div>
              )}
            </div>
          )}

        {downloadUrl && (
          <div className="pdf-to-excel-download-box">
            <div className="pdf-to-excel-excel-icon">
              📊
            </div>

            <div className="pdf-to-excel-download-info">
              <strong>
                Excel file is ready!
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
              className="pdf-to-excel-download"
            >
              Download Excel File
            </a>

            <button
              type="button"
              className="pdf-to-excel-start-over"
              onClick={
                startOver
              }
            >
              Convert Another PDF
            </button>
          </div>
        )}

        <div className="pdf-to-excel-privacy">
          <div className="pdf-to-excel-info-card">
            <div className="pdf-to-excel-info-icon">
              🔒
            </div>

            <div>
              <h3>
                Your files are
                processed in your
                browser
              </h3>

              <p>
                Smart Tools is
                designed to process
                PDF files directly
                in your browser.
                Your PDF is not
                intentionally
                uploaded to a Smart
                Tools server for
                conversion.
              </p>
            </div>
          </div>
        </div>

        <section className="pdf-to-excel-content-section">
          <div className="pdf-to-excel-content-header">
            <h2>
              How to Convert PDF to
              Excel
            </h2>

            <p>
              Extract PDF data and
              create an editable Excel
              spreadsheet in just a few
              simple steps.
            </p>
          </div>

          <div className="pdf-to-excel-steps">
            <div className="pdf-to-excel-step">
              <div className="pdf-to-excel-step-number">
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

            <div className="pdf-to-excel-step">
              <div className="pdf-to-excel-step-number">
                2
              </div>

              <h3>
                Extract the data
              </h3>

              <p>
                Smart Tools analyzes
                selectable PDF text and
                identifies rows and
                columns in the document.
              </p>
            </div>

            <div className="pdf-to-excel-step">
              <div className="pdf-to-excel-step-number">
                3
              </div>

              <h3>
                Download Excel
              </h3>

              <p>
                Generate an XLSX
                spreadsheet and download
                the extracted data to your
                device.
              </p>
            </div>
          </div>
        </section>

        <section className="pdf-to-excel-content-section">
          <div className="pdf-to-excel-article">
            <h2>
              What Does PDF to Excel
              Conversion Do?
            </h2>

            <p>
              A PDF to Excel converter
              extracts text and
              structured information from
              a PDF and places the data
              into an editable Excel
              spreadsheet.
            </p>

            <p>
              This can be useful when a
              PDF contains tables,
              financial information,
              reports, lists, invoices,
              or other structured data
              that you want to analyze or
              edit in a spreadsheet.
            </p>

            <h3>
              When should you convert a
              PDF to Excel?
            </h3>

            <p>
              Converting PDF data to
              Excel can make it easier to
              sort, filter, calculate, and
              analyze information. It can
              also reduce the need to
              manually retype data from
              PDF documents.
            </p>
          </div>
        </section>

        <section className="pdf-to-excel-content-section">
          <div className="pdf-to-excel-light-section">
            <h2>
              Important Information
            </h2>

            <p>
              PDF documents can contain
              complex layouts, tables,
              graphics, scanned images,
              and positioning information.
              Because of this, automatic
              PDF-to-Excel conversion
              cannot always reproduce the
              original document perfectly.
            </p>

            <ul>
              <li>
                Text-based PDFs generally
                provide the best results.
              </li>

              <li>
                Scanned or image-only PDFs
                require OCR and are not
                supported by the current
                converter.
              </li>

              <li>
                Complex tables may not be
                reconstructed exactly as
                they appear in the original
                PDF.
              </li>

              <li>
                Columns, spacing, merged
                cells, and specialized
                layouts may require manual
                adjustment in Excel.
              </li>

              <li>
                Images, charts, graphics,
                and advanced PDF elements
                are not converted into
                equivalent Excel objects.
              </li>

              <li>
                Password-protected or
                encrypted PDFs may not be
                supported.
              </li>

              <li>
                The current converter
                supports PDFs up to 25 MB
                and 100 pages.
              </li>
            </ul>
          </div>
        </section>

        <section className="pdf-to-excel-faq">
          <h2>
            PDF to Excel Converter FAQ
          </h2>

          <div className="pdf-to-excel-faq-list">
            <details>
              <summary>
                Is the PDF to Excel
                converter free?
              </summary>

              <p>
                Yes. Smart Tools
                provides this PDF to
                Excel conversion tool
                without requiring payment
                to create an Excel file.
              </p>
            </details>

            <details>
              <summary>
                Can I convert a PDF table
                to Excel?
              </summary>

              <p>
                Yes. The converter is
                designed to detect
                selectable text arranged
                in rows and columns and
                place the extracted data
                into Excel worksheets.
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
                PDF to Excel?
              </summary>

              <p>
                The current converter works
                with PDFs containing
                selectable text. Scanned or
                image-only PDFs require OCR
                and are not supported by
                this version.
              </p>
            </details>

            <details>
              <summary>
                Will the original table
                layout be preserved?
              </summary>

              <p>
                The converter attempts to
                identify rows and columns
                using the position of text
                within the PDF. Complex
                tables, merged cells, and
                unusual layouts may require
                additional editing in Excel.
              </p>
            </details>

            <details>
              <summary>
                What Excel format does the
                converter create?
              </summary>

              <p>
                The converter creates an
                XLSX Excel workbook. Each
                PDF page is placed into a
                separate worksheet.
              </p>
            </details>
          </div>
        </section>

      </div>
    </section>
  );
};

export default PDFToExcel;