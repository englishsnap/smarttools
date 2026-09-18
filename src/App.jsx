import { BrowserRouter, Routes, Route } from "react-router-dom"

import Home from "./pages/Home"

import Navbar from "./components/Navbar"
import Footer from "./components/Footer"
import MergePDF from "./components/MergePDF"
import SplitPDF from "./components/SplitPDF"
import CompressPDF from "./components/CompressPDF"
import PDFToWord from "./components/PDFToWord"
import PDFToExcel from "./components/PDFToExcel"
import JPGPNGToPDF from "./components/JPGPNGToPDF"
import ImageToText from "./components/ImageToText"
import BackgroundRemover from "./components/BackgroundRemover"
import PDFToJPGPNG from "./components/PDFToJPGPNG"
import ExcelToPDF from "./components/ExcelToPDF"
import About from "./components/About"
import Contact from "./components/Contact"
import PrivacyPolicy from "./components/PrivacyPolicy"

function App() {
  return (
    <BrowserRouter>

      <Navbar />
      <Routes>

        <Route path="/" element={<Home />} />

        <Route
          path="/merge-pdf"
          element={<MergePDF />}
        />

        <Route
          path="/split-pdf"
          element={<SplitPDF />}
        />

        <Route 
          path="/compress-pdf"
          element={<CompressPDF />}
        />

        <Route
          path="/pdf-to-word"
          element={<PDFToWord />}
        />

        <Route
          path="/pdf-to-excel"
          element={<PDFToExcel />}
        />

        <Route
          path="/jpg-png-to-pdf"
          element={<JPGPNGToPDF />}
        />

        <Route
          path="/image-to-text"
          element={<ImageToText />}
        />

        <Route
          path="/background-remover"
          element={<BackgroundRemover />}
        />

        <Route
          path="/pdf-to-jpg-png"
          element={<PDFToJPGPNG />}
        />

        <Route
          path="/excel-to-pdf"
          element={<ExcelToPDF />}
        />

        <Route path="/about" element={<About />} />

        <Route path="/contact" element={<Contact />} />

        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      </Routes>
      <Footer />
      
    </BrowserRouter>
  )
}

export default App