import { useEffect } from "react";
import "./PrivacyPolicy.css";

const PrivacyPolicy = () => {
  useEffect(() => {
    document.title = "Privacy Policy | Smart Tools";

    const description =
      "Read the Smart Tools Privacy Policy to learn how we handle contact information, uploaded files, third-party services, and privacy.";

    let meta = document.querySelector('meta[name="description"]');

    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }

    meta.setAttribute("content", description);
  }, []);

  return (
    <main className="privacy-page">
      {/* Hero */}
      <section className="privacy-hero">
        <div className="container">
          <div className="privacy-hero-content">
            <span className="privacy-badge">YOUR PRIVACY MATTERS</span>

            <h1>Privacy Policy</h1>

            <p>
              This Privacy Policy explains how Smart Tools handles information
              when you use our website and online tools.
            </p>

            <span className="privacy-updated">
              Last Updated: September 18, 2026
            </span>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="privacy-section">
        <div className="container">
          <div className="privacy-content">
            {/* Introduction */}
            <section className="privacy-block">
              <span className="privacy-section-label">01</span>

              <h2>Introduction</h2>

              <p>
                Welcome to Smart Tools. We provide online tools for working
                with PDF files, images, documents, and spreadsheets.
              </p>

              <p>
                We respect your privacy and aim to be transparent about how
                information is handled when you use our website. This Privacy
                Policy describes the types of information that may be
                collected, how that information may be used, and the role of
                third-party services used by the website.
              </p>
            </section>

            {/* Information We Collect */}
            <section className="privacy-block">
              <span className="privacy-section-label">02</span>

              <h2>Information We Collect</h2>

              <p>
                Smart Tools does not require you to create an account to use
                the online tools available on the website.
              </p>

              <p>
                Depending on how you use the website, information may be
                provided directly by you, including information submitted
                through our Contact Us form.
              </p>

              <h3>Information submitted through the Contact Us form</h3>

              <p>
                When you contact us, you may provide information such as:
              </p>

              <ul>
                <li>Your name</li>
                <li>Your email address</li>
                <li>The subject of your message</li>
                <li>The contents of your message</li>
              </ul>

              <p>
                Please do not include passwords, payment information, or other
                highly sensitive information in messages submitted through the
                Contact Us form.
              </p>
            </section>

            {/* Uploaded Files */}
            <section className="privacy-block">
              <span className="privacy-section-label">03</span>

              <h2>Files You Upload</h2>

              <p>
                Smart Tools provides browser-based tools that allow you to
                process files such as PDFs, images, and spreadsheets.
              </p>

              <p>
                Many of our tools are designed to process files directly in
                your web browser. Where processing occurs in the browser, the
                file does not need to be uploaded to a Smart Tools server for
                that processing.
              </p>

              <p>
                The exact processing method can vary depending on the tool and
                the technology used by that tool. You should review the
                information provided on the individual tool page before using
                it with sensitive or confidential files.
              </p>

              <p>
                Smart Tools does not ask users to upload files to create an
                account or maintain a personal file library.
              </p>
            </section>

            {/* How Information Is Used */}
            <section className="privacy-block">
              <span className="privacy-section-label">04</span>

              <h2>How We Use Information</h2>

              <p>
                Information submitted through the website may be used to:
              </p>

              <ul>
                <li>Respond to questions and support requests</li>
                <li>Review feedback and suggestions</li>
                <li>Investigate reported technical issues</li>
                <li>Improve the website and its tools</li>
                <li>Maintain the security and reliability of the website</li>
              </ul>

              <p>
                We do not require personal information simply to use the
                website's file tools.
              </p>
            </section>

            {/* EmailJS */}
            <section className="privacy-block">
              <span className="privacy-section-label">05</span>

              <h2>Contact Form and EmailJS</h2>

              <p>
                Our Contact Us form uses EmailJS to transmit messages submitted
                through the form.
              </p>

              <p>
                When you submit the Contact Us form, the information you
                provide, including your name, email address, subject, and
                message, may be transmitted through EmailJS so that we can
                receive and respond to your message.
              </p>

              <p>
                EmailJS is a third-party service. Information submitted through
                the Contact Us form may therefore be processed according to
                EmailJS's own privacy practices and terms.
              </p>

              <p>
                The Contact Us form may also send an automated confirmation
                email to the email address provided by the visitor.
              </p>
            </section>

            {/* Cookies and Analytics */}
            <section className="privacy-block">
              <span className="privacy-section-label">06</span>

              <h2>Cookies and Analytics</h2>

              <p>
                Smart Tools may use cookies, local storage, analytics
                technologies, or similar technologies in the future to
                understand website usage, improve functionality, maintain
                security, or measure website performance.
              </p>

              <p>
                If analytics, advertising, or other tracking technologies are
                introduced, this Privacy Policy may be updated to explain their
                use.
              </p>
            </section>

            {/* Third Party Services */}
            <section className="privacy-block">
              <span className="privacy-section-label">07</span>

              <h2>Third-Party Services</h2>

              <p>
                Smart Tools may use third-party services to provide, operate,
                secure, or improve parts of the website.
              </p>

              <p>
                Examples may include website hosting, email delivery,
                analytics, security, or other infrastructure services.
              </p>

              <p>
                These third-party providers may process certain technical or
                user-provided information as necessary to provide their
                services. Their handling of information is governed by their
                respective privacy policies and terms.
              </p>
            </section>

            {/* Data Security */}
            <section className="privacy-block">
              <span className="privacy-section-label">08</span>

              <h2>Data Security</h2>

              <p>
                We take reasonable steps to protect information handled
                through the website. However, no website or method of
                electronic transmission can be guaranteed to be completely
                secure.
              </p>

              <p>
                For your protection, please avoid submitting passwords,
                financial account information, government identification
                numbers, or other highly sensitive information through the
                Contact Us form.
              </p>
            </section>

            {/* Data Retention */}
            <section className="privacy-block">
              <span className="privacy-section-label">09</span>

              <h2>Data Retention</h2>

              <p>
                Information submitted through the Contact Us form may be
                retained as reasonably necessary to respond to your request,
                maintain support records, address technical issues, or meet
                applicable legal or administrative requirements.
              </p>

              <p>
                Smart Tools does not provide users with a personal account or
                file-storage system through which uploaded files are retained
                as a user library.
              </p>
            </section>

            {/* Children's Privacy */}
            <section className="privacy-block">
              <span className="privacy-section-label">10</span>

              <h2>Children's Privacy</h2>

              <p>
                Smart Tools is not specifically directed toward children. We
                do not knowingly request personal information from children
                through the website.
              </p>

              <p>
                If you believe that a child has submitted personal information
                to us, please contact us so that the matter can be reviewed.
              </p>
            </section>

            {/* Changes */}
            <section className="privacy-block">
              <span className="privacy-section-label">11</span>

              <h2>Changes to This Privacy Policy</h2>

              <p>
                We may update this Privacy Policy from time to time to reflect
                changes to the website, services, technologies, or applicable
                requirements.
              </p>

              <p>
                When changes are made, the updated policy will be posted on
                this page and the "Last Updated" date will be revised.
              </p>
            </section>

            {/* Contact */}
            <section className="privacy-block privacy-contact-block">
              <span className="privacy-section-label">12</span>

              <h2>Contact Us</h2>

              <p>
                If you have questions, concerns, or requests regarding this
                Privacy Policy or the handling of information through Smart
                Tools, please contact us through our Contact Us page.
              </p>

              <a href="/contact" className="privacy-contact-button">
                Contact Smart Tools
              </a>
            </section>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="privacy-cta">
        <div className="container">
          <div className="privacy-cta-content">
            <h2>Use Smart Tools with confidence</h2>

            <p>
              Simple online tools for PDFs, images, documents, and
              spreadsheets.
            </p>

            <a href="/" className="privacy-cta-button">
              Explore All Tools
            </a>
          </div>
        </div>
      </section>
    </main>
  );
};

export default PrivacyPolicy;