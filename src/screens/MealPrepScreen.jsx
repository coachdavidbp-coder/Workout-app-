import { useMemo, useState } from "react";
import { useStore, todayKey } from "../store.jsx";
import { RECIPES, findRecipes, dishGradient, recipeVideoEmbed, recipeVideoSearch } from "../data/recipes.js";
import { DIETS } from "../data/plan.js";
import { MEAL_SLOTS } from "../data/foods.js";
import BrandLogo from "../components/BrandLogo.jsx";
import { IconSearch, IconChevron } from "../components/icons.jsx";
import { haptic } from "../lib/fx.js";
import { toast } from "../lib/toast.js";

// Dish tile: a food emoji on a unique per-dish gradient. Deterministic and
// offline, so every card always matches its recipe.
function RecipeImg({ recipe, className }) {
  return (
    <div className={`recipe-img tile ${className || ""}`} style={dishGradient(recipe)}>
      <span>{recipe.emoji}</span>
    </div>
  );
}

export default function MealPrepScreen() {
  const { state, actions } = useStore();
  const userDiet = state.profile?.diet || "balanced";
  const favs = state.favRecipes || [];

  const [active, setActive] = useState(null);
  const [query, setQuery] = useState("");
  const [diet, setDiet] = useState(userDiet);
  const [ingMode, setIngMode] = useState(false);
  const [ingText, setIngText] = useState("");

  const results = useMemo(() => {
    if (ingMode) {
      const ingredients = ingText.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
      if (!ingredients.length) return [];
      return findRecipes({ diet, ingredients });
    }
    return findRecipes({ diet, query });
  }, [ingMode, ingText, diet, query]);

  if (active) {
    return <RecipeDetail recipe={active} onBack={() => setActive(null)} fav={favs.includes(active.id)} actions={actions} />;
  }

  const dietChips = [["all", "All"], [userDiet, DIETS[userDiet]?.name || "My diet"],
    ...Object.values(DIETS).filter((d) => d.id !== userDiet).map((d) => [d.id, d.name])];

  return (
    <div className="scroll">
      <header className="prep-head">
        <div className="brandrow"><BrandLogo height={24} /></div>
        <div className="h-title"><div className="kicker">Recipes</div><h1>Meal Prep</h1></div>

        <div className="prep-toggle">
          <button className={`week-pill ${!ingMode ? "on" : ""}`} onClick={() => setIngMode(false)}>Browse</button>
          <button className={`week-pill ${ingMode ? "on" : ""}`} onClick={() => setIngMode(true)}>What can I make?</button>
        </div>

        {!ingMode ? (
          <div className="prep-search">
            <span style={{ color: "var(--mu)" }}><IconSearch width="18" height="18" /></span>
            <input className="login-input" style={{ border: "none", background: "transparent", padding: "11px 6px" }}
              placeholder="Search recipes (e.g. chicken, salad)…" value={query} onChange={(e) => setQuery(e.target.value)} />
            {query && <button className="food-clear" onClick={() => setQuery("")} aria-label="Clear">×</button>}
          </div>
        ) : (
          <div className="prep-ing">
            <textarea className="login-input" rows={2} placeholder="List what you have — e.g. chicken, rice, broccoli"
              value={ingText} onChange={(e) => setIngText(e.target.value)} />
            <p className="summary-note" style={{ marginTop: 6 }}>We’ll match recipes you can make from those ingredients.</p>
          </div>
        )}

        <div className="prep-diets">
          {dietChips.map(([id, label]) => (
            <button key={id} className={`chip ${diet === id ? "on" : ""}`} onClick={() => { setDiet(id); haptic(); }}>{label}</button>
          ))}
        </div>
      </header>

      <main className="content">
        <div className="prep-count">{results.length} recipe{results.length === 1 ? "" : "s"}</div>
        <div className="recipe-grid">
          {results.map((r) => (
            <button key={r.id} className="recipe-card" onClick={() => { setActive(r); haptic(); }}>
              <RecipeImg recipe={r} className="card" />
              {favs.includes(r.id) && <span className="recipe-fav-dot">♥</span>}
              <div className="recipe-card-body">
                <div className="recipe-card-name">{r.name}</div>
                <div className="recipe-card-macros">
                  <span>{r.cal} kcal</span><span className="dot">·</span><span>{r.protein}g protein</span><span className="dot">·</span><span>{r.time} min</span>
                </div>
                <div className="recipe-card-tags">
                  {r.tags.slice(0, 2).map((t) => <span key={t} className="rtag">{t}</span>)}
                </div>
              </div>
            </button>
          ))}
          {results.length === 0 && (
            <div className="empty-hint" style={{ gridColumn: "1 / -1" }}>
              {ingMode ? "No matches yet — add a couple more ingredients." : "No recipes match. Try another word or diet."}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function RecipeDetail({ recipe, onBack, fav, actions }) {
  const [slot, setSlot] = useState("Lunch");
  const logMeal = () => {
    actions.addMeal(todayKey(), {
      name: recipe.name, cal: recipe.cal, p: recipe.protein, qty: 1, slot, unit: "1 serving",
    });
    haptic("success");
    toast({ emoji: "🍽️", title: "Logged to today", sub: `${recipe.name} · ${recipe.cal} kcal`, tone: "good" });
    onBack();
  };
  const watch = () => window.open(recipeVideoSearch(recipe), "_blank", "noopener");

  return (
    <div className="scroll recipe-detail">
      <div className="recipe-hero">
        <RecipeImg recipe={recipe} className="hero" />
        <button className="rd-back" onClick={onBack} aria-label="Back">‹</button>
        <button className={`rd-fav ${fav ? "on" : ""}`} onClick={() => { actions.toggleFavRecipe(recipe.id); haptic(); }} aria-label="Favorite">♥</button>
      </div>

      <main className="content">
        <h1 className="rd-title">{recipe.name}</h1>
        <div className="rd-tags">
          {recipe.tags.map((t) => <span key={t} className="rtag">{t}</span>)}
        </div>

        <div className="rd-macros">
          <div className="rd-macro"><div className="k">{recipe.cal}</div><div className="l">Kcal</div></div>
          <div className="rd-macro"><div className="k">{recipe.protein}g</div><div className="l">Protein</div></div>
          <div className="rd-macro"><div className="k">{recipe.fat}g</div><div className="l">Fat</div></div>
          <div className="rd-macro"><div className="k">{recipe.carbs}g</div><div className="l">Carbs</div></div>
        </div>

        <div className="rd-time">🕐 Cooking time: <b>{recipe.time} min</b></div>

        <div className="section-label" style={{ marginTop: 18 }}>Ingredients</div>
        <ul className="rd-list">
          {recipe.ingredients.map((i, k) => <li key={k}>{i}</li>)}
        </ul>

        <div className="section-label" style={{ marginTop: 18 }}>Steps</div>
        <ol className="rd-steps">
          {recipe.steps.map((s, k) => <li key={k}>{s}</li>)}
        </ol>

        <div className="section-label" style={{ marginTop: 18 }}>How-to video</div>
        <div className="video-wrap">
          <iframe
            src={recipeVideoEmbed(recipe)}
            title={`${recipe.name} how-to`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <button className="btn btn-block rd-watch" onClick={watch}>▶ More videos on YouTube</button>

        <div className="section-label" style={{ marginTop: 18 }}>Add to</div>
        <div className="row gap-2" style={{ flexWrap: "wrap" }}>
          {MEAL_SLOTS.map((s) => (
            <button key={s} className={`week-pill ${slot === s ? "on" : ""}`} onClick={() => setSlot(s)}>{s}</button>
          ))}
        </div>

        <button className="btn btn-primary btn-block" style={{ margin: "16px 0 8px" }} onClick={logMeal}>Log Meal</button>
      </main>
    </div>
  );
}
