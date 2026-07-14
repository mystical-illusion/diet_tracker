import { useState, useEffect, useRef } from "react";

export default function FoodSearchBar({
  onSelect,
  placeholder = "Search foods…",
}) {
  const [query, setQuery] = useState("");
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef();

  // search with delay
  useEffect(() => {
    const t = setTimeout(async () => {
      if (query.length > 1) {
        setLoading(true);
        try {
          // search your nutrition endpoint
          const response = await fetch(
            `http://127.0.0.1:5001/nutrition/${query.toLowerCase()}`,
          );
          const data = await response.json();

          if (data.nutrition) {
            // found one food
            setFoods([
              {
                id: query,
                name: data.food,
                calories: data.nutrition.calories,
                protein: data.nutrition.protein,
                carbs: data.nutrition.carbs,
                fat: data.nutrition.fat,
              },
            ]);
          } else {
            setFoods([]);
          }
          setOpen(true);
        } catch {
          setFoods([]);
        }
        setLoading(false);
      } else {
        setOpen(false);
        setFoods([]);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  // close on outside click
  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleSelect = (food) => {
    onSelect(food);
    setQuery("");
    setOpen(false);
  };

  return (
    <div className="search-wrap" ref={ref}>
      <span className="search-icon">🔍</span>
      <input
        className="input search-input"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query.length > 1 && setOpen(true)}
      />
      {open && (
        <div className="dropdown">
          {loading && <div className="dropdown-empty">Searching…</div>}
          {!loading && foods.length === 0 && (
            <div className="dropdown-empty">No results for "{query}"</div>
          )}
          {foods.map((food) => (
            <button
              key={food.id}
              className="dropdown-item"
              onClick={() => handleSelect(food)}
            >
              <div className="dropdown-item-name">{food.name}</div>
              <div className="dropdown-item-meta">
                {food.calories} kcal · P {food.protein}g · C {food.carbs}g · F{" "}
                {food.fat}g per 100g
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
