import { NavLink } from "react-router-dom"
import "./ImageEditing.css"

function ImageEditing(){
    return(
        <>
            <section className="image-editing-section">

                <div className="container">

                    <div className="row align-items-center g-5">

                        {/* Image */}

                        <div className="col-lg-6">

                            <div className="image-editing-image">

                                <img
                                    src="/assets/image-editing_1.jpg"
                                    alt="Image editing tools"
                                />
                            </div>
                        </div>

                        {/* Content */}

                        <div className="col-lg-6">

                            <div className="image-editing-content">

                                <span className="image-editing-badge">
                                    IMAGE TOOLS
                                </span>

                                <h2>Image editing made simple with Smart Tools</h2>

                                <p>
                                    Work with your images quickly and easily using
                                    Smart Tools. Remove unwanted backgrounds, extract
                                    text from images, and handle everyday image tasks
                                    without complicated software.
                                </p>

                                <p>
                                    Our simple online tools are designed to help you
                                    get the job done directly from your browser.
                                </p>

                                <NavLink
                                    to="/background-remover"
                                    className="image-editing-button"
                                >
                                    Remove Background
                                    <span>→</span>
                                </NavLink>
                                
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}

export default ImageEditing