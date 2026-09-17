function ToolFilter({ categories, activeCategory, onCategoryChange }) {

  return (
    <div className="tool-filter">

      {categories.map((category) => (

        <button
          key={category}
          className={`filter-button ${
            activeCategory === category ? "active" : ""
          }`}
          onClick={() => onCategoryChange(category)}
        >
          {category}
        </button>

      ))}

    </div>
  )
}

export default ToolFilter