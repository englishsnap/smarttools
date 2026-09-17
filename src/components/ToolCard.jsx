import { useNavigate } from "react-router-dom"


function ToolCard({ tool }) {

  const navigate = useNavigate()

  const handleClick = () => {
    navigate(tool.path)
  }

  return (
    <div className="col-md-6 col-lg-4">

      <div className="tool-card h-100">

        <div className="tool-icon">
           {/* <img src={tool.image} /> */}
        </div>

        <h3 className="tool-title">
          {tool.name}
        </h3>

        <p className="tool-description">
          {tool.description}
        </p>

        <button
          className="tool-button"
          onClick={handleClick}
        >
          Open Tool
          <span>→</span>
        </button>

      </div>

    </div>
  )
}

export default ToolCard