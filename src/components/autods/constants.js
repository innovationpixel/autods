import { FaTiktok } from "react-icons/fa6";
import {
  LuBadgeCheck,
  LuBell,
  LuBox,
  LuBriefcaseBusiness,
  LuCar,
  LuChartLine,
  LuChevronDown,
  LuClipboardList,
  LuClock3,
  LuDribbble,
  LuExternalLink,
  LuFilePenLine,
  LuGauge,
  LuGamepad2,
  LuHeadphones,
  LuHouse,
  LuInbox,
  LuMegaphone,
  LuMenu,
  LuMessageCircleMore,
  LuPackage2,
  LuPackagePlus,
  LuPackageSearch,
  LuPawPrint,
  LuPencil,
  LuPlus,
  LuRefreshCcw,
  LuSearch,
  LuSettings2,
  LuShirt,
  LuShoppingCart,
  LuSparkles,
  LuStore,
  LuTabletSmartphone,
  LuTrash2,
  LuTruck,
  LuUmbrella,
  LuUserRound,
  LuWalletCards,
  LuWrench,
  LuX,
  LuZap,
} from "react-icons/lu";

export const sidebarGroups = [
  [
    {
      label: "Marketplace",
      icon: LuStore,
      active: true,
      children: [
        { label: "Hand-Picked Products", icon: LuBadgeCheck },
        { label: "Ads Spy", icon: LuMegaphone },
        { label: "Trending Products", icon: LuChartLine },
        { label: "TikTok Analytics", icon: FaTiktok, badge: "NEW" },
      ],
    },
    { label: "Print On Demand", icon: LuShirt },
  ],
  [
    { label: "Dashboard", icon: LuGauge, marker: "#f6c6c4" },
    { label: "Orders", icon: LuClipboardList },
    { label: "Sourcing Request", icon: LuPackageSearch, marker: "#f1b45c" },
    { label: "Products", icon: LuPackage2, marker: "#9ad2c0" },
    { label: "Drafts", icon: LuFilePenLine },
    { label: "Customer Support", icon: LuHeadphones },
    { label: "Settings", icon: LuSettings2 },
  ],
];

export const filterPills = [
  { label: "Best Sellers", icon: LuMenu },
  { label: "Fast Shipping", icon: LuTruck },
];

export const addProductsMenuItems = [
  {
    id: "single-product",
    icon: LuBox,
    title: "Single Product",
    description: "Import one product to one store",
    action: "open-add-product-modal",
  },
  {
    id: "multiple-products",
    icon: LuPackagePlus,
    title: "Multiple Products / Stores",
    description: "Import multiple products together",
    action: "open-multiple-products-modal",
  },
  {
    id: "hand-picked-products",
    icon: LuBadgeCheck,
    title: "Hand-Picked Products",
    description: "Verified bestsellers to add to your store",
  },
  {
    id: "autods-finder",
    icon: LuSearch,
    title: "AutoDS Finder",
    description: "Use our top sellers database to import",
  },
];

export const storeSwitcherItems = [
  {
    id: "store-sheikh002-au",
    name: "sheikh002-au",
    sidebarName: "Sheikh002-Au",
    initials: "SO",
    country: "AU",
    marketplace: "eBay",
    orders: 765,
    products: 32,
    stockLimit: "44",
    priceLimit: "$12.6K",
    connection: "API",
  },
  {
    id: "store-nrf-enterprise",
    name: "nrf_enterprise_inc-llc-au",
    sidebarName: "nrf_enterprise_inc...",
    initials: "NE",
    country: "AU",
    marketplace: "eBay",
    orders: 1432,
    products: 3,
    stockLimit: "2.7K",
    priceLimit: "$113.7K",
    connection: "API",
  },
];

export const storeSwitcherMenuItems = [
  { id: "rename", label: "Rename", icon: LuPencil },
  { id: "copy-token", label: "Copy AutoDS Token", icon: LuClipboardList },
  { id: "renew-token", label: "Renew Token", icon: LuRefreshCcw },
  { id: "watermark", label: "Set Store Watermark", icon: LuBadgeCheck },
  { id: "settings", label: "Settings", icon: LuSettings2 },
  { id: "resync", label: "Resync Store", icon: LuStore },
  { id: "convert", label: "Convert to NON-API (MIP)", icon: LuZap },
  { id: "delete", label: "Delete", icon: LuTrash2 },
];

export const multipleProductsTabs = [
  { id: "urls", label: "URL's or ID's" },
  { id: "csv", label: "Upload CSV" },
  { id: "finder", label: "AutoDS Finder" },
];

export const finderPlans = [
  { id: "basic", label: "Basic", sales: "3 sales/mo", credits: 1, icon: LuBadgeCheck },
  { id: "popular", label: "Popular", sales: "5 sales/mo", credits: 2, icon: LuSparkles },
  { id: "best-sellers", label: "Best Sellers", sales: "8 sales/mo", credits: 4, icon: LuPackageSearch },
];

