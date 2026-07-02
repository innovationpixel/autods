import { useEffect, useId, useRef, useState } from "react";
import { LuChevronDown, LuLoader } from "react-icons/lu";
import { getProductCategorySuggestions } from "../../services/ProductService";

function useDebouncedValue(value, delayMs = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

export default function DraftCategorySelect({
  listingId,
  categoryId,
  categoryName,
  searchSeed = "",
  onChange,
}) {
  const listboxId = useId();
  const rootRef = useRef(null);
  const searchRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  const debouncedSearch = useDebouncedValue(search, 300);
  const displayLabel = categoryName || "Select category";
  const hasCategory = Boolean(categoryName);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event) => {
      if (rootRef.current?.contains(event.target)) {
        return;
      }
      setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    searchRef.current?.focus();
    setSearch((current) => current || searchSeed || "");
  }, [open, searchSeed]);

  useEffect(() => {
    if (!open || !listingId) {
      return;
    }

    const query = debouncedSearch.trim() || searchSeed.trim();
    if (!query) {
      setSuggestions([]);
      setError("");
      return;
    }

    let cancelled = false;

    const loadSuggestions = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await getProductCategorySuggestions(listingId, query);
        if (cancelled) {
          return;
        }

        setSuggestions(response.data?.suggestions ?? []);
      } catch (err) {
        if (cancelled) {
          return;
        }

        setSuggestions([]);
        setError(err.response?.data?.error ?? "Could not load categories.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadSuggestions();

    return () => {
      cancelled = true;
    };
  }, [open, listingId, debouncedSearch, searchSeed]);

  const selectSuggestion = (suggestion) => {
    onChange({
      categoryId: suggestion.category_id,
      categoryName: suggestion.category_path || suggestion.category_name,
    });
    setOpen(false);
  };

  return (
    <div className="draft-category-select" ref={rootRef}>
      <button
        type="button"
        className={`draft-editor__select ${hasCategory ? "" : "draft-editor__select--placeholder"}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{displayLabel}</span>
        <LuChevronDown />
      </button>

      {open ? (
        <div className="draft-category-select__menu" id={listboxId} role="listbox">
          <input
            ref={searchRef}
            type="text"
            className="draft-category-select__search"
            placeholder="Search eBay categories..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          {loading ? (
            <div className="draft-category-select__status">
              <LuLoader />
              <span>Loading categories...</span>
            </div>
          ) : null}

          {!loading && error ? (
            <div className="draft-category-select__status draft-category-select__status--error">
              {error}
            </div>
          ) : null}

          {!loading && !error && suggestions.length === 0 ? (
            <div className="draft-category-select__status">
              No categories found. Try a different search.
            </div>
          ) : null}

          {!loading && !error
            ? suggestions.map((suggestion) => {
                const isSelected = String(suggestion.category_id) === String(categoryId);

                return (
                  <button
                    key={suggestion.category_id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={`draft-category-select__option ${isSelected ? "draft-category-select__option--selected" : ""}`}
                    onClick={() => selectSuggestion(suggestion)}
                  >
                    <strong>{suggestion.category_name}</strong>
                    {suggestion.category_path && suggestion.category_path !== suggestion.category_name ? (
                      <span>{suggestion.category_path}</span>
                    ) : null}
                  </button>
                );
              })
            : null}
        </div>
      ) : null}
    </div>
  );
}
