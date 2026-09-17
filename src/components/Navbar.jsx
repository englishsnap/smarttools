import { useState, useEffect, useRef } from "react"
import { NavLink } from "react-router-dom"

import "./Navbar.css"

function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState(null)
  
  // Reference to track the navbar container for outside clicks
  const navbarRef = useRef(null)

  const handleDropdown = (menu) => {
    setOpenDropdown(openDropdown === menu ? null : menu)
  }

  const closeMenu = () => {
    setMobileMenuOpen(false)
    setOpenDropdown(null)
  }

  // Close dropdown when clicking outside the navbar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navbarRef.current && !navbarRef.current.contains(event.target)) {
        setOpenDropdown(null)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  return (
    <header className="smart-navbar" ref={navbarRef}>
      <div className="navbar-container">

        {/* Logo */}
        <NavLink
          to="/"
          className="navbar-logo"
          onClick={closeMenu}
        >
          <span className="logo-icon">ST</span>
          <span className="logo-text">Smart Tools</span>
        </NavLink>

        {/* Desktop Navigation */}
        <nav className="desktop-nav">

          <NavLink
            to="/"
            className={({ isActive }) =>
              `nav-link ${isActive ? "active" : ""}`
            }
          >
            Home
          </NavLink>

          {/* Organize PDF */}
          <div className="nav-dropdown">
            <button
              className="nav-dropdown-button"
              onClick={() => handleDropdown("organize")}
            >
              Organize PDF
              <span className="dropdown-arrow">⌄</span>
            </button>

            {openDropdown === "organize" && (
              <div className="smart-dropdown-menu">
                <NavLink to="/merge-pdf" onClick={closeMenu}>Merge PDF</NavLink>
                <NavLink to="/split-pdf" onClick={closeMenu}>Split PDF</NavLink>
                <NavLink to="/compress-pdf" onClick={closeMenu}>Compress PDF</NavLink>
              </div>
            )}
          </div>

          {/* Convert PDF */}
          <div className="nav-dropdown">
            <button
              className="nav-dropdown-button"
              onClick={() => handleDropdown("convert")}
            >
              Convert PDF
              <span className="dropdown-arrow">⌄</span>
            </button>

            {openDropdown === "convert" && (
              <div className="smart-dropdown-menu">
                <NavLink to="/pdf-to-word" onClick={closeMenu}>PDF to Word</NavLink>
                <NavLink to="/pdf-to-excel" onClick={closeMenu}>PDF to Excel</NavLink>
                <NavLink to="/excel-to-pdf" onClick={closeMenu}>Excel to PDF</NavLink>
                <NavLink to="/jpg-png-to-pdf" onClick={closeMenu}>JPG/PNG to PDF</NavLink>
                <NavLink to="/pdf-to-jpg-png" onClick={closeMenu}>PDF to JPG/PNG</NavLink>
              </div>
            )}
          </div>

          {/* Image Tools */}
          <div className="nav-dropdown">
            <button
              className="nav-dropdown-button"
              onClick={() => handleDropdown("image")}
            >
              Image Tools
              <span className="dropdown-arrow">⌄</span>
            </button>

            {openDropdown === "image" && (
              <div className="smart-dropdown-menu">
                <NavLink to="/image-to-text" onClick={closeMenu}>Image to Text</NavLink>
                <NavLink to="/background-remover" onClick={closeMenu}>Background Remover</NavLink>
              </div>
            )}
          </div>

          {/* About */}
          <NavLink
            to="/about"
            className={({ isActive }) =>
              `nav-link ${isActive ? "active" : ""}`
            }
          >
            About
          </NavLink>

          {/* Contact */}
          <NavLink
            to="/contact"
            className={({ isActive }) =>
              `nav-link ${isActive ? "active" : ""}`
            }
          >
            Contact
          </NavLink>

        </nav>

        {/* Mobile Menu Button */}
        <button
          className={`mobile-menu-button ${
            mobileMenuOpen ? "open" : ""
          }`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

      </div>

      {/* Mobile Navigation */}
      <div
        className={`mobile-nav ${
          mobileMenuOpen ? "show" : ""
        }`}
      >
        <NavLink to="/" onClick={closeMenu}>Home</NavLink>

        {/* Mobile Organize PDF */}
        <button
          className="mobile-dropdown-button"
          onClick={() => handleDropdown("mobile-organize")}
        >
          Organize PDF
          <span>⌄</span>
        </button>

        {openDropdown === "mobile-organize" && (
          <div className="mobile-dropdown">
            <NavLink to="/merge-pdf" onClick={closeMenu}>Merge PDF</NavLink>
            <NavLink to="/split-pdf" onClick={closeMenu}>Split PDF</NavLink>
            <NavLink to="/compress-pdf" onClick={closeMenu}>Compress PDF</NavLink>
          </div>
        )}

        {/* Mobile Convert PDF */}
        <button
          className="mobile-dropdown-button"
          onClick={() => handleDropdown("mobile-convert")}
        >
          Convert PDF
          <span>⌄</span>
        </button>

        {openDropdown === "mobile-convert" && (
          <div className="mobile-dropdown">
            <NavLink to="/pdf-to-word" onClick={closeMenu}>PDF to Word</NavLink>
            <NavLink to="/pdf-to-excel" onClick={closeMenu}>PDF to Excel</NavLink>
            <NavLink to="/jpg-png-to-pdf" onClick={closeMenu}>JPG/PNG to PDF</NavLink>
          </div>
        )}

        {/* Mobile Image Tools */}
        <button
          className="mobile-dropdown-button"
          onClick={() => handleDropdown("mobile-image")}
        >
          Image Tools
          <span>⌄</span>
        </button>

        {openDropdown === "mobile-image" && (
          <div className="mobile-dropdown">
            <NavLink to="/image-to-text" onClick={closeMenu}>Image to Text</NavLink>
            <NavLink to="/background-remover" onClick={closeMenu}>Background Remover</NavLink>
          </div>
        )}

        <NavLink to="/about" onClick={closeMenu}>About</NavLink>
        <NavLink to="/contact" onClick={closeMenu}>Contact</NavLink>
      </div>
    </header>
  )
}

export default Navbar