export const categoryFilters = [
  { key: "all", label: "All Categories", icon: LuShoppingCart },
  { key: "toys-hobbies", label: "Toys & Hobbies", icon: LuGamepad2 },
  { key: "home-garden", label: "Home & Garden", icon: LuHouse },
  {
    key: "home-improvements-tools",
    label: "Home Improvements & Tools",
    icon: LuWrench,
  },
  { key: "outdoors", label: "Outdoors", icon: LuUmbrella },
  { key: "sports-fitness", label: "Sports & Fitness", icon: LuDribbble },
  { key: "pets", label: "Pets", icon: LuPawPrint },
  {
    key: "electronics-gadgets",
    label: "Electronics & Gadgets",
    icon: LuTabletSmartphone,
  },
  {
    key: "clothing-shoes-jewelry",
    label: "Clothing, Shoes & Jewelry",
    icon: LuShirt,
  },
  {
    key: "beauty-personal-care",
    label: "Beauty & Personal Care",
    icon: LuBriefcaseBusiness,
  },
  {
    key: "automotive-motorcycle",
    label: "Automotive & Motorcycle",
    icon: LuCar,
  },
  { key: "other-category", label: "Other Category", icon: LuBox },
];

export const subfilterOptions = {
  Outdoors: ["Camping", "Climbing & Hiking", "Cycling"],
  "Toys & Hobbies": ["Kids Toys", "Games", "RC Toys"],
  "Home & Garden": ["Decor", "Garden", "Storage"],
  "Home Improvements & Tools": ["Hardware", "Power Tools", "Lighting"],
  "Sports & Fitness": ["Fitness", "Outdoor Sports", "Training"],
  Pets: ["Dogs", "Cats", "Pet Travel"],
  "Electronics & Gadgets": ["Chargers", "Audio", "Smart Devices"],
  "Clothing, Shoes & Jewelry": ["Clothing", "Shoes", "Accessories"],
  "Beauty & Personal Care": ["Nails", "Makeup", "Skin Care"],
  "Automotive & Motorcycle": ["Car Accessories", "Motorcycle", "Lighting"],
  "Other Category": ["General", "Supplies", "Storage"],
};

export const filterOptions = {
  shipsTo: ["United States", "Canada", "United Kingdom", "Australia"],
  currency: ["USD", "EUR", "GBP"],
  shipsFrom: ["Select Ships From", "United States", "China", "Germany", "Spain"],
  priceRange: [
    "Select Price Range",
    "$0 - $25",
    "$25 - $50",
    "$50 - $100",
    "$100+",
  ],
  supplier: [
    "Select Supplier",
    "Amazon",
    "Funky Junque",
    "JoymozeDirect",
    "FINDCOZY DIRECT",
    "BeautyLadyNailArt Store",
    "VENALISA & CANNI Official Store",
    "PlayKids World",
    "Happy Hopper",
    "Battle Joy",
    "FChiX",
    "Surplus World Inc.",
    "Shop103181382 Store",
    "CJ",
  ],
  sortBy: ["By Relevance", "Newest", "Fastest Shipping", "Lowest Price"],
};

export const podCategoryFilters = [
  "All Products",
  "Printed Apparel",
  "Full Printed Apparel",
  "Accessories",
  "Decoration",
  "Footwear",
  "Home & Living",
  "Printed in EU",
];

export const podProducts = [
  {
    id: "pod-1",
    title: "Unisex V-Neck T-Shirt | Bella + Canvas 3005 (US)",
    price: "$12.25-16.50",
    category: "Printed Apparel",
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: "pod-2",
    title: "Unisex Long Sleeve | Gildan 2400",
    price: "$11.50-14.50",
    category: "Printed Apparel",
    image:
      "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: "pod-3",
    title: "Unisex T-Shirt | Bella + Canvas 3001",
    price: "$9.75-12.75",
    category: "Printed Apparel",
    image:
      "https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: "pod-4",
    title: "Kid's Hoodie | Gildan 18500B",
    price: "$17-17",
    category: "Printed Apparel",
    image:
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: "pod-5",
    title: "Kids T-Shirt | Gildan 5000B",
    price: "$8.25-10.25",
    category: "Printed Apparel",
    image:
      "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: "pod-6",
    title: "Unisex Tank Top | Bella + Canvas 3480",
    price: "$10.25-13.50",
    category: "Printed Apparel",
    image:
      "https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: "pod-7",
    title: "AOP Unisex Hawaiian Shirt",
    price: "$14-14",
    category: "Full Printed Apparel",
    image:
      "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1000&q=80",
    advanced: true,
  },
  {
    id: "pod-8",
    title: "AOP Unisex Sweater",
    price: "$23-23",
    category: "Full Printed Apparel",
    image:
      "https://images.unsplash.com/photo-1618354691438-25bc04584c23?auto=format&fit=crop&w=1000&q=80",
    advanced: true,
  },
  {
    id: "pod-9",
    title: "Aluminum Ornament - Round",
    price: "$3.75-3.75",
    category: "Decoration",
    image:
      "https://images.unsplash.com/photo-1543589077-47d81606c1bf?auto=format&fit=crop&w=1000&q=80",
    advanced: true,
  },
  {
    id: "pod-10",
    title: "Poster - Portrait 2:3 (US)",
    price: "$4.50-6",
    category: "Decoration",
    image:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1000&q=80",
    advanced: true,
  },
  {
    id: "pod-11",
    title: "Poster - Square",
    price: "$5.25-5.25",
    category: "Decoration",
    image:
      "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1000&q=80",
    advanced: true,
  },
  {
    id: "pod-12",
    title: "Poster - Landscape 3:2 (US)",
    price: "$4.50-6",
    category: "Decoration",
    image:
      "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1000&q=80",
    advanced: true,
  },
  {
    id: "pod-13",
    title: "Canvas Tote Bag",
    price: "$8.50-12.00",
    category: "Accessories",
    image:
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: "pod-14",
    title: "Printed Sneakers",
    price: "$22.00-29.00",
    category: "Footwear",
    image:
      "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: "pod-15",
    title: "Throw Pillow",
    price: "$12.00-18.00",
    category: "Home & Living",
    image:
      "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: "pod-16",
    title: "EU Organic Cotton T-Shirt",
    price: "$13.25-17.25",
    category: "Printed in EU",
    image:
      "https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=1000&q=80",
  },
];

