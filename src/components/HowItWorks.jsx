import "./HowItWorks.css"

const steps = [
  {
    number: "01",
    title: "Choose a Tool",
    description:
      "Select the tool you need from our collection of PDF and image tools."
  },
  {
    number: "02",
    title: "Upload Your File",
    description:
      "Upload your document or image directly from your device."
  },
  {
    number: "03",
    title: "Get Your Result",
    description:
      "Let Smart Tools process your file and download the finished result."
  }
]

function HowItWorks(){
    return(

        <>
            <section className="how-it-works-section">

                <div className="container">

                    <div className="how-it-works-heading text-center">

                        <span className="how-it-works-badge">
                            HOW IT WORKS
                        </span>

                        <h2>
                            Get things done in three simple steps
                        </h2>

                        <p>
                            Smart Tools keeps file conversion and editing
                            simple from start to finish.
                        </p>
                    </div>

                    <div className="row g-4 mt-4">

                        {steps.map((step)=>(

                            <div className="col-12 col-md-4" key={step.number}>

                                <div className="how-step">

                                    <div className="how-step-number">
                                        {step.number}
                                    </div>

                                    <h3>
                                        {step.title}
                                    </h3>

                                    <p>
                                        {step.description}
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

export default HowItWorks