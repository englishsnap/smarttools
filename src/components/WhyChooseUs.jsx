import "./WhyChooseUs.css"

import features from "../data/features"

function WhyChooseUs(){
    return(
        <>
            <section className="why-choose-section">

                <div className="container">

                    {/* Section Heading */}

                    <div className="why-choose-heading text-center">

                        <span className="why-choose-badge">
                            WHY SMART TOOLS
                        </span>

                        <h2>
                            Everything you need, right in your browser.
                        </h2>

                        <p>
                            Simple online tools designed to help you work
                            with your everyday documents and images.
                        </p>
                    </div>

                    {/* Features */}

                    <div className="row g-4 mt-4">

                        {features.map((feature)=>(
                        <div className="col-12 col-sm-6 col-lg-3" key={feature.title}>
                            
                            <div className="why-card">

                                <div className="why-icon">
                                    {feature.icon}
                                </div>

                                <h3>
                                    {feature.title}
                                </h3>

                                <p>
                                    {feature.description}
                                </p>
                            </div>
                        </div>
                        ))}
                    </div>
                </div>
            </section>
        </>
    )
}

export default WhyChooseUs