export const dashboardDateOptions = [
  "2026-04-14",
  "2026-04-15",
  "2026-04-16",
  "2026-04-17",
  "2026-04-18",
  "2026-04-19",
  "2026-04-20",
  "2026-04-21",
  "2026-04-22",
  "2026-04-23",
];

export const dashboardStatCards = [
  {
    label: "Profit",
    value: "$0",
    icon: LuChartLine,
    tone: "mint",
  },
  {
    label: "Orders",
    value: "0",
    icon: LuClipboardList,
    tone: "amber",
  },
  {
    label: "Total Revenue",
    value: "$0",
    icon: LuWalletCards,
    tone: "peach",
  },
  {
    label: "New Products",
    value: "0",
    icon: LuPackagePlus,
    tone: "green",
  },
];

export const dashboardOverviewRows = [
  { label: "Average Profit", value: "$0" },
  { label: "Average Sell Order Cost", value: "$0" },
  { label: "Average Buy Order Cost", value: "$0" },
  { label: "Max Profit On Order", value: "$0" },
  { label: "Total Products Cost", value: "$0" },
];

export const dashboardTopProducts = [
  {
    id: "dash-top-1",
    title: "Leather Mini Coin Purse Handmade Key Case Zipper Small Wallet Short Handbag",
    sold: "1 sold",
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&q=80",
    sparkline: [1, 1, 1, 6, 1, 1, 1],
  },
  {
    id: "dash-top-2",
    title: "Silicone Treated Gun Sleeve Shotgun/Rifle Sock Shooting Cover Green Gray",
    sold: "1 sold",
    image:
      "https://images.unsplash.com/photo-1606925797300-0b35e9d1794e?auto=format&fit=crop&w=300&q=80",
    sparkline: [1, 1, 5, 1, 1, 1, 1],
  },
  {
    id: "dash-top-3",
    title: "Fashion Electronic Watch Waterproof Digital Sport Watch Women Men",
    sold: "1 sold",
    image:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=300&q=80",
    sparkline: [1, 1, 4, 1, 1, 1, 1],
  },
  {
    id: "dash-top-4",
    title: "Self-Adhesive Temporary Pleated Blinds Blackout Bathroom Curtains Windows Shade",
    sold: "1 sold",
    image:
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=300&q=80",
    sparkline: [1, 1, 1, 5, 1, 1, 1],
  },
  {
    id: "dash-top-5",
    title: "USB Data Charger Cable for Apple iPhone 4S 4 3GS iPod Touch iPad 1 2 3 Sync Cord",
    sold: "1 sold",
    image:
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=300&q=80",
    sparkline: [1, 1, 1, 1, 1, 5, 1],
  },
];

export const orderStatusOptions = ["Pending", "Ordered", "Shipped", "Delivered", "Canceled"];

export const profileMenuItems = [
  { label: "AutoDS Academy", icon: LuBadgeCheck },
  { label: "Support Center", icon: LuInbox },
  { label: "Refer a Friend", icon: LuUserRound, muted: true },
  { label: "AutoDS Wallet", icon: LuWalletCards, muted: true },
  { label: "Log out", icon: LuExternalLink, muted: true },
];

export const headerNotifications = [
  {
    id: "wallet-pending",
    title: "AutoDS Wallet setup pending",
    message: "Connect your Payoneer account to activate wallet payouts.",
    time: "Just now",
  },
  {
    id: "drafts-ready",
    title: "Draft upload retry completed",
    message: "2 draft products are ready to review before publishing.",
    time: "18 min ago",
  },
  {
    id: "support-reply",
    title: "New customer support reply",
    message: "A buyer replied to your eBay support conversation.",
    time: "1 hour ago",
  },
  {
    id: "orders-alert",
    title: "Orders automation needs attention",
    message: "One order could not be synced because the buyer address is incomplete.",
    time: "2 hours ago",
  },
  {
    id: "products-imported",
    title: "Products imported successfully",
    message: "4 marketplace products finished importing and are waiting for review.",
    time: "Today",
  },
  {
    id: "billing-reminder",
    title: "Billing reminder",
    message: "Your payment method needs an update before the next subscription renewal.",
    time: "Yesterday",
  },
];
export const NOTIFICATION_PREVIEW_LIMIT = 4;

export const whatsNewItems = [
  {
    id: "may-products",
    label: "NEW VIDEO",
    date: "April 21, 2026",
    title: "Top 10 Dropshipping Products To Sell In May 2026 ($3K/Week!)",
    copy: [
      "Stop guessing what to sell. These are the Top 10 products for May 2026 with price, cost, and how to market each one.",
      "Pick smarter. Sell faster.",
      "Watch now!",
    ],
    image:
      "https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&w=640&q=80",
    linkLabel: "Watch It On YouTube",
  },
  {
    id: "ai-business",
    label: "NEW VIDEO",
    date: "April 20, 2026",
    title: "5 AI Business Ideas To Start In 2026",
    copy: [
      "You don't need more ideas. You need the right ones. These 5 AI side hustles can actually make money fast.",
      "Pick one. Start now!",
    ],
    image:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=640&q=80",
    linkLabel: "Watch It On YouTube",
  },
  {
    id: "wallet-update",
    label: "UPDATE",
    date: "April 18, 2026",
    title: "AutoDS Wallet: Faster payouts and cleaner fee tracking",
    copy: [
      "A smoother wallet experience is now available with clearer payout details and better transaction visibility.",
      "Review your wallet today.",
    ],
    image:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=640&q=80",
    linkLabel: "Read More",
  },
];

