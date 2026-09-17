import { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import "./ExcelToPDF.css";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
const MAX_SHEETS = 20;
const MAX_ROWS_PER_SHEET = 1000;
const MAX_COLUMNS_PER_SHEET = 30;

const ExcelToPDF = () => {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const [error, setError] = useState("");

  const [workbook, setWorkbook] = useState(null);
  const [sheetNames, setSheetNames] = useState([]);
  const [selectedSheets, setSelectedSheets] = useState([]);

  const [orientation, setOrientation] = useState("portrait");
  const [pageSize, setPageSize] = useState("a4");
  const [includeGridlines, setIncludeGridlines] = useState(true);

  const [isReading, setIsReading] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  const [progress, setProgress] = useState(0);
  const [currentSheet, setCurrentSheet] = useState(0);

  const [downloadUrl, setDownloadUrl] = useState("");
  const [outputFileName, setOutputFileName] = useState("");

  const fileInputRef = useRef(null);
  const downloadUrlRef = useRef("");

  /*
    SEO
  */
  useEffect(() => {
    document.title = "Excel to PDF Converter Online Free | Smart Tools";

    const description =
      "Convert Excel XLSX and XLS spreadsheets to PDF online for free. Convert worksheets into clean PDF tables with Smart Tools.";

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
    Clean up download URL
  */
  useEffect(() => {
    return () => {
      if (downloadUrlRef.current) {
        URL.revokeObjectURL(downloadUrlRef.current);
      }
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
    Clear download URL
  */
  const clearDownloadUrl = () => {
    if (downloadUrlRef.current) {
      URL.revokeObjectURL(downloadUrlRef.current);
      downloadUrlRef.current = "";
    }

    setDownloadUrl("");
    setOutputFileName("");
  };

  /*
    Validate Excel file
  */
  const validateFile = (selectedFile) => {
    if (!selectedFile) {
      return "Please select an Excel file.";
    }

    const fileName = selectedFile.name.toLowerCase();

    const isExcel =
      fileName.endsWith(".xlsx") ||
      fileName.endsWith(".xls");

    if (!isExcel) {
      return "Please select a valid Excel file (.xlsx or .xls).";
    }

    if (selectedFile.size === 0) {
      return "The selected Excel file appears to be empty.";
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      return "The maximum supported Excel file size is 25 MB.";
    }

    return "";
  };

  /*
    Read Excel workbook
  */
  const readExcelFile = async (selectedFile) => {
    setIsReading(true);
    setError("");

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();

      if (!arrayBuffer || arrayBuffer.byteLength === 0) {
        throw new Error(
          "The Excel file contains no readable data."
        );
      }

      const parsedWorkbook = XLSX.read(arrayBuffer, {
        type: "array",
        cellDates: true,
        cellNF: true,
        cellStyles: true,
      });

      const names = parsedWorkbook.SheetNames || [];

      if (names.length === 0) {
        throw new Error(
          "No worksheets were found in this Excel file."
        );
      }

      if (names.length > MAX_SHEETS) {
        throw new Error(
          `This workbook contains ${names.length} worksheets. For browser stability, the maximum is ${MAX_SHEETS} worksheets.`
        );
      }

      /*
        Validate sheet sizes
      */
      for (const sheetName of names) {
        const sheet = parsedWorkbook.Sheets[sheetName];

        if (!sheet || !sheet["!ref"]) {
          continue;
        }

        const range = XLSX.utils.decode_range(sheet["!ref"]);

        const rowCount = range.e.r - range.s.r + 1;
        const columnCount = range.e.c - range.s.c + 1;

        if (rowCount > MAX_ROWS_PER_SHEET) {
          throw new Error(
            `The worksheet "${sheetName}" contains ${rowCount} rows. For browser stability, the maximum is ${MAX_ROWS_PER_SHEET} rows per worksheet.`
          );
        }

        if (columnCount > MAX_COLUMNS_PER_SHEET) {
          throw new Error(
            `The worksheet "${sheetName}" contains ${columnCount} columns. For browser stability, the maximum is ${MAX_COLUMNS_PER_SHEET} columns per worksheet.`
          );
        }
      }

      setWorkbook(parsedWorkbook);
      setSheetNames(names);
      setSelectedSheets([...names]);
    } catch (err) {
      console.error("Excel reading error:", err);

      setWorkbook(null);
      setSheetNames([]);
      setSelectedSheets([]);

      setError(
        err?.message ||
          "Unable to read this Excel file. Please try another file."
      );
    } finally {
      setIsReading(false);
    }
  };

  /*
    Handle file selection
  */
  const handleFileSelect = async (selectedFile) => {
    if (!selectedFile) return;

    clearDownloadUrl();

    setError("");
    setFile(null);
    setWorkbook(null);
    setSheetNames([]);
    setSelectedSheets([]);
    setProgress(0);
    setCurrentSheet(0);

    const validationError = validateFile(selectedFile);

    if (validationError) {
      setError(validationError);
      return;
    }

    setFile(selectedFile);

    await readExcelFile(selectedFile);
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
    Remove selected file
  */
  const handleRemoveFile = () => {
    if (isReading || isConverting) return;

    clearDownloadUrl();

    setFile(null);
    setWorkbook(null);
    setSheetNames([]);
    setSelectedSheets([]);
    setError("");
    setProgress(0);
    setCurrentSheet(0);
  };

  /*
    Select / deselect worksheet
  */
  const toggleSheet = (sheetName) => {
    if (isConverting) return;

    setSelectedSheets((current) => {
      if (current.includes(sheetName)) {
        return current.filter((name) => name !== sheetName);
      }

      return [...current, sheetName];
    });
  };

  /*
    Select all worksheets
  */
  const selectAllSheets = () => {
    if (isConverting) return;

    setSelectedSheets([...sheetNames]);
  };

  /*
    Clear worksheet selection
  */
  const clearSheetSelection = () => {
    if (isConverting) return;

    setSelectedSheets([]);
  };

  /*
    Convert cell values to readable text
  */
  const formatCellValue = (value) => {
    if (value === null || value === undefined) {
      return "";
    }

    if (value instanceof Date) {
      return value.toLocaleDateString();
    }

    if (typeof value === "boolean") {
      return value ? "TRUE" : "FALSE";
    }

    if (typeof value === "number") {
      return String(value);
    }

    return String(value);
  };

  /*
    Get worksheet data
  */
  const getSheetData = (sheet) => {
    const rows = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: "",
      raw: false,
    });

    return rows.map((row) =>
      row.map((cell) => formatCellValue(cell))
    );
  };

  /*
    Create PDF
  */
  const convertToPDF = async () => {
    if (!file || !workbook) {
      setError("Please select an Excel file first.");
      return;
    }

    if (selectedSheets.length === 0) {
      setError("Please select at least one worksheet.");
      return;
    }

    clearDownloadUrl();

    setError("");
    setIsConverting(true);
    setProgress(0);
    setCurrentSheet(0);

    try {
      const pdf = new jsPDF({
        orientation,
        unit: "mm",
        format: pageSize,
      });

      for (let index = 0; index < selectedSheets.length; index++) {
        const sheetName = selectedSheets[index];

        setCurrentSheet(index + 1);

        const sheet = workbook.Sheets[sheetName];

        if (!sheet) {
          continue;
        }

        const rows = getSheetData(sheet);

        /*
          Skip completely empty worksheets
        */
        const nonEmptyRows = rows.filter((row) =>
          row.some((cell) => String(cell).trim() !== "")
        );

        if (nonEmptyRows.length === 0) {
          continue;
        }

        if (index > 0) {
          pdf.addPage(pageSize, orientation);
        }

        /*
          Sheet title
        */
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");

        pdf.text(
          sheetName,
          14,
          15
        );

        /*
          Conversion note
        */
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "normal");

        pdf.text(
          `Converted from ${file.name}`,
          14,
          21
        );

        /*
          Table
        */
        const header = nonEmptyRows[0] || [];
        const body = nonEmptyRows.slice(1);

        /*
          If the worksheet has only one row,
          use it as table data with generated headers.
        */
        let tableHead = header;
        let tableBody = body;

        if (nonEmptyRows.length === 1) {
          tableHead = header.map(
            (_, columnIndex) =>
              `Column ${columnIndex + 1}`
          );

          tableBody = [header];
        }

        autoTable(pdf, {
          startY: 27,

          head: [tableHead],

          body: tableBody,

          theme: includeGridlines
            ? "grid"
            : "plain",

          styles: {
            font: "helvetica",
            fontSize: 7,
            cellPadding: 2,
            overflow: "linebreak",
            valign: "middle",
          },

          headStyles: {
            fontStyle: "bold",
            fontSize: 7,
          },

          bodyStyles: {
            fontSize: 7,
          },

          margin: {
            top: 27,
            right: 10,
            bottom: 12,
            left: 10,
          },

          tableWidth: "auto",

          pageBreak: "auto",

          rowPageBreak: "auto",

          didDrawPage: (data) => {
            /*
              Page footer
            */
            const pageNumber = pdf.internal.getNumberOfPages();

            pdf.setFontSize(7);
            pdf.setFont("helvetica", "normal");

            pdf.text(
              `Smart Tools • ${sheetName} • Page ${pageNumber}`,
              14,
              pdf.internal.pageSize.getHeight() - 6
            );
          },
        });

        /*
          Allow the browser UI to update between worksheets.
        */
        await new Promise((resolve) =>
          setTimeout(resolve, 0)
        );

        const percentage = Math.round(
          ((index + 1) / selectedSheets.length) * 100
        );

        setProgress(percentage);
      }

      /*
        Generate filename
      */
      const originalName = file.name.replace(
        /\.(xlsx|xls)$/i,
        ""
      );

      const finalFileName = `${originalName}.pdf`;

      const pdfBlob = pdf.output("blob");

      const url = URL.createObjectURL(pdfBlob);

      downloadUrlRef.current = url;

      setDownloadUrl(url);
      setOutputFileName(finalFileName);
    } catch (err) {
      console.error("Excel to PDF conversion error:", err);

      setError(
        err?.message ||
          "Unable to convert the Excel file to PDF. Please try again."
      );

      clearDownloadUrl();
    } finally {
      setIsConverting(false);
    }
  };

  /*
    Start over
  */
  const handleStartOver = () => {
    clearDownloadUrl();

    setFile(null);
    setWorkbook(null);
    setSheetNames([]);
    setSelectedSheets([]);

    setError("");

    setOrientation("portrait");
    setPageSize("a4");
    setIncludeGridlines(true);

    setIsReading(false);
    setIsConverting(false);

    setProgress(0);
    setCurrentSheet(0);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <section className="excel-to-pdf-section">
      <div className="container">

        {/* Header */}
        <div className="excel-to-pdf-header text-center">
          <span className="excel-to-pdf-badge">
            FREE ONLINE TOOL
          </span>

          <h1>Excel to PDF Converter</h1>

          <p>
            Convert Excel spreadsheets into clean,
            professional PDF documents directly in your
            browser.
          </p>
        </div>

        <div className="excel-to-pdf-tool">

          {/* Upload */}
          {!file && (
            <div
              className={`excel-to-pdf-upload ${
                isDragging
                  ? "excel-to-pdf-upload-active"
                  : ""
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="excel-to-pdf-upload-icon">
                📊
              </div>

              <h2>Upload your Excel file</h2>

              <p>
                Drag and drop your Excel spreadsheet here or
                choose a file from your computer.
              </p>

              <button
                type="button"
                className="excel-to-pdf-browse-btn"
                onClick={handleBrowseClick}
                disabled={isReading || isConverting}
              >
                Choose Excel File
              </button>

              <div className="excel-to-pdf-upload-note">
                Supported formats: XLSX and XLS • Maximum
                file size: 25 MB
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                onChange={handleInputChange}
                hidden
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              className="excel-to-pdf-error"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Selected file */}
          {file && (
            <div className="excel-to-pdf-file">
              <div className="excel-to-pdf-file-icon">
                📊
              </div>

              <div className="excel-to-pdf-file-info">
                <strong>{file.name}</strong>

                <span>
                  {formatFileSize(file.size)}

                  {sheetNames.length > 0 &&
                    ` • ${sheetNames.length} ${
                      sheetNames.length === 1
                        ? "worksheet"
                        : "worksheets"
                    }`}
                </span>
              </div>

              <button
                type="button"
                className="excel-to-pdf-remove"
                onClick={handleRemoveFile}
                disabled={isReading || isConverting}
              >
                Remove
              </button>
            </div>
          )}

          {/* Reading */}
          {isReading && (
            <div className="excel-to-pdf-reading">
              <div
                className="spinner-border"
                role="status"
              >
                <span className="visually-hidden">
                  Reading Excel file...
                </span>
              </div>

              <p>Reading your Excel file...</p>
            </div>
          )}

          {/* Options */}
          {file &&
            workbook &&
            sheetNames.length > 0 &&
            !isReading && (
              <div className="excel-to-pdf-options">

                {/* Worksheets */}
                <div className="excel-to-pdf-option-group">
                  <div className="excel-to-pdf-option-header">
                    <div>
                      <h3>Worksheets</h3>

                      <p>
                        Choose which worksheets to include
                        in the PDF.
                      </p>
                    </div>

                    <div className="excel-to-pdf-sheet-actions">
                      <button
                        type="button"
                        onClick={selectAllSheets}
                        disabled={isConverting}
                      >
                        Select All
                      </button>

                      <button
                        type="button"
                        onClick={clearSheetSelection}
                        disabled={isConverting}
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="excel-to-pdf-sheet-list">
                    {sheetNames.map((sheetName) => (
                      <label
                        className={`excel-to-pdf-sheet ${
                          selectedSheets.includes(sheetName)
                            ? "excel-to-pdf-sheet-active"
                            : ""
                        }`}
                        key={sheetName}
                      >
                        <input
                          type="checkbox"
                          checked={selectedSheets.includes(
                            sheetName
                          )}
                          onChange={() =>
                            toggleSheet(sheetName)
                          }
                          disabled={isConverting}
                        />

                        <span>
                          {sheetName}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Page settings */}
                <div className="excel-to-pdf-option-group">
                  <h3>PDF Settings</h3>

                  {/* Page size */}
                  <div className="excel-to-pdf-setting">
                    <label>Page Size</label>

                    <div className="excel-to-pdf-choice-row">
                      <button
                        type="button"
                        className={`excel-to-pdf-choice ${
                          pageSize === "a4"
                            ? "excel-to-pdf-choice-active"
                            : ""
                        }`}
                        onClick={() =>
                          setPageSize("a4")
                        }
                        disabled={isConverting}
                      >
                        A4
                      </button>

                      <button
                        type="button"
                        className={`excel-to-pdf-choice ${
                          pageSize === "letter"
                            ? "excel-to-pdf-choice-active"
                            : ""
                        }`}
                        onClick={() =>
                          setPageSize("letter")
                        }
                        disabled={isConverting}
                      >
                        Letter
                      </button>
                    </div>
                  </div>

                  {/* Orientation */}
                  <div className="excel-to-pdf-setting">
                    <label>Orientation</label>

                    <div className="excel-to-pdf-choice-row">
                      <button
                        type="button"
                        className={`excel-to-pdf-choice ${
                          orientation === "portrait"
                            ? "excel-to-pdf-choice-active"
                            : ""
                        }`}
                        onClick={() =>
                          setOrientation("portrait")
                        }
                        disabled={isConverting}
                      >
                        Portrait
                      </button>

                      <button
                        type="button"
                        className={`excel-to-pdf-choice ${
                          orientation === "landscape"
                            ? "excel-to-pdf-choice-active"
                            : ""
                        }`}
                        onClick={() =>
                          setOrientation("landscape")
                        }
                        disabled={isConverting}
                      >
                        Landscape
                      </button>
                    </div>
                  </div>

                  {/* Gridlines */}
                  <div className="excel-to-pdf-gridline-option">
                    <label>
                      <input
                        type="checkbox"
                        checked={includeGridlines}
                        onChange={(event) =>
                          setIncludeGridlines(
                            event.target.checked
                          )
                        }
                        disabled={isConverting}
                      />

                      <span>
                        Include table gridlines
                      </span>
                    </label>
                  </div>
                </div>

                {/* Convert */}
                <button
                  type="button"
                  className="excel-to-pdf-button"
                  onClick={convertToPDF}
                  disabled={
                    isConverting ||
                    selectedSheets.length === 0
                  }
                >
                  {isConverting
                    ? "Converting..."
                    : "Convert Excel to PDF"}
                </button>
              </div>
            )}

          {/* Progress */}
          {isConverting && (
            <div className="excel-to-pdf-progress">
              <div className="excel-to-pdf-progress-header">
                <span>
                  Converting worksheet {currentSheet} of{" "}
                  {selectedSheets.length}
                </span>

                <strong>{progress}%</strong>
              </div>

              <div className="excel-to-pdf-progress-track">
                <div
                  className="excel-to-pdf-progress-bar"
                  style={{
                    width: `${progress}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Result */}
          {downloadUrl && (
            <div className="excel-to-pdf-result">
              <div className="excel-to-pdf-success-icon">
                ✓
              </div>

              <h2>Conversion Complete</h2>

              <p>
                Your Excel workbook has been converted into
                a PDF successfully.
              </p>

              <a
                href={downloadUrl}
                download={outputFileName}
                className="excel-to-pdf-download"
              >
                Download PDF
              </a>

              <button
                type="button"
                className="excel-to-pdf-start-over"
                onClick={handleStartOver}
              >
                Convert Another Excel File
              </button>
            </div>
          )}
        </div>

        {/* Privacy */}
        <div className="excel-to-pdf-privacy">
          <div className="excel-to-pdf-info-card">
            <div className="excel-to-pdf-info-icon">
              🔒
            </div>

            <div>
              <h3>
                Your files are processed in your browser
              </h3>

              <p>
                Smart Tools is designed to process Excel
                files directly in your browser. Your
                spreadsheet is not intentionally uploaded to
                a Smart Tools server for conversion.
              </p>
            </div>
          </div>
        </div>

        {/* How to */}
        <section className="excel-to-pdf-content-section">
          <div className="excel-to-pdf-content-header">
            <h2>How to Convert Excel to PDF</h2>

            <p>
              Turn your Excel spreadsheet into a PDF in a
              few simple steps.
            </p>
          </div>

          <div className="excel-to-pdf-steps">

            <div className="excel-to-pdf-step">
              <div className="excel-to-pdf-step-number">
                1
              </div>

              <h3>Upload your Excel file</h3>

              <p>
                Select an XLSX or XLS file from your computer
                or drag and drop it into the upload area.
              </p>
            </div>

            <div className="excel-to-pdf-step">
              <div className="excel-to-pdf-step-number">
                2
              </div>

              <h3>Choose your settings</h3>

              <p>
                Select the worksheets you want to include,
                then choose your preferred page size and
                orientation.
              </p>
            </div>

            <div className="excel-to-pdf-step">
              <div className="excel-to-pdf-step-number">
                3
              </div>

              <h3>Download your PDF</h3>

              <p>
                Convert your spreadsheet and download the
                resulting PDF document.
              </p>
            </div>

          </div>
        </section>

        {/* Explanation */}
        <section className="excel-to-pdf-light-section">
          <div className="excel-to-pdf-article">
            <h2>What Does Excel to PDF Conversion Do?</h2>

            <p>
              Excel to PDF conversion turns spreadsheet data
              into a portable document that is easier to
              share, print, and view across different
              devices.
            </p>

            <p>
              Smart Tools reads the worksheets in your Excel
              workbook and creates PDF tables from the
              spreadsheet data. You can select individual
              worksheets or include the entire workbook.
            </p>

            <p>
              Landscape orientation can be particularly useful
              for worksheets containing many columns, while
              portrait orientation may work better for smaller
              tables.
            </p>
          </div>
        </section>

        {/* Important information */}
        <section className="excel-to-pdf-content-section">
          <div className="excel-to-pdf-important">
            <h2>Important Information</h2>

            <ul className="excel-to-pdf-important-list">
              <li>
                XLSX and XLS Excel files are supported.
              </li>

              <li>
                The maximum supported file size is 25 MB.
              </li>

              <li>
                For browser stability, workbooks are limited
                to 20 worksheets.
              </li>

              <li>
                Each worksheet is limited to 1,000 rows and
                30 columns.
              </li>

              <li>
                The converter focuses on spreadsheet data
                and table presentation.
              </li>

              <li>
                Complex Excel formatting, formulas,
                charts, images, macros, and advanced
                spreadsheet features may not be reproduced
                exactly.
              </li>

              <li>
                The generated PDF may look different from
                the original Excel workbook.
              </li>
            </ul>
          </div>
        </section>

        {/* FAQ */}
        <section className="excel-to-pdf-content-section">
          <div className="excel-to-pdf-faq">

            <div className="excel-to-pdf-content-header">
              <h2>Frequently Asked Questions</h2>
            </div>

            <div className="excel-to-pdf-faq-list">

              <details>
                <summary>
                  Is the Excel to PDF converter free?
                </summary>

                <p>
                  Yes. Smart Tools is designed to provide
                  this Excel to PDF conversion tool online
                  for free.
                </p>
              </details>

              <details>
                <summary>
                  Which Excel files are supported?
                </summary>

                <p>
                  The converter supports common Excel
                  workbook formats including XLSX and XLS.
                </p>
              </details>

              <details>
                <summary>
                  Can I convert only one worksheet?
                </summary>

                <p>
                  Yes. You can select individual worksheets
                  instead of converting the entire workbook.
                </p>
              </details>

              <details>
                <summary>
                  Can I convert multiple worksheets?
                </summary>

                <p>
                  Yes. Select multiple worksheets and they
                  will be included in the generated PDF.
                </p>
              </details>

              <details>
                <summary>
                  Should I use portrait or landscape?
                </summary>

                <p>
                  Landscape is usually more suitable for
                  spreadsheets with many columns. Portrait
                  can work well for smaller tables.
                </p>
              </details>

              <details>
                <summary>
                  Are my Excel files uploaded to a server?
                </summary>

                <p>
                  The conversion is designed to happen
                  directly in your browser. Smart Tools does
                  not intentionally upload your spreadsheet
                  to its server for conversion.
                </p>
              </details>

              <details>
                <summary>
                  Will the PDF look exactly like my Excel
                  workbook?
                </summary>

                <p>
                  Not necessarily. The tool converts
                  spreadsheet data into PDF tables. Advanced
                  Excel formatting, charts, images, formulas,
                  and other complex workbook features may not
                  be reproduced exactly.
                </p>
              </details>

            </div>
          </div>
        </section>

      </div>
    </section>
  );
};

export default ExcelToPDF;