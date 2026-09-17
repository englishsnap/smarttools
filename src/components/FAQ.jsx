import "./FAQ.css"

import faqs from "../data/faqs"

function FAQ(){
    return(
        <>
            <section className="faq-section">

                <div className="container">

                    {/* Section Heading */}

                    <div className="faq-heading text-center">

                        <span className="faq-badge">
                            FAQ
                        </span>

                        <h2>
                            Frequently Asked Questions
                        </h2>

                        <p>
                            Find answers to some common questions about Smart Tools.
                        </p>

                    </div>

                    {/* FAQ List */}

                    <div className="faq-list">

                        {faqs.map((faq, index)=>(

                            <div className="faq-item" key={index}>
                                <details>
                                    <summary>
                                        {faq.question}

                                        <span className="faq-icon">
                                            +
                                        </span>
                                    </summary>

                                    <div className="faq-answer">
                                        <p>
                                            {faq.answer}
                                        </p>
                                    </div>
                                </details>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </>
    )
}

export default FAQ