export const loadBalanceAmounts = [15, 50, 100, 200, 500, 1000];

export const aiCreditPackages = [
  { id: "1000", credits: "1000 Credits", price: "$0.20/10 credits" },
  { id: "5000", credits: "5000 Credits", price: "$0.06/10 credits", badge: "Most Popular" },
  { id: "10000", credits: "10000 Credits", price: "$0.05/10 credits" },
  { id: "20000", credits: "20000 Credits", price: "$0.04/10 credits" },
];

export const orderRowsSeed = [
  {
    title: "Cushion Bicycle Rear Seat Bicycle Back Seat Bicycl...",
    color: "Color: Rear Seat-Black",
    image:
      "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=240&q=80",
    date: "2026-04-21",
    buyer: "littlebee_mon",
    itemBuy: "397685144819",
    itemSell: "406862734994",
    price: "A$6.09",
  },
  {
    title: "First Aid Pouch Bag Emergency Holiday...",
    color: "Color: Grey",
    image:
      "https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=240&q=80",
    date: "2026-04-21",
    buyer: "caisson47",
    itemBuy: "397197063801",
    itemSell: "406862736574",
    price: "A$8.59",
  },
  {
    title: "Mix Colour 20Pcs Plastic Darning Threading...",
    color: "Size: Mix 7Cm And 9Cm,...",
    image:
      "https://images.unsplash.com/photo-1582735689369-4fe89db7114c?auto=format&fit=crop&w=240&q=80",
    date: "2026-04-20",
    buyer: "studee80",
    itemBuy: "397051900599",
    itemSell: "406863453847",
    price: "A$6.99",
  },
  {
    title: "Professional Kazoo with Adjustable Tone and Fo...",
    color: "Color: Black",
    image:
      "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=240&q=80",
    date: "2026-04-20",
    buyer: "sekonet-0",
    itemBuy: "397733638169",
    itemSell: "406862812044",
    price: "A$8.79",
  },
  {
    title: "Edison Bulb Holder E27 for Lamp or Pendant...",
    color: "Color: No.4 E27, Base Type...",
    image:
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=240&q=80",
    date: "2026-04-20",
    buyer: "b1gfella",
    itemBuy: "397486850637",
    itemSell: "406862734298",
    price: "A$4.99",
  },
  {
    title: "1X Kids Extendable Butterfly Catcher...",
    color: "Color: Purple",
    image:
      "https://images.unsplash.com/photo-1465156799763-2c087c332922?auto=format&fit=crop&w=240&q=80",
    date: "2026-04-20",
    buyer: "ikslow",
    itemBuy: "397111399925",
    itemSell: "406862734971",
    price: "A$9.99",
  },
  {
    title: "Women's Fashion Black Steel Band Quartz Dress...",
    color: "Color: Black, Is Customized: No",
    image:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=240&q=80",
    date: "2026-04-20",
    buyer: "craftychrisknits",
    itemBuy: "397665799502",
    itemSell: "406862761778",
    price: "A$14.79",
  },
  {
    title: "Silicone Rubber Watch Strap Band Keeper Hold...",
    color: "Band Color: 4Pcs White, Band...",
    image:
      "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&w=240&q=80",
    date: "2026-04-20",
    buyer: "nicol_rumme",
    itemBuy: "397380840853",
    itemSell: "406860607274",
    price: "A$14.89",
  },
  {
    title: "Portable Soft Body Powder Puff W/Box Cas...",
    color: "Style: Pink",
    image:
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=240&q=80",
    date: "2026-04-19",
    buyer: "rw6067",
    itemBuy: "397782546015",
    itemSell: "406862773456",
    price: "A$12.39",
  },
  {
    title: "12V Boost Step up...",
    color: "Color: 9V",
    image:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=240&q=80",
    date: "2026-04-19",
    buyer: "madgyer",
    itemBuy: "397218645871",
    itemSell: "406860637729",
    price: "A$9.99",
  },
  {
    title: "10/20Pcs Stainless Steel Pendant Pinch Clip Bail...",
    color: "Gold 20Pcs, Size:...",
    image:
      "https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=240&q=80",
    date: "2026-04-18",
    buyer: "girlinthegarage.store",
    itemBuy: "397193093240",
    itemSell: "406862773052",
    price: "A$6.09",
  },
  {
    title: "10/20Pcs Stainless Steel Pendant Pinch Clip Bail...",
    color: "Color: Silver 20Pcs, Size:...",
    image:
      "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=240&q=80",
    date: "2026-04-18",
    buyer: "girlinthegarage.store",
    itemBuy: "397193093240",
    itemSell: "406862773052",
    price: "A$8.59",
  },
  {
    title: "Self-Adhesive Temporary Pleated Blinds Blackout...",
    color: "Color: White, Size: S-...",
    image:
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=240&q=80",
    date: "2026-04-18",
    buyer: "ensi-star",
    itemBuy: "397401187312",
    itemSell: "406862746472",
    price: "A$12.49",
  },
  {
    title: "Crystal Moon Suncatcher Hanging Catcher...",
    color: "Color: A 882",
    image:
      "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=240&q=80",
    date: "2026-04-18",
    buyer: "tatamh_foyufqea7",
    itemBuy: "397160391245",
    itemSell: "406862736464",
    price: "A$8.79",
  },
  {
    title: "Pineapple Eye Remover Stainless Steel Fruit Cor...",
    color: "Color: Silver",
    image:
      "https://images.unsplash.com/photo-1550258987-190a2d41a8ba?auto=format&fit=crop&w=240&q=80",
    date: "2026-04-18",
    buyer: "onedayat-44",
    itemBuy: "397658934193",
    itemSell: "406862761730",
    price: "A$4.99",
  },
  {
    title: "10PCS Bicycle Tube Glueless Patch Kit Bike...",
    color: "Color: 30Pcs- (2.9Cm)",
    image:
      "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=240&q=80",
    date: "2026-04-18",
    buyer: "jay751",
    itemBuy: "397414518981",
    itemSell: "406862761993",
    price: "A$9.99",
  },
  {
    title: "Kayak Paddle Leash Adjustable Elastic Coile...",
    color: "Color: 2Pcs Orange",
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=240&q=80",
    date: "2026-04-18",
    buyer: "prorapid08",
    itemBuy: "397591350882",
    itemSell: "406862737818",
    price: "A$14.79",
  },
  {
    title: "Kayak Paddle Leash Adjustable Elastic Coile...",
    color: "Color: 2Pcs Blue",
    image:
      "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=240&q=80",
    date: "2026-04-18",
    buyer: "prorapid08",
    itemBuy: "397591350882",
    itemSell: "406862737818",
    price: "A$14.89",
  },
  {
    title: "Magnetic Mini Box Cutter Portable Paper Cutter...",
    color: "Color: 3Pcs Mini Knives",
    image:
      "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=240&q=80",
    date: "2026-04-17",
    buyer: "jamshid2011-2013",
    itemBuy: "397118191643",
    itemSell: "406862811386",
    price: "A$12.39",
  },
  {
    title: "USB Data Charger Cable for Apple iPhone 4S 4...",
    color: "Color: Silver, Cable Length:...",
    image:
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=240&q=80",
    date: "2026-04-17",
    buyer: "livadia1916",
    itemBuy: "397114729502",
    itemSell: "406862761448",
    price: "A$9.99",
  },
  {
    title: "Travel Jewelry Pouch Portable Organizer Roll...",
    color: "Color: Beige",
    image:
      "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&w=240&q=80",
    date: "2026-04-17",
    buyer: "andstyle.au",
    itemBuy: "397118191120",
    itemSell: "406862811004",
    price: "A$11.49",
  },
  {
    title: "Mini Hair Clips Acrylic Colorful Daily Style...",
    color: "Color: Candy Mix",
    image:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=240&q=80",
    date: "2026-04-17",
    buyer: "melrose.au",
    itemBuy: "397118191188",
    itemSell: "406862811067",
    price: "A$7.49",
  },
  {
    title: "Kids Rainbow Sticker Roll Reward Labels...",
    color: "Color: Rainbow",
    image:
      "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?auto=format&fit=crop&w=240&q=80",
    date: "2026-04-17",
    buyer: "paperjoys",
    itemBuy: "397118191255",
    itemSell: "406862811121",
    price: "A$5.99",
  },
  {
    title: "LED Solar Path Lamp Warm Garden Light...",
    color: "Color: Warm White",
    image:
      "https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=240&q=80",
    date: "2026-04-17",
    buyer: "outdoorlane",
    itemBuy: "397118191288",
    itemSell: "406862811155",
    price: "A$13.99",
  },
  {
    title: "Foldable Makeup Mirror Travel Cosmetic Desk...",
    color: "Color: White",
    image:
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=240&q=80",
    date: "2026-04-17",
    buyer: "makeupnest",
    itemBuy: "397118191325",
    itemSell: "406862811189",
    price: "A$10.99",
  },
  {
    title: "Pet Travel Water Bottle Portable Leakproof...",
    color: "Color: Green",
    image:
      "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=240&q=80",
    date: "2026-04-17",
    buyer: "wagandwalk",
    itemBuy: "397118191354",
    itemSell: "406862811214",
    price: "A$8.29",
  },
  {
    title: "Desk Cable Organizer Silicone Holder Strip...",
    color: "Color: Black",
    image:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=240&q=80",
    date: "2026-04-17",
    buyer: "wiretidy",
    itemBuy: "397118191402",
    itemSell: "406862811258",
    price: "A$6.79",
  },
  {
    title: "Portable Storage Basket Utility Carry Box...",
    color: "Color: Grey",
    image:
      "https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=240&q=80",
    date: "2026-04-17",
    buyer: "organizehub",
    itemBuy: "397118191448",
    itemSell: "406862811302",
    price: "A$12.99",
  },
];

