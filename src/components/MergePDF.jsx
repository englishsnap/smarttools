import { useRef, useState } from "react"
import { PDFDocument } from "pdf-lib"
import "./MergePDF.css"

function MergePDF() {

  // =========================================
  // STATE
  // =========================================

  const [files, setFiles] = useState([])

  const [isDragging, setIsDragging] = useState(false)

  const [draggedIndex, setDraggedIndex] = useState(null)

  const [error, setError] = useState("")

  const [success, setSuccess] = useState("")

  const [isMerging, setIsMerging] = useState(false)


  // =========================================
  // FILE INPUT REFERENCE
  // =========================================

  const fileInputRef = useRef(null)


  // =========================================
  // SETTINGS
  // =========================================

  const MAX_FILE_SIZE = 25 * 1024 * 1024


  // =========================================
  // OPEN FILE BROWSER
  // =========================================

  const handleChooseFiles = () => {

    if (isMerging) {
      return
    }

    fileInputRef.current?.click()

  }


  // =========================================
  // VALIDATE AND ADD FILES
  // =========================================

  const validateAndAddFiles = (selectedFiles) => {

    if (isMerging) {
      return
    }

    setError("")

    setSuccess("")


    const validFiles = []

    const rejectedFiles = []


    selectedFiles.forEach((file) => {

      // -------------------------------------
      // CHECK FILE TYPE
      // -------------------------------------

      if (
        file.type !== "application/pdf" &&
        !file.name.toLowerCase().endsWith(".pdf")
      ) {

        rejectedFiles.push(
          `${file.name} is not a PDF file.`
        )

        return
      }


      // -------------------------------------
      // CHECK FILE SIZE
      // -------------------------------------

      if (file.size > MAX_FILE_SIZE) {

        rejectedFiles.push(
          `${file.name} is larger than 25 MB.`
        )

        return
      }


      // -------------------------------------
      // CHECK DUPLICATES
      // -------------------------------------

      const alreadyAdded = files.some(
        (existingFile) =>
          existingFile.name === file.name &&
          existingFile.size === file.size &&
          existingFile.lastModified === file.lastModified
      )


      if (alreadyAdded) {

        rejectedFiles.push(
          `${file.name} has already been added.`
        )

        return
      }


      // -------------------------------------
      // FILE PASSED VALIDATION
      // -------------------------------------

      validFiles.push(file)

    })


    // =========================================
    // DISPLAY ERRORS
    // =========================================

    if (rejectedFiles.length > 0) {

      setError(
        rejectedFiles.join(" ")
      )

    }


    // =========================================
    // ADD VALID FILES
    // =========================================

    if (validFiles.length > 0) {

      setFiles((previousFiles) => [
        ...previousFiles,
        ...validFiles
      ])

    }

  }


  // =========================================
  // FILE INPUT CHANGE
  // =========================================

  const handleFileChange = (event) => {

    const selectedFiles = Array.from(
      event.target.files
    )

    validateAndAddFiles(selectedFiles)

    // Reset input so the same file can
    // be selected again after removing it

    event.target.value = ""

  }


  // =========================================
  // UPLOAD AREA - DRAG OVER
  // =========================================

  const handleDragOver = (event) => {

    event.preventDefault()

    if (isMerging) {
      return
    }

    setIsDragging(true)

  }


  // =========================================
  // UPLOAD AREA - DRAG LEAVE
  // =========================================

  const handleDragLeave = (event) => {

    event.preventDefault()

    setIsDragging(false)

  }


  // =========================================
  // UPLOAD AREA - DROP
  // =========================================

  const handleDrop = (event) => {

    event.preventDefault()

    setIsDragging(false)

    if (isMerging) {
      return
    }


    const droppedFiles = Array.from(
      event.dataTransfer.files
    )


    validateAndAddFiles(droppedFiles)

  }


  // =========================================
  // REMOVE INDIVIDUAL FILE
  // =========================================

  const handleRemoveFile = (indexToRemove) => {

    if (isMerging) {
      return
    }

    setFiles((previousFiles) =>
      previousFiles.filter(
        (_, index) =>
          index !== indexToRemove
      )
    )

    setError("")

    setSuccess("")

  }


  // =========================================
  // CLEAR ALL FILES
  // =========================================

  const handleClearAll = () => {

    if (isMerging) {
      return
    }

    setFiles([])

    setError("")

    setSuccess("")

    setDraggedIndex(null)

  }


  // =========================================
  // START REORDERING
  // =========================================

  const handleFileDragStart = (index) => {

    if (isMerging) {
      return
    }

    setDraggedIndex(index)

  }


  // =========================================
  // DRAG OVER FILE
  // =========================================

  const handleFileDragOver = (event) => {

    event.preventDefault()

  }


  // =========================================
  // DROP FILE INTO NEW POSITION
  // =========================================

  const handleFileDrop = (dropIndex) => {

    if (
      draggedIndex === null ||
      isMerging
    ) {
      return
    }


    // -------------------------------------
    // SAME POSITION
    // -------------------------------------

    if (draggedIndex === dropIndex) {

      setDraggedIndex(null)

      return
    }


    setFiles((previousFiles) => {

      const updatedFiles = [
        ...previousFiles
      ]


      // Remove dragged file

      const [movedFile] =
        updatedFiles.splice(
          draggedIndex,
          1
        )


      // Insert file into new position

      updatedFiles.splice(
        dropIndex,
        0,
        movedFile
      )


      return updatedFiles

    })


    setDraggedIndex(null)

    setSuccess("")

  }


  // =========================================
  // END REORDERING
  // =========================================

  const handleFileDragEnd = () => {

    setDraggedIndex(null)

  }


  // =========================================
  // MERGE PDF
  // =========================================

  const handleMergePDF = async () => {

    // -------------------------------------
    // CHECK FILE COUNT
    // -------------------------------------

    if (files.length < 2) {

      setError(
        "Please select at least two PDF files."
      )

      return
    }


    // -------------------------------------
    // START MERGING
    // -------------------------------------

    setError("")

    setSuccess("")

    setIsMerging(true)


    try {

      // -----------------------------------
      // CREATE NEW PDF
      // -----------------------------------

      const mergedPdf =
        await PDFDocument.create()


      // -----------------------------------
      // PROCESS FILES IN CURRENT ORDER
      // -----------------------------------

      for (const file of files) {

        const fileBytes =
          await file.arrayBuffer()


        const pdf =
          await PDFDocument.load(
            fileBytes
          )


        // Get all pages

        const pages =
          await mergedPdf.copyPages(
            pdf,
            pdf.getPageIndices()
          )


        // Add pages in order

        pages.forEach((page) => {

          mergedPdf.addPage(page)

        })

      }


      // -----------------------------------
      // CREATE FINAL PDF
      // -----------------------------------

      const mergedPdfBytes =
        await mergedPdf.save()


      // -----------------------------------
      // CREATE DOWNLOAD BLOB
      // -----------------------------------

      const blob = new Blob(
        [mergedPdfBytes],
        {
          type: "application/pdf"
        }
      )


      // -----------------------------------
      // CREATE TEMPORARY DOWNLOAD URL
      // -----------------------------------

      const url =
        URL.createObjectURL(blob)


      // -----------------------------------
      // CREATE DOWNLOAD LINK
      // -----------------------------------

      const link =
        document.createElement("a")


      link.href = url

      link.download = "merged.pdf"


      document.body.appendChild(link)


      link.click()


      document.body.removeChild(link)


      // -----------------------------------
      // CLEAN UP URL
      // -----------------------------------

      URL.revokeObjectURL(url)


      // -----------------------------------
      // SUCCESS
      // -----------------------------------

      setSuccess(
        "Your PDF has been merged successfully."
      )

    } catch (mergeError) {

      console.error(
        "PDF merge error:",
        mergeError
      )


      setError(
        "Something went wrong while merging your PDFs. Please make sure all files are valid PDF documents."
      )

    } finally {

      setIsMerging(false)

    }

  }


  // =========================================
  // COMPONENT
  // =========================================

  return (

    <main className="merge-pdf-page">

      <div className="container">


        {/* =====================================
            PAGE HEADING
        ====================================== */}

        <div className="merge-pdf-heading text-center">

          <span className="merge-pdf-badge">
            PDF TOOL
          </span>


          <h1>
            Merge PDF
          </h1>


          <p>
            Combine multiple PDF files into one
            document quickly and easily.
          </p>

        </div>


        {/* =====================================
            UPLOAD AREA
        ====================================== */}

        <div className="merge-pdf-upload-wrapper">

          <div
            className={`merge-pdf-upload ${
              isDragging
                ? "is-dragging"
                : ""
            }`}
            onClick={handleChooseFiles}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >


            {/* Upload Icon */}

            <div className="merge-pdf-upload-icon">
              📄
            </div>


            {/* Upload Heading */}

            <h2>

              {isDragging
                ? "Drop your PDF files here"
                : "Drop PDF files here"
              }

            </h2>


            {/* Upload Description */}

            <p>
              or click to browse your files
            </p>


            {/* Browse Button */}

            <button
              type="button"
              className="merge-pdf-upload-button"
              onClick={(event) => {

                event.stopPropagation()

                handleChooseFiles()

              }}
              disabled={isMerging}
            >
              Choose PDF Files
            </button>


            {/* File Note */}

            <span className="merge-pdf-file-note">

              Only PDF files are supported ·
              Maximum 25 MB per file

            </span>


            {/* Hidden File Input */}

            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              multiple
              onChange={handleFileChange}
              hidden
            />


            {/* Error Message */}

            {error && (

              <div
                className="merge-pdf-error"
                role="alert"
              >
                {error}
              </div>

            )}


            {/* Success Message */}

            {success && (

              <div
                className="merge-pdf-success"
                role="status"
              >
                {success}
              </div>

            )}

          </div>

        </div>


        {/* =====================================
            SELECTED FILES
        ====================================== */}

        {files.length > 0 && (

          <div className="merge-pdf-files">


            {/* Files Header */}

            <div className="merge-pdf-files-header">

              <h2>
                Selected Files
              </h2>


              <div className="merge-pdf-files-header-right">

                <span>
                  {files.length} file
                  {files.length !== 1
                    ? "s"
                    : ""}
                </span>


                <button
                  type="button"
                  className="merge-pdf-clear"
                  onClick={handleClearAll}
                  disabled={isMerging}
                >
                  Clear All
                </button>

              </div>

            </div>


            {/* Reorder Instruction */}

            <p className="merge-pdf-reorder-note">

              Drag and drop files to change
              their order.

            </p>


            {/* File List */}

            <div className="merge-pdf-file-list">

              {files.map((file, index) => (

                <div
                  className={`merge-pdf-file-item ${
                    draggedIndex === index
                      ? "is-dragging"
                      : ""
                  }`}
                  key={`${file.name}-${file.lastModified}-${index}`}
                  draggable={!isMerging}
                  onDragStart={() =>
                    handleFileDragStart(index)
                  }
                  onDragOver={
                    handleFileDragOver
                  }
                  onDrop={() =>
                    handleFileDrop(index)
                  }
                  onDragEnd={
                    handleFileDragEnd
                  }
                >


                  {/* Drag Handle */}

                  <div
                    className="merge-pdf-drag-handle"
                    aria-label="Drag to reorder"
                  >
                    ⋮⋮
                  </div>


                  {/* File Information */}

                  <div className="merge-pdf-file-info">


                    {/* File Icon */}

                    <div className="merge-pdf-file-icon">
                      📄
                    </div>


                    {/* File Name and Size */}

                    <div className="merge-pdf-file-details">

                      <p className="merge-pdf-file-name">
                        {file.name}
                      </p>


                      <span className="merge-pdf-file-size">

                        {(
                          file.size /
                          1024 /
                          1024
                        ).toFixed(2)}{" "}
                        MB

                      </span>

                    </div>

                  </div>


                  {/* Remove Button */}

                  <button
                    type="button"
                    className="merge-pdf-remove"
                    onClick={() =>
                      handleRemoveFile(index)
                    }
                    disabled={isMerging}
                    aria-label={`Remove ${file.name}`}
                  >
                    ×
                  </button>

                </div>

              ))}

            </div>


            {/* =================================
                MERGE ACTION
            ================================== */}

            <div className="merge-pdf-action">

              <button
                type="button"
                className="merge-pdf-button"
                disabled={
                  files.length < 2 ||
                  isMerging
                }
                onClick={handleMergePDF}
              >

                {isMerging
                  ? "Merging PDFs..."
                  : "Merge PDF"
                }

              </button>

            </div>


            {/* Minimum File Message */}

            {files.length === 1 && (

              <p className="merge-pdf-minimum-note">

                Add at least one more PDF file
                to merge.

              </p>

            )}

          </div>

        )}

      </div>

    </main>

  )

}

export default MergePDF