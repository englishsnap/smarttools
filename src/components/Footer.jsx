import { NavLink } from "react-router-dom"
import "./Footer.css"

const pdfTools = [
  {
    name: "Merge PDF",
    path: "/merge-pdf"
  },
  {
    name: "Split PDF",
    path: "/split-pdf"
  },
  {
    name: "Compress PDF",
    path: "/compress-pdf"
  },
  {
    name: "PDF to Word",
    path: "/pdf-to-word"
  },
  {
    name: "PDF to Excel",
    path: "/pdf-to-excel"
  },
  {
    name: "JPG/PNG to PDF",
    path: "/jpg-png-to-pdf"
  },
  {
    name: "PDF to JPG/PNG",
    path: "/pdf-to-jpg-png"
  },
  {
    name: "Excel to PDF",
    path: "/excel-to-pdf"
  }
]

const imageTools = [
  {
    name: "Image to Text",
    path: "/image-to-text"
  },
  {
    name: "Background Remover",
    path: "/background-remover"
  }
]

const companyLinks = [
  {
    name: "About",
    path: "/about"
  },
  {
    name: "Contact",
    path: "/contact"
  },
  {
    name: "Privacy Policy",
    path: "/privacy-policy"
  },
  // {
  //   name: "Terms of Service",
  //   path: "/terms"
  // }
]

function Footer() {
  return (
    <footer className="site-footer">

      <div className="container">

        <div className="row g-4">

          {/* Brand */}

          <div className="col-12 col-lg-4">

            <div className="footer-brand">

              <NavLink
                to="/"
                className="footer-logo"
              >
                Smart Tools
              </NavLink>

              <p>
                Simple online tools for converting,
                organizing, and working with your
                everyday documents and images.
              </p>

            </div>

          </div>


          {/* PDF Tools */}

          <div className="col-6 col-md-4 col-lg-2">

            <div className="footer-column">

              <h3>
                PDF Tools
              </h3>

              <ul>

                {pdfTools.map((tool) => (

                  <li key={tool.path}>

                    <NavLink to={tool.path}>
                      {tool.name}
                    </NavLink>

                  </li>

                ))}

              </ul>

            </div>

          </div>


          {/* Image Tools */}

          <div className="col-6 col-md-4 col-lg-3">

            <div className="footer-column">

              <h3>
                Image Tools
              </h3>

              <ul>

                {imageTools.map((tool) => (

                  <li key={tool.path}>

                    <NavLink to={tool.path}>
                      {tool.name}
                    </NavLink>

                  </li>

                ))}

              </ul>

            </div>

          </div>


          {/* Company */}

          <div className="col-12 col-md-4 col-lg-3">

            <div className="footer-column">

              <h3>
                Company
              </h3>

              <ul>

                {companyLinks.map((link) => (

                  <li key={link.path}>

                    <NavLink to={link.path}>
                      {link.name}
                    </NavLink>

                  </li>

                ))}

              </ul>

            </div>

          </div>

        </div>


        {/* Footer Bottom */}

        <div className="footer-bottom">

          <p>
            © 2026 Smart Tools. All rights reserved.
          </p>

          <p>
            Simple tools for your everyday files.
          </p>

        </div>

      </div>

    </footer>
  )
}

export default Footer