export const initialOrders = orderRowsSeed.map((item, index) => ({
  id: `order-${index + 1}`,
  ...item,
  status: "Pending",
  estimatedArrival: "-",
  sourcingRequest: "-",
  trackingNumber: "-",
  profit: "0",
  feeTax: "-",
  tags: "-",
  store: "sheikh002-au",
  orderBuyId: `${item.itemBuy}-100${index + 1}`,
  orderSellId: `${item.itemSell}-100${index + 1}`,
}));

export const initialProductAlerts = [
  {
    id: "import-1",
    tone: "warning",
    message: "Import Products #153999960 (Import to Store) (197/197 finished)",
  },
  {
    id: "import-2",
    tone: "danger",
    message: "Import Products #153999648 (Import to Store) (98/98 finished)",
  },
];

export const productSeedItems = [
  {
    title: "Detachable Lobster Swivel Bag Handbag Shoulder...",
    image:
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=240&q=80",
    uploaded: "2026-04-17",
    available: 20,
    onHold: 0,
    outOfStock: 0,
    total: 20,
    priceBuy: "A$5.19 - A$7.29",
    priceSell: "A$5.19 - A$7.29",
    sold: 0,
    dws: 4,
    profit: "-",
    tags: "-",
  },
  {
    title: "10Pc Mini Contact Lens Case for Eyes Travel Kit...",
    image:
      "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=240&q=80",
    uploaded: "2026-04-17",
    available: 7,
    onHold: 0,
    outOfStock: 0,
    total: 7,
    priceBuy: "A$4.99 - A$11.59",
    priceSell: "A$4.99 - A$11.59",
    sold: 0,
    dws: 4,
    profit: "-",
    tags: "-",
  },
  {
    title: "Universal Leather Watch Band Replacement Strap...",
    image:
      "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&w=240&q=80",
    uploaded: "2026-04-17",
    available: 22,
    onHold: 0,
    outOfStock: 0,
    total: 22,
    priceBuy: "A$4.99 - A$10.99",
    priceSell: "A$4.99 - A$10.99",
    sold: 0,
    dws: 4,
    profit: "-",
    tags: "-",
  },
  {
    title: "6PCS Random Number Puzzle Plastic Moving...",
    image:
      "https://images.unsplash.com/photo-1516627145497-ae6968895b75?auto=format&fit=crop&w=240&q=80",
    uploaded: "2026-04-17",
    available: 2,
    onHold: 0,
    outOfStock: 0,
    total: 2,
    priceBuy: "A$4.99 - A$8.99",
    priceSell: "A$4.99 - A$8.99",
    sold: 0,
    dws: 4,
    profit: "-",
    tags: "-",
  },
  {
    title: "100.Pcs Pack Nail Art Toe Separators Fingers Foots...",
    image:
      "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=240&q=80",
    uploaded: "2026-04-17",
    available: 5,
    onHold: 0,
    outOfStock: 0,
    total: 5,
    priceBuy: "A$4.99 - A$11.19",
    priceSell: "A$4.99 - A$11.19",
    sold: 0,
    dws: 4,
    profit: "-",
    tags: "-",
  },
  {
    title: "Outdoor Adjustable Paracord Survival...",
    image:
      "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=240&q=80",
    uploaded: "2026-04-17",
    available: 2,
    onHold: 0,
    outOfStock: 0,
    total: 2,
    priceBuy: "A$11.09 - A$11.19",
    priceSell: "A$11.09 - A$11.19",
    sold: 0,
    dws: 4,
    profit: "-",
    tags: "-",
  },
  {
    title: "Hair Dryer Holder Wall Hair Dryer Mount Bathroom...",
    image:
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=240&q=80",
    uploaded: "2026-04-17",
    available: 8,
    onHold: 0,
    outOfStock: 0,
    total: 8,
    priceBuy: "A$4.99 - A$14.29",
    priceSell: "A$4.99 - A$14.29",
    sold: 0,
    dws: 4,
    profit: "-",
    tags: "-",
  },
  {
    title: "4X Silicone Rubber Watch Strap Band...",
    image:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=240&q=80",
    uploaded: "2026-04-17",
    available: 4,
    onHold: 0,
    outOfStock: 0,
    total: 4,
    priceBuy: "A$4.39 - A$10.19",
    priceSell: "A$4.39 - A$10.19",
    sold: 0,
    dws: 4,
    profit: "-",
    tags: "-",
  },
  {
    title: "Glasses Neck Cord Lanyard Strap for Glasses...",
    image:
      "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=240&q=80",
    uploaded: "2026-04-17",
    available: 6,
    onHold: 0,
    outOfStock: 0,
    total: 6,
    priceBuy: "A$2.99 - A$5.49",
    priceSell: "A$2.99 - A$5.49",
    sold: 0,
    dws: 4,
    profit: "-",
    tags: "-",
  },
  {
    title: "Magnetic Soft Pad Jaw Rubber for Metal Vise...",
    image:
      "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=240&q=80",
    uploaded: "2026-04-17",
    available: 3,
    onHold: 0,
    outOfStock: 0,
    total: 3,
    priceBuy: "A$7.99 - A$12.99",
    priceSell: "A$7.99 - A$12.99",
    sold: 0,
    dws: 4,
    profit: "-",
    tags: "-",
  },
  {
    title: "Electric Water Bottle Pump Dispenser...",
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=240&q=80",
    uploaded: "2026-04-17",
    available: 9,
    onHold: 0,
    outOfStock: 0,
    total: 9,
    priceBuy: "A$8.99 - A$13.49",
    priceSell: "A$8.99 - A$13.49",
    sold: 0,
    dws: 4,
    profit: "-",
    tags: "-",
  },
  {
    title: "Coffee Waste Container Espresso Grinds Knock B...",
    image:
      "https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=240&q=80",
    uploaded: "2026-04-17",
    available: 10,
    onHold: 0,
    outOfStock: 0,
    total: 10,
    priceBuy: "A$15.99 - A$20.49",
    priceSell: "A$15.99 - A$20.49",
    sold: 0,
    dws: 4,
    profit: "-",
    tags: "-",
  },
  {
    title: "15M Heat Resistant Wire Harness Tape Flame...",
    image:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=240&q=80",
    uploaded: "2026-04-17",
    available: 11,
    onHold: 0,
    outOfStock: 0,
    total: 11,
    priceBuy: "A$6.39 - A$11.29",
    priceSell: "A$6.39 - A$11.29",
    sold: 0,
    dws: 4,
    profit: "-",
    tags: "-",
  },
  {
    title: "Electric Foot Grinder File Vacuum Hard Ski...",
    image:
      "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=240&q=80",
    uploaded: "2026-04-17",
    available: 6,
    onHold: 0,
    outOfStock: 0,
    total: 6,
    priceBuy: "A$9.49 - A$15.99",
    priceSell: "A$9.49 - A$15.99",
    sold: 0,
    dws: 4,
    profit: "-",
    tags: "-",
  },
  {
    title: "20Pc Sandpaper Set 1000/2000/3000",
    image:
      "https://images.unsplash.com/photo-1584466977773-e625c37cdd50?auto=format&fit=crop&w=240&q=80",
    uploaded: "2026-04-17",
    available: 3,
    onHold: 0,
    outOfStock: 0,
    total: 3,
    priceBuy: "A$5.49 - A$8.79",
    priceSell: "A$5.49 - A$8.79",
    sold: 0,
    dws: 4,
    profit: "-",
    tags: "-",
  },
  {
    title: "1/2 Pcs Universal 3.5MM L-Plug Signal Booster...",
    image:
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=240&q=80",
    uploaded: "2026-04-17",
    available: 1,
    onHold: 0,
    outOfStock: 0,
    total: 1,
    priceBuy: "A$3.99 - A$6.29",
    priceSell: "A$3.99 - A$6.29",
    sold: 0,
    dws: 4,
    profit: "-",
    tags: "-",
  },
  {
    title: "Single Watch Gift Box with Pillow PU Leather...",
    image:
      "https://images.unsplash.com/photo-1509048191080-d2d0bd6e6b83?auto=format&fit=crop&w=240&q=80",
    uploaded: "2026-04-17",
    available: 12,
    onHold: 0,
    outOfStock: 0,
    total: 12,
    priceBuy: "A$4.99 - A$7.99",
    priceSell: "A$4.99 - A$7.99",
    sold: 0,
    dws: 4,
    profit: "-",
    tags: "-",
  },
];

