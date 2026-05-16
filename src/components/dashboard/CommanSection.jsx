import { useMemo, useState } from "react";
import {
  FaThLarge,
  FaGamepad,
  FaHome,
  FaTools,
  FaTree,
  FaBasketballBall,
  FaPaw,
  FaMobileAlt,
  FaTshirt,
  FaPumpSoap,
  FaCar,
  FaBoxOpen,
  FaListUl,
  FaBolt,
  FaBath,
  FaWrench,
  FaTint,
  FaHardHat,
  FaHammer,
  FaRulerCombined,
} from "react-icons/fa";

const categoryConfig = [
  { name: "All Categories", icon: <FaThLarge /> },
  { name: "Toys & Hobbies", icon: <FaGamepad /> },
  { name: "Home & Garden", icon: <FaHome /> },
  { name: "Home Improvements & Tools", icon: <FaTools /> },
  { name: "Outdoors", icon: <FaTree /> },
  { name: "Sports & Fitness", icon: <FaBasketballBall /> },
  { name: "Pets", icon: <FaPaw /> },
  { name: "Electronics & Gadgets", icon: <FaMobileAlt /> },
  { name: "Clothing, Shoes & Jewelry", icon: <FaTshirt /> },
  { name: "Beauty & Personal Care", icon: <FaPumpSoap /> },
  { name: "Automotive & Motorcycle", icon: <FaCar /> },
  { name: "Other Category", icon: <FaBoxOpen /> },
];

const subfilterConfig = [
  { name: "Lighting & Ceiling Fans", icon: <FaBolt /> },
  { name: "Electrical equipment", icon: <FaBolt /> },
  { name: "Kitchen & Bath Fixtures", icon: <FaBath /> },
  { name: "Hardware", icon: <FaWrench /> },
  { name: "Plumbing", icon: <FaTint /> },
  { name: "Building supplies", icon: <FaHardHat /> },
  { name: "Power & Hand tools", icon: <FaHammer /> },
  { name: "Measuring & Layout Tools", icon: <FaRulerCombined /> },
  { name: "Wood Working", icon: <FaTools /> },
];

const categoryImages = {
  "Toys & Hobbies":
    "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1200&auto=format&fit=crop",
  "Home & Garden":
    "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?q=80&w=1200&auto=format&fit=crop",
  "Home Improvements & Tools":
    "https://images.unsplash.com/photo-1504148455328-c376907d081c?q=80&w=1200&auto=format&fit=crop",
  Outdoors:
    "https://images.unsplash.com/photo-1517821365201-7734f463f9dd?q=80&w=1200&auto=format&fit=crop",
  "Sports & Fitness":
    "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1200&auto=format&fit=crop",
  Pets: "https://images.unsplash.com/photo-1517849845537-4d257902454a?q=80&w=1200&auto=format&fit=crop",
  "Electronics & Gadgets":
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=1200&auto=format&fit=crop",
  "Clothing, Shoes & Jewelry":
    "https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=1200&auto=format&fit=crop",
  "Beauty & Personal Care":
    "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1200&auto=format&fit=crop",
  "Automotive & Motorcycle":
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200&auto=format&fit=crop",
  "Other Category":
    "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1200&auto=format&fit=crop",
};

const categoryToSubfilters = {
  "Toys & Hobbies": ["Hardware", "Measuring & Layout Tools"],
  "Home & Garden": ["Wood Working", "Lighting & Ceiling Fans"],
  "Home Improvements & Tools": [
    "Lighting & Ceiling Fans",
    "Electrical equipment",
    "Kitchen & Bath Fixtures",
    "Hardware",
    "Plumbing",
    "Building supplies",
    "Power & Hand tools",
    "Measuring & Layout Tools",
    "Wood Working",
  ],
  Outdoors: ["Hardware", "Building supplies"],
  "Sports & Fitness": ["Building supplies", "Hardware"],
  Pets: ["Hardware", "Kitchen & Bath Fixtures"],
  "Electronics & Gadgets": ["Electrical equipment", "Measuring & Layout Tools"],
  "Clothing, Shoes & Jewelry": ["Hardware"],
  "Beauty & Personal Care": ["Kitchen & Bath Fixtures"],
  "Automotive & Motorcycle": ["Electrical equipment", "Hardware"],
  "Other Category": ["Hardware"],
};

