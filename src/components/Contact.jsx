import { useEffect, useState, useRef } from "react";
import emailjs from "@emailjs/browser";
import "./Contact.css";

const Contact = () => {
  const formRef = useRef();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [status, setStatus] = useState({
    type: "",
    message: "",
  });

  useEffect(() => {
    document.title = "Contact Smart Tools | Get in Touch";

    const description =
      "Contact Smart Tools with questions, feedback, suggestions, or issues related to our free online PDF, document, and image tools.";

    let meta = document.querySelector('meta[name="description"]');

    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }

    meta.setAttribute("content", description);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (status.message) {
      setStatus({
        type: "",
        message: "",
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    setStatus({
      type: "",
      message: "",
    });

    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.subject.trim() ||
      !formData.message.trim()
    ) {
      setStatus({
        type: "error",
        message: "Please complete all required fields.",
      });

      return;
    }

    setLoading(true);

    // Replace these values with your actual EmailJS credentials
    const SERVICE_ID = "service_d15zs0f";
    const TEMPLATE_ID = "template_88k06jp";
    const PUBLIC_KEY = "iBMj5zY17uprniZfI";

    emailjs
      .sendForm(SERVICE_ID, TEMPLATE_ID, formRef.current, PUBLIC_KEY)
      .then(
        (result) => {
          console.log("SUCCESS!", result.text);
          setStatus({
            type: "success",
            message: "Thank you for contacting Smart Tools. Your message has been sent successfully!",
          });
          setFormData({
            name: "",
            email: "",
            subject: "",
            message: "",
          });
          setLoading(false);
        },
        (error) => {
          console.log("FAILED...", error.text);
          setStatus({
            type: "error",
            message: "Failed to send your message. Please try again later.",
          });
          setLoading(false);
        }
      );
  };

  return (
    <main className="contact-page">
      {/* Hero */}
      <section className="hero-page-design">
        <div className="container">
          <div className="hero-page-content">
            <span className="section-eye-brow">
              GET IN TOUCH
            </span>

            <h1>Contact Us</h1>

            <p className="hero-page-description">
              Have a question, suggestion, or feedback about Smart Tools?
              We’d love to hear from you.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="contact-section">
        <div className="container">
          <div className="contact-grid">
            {/* Contact Information */}
            <div className="contact-info">
              <span className="contact-section-label">
                CONTACT SMART TOOLS
              </span>

              <h2>We’re here to help</h2>

              <p>
                Whether you have a question about one of our tools, found an
                issue, or have an idea that could make Smart Tools better,
                please send us a message.
              </p>

              <div className="contact-info-cards">
                <div className="contact-info-card">
                  <div className="contact-info-icon">✉</div>

                  <div>
                    <h3>Email Support</h3>

                    <p>
                      Send us your questions, feedback, or suggestions using
                      the contact form.
                    </p>
                  </div>
                </div>

                <div className="contact-info-card">
                  <div className="contact-info-icon">💡</div>

                  <div>
                    <h3>Suggestions</h3>

                    <p>
                      Have an idea for a new tool or feature? Let us know what
                      you would like to see.
                    </p>
                  </div>
                </div>

                <div className="contact-info-card">
                  <div className="contact-info-icon">🔧</div>

                  <div>
                    <h3>Report an Issue</h3>

                    <p>
                      If one of our tools is not working as expected, tell us
                      what happened so we can investigate it.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="contact-form-wrapper">
              <form ref={formRef} className="contact-form" onSubmit={handleSubmit}>
                <div className="contact-form-header">
                  <h2>Send us a message</h2>

                  <p>
                    Fill out the form below and provide as much useful
                    information as possible.
                  </p>
                </div>

                {status.message && (
                  <div
                    className={`contact-status ${
                      status.type === "success"
                        ? "contact-status-success"
                        : "contact-status-error"
                    }`}
                    role="alert"
                  >
                    {status.message}
                  </div>
                )}

                <div className="contact-form-row">
                  <div className="contact-form-group">
                    <label htmlFor="contact-name">
                      Name <span>*</span>
                    </label>

                    <input
                      id="contact-name"
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Your name"
                      maxLength={100}
                      required
                    />
                  </div>

                  <div className="contact-form-group">
                    <label htmlFor="contact-email">
                      Email <span>*</span>
                    </label>

                    <input
                      id="contact-email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      maxLength={150}
                      required
                    />
                  </div>
                </div>

                <div className="contact-form-group">
                  <label htmlFor="contact-subject">
                    Subject <span>*</span>
                  </label>

                  <input
                    id="contact-subject"
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="How can we help?"
                    maxLength={150}
                    required
                  />
                </div>

                <div className="contact-form-group">
                  <label htmlFor="contact-message">
                    Message <span>*</span>
                  </label>

                  <textarea
                    id="contact-message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Write your message here..."
                    rows="7"
                    maxLength={3000}
                    required
                  />
                </div>

                <button type="submit" className="contact-submit-button" disabled={loading}>
                  {loading ? "Sending..." : "Send Message"}
                </button>

                <p className="contact-form-note">
                  Please do not include passwords, payment information, or
                  other sensitive information in your message.
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Helpful Information */}
      <section className="contact-help-section">
        <div className="container">
          <div className="contact-content-header">
            <span className="contact-section-label">
              BEFORE YOU CONTACT US
            </span>

            <h2>Need help with a tool?</h2>

            <p>
              If you are contacting us about a tool, including the tool name,
              file type, and a short description of the problem can help us
              understand the issue more quickly.
            </p>
          </div>

          <div className="contact-help-grid">
            <div className="contact-help-card">
              <h3>Include the tool name</h3>

              <p>
                Tell us which Smart Tools feature you were using, such as
                Merge PDF, PDF to Word, or Image to Text.
              </p>
            </div>

            <div className="contact-help-card">
              <h3>Describe the issue</h3>

              <p>
                Explain what happened and, if possible, what you expected the
                tool to do.
              </p>
            </div>

            <div className="contact-help-card">
              <h3>Share useful details</h3>

              <p>
                Mention the file type or any error message you received when
                using the tool.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="contact-cta">
        <div className="container">
          <div className="contact-cta-content">
            <h2>Explore Smart Tools</h2>

            <p>
              Try our free online tools for PDFs, images, documents, and
              spreadsheets.
            </p>

            <a href="/" className="contact-cta-button">
              Explore All Tools
            </a>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Contact;