export const initialProducts = Array.from({ length: 768 }, (_, index) => {
  const seed = productSeedItems[index % productSeedItems.length];
  const cycle = Math.floor(index / productSeedItems.length);
  const uploadedDates = ["2026-04-17", "2026-04-18", "2026-04-19", "2026-04-20"];

  return {
    id: `product-${index + 1}`,
    title: seed.title,
    image: seed.image,
    uploaded: uploadedDates[index % uploadedDates.length],
    sourcingRequested: index % 5 === 0,
    available: Math.max(0, seed.available - (cycle % 3)),
    onHold: cycle % 2 === 0 ? 0 : 1,
    outOfStock: index % 6 === 0 ? 1 : 0,
    total: Math.max(1, seed.total + (cycle % 4)),
    oosDays: cycle % 6 === 0 ? 2 + (index % 4) : "-",
    priceBuy: seed.priceBuy,
    priceSell: seed.priceSell,
    profit: seed.profit,
    itemBuy: `397${String(582100999 + index).padStart(9, "0")}`,
    itemSell: `406${String(83454105 + index).padStart(8, "0")}`,
    sold: seed.sold,
    dws: seed.dws,
    store: "sheikh002-au",
    asin: "-",
    views: "-",
    watchers: "-",
    daysLeft: 25 - (index % 3),
    tags: seed.tags,
    warning: index % 7 === 0,
  };
});