const suppliers = [
  "Amazon",
  "Well-Spring",
  "RV Accessories",
  "Jeff's Store",
  "Walmart",
  "Target",
  "Home Depot",
  "eBay",
  "AliExpress",
  "Pets Hub",
  "Outdoor Pro",
  "Fashion Store",
  "Beauty Plus",
  "Motor World",
  "Gadget Zone",
  "Tool House",
  "Garden Base",
  "Toy Planet",
  "FitCore",
  "Auto Gear",
];

const shipsFromOptions = ["USA", "China", "Germany", "UAE"];
const currencyOptions = ["USD"];
const shipsToOptions = ["United States"];

const baseTitles = {
  "Toys & Hobbies": [
    "Remote Control Car for Kids and Hobby Collectors",
    "Creative Puzzle Set for Family Indoor Play",
    "Building Blocks Toy Kit for Fun Learning",
    "Mini Drone Toy for Weekend Entertainment",
    "Board Game Set for Home Gatherings",
  ],
  "Home & Garden": [
    "Compact Garden Tool Set for Backyard Use",
    "Decorative Indoor Planter for Living Room",
    "Modern Watering Can for Home Plants",
    "Wooden Plant Stand for Balcony and Patio",
    "Outdoor Solar Lantern for Garden Decor",
  ],
  "Home Improvements & Tools": [
    "Portable LED Work Light for Workshop and Garage",
    "Cordless Electric Drill Set for Repair Work",
    "Heavy Duty Measuring Tape for Layout Tasks",
    "Modern Ceiling Lamp for Bedroom and Hallway",
    "Bathroom Wall Mounted Soap Dispenser",
  ],
  Outdoors: [
    "Camping Multi Tool for Travel and Hiking",
    "Portable Folding Chair for Outdoor Trips",
    "Insulated Water Bottle for Hiking and Trekking",
    "Compact Survival Kit for Campers",
    "Weather Resistant Camping Lamp",
  ],
  "Sports & Fitness": [
    "Resistance Bands Set for Daily Home Workouts",
    "Yoga Mat for Stretching and Core Training",
    "Adjustable Jump Rope for Cardio Sessions",
    "Foam Roller for Recovery and Mobility",
    "Training Cone Set for Agility Practice",
  ],
  Pets: [
    "Pet Grooming Brush Kit for Cats and Dogs",
    "Leak Proof Pet Water Bottle for Travel",
    "Comfort Pet Bed for Small Dogs and Cats",
    "Adjustable Pet Harness for Daily Walks",
    "Pet Food Storage Container for Home Use",
  ],
  "Electronics & Gadgets": [
    "Wireless Charger Stand for Desk Setup",
    "Portable Bluetooth Speaker for Indoor and Outdoor Use",
    "USB Desk Lamp with Adjustable Brightness",
    "Smartphone Tripod Stand for Videos",
    "Mini Power Bank for Daily Carry",
  ],
  "Clothing, Shoes & Jewelry": [
    "Casual Running Shoes for Daily Wear",
    "Minimal Leather Wallet for Men",
    "Classic Tote Bag for Everyday Use",
    "Lightweight Hoodie for Travel and Comfort",
    "Simple Bracelet Set for Casual Styling",
  ],
  "Beauty & Personal Care": [
    "Personal Care Organizer Tray for Bathroom Counter",
    "Makeup Brush Holder for Vanity Setup",
    "Skin Care Storage Box for Daily Essentials",
    "Hair Dryer Stand for Bathroom Use",
    "Travel Cosmetic Case for Organized Packing",
  ],
  "Automotive & Motorcycle": [
    "Car Interior Cleaning Brush Set for Dashboard Care",
    "Portable Tire Inflator for Emergency Use",
    "Magnetic Phone Mount for Car Dashboard",
    "Seat Gap Organizer for Daily Driving",
    "LED Car Vacuum Cleaner for Quick Cleanup",
  ],
  "Other Category": [
    "Multipurpose Storage Basket for Home and Office",
    "Foldable Utility Box for Easy Organization",
    "Compact Desktop Organizer for Work Setup",
    "Portable Cleaning Kit for Small Spaces",
    "Universal Household Holder for Daily Use",
  ],
};

