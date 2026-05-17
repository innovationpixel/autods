import {
  LuClipboardList,
  LuFilePenLine,
  LuPackage2,
  LuPackagePlus,
  LuSlidersHorizontal,
  LuSparkles,
  LuUmbrella,
  LuX,
} from "react-icons/lu";
import PodProductCard from "../PodProductCard";
import { podCategoryFilters } from "../constants";

function PrintOnDemandContent({ activeCategory, onCategoryChange, products }) {
  return (
    <section className="pod-content">
      <div className="pod-hero">
        <div className="pod-hero__decor pod-hero__decor--tag">
          <LuFilePenLine />
        </div>
        <div className="pod-hero__decor pod-hero__decor--bottle">
          <LuPackage2 />
        </div>
        <div className="pod-hero__decor pod-hero__decor--swatches">
          <LuSparkles />
        </div>
        <div className="pod-hero__decor pod-hero__decor--paper">
          <LuClipboardList />
        </div>
        <div className="pod-hero__decor pod-hero__decor--box">
          <LuPackagePlus />
        </div>
        <div className="pod-hero__decor pod-hero__decor--drop">
          <LuUmbrella />
        </div>

        <div className="pod-hero__copy">
          <h2>Your Design Here</h2>
          <p>Start getting creative: Multiple print options are at your disposal</p>
        </div>

        <button type="button" className="pod-hero__close" aria-label="Close print on demand banner">
          <LuX />
        </button>
      </div>

      <div className="pod-filters" aria-label="Print on demand filters">
        {podCategoryFilters.map((category) => (
          <button
            type="button"
            key={category}
            className={`pod-filter-chip ${activeCategory === category ? "pod-filter-chip--active" : ""}`}
            onClick={() => onCategoryChange(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {products.length ? (
        <div className="pod-products-grid">
          {products.map((item) => (
            <PodProductCard item={item} key={item.id} />
          ))}
        </div>
      ) : (
        <div className="marketplace-products__empty">
          <LuSlidersHorizontal />
          <p>No print on demand products match the current filters.</p>
        </div>
      )}
    </section>
  );
}

export default PrintOnDemandContent;