export const DRAFT_UPLOAD_COUNT = 689;

export const initialDrafts = [
  {
    id: "draft-1",
    title: "Ice Cream Scoop Non Stick Professional Polished Anti-Freeze Aluminium Spoon Tool",
    image:
      "https://images.unsplash.com/photo-1517093157656-b9eccef91cb1?auto=format&fit=crop&w=300&q=80",
    store: "nrf_enterprise_inc-llc-au",
    supplier: "eBay AU",
    variants: 4,
    issue: "Missing item specifics",
  },
  {
    id: "draft-2",
    title: "Flameless LED Candles Tea Lights Battery Operated Realistic Candle Decoration AU",
    image:
      "https://images.unsplash.com/photo-1602874801007-bd458bb1b8b6?auto=format&fit=crop&w=300&q=80",
    store: "nrf_enterprise_inc-llc-au",
    supplier: "eBay AU",
    variants: 4,
    issue: "Destination policy needs review",
  },
  {
    id: "draft-3",
    title: "Waterproof Housing Case Diving Protective Cover for Gopro Hero 13 12 11 10 9",
    image:
      "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=300&q=80",
    store: "nrf_enterprise_inc-llc-au",
    supplier: "eBay AU",
    variants: 2,
    issue: "Image validation failed",
  },
  {
    id: "draft-4",
    title: "50PCS Adhesive Magnets for Crafts Flexible round Magnets with Adhesive Backing A",
    image:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=300&q=80",
    store: "nrf_enterprise_inc-llc-au",
    supplier: "eBay AU",
    variants: 2,
    issue: "Description rewrite pending",
  },
  {
    id: "draft-5",
    title: "Voltage Electric Tester Volt Detector Test Pen AC DC Non-Contact Sensor 90-1000V",
    image:
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=300&q=80",
    store: "nrf_enterprise_inc-llc-au",
    supplier: "eBay AU",
    variants: 1,
    issue: "Category mapping required",
  },
  {
    id: "draft-6",
    title: "25W PD Car Charger QC3.0 Two to Six Port Fast Charger with Digital Display AUS",
    image:
      "https://images.unsplash.com/photo-1605514449459-5a9cfa0b9955?auto=format&fit=crop&w=300&q=80",
    store: "nrf_enterprise_inc-llc-au",
    supplier: "eBay AU",
    variants: 5,
    issue: "Retry import to finish upload",
  },
  {
    id: "draft-7",
    title: "25/35cm Glass Window Cleaning Squeegee Blade Wiper Cleaner Bathroom Shower",
    image:
      "https://images.unsplash.com/photo-1528740561666-dc2479dc08ab?auto=format&fit=crop&w=300&q=80",
    store: "nrf_enterprise_inc-llc-au",
    supplier: "eBay AU",
    variants: 3,
    issue: "Return policy missing",
  },
];

