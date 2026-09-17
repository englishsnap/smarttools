import { useState } from "react"
import { useNavigate } from "react-router-dom"

import tools from "../data/tools"

import "./Hero.css"

function Hero() {

  const [activeCategory, setActiveCategory] = useState("All")

  const navigate = useNavigate()

  const categories = [
    "All",
    "Organize PDF",
    "Convert PDF",
    "Image Tools"
  ]

  const filteredTools =
    activeCategory === "All"
      ? tools
      : tools.filter(
          (tool) => tool.category === activeCategory
        )

  return (

    <>

      {/* Hero Section */}


  <main className="hero-page">

    <section className="hero-page-design">

      <div className="container">

        <div className="hero-page-content">
          
          <p className="section-eye-brow">
            FREE ONLINE TOOLS
          </p>

          <h1>
            Simple Tools
            <span> for Your Everyday Files</span>
          </h1>
        
          <p className="hero-page-description">
            Convert, organize, and manage your documents
            and images with easy-to-use online tools.
          </p>

        </div>
      </div>

    </section>
    
      {/* Tools Section */}

      <section className="tools-section">

        <div className="container">

          <div className="text-center">

            <h2>
              Our Tools
            </h2>

            <p>
              Choose a tool to get started.
            </p>

          </div>


          {/* Category Filter */}

          <div className="tool-filter">

            {categories.map((category) => (

              <button
                key={category}
                className={`filter-button ${
                  activeCategory === category
                    ? "active"
                    : ""
                }`}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>

            ))}

          </div>


          {/* Tool Cards */}

          <div className="row g-4 mt-3">

            {filteredTools.map((tool) => (

              <div
                className="col-md-6 col-lg-3"
                key={tool.id}
              >

                <div className="tool-card h-100">

                  {/* Tool Image */}

                  <div className="tool-image-container">

              
                      <img 
                        src={tool.image}
                        alt={tool.name}
                        className="tool-image"
                      />
                    
            
                  </div>



                  {/* Tool Information */}

                  <div className="tool-card-content">

                    <h3 className="tool-title">
                      {tool.name}
                    </h3>

                    <p className="tool-description">
                      {tool.description}
                    </p>

                    <button
                      className="tool-button"
                      onClick={() => navigate(tool.path)}
                    >
                      Open Tool
                      <span>→</span>
                    </button>

                  </div>

                </div>

              </div>

            ))}

          </div>

        </div>

      </section>

      </main>

    </>

  )
}

export default Hero