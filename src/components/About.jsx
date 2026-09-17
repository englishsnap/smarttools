import { useEffect } from "react";
import { Link } from "react-router-dom";
import "./About.css";

const About = () => {
  useEffect(() => {
    document.title = "About Smart Tools | Free Online File Tools";

    const description =
      "Learn about Smart Tools, a collection of simple online tools for converting, organizing, and managing PDF and image files.";

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

  return (
    <main className="about-page">
      {/* Hero */}
      <section className="hero-page-design"> 

        <div className="container">
          <div className="hero-page-content"> 
   
            <span className="section-eye-brow"> 
              ABOUT SMART TOOLS
            </span>

            <h1>
            Simple Tools
            <span> for Your Everyday Files</span>
            </h1>

            <p className="hero-page-description"> 
              Smart Tools is a collection of easy-to-use
              online tools designed to help you convert,
              organize, and manage documents and images
              without unnecessary complexity.
            </p>
          </div>
        </div>
      </section>

      {/* Introduction */}
      <section className="about-content-section">
        <div className="container">
          <div className="about-intro">
            <div className="about-section-heading">
              <span>WHAT WE DO</span>

              <h2>
                Making everyday file tasks easier
              </h2>
            </div>

            <div className="about-intro-text">
              <p>
                Working with documents and images often
                involves small tasks that can take more time
                than expected. Converting a PDF, combining
                files, reducing file size, extracting text,
                or changing an image format should not have
                to be complicated.
              </p>

              <p>
                Smart Tools brings these common tasks
                together in one simple online platform. Our
                goal is to provide straightforward tools that
                are easy to understand and convenient to use.
              </p>

              <p>
                Instead of requiring complicated software for
                everyday file tasks, Smart Tools gives you
                practical browser-based tools in one place.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What We Offer */}
      <section className="about-tools-section">
        <div className="container">
          <div className="about-section-heading text-center">
            <span>OUR TOOLS</span>

            <h2>
              Tools for documents and images
            </h2>

            <p>
              Smart Tools currently includes a growing
              collection of PDF, document, and image tools.
            </p>
          </div>

          <div className="about-tool-categories">
            <div className="about-category-card">
              <div className="about-category-icon">
                📄
              </div>

              <h3>PDF Tools</h3>

              <p>
                Merge, split, compress, convert, and
                transform PDF documents for everyday file
                tasks.
              </p>
            </div>

            <div className="about-category-card">
              <div className="about-category-icon">
                🖼️
              </div>

              <h3>Image Tools</h3>

              <p>
                Work with images using tools for conversion,
                text extraction, background removal, and
                other common image tasks.
              </p>
            </div>

            <div className="about-category-card">
              <div className="about-category-icon">
                📊
              </div>

              <h3>Document Conversion</h3>

              <p>
                Convert documents between commonly used
                formats when you need a more convenient way
                to share or work with your files.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Smart Tools */}
      <section className="about-why-section">
        <div className="container">
          <div className="about-why-grid">
            <div className="about-why-content">
              <div className="about-section-heading">
                <span>WHY SMART TOOLS</span>

                <h2>
                  Built around simplicity
                </h2>
              </div>

              <p>
                We believe online file tools should be
                straightforward. You should be able to find
                the tool you need, understand what it does,
                and complete your task without unnecessary
                steps.
              </p>

              <p>
                Smart Tools is designed with that principle
                in mind. The website brings commonly needed
                file utilities together with clear
                instructions and simple interfaces.
              </p>
            </div>

            <div className="about-benefits">
              <div className="about-benefit">
                <div className="about-benefit-icon">
                  ✓
                </div>

                <div>
                  <h3>Easy to Use</h3>

                  <p>
                    Simple interfaces designed for everyday
                    file tasks.
                  </p>
                </div>
              </div>

              <div className="about-benefit">
                <div className="about-benefit-icon">
                  ⚡
                </div>

                <div>
                  <h3>Practical</h3>

                  <p>
                    Tools focused on common document and
                    image needs.
                  </p>
                </div>
              </div>

              <div className="about-benefit">
                <div className="about-benefit-icon">
                  🔒
                </div>

                <div>
                  <h3>Browser-Based</h3>

                  <p>
                    Many tools are designed to process files
                    directly in your browser.
                  </p>
                </div>
              </div>

              <div className="about-benefit">
                <div className="about-benefit-icon">
                  📱
                </div>

                <div>
                  <h3>Responsive</h3>

                  <p>
                    Designed to work across desktop, tablet,
                    and mobile screens.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy */}
      <section className="about-privacy-section">
        <div className="container">
          <div className="about-privacy-card">
            <div className="about-privacy-icon">
              🔒
            </div>

            <div>
              <span className="about-small-label">
                YOUR PRIVACY
              </span>

              <h2>
                Designed with browser-based processing in
                mind
              </h2>

              <p>
                Several Smart Tools are designed to process
                files directly in your browser rather than
                intentionally uploading the files to a Smart
                Tools conversion server.
              </p>

              <p>
                Processing behavior can vary by tool, so
                individual tool pages explain their specific
                limitations and processing approach.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="about-mission-section">
        <div className="container">
          <div className="about-mission text-center">
            <div className="about-section-heading">
              <span>OUR GOAL</span>

              <h2>
                Useful tools without unnecessary complexity
              </h2>
            </div>

            <p>
              Smart Tools aims to continue building useful
              online utilities that make common file tasks
              easier. As the platform grows, the focus will
              remain on practical tools, clear interfaces,
              and a straightforward user experience.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="about-cta-section">
        <div className="container">
          <div className="about-cta">
            <h2>
              Ready to work with your files?
            </h2>

            <p>
              Explore the available Smart Tools and find the
              tool you need for your next file task.
            </p>

            <Link
              to="/"
              className="about-cta-button"
            >
              Explore Smart Tools
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
};

export default About;