export const draftEditorTemplates = {
  "draft-2": {
    product: {
      title: "Flameless LED Candles Tea Lights Battery Operated Realistic Candle Decoration AU",
      category: "Candles",
      shippingMethod: "Cheapest with tracking",
      paymentPolicy: "Enter Payment Policy",
      shippingPolicy: "Enter Shipping Policy",
      returnPolicy: "Enter Return Policy",
      countryLocation: "Australia",
      zipcode: "2042",
      suburb: "Newtown",
      brand: "Brand",
      monitoring: ["Stock Monitoring", "Price Monitoring", "Auto Order"],
    },
    description:
      "1/8/12Pcs Flameless LED Tealight Tea Candles Wedding Light Romantic Candles Lights for Birthday Wedding Party Decorations\n\nFeatures:\n1.The product choose high-quality batteries, whose life is twice that of similar batteries.\n2.Pre-installed battery is guaranteed to be used out of the box. Just switch the on/off button at the bottom to control it.\n3.The battery can be easily replaceable via the bottom. No need to worry about fire hazards after people walk away.\n4.Romantic Love LED candles and faux rose petals are suitable for weddings, romantic evenings, Valentine's Day, wedding flower decoration, anniversary, honeymoon, surprise proposal, birthday party or an ambient dinner.",
    variants: [
      {
        id: "var-1",
        title: "Emitting Color: Warm Light, Body Color::6Pcs",
        sku: "397064476089_665508035319",
        price: "A$5.29",
        image:
          "https://images.unsplash.com/photo-1602874801007-bd458bb1b8b6?auto=format&fit=crop&w=300&q=80",
      },
      {
        id: "var-2",
        title: "Emitting Color: Warm Light, Body Color::6Pcs",
        sku: "397064476089_665508035320",
        price: "A$8.89",
        image:
          "https://images.unsplash.com/photo-1602874801007-bd458bb1b8b6?auto=format&fit=crop&w=300&q=80",
      },
      {
        id: "var-3",
        title: "Emitting Color: Warm Light, Body Color::12Pcs",
        sku: "397064476089_665508035321",
        price: "A$11.99",
        image:
          "https://images.unsplash.com/photo-1602874801007-bd458bb1b8b6?auto=format&fit=crop&w=300&q=80",
      },
      {
        id: "var-4",
        title: "Emitting Color: Hook, Body Color::1Pcs",
        sku: "397064476089_665508035322",
        price: "A$4.99",
        image:
          "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=300&q=80",
      },
    ],
    images: [
      {
        id: "img-1",
        src: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=500&q=80",
      },
      {
        id: "img-2",
        src: "https://images.unsplash.com/photo-1602874801007-bd458bb1b8b6?auto=format&fit=crop&w=500&q=80",
      },
      {
        id: "img-3",
        src: "https://images.unsplash.com/photo-1602874801007-bd458bb1b8b6?auto=format&fit=crop&w=500&q=80",
        label: "Warm Light",
      },
      {
        id: "img-4",
        src: "https://images.unsplash.com/photo-1602874801007-bd458bb1b8b6?auto=format&fit=crop&w=500&q=80",
        label: "Warm Light",
        primary: true,
      },
      {
        id: "img-5",
        src: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=500&q=80",
      },
      {
        id: "img-6",
        src: "https://images.unsplash.com/photo-1602874801007-bd458bb1b8b6?auto=format&fit=crop&w=500&q=80",
        label: "Warm Light",
      },
    ],
    specifics: [
      { label: "Type", value: "Does not apply" },
      {
        label: "Condition",
        value: "Brand New: A brand-new, unused, unopened, undamaged item in its original packaging.",
      },
      { label: "Brand", value: "Unbranded" },
      { label: "Unit Type", value: "Unit" },
      { label: "Shape", value: "Cylindrical" },
      { label: "Features", value: "Plastic" },
    ],
  },
};