const createProducts = () => {
  const categories = Object.keys(baseTitles);
  const products = [];

  for (let i = 0; i < 50; i++) {
    const category = categories[i % categories.length];
    const titles = baseTitles[category];
    const subfilters = categoryToSubfilters[category] || ["Hardware"];
    const supplier = suppliers[i % suppliers.length];
    const shipsFrom = shipsFromOptions[i % shipsFromOptions.length];
    const shippingDays = (i % 7) + 1;
    const priceValue = 12 + i * 3.15;
    const priceRange =
      priceValue <= 50
        ? "0-50"
        : priceValue <= 100
          ? "50-100"
          : priceValue <= 200
            ? "100-200"
            : "200+";

    products.push({
      id: i + 1,
      image: categoryImages[category],
      store: supplier,
      storeLink: "/",
      title: `${titles[i % titles.length]} ${i + 1}`,
      price: `$${priceValue.toFixed(2)}`,
      shipping: `${shippingDays} Business Days`,
      shippingDays,
      shipsTo: "United States",
      currency: "USD",
      shipsFrom,
      priceRange,
      supplier,
      category,
      subfilter: subfilters[i % subfilters.length],
    });
  }

  return products;
};

const allProducts = createProducts();

const CommanSection = () => {
  const [topSearch, setTopSearch] = useState("");
  const [mainSearch, setMainSearch] = useState("");
  const [shipsTo, setShipsTo] = useState("United States");
  const [currency, setCurrency] = useState("USD");
  const [shipsFrom, setShipsFrom] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [supplier, setSupplier] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [activeSubfilter, setActiveSubfilter] = useState("");
  const [activeTag, setActiveTag] = useState("");
  const [sortBy, setSortBy] = useState("relevance");
  const [showAll, setShowAll] = useState(false);

  const filteredProducts = useMemo(() => {
    let data = [...allProducts];

    const query = `${topSearch} ${mainSearch}`.trim().toLowerCase();

    if (query) {
      data = data.filter((item) =>
        `${item.title} ${item.store} ${item.supplier} ${item.category} ${item.subfilter} ${item.shipsFrom}`
          .toLowerCase()
          .includes(query),
      );
    }

    if (shipsTo) {
      data = data.filter((item) => item.shipsTo === shipsTo);
    }

    if (currency) {
      data = data.filter((item) => item.currency === currency);
    }

    if (shipsFrom) {
      data = data.filter((item) => item.shipsFrom === shipsFrom);
    }

    if (priceRange) {
      data = data.filter((item) => item.priceRange === priceRange);
    }

    if (supplier) {
      data = data.filter((item) => item.supplier === supplier);
    }

    if (activeCategory && activeCategory !== "All Categories") {
      data = data.filter((item) => item.category === activeCategory);
    }

    if (activeSubfilter) {
      data = data.filter((item) => item.subfilter === activeSubfilter);
    }

    if (activeTag === "Best Sellers") {
      data.sort((a, b) => a.id - b.id);
    }

    if (activeTag === "Fast Shipping") {
      data.sort((a, b) => a.shippingDays - b.shippingDays);
    }

    if (sortBy === "priceLowToHigh") {
      data.sort(
        (a, b) =>
          parseFloat(a.price.replace(/[^0-9.]/g, "")) -
          parseFloat(b.price.replace(/[^0-9.]/g, "")),
      );
    }

    if (sortBy === "priceHighToLow") {
      data.sort(
        (a, b) =>
          parseFloat(b.price.replace(/[^0-9.]/g, "")) -
          parseFloat(a.price.replace(/[^0-9.]/g, "")),
      );
    }

    if (sortBy === "shippingFast") {
      data.sort((a, b) => a.shippingDays - b.shippingDays);
    }

    return data;
  }, [
    topSearch,
    mainSearch,
    shipsTo,
    currency,
    shipsFrom,
    priceRange,
    supplier,
    activeCategory,
    activeSubfilter,
    activeTag,
    sortBy,
  ]);

  const visibleProducts = showAll
    ? filteredProducts
    : filteredProducts.slice(0, 8);

  const sectionTitle =
    activeTag === "Fast Shipping"
      ? "Fast Shipping"
      : activeTag === "Best Sellers"
        ? "Best Sellers"
        : "Products";

  return (
    <div className="marketplace-page">
      <div className="marketplace-topbar">
        <h1 className="marketplace-title">Marketplace</h1>

        <div className="marketplace-top-search">
          <input
            type="text"
            placeholder="Search anything"
            value={topSearch}
            onChange={(e) => {
              setTopSearch(e.target.value);
              setShowAll(false);
            }}
          />
        </div>
      </div>

      <div className="marketplace-search-row">
        <div className="marketplace-main-search">
          <input
            type="text"
            placeholder="Search by product title, supplier or product description..."
            value={mainSearch}
            onChange={(e) => {
              setMainSearch(e.target.value);
              setShowAll(false);
            }}
          />
        </div>

        <button className="marketplace-search-btn" type="button">
          Search
        </button>
      </div>

      <div className="marketplace-filters-row">
        <div className="filter-item">
          <label>Ships To</label>
          <select
            value={shipsTo}
            onChange={(e) => {
              setShipsTo(e.target.value);
              setShowAll(false);
            }}
          >
            {shipsToOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-item">
          <label>Currency</label>
          <select
            value={currency}
            onChange={(e) => {
              setCurrency(e.target.value);
              setShowAll(false);
            }}
          >
            {currencyOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-item">
          <label>Ships From</label>
          <select
            value={shipsFrom}
            onChange={(e) => {
              setShipsFrom(e.target.value);
              setShowAll(false);
            }}
          >
            <option value="">Select Ships From</option>
            {shipsFromOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-item">
          <label>Price Range</label>
          <select
            value={priceRange}
            onChange={(e) => {
              setPriceRange(e.target.value);
              setShowAll(false);
            }}
          >
            <option value="">Select Price Range</option>
            <option value="0-50">$0 - $50</option>
            <option value="50-100">$50 - $100</option>
            <option value="100-200">$100 - $200</option>
            <option value="200+">$200+</option>
          </select>
        </div>

        <div className="filter-item">
          <label>Supplier</label>
          <select
            value={supplier}
            onChange={(e) => {
              setSupplier(e.target.value);
              setShowAll(false);
            }}
          >
            <option value="">Select Supplier</option>
            {suppliers.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="marketplace-categories">
        {categoryConfig.map((category) => (
          <div
            key={category.name}
            className={`category-item ${activeCategory === category.name ? "active" : ""}`}
            onClick={() => {
              setActiveCategory(
                activeCategory === category.name ? "" : category.name,
              );
              setShowAll(false);
            }}
          >
            <div className="category-icon">{category.icon}</div>
            <span>{category.name}</span>
          </div>
        ))}
      </div>

      <div className="marketplace-subfilters-row">
        <div className="subfilter-tags">
          {subfilterConfig.map((item) => (
            <button
              key={item.name}
              type="button"
              className={activeSubfilter === item.name ? "active" : ""}
              onClick={() => {
                setActiveSubfilter(
                  activeSubfilter === item.name ? "" : item.name,
                );
                setShowAll(false);
              }}
            >
              <span className="subfilter-icon">{item.icon}</span>
              <span>{item.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="marketplace-toolbar">
        <div className="toolbar-left">
          <button
            className={`pill-btn ${activeTag === "Best Sellers" ? "active" : ""}`}
            type="button"
            onClick={() => {
              setActiveTag(activeTag === "Best Sellers" ? "" : "Best Sellers");
              setShowAll(false);
            }}
          >
            <FaListUl />
            <span>Best Sellers</span>
          </button>

          <button
            className={`pill-btn ${activeTag === "Fast Shipping" ? "active" : ""}`}
            type="button"
            onClick={() => {
              setActiveTag(
                activeTag === "Fast Shipping" ? "" : "Fast Shipping",
              );
              setShowAll(false);
            }}
          >
            <FaBolt />
            <span>Fast Shipping</span>
          </button>
        </div>

        <div className="toolbar-right">
          <span>Sort By:</span>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setShowAll(false);
            }}
          >
            <option value="relevance">By Relevance</option>
            <option value="priceLowToHigh">Price: Low to High</option>
            <option value="priceHighToLow">Price: High to Low</option>
            <option value="shippingFast">Fastest Shipping</option>
          </select>
        </div>
      </div>

      <div className="marketplace-section-head">
        <h2>{sectionTitle}</h2>

        {filteredProducts.length > 8 && (
          <button
            type="button"
            className="see-more-btn"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? "Show less" : "See more"}
          </button>
        )}
      </div>

      <div className="product-grid">
        {visibleProducts.length > 0 ? (
          visibleProducts.map((item) => (
            <div className="product-card" key={item.id}>
              <div className="product-image-wrap">
                <img src={item.image} alt={item.title} />
              </div>

              <a href={item.storeLink} className="product-store">
                {item.store}
              </a>

              <h3 className="product-title">{item.title}</h3>

              <div className="product-price">{item.price}</div>

              <div className="product-shipping">
                Shipping time: {item.shipping}
              </div>
            </div>
          ))
        ) : (
          <div className="no-products-found">No products found.</div>
        )}
      </div>
    </div>
  );
};

export default CommanSection;
