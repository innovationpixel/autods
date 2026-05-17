import { useEffect, useRef, useState } from "react";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import ProductCard from "./ProductCard";

function CarouselSection({ onSeeMore, section }) {
  const trackRef = useRef(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateNavState = () => {
    const element = trackRef.current;

    if (!element) {
      return;
    }

    const maxScroll = element.scrollWidth - element.clientWidth;

    setCanPrev(element.scrollLeft > 4);
    setCanNext(element.scrollLeft < maxScroll - 4);
  };

  useEffect(() => {
    if (!trackRef.current) {
      return;
    }

    trackRef.current.scrollTo({ left: 0, behavior: "auto" });
    updateNavState();
  }, [section.items.length, section.key]);

  const scrollTrack = (direction) => {
    const element = trackRef.current;

    if (!element) {
      return;
    }

    element.scrollBy({
      left: direction * (element.clientWidth * 0.88),
      behavior: "smooth",
    });

    window.setTimeout(updateNavState, 360);
  };

  return (
    <section className="marketplace-section">
      <div className="marketplace-section__head">
        <h2 className="marketplace-section__title">{section.title}</h2>
        <button
          type="button"
          className="marketplace-section__see-more"
          onClick={() => onSeeMore(section)}
        >
          See more
        </button>
      </div>

      <div className="marketplace-carousel">
        <button
          type="button"
          className={`marketplace-carousel__nav marketplace-carousel__nav--prev ${canPrev ? "" : "marketplace-carousel__nav--hidden"}`}
          onClick={() => scrollTrack(-1)}
          disabled={!canPrev}
          aria-label={`Scroll ${section.title} left`}
        >
          <LuChevronLeft />
        </button>

        <div ref={trackRef} className="marketplace-carousel__track" onScroll={updateNavState}>
          {section.items.map((item) => (
            <ProductCard item={item} key={item.id} />
          ))}
        </div>

        <button
          type="button"
          className={`marketplace-carousel__nav marketplace-carousel__nav--next ${canNext ? "" : "marketplace-carousel__nav--hidden"}`}
          onClick={() => scrollTrack(1)}
          disabled={!canNext}
          aria-label={`Scroll ${section.title} right`}
        >
          <LuChevronRight />
        </button>
      </div>
    </section>
  );
}

export default CarouselSection;
