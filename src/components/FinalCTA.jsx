import { NavLink } from "react-router-dom"
import "./FinalCTA.css"

function FinalCTA() {
  return (
    <section className="final-cta-section">

      <div className="container">

        <div className="final-cta-content text-center">

          <span className="final-cta-badge">
            SMART TOOLS
          </span>

          <h2>
            Ready to simplify your files?
          </h2>

          <p>
            Convert, organize, and work with your documents
            and images using simple online tools.
          </p>

          <a href="/" className="contact-cta-button">
              Explore All Tools
          </a>

        </div>

      </div>

    </section>
  )
}

export default FinalCTA