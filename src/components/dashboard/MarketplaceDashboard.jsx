import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { FaTiktok } from "react-icons/fa6";
import {
  LuBadgeCheck,
  LuBell,
  LuBox,
  LuBriefcaseBusiness,
  LuCar,
  LuCheck,
  LuChevronDown,
  LuChevronLeft,
  LuChevronRight,
  LuChevronsLeft,
  LuClipboardList,
  LuClock3,
  LuDribbble,
  LuEllipsisVertical,
  LuExternalLink,
  LuEyeOff,
  LuFilePenLine,
  LuGauge,
  LuGamepad2,
  LuHeadphones,
  LuHouse,
  LuInbox,
  LuMegaphone,
  LuMenu,
  LuMessageCircleMore,
  LuMoon,
  LuPackage2,
  LuPackagePlus,
  LuPackageSearch,
  LuPawPrint,
  LuPencil,
  LuPlay,
  LuPlus,
  LuRefreshCcw,
  LuSearch,
  LuSettings2,
  LuShirt,
  LuShoppingCart,
  LuSlidersHorizontal,
  LuSparkles,
  LuStore,
  LuSun,
  LuTabletSmartphone,
  LuTruck,
  LuUmbrella,
  LuUpload,
  LuUserRound,
  LuVolume2,
  LuWalletCards,
  LuChartLine,
  LuWrench,
  LuTrash2,
  LuX,
  LuZap,
} from "react-icons/lu";
import "../../assets/css/marketplace-utilities.css";
import "../../assets/css/marketplace-dashboard.css";
import { ThemeContext } from "../../context/ThemeContext";
import MarketplaceSettingsPage from "./MarketplaceSettingsPage";
import CustomerSupportContent from "./CustomerSupportPage";

const sidebarGroups = [
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

const filterPills = [
  { label: "Best Sellers", icon: LuMenu },
  { label: "Fast Shipping", icon: LuTruck },
];

const addProductsMenuItems = [
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

const storeSwitcherItems = [
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

const storeSwitcherMenuItems = [
  { id: "rename", label: "Rename", icon: LuPencil },
  { id: "copy-token", label: "Copy AutoDS Token", icon: LuClipboardList },
  { id: "renew-token", label: "Renew Token", icon: LuRefreshCcw },
  { id: "watermark", label: "Set Store Watermark", icon: LuBadgeCheck },
  { id: "settings", label: "Settings", icon: LuSettings2 },
  { id: "resync", label: "Resync Store", icon: LuStore },
  { id: "convert", label: "Convert to NON-API (MIP)", icon: LuZap },
  { id: "delete", label: "Delete", icon: LuTrash2 },
];

const multipleProductsTabs = [
  { id: "urls", label: "URL's or ID's" },
  { id: "csv", label: "Upload CSV" },
  { id: "finder", label: "AutoDS Finder" },
];

const finderPlans = [
  { id: "basic", label: "Basic", sales: "3 sales/mo", credits: 1, icon: LuBadgeCheck },
  { id: "popular", label: "Popular", sales: "5 sales/mo", credits: 2, icon: LuSparkles },
  { id: "best-sellers", label: "Best Sellers", sales: "8 sales/mo", credits: 4, icon: LuPackageSearch },
];

const categoryFilters = [
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

const subfilterOptions = {
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

const filterOptions = {
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

const podCategoryFilters = [
  "All Products",
  "Printed Apparel",
  "Full Printed Apparel",
  "Accessories",
  "Decoration",
  "Footwear",
  "Home & Living",
  "Printed in EU",
];

const podProducts = [
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

const dashboardDateOptions = [
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

const dashboardStatCards = [
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

const dashboardOverviewRows = [
  { label: "Average Profit", value: "$0" },
  { label: "Average Sell Order Cost", value: "$0" },
  { label: "Average Buy Order Cost", value: "$0" },
  { label: "Max Profit On Order", value: "$0" },
  { label: "Total Products Cost", value: "$0" },
];

const dashboardTopProducts = [
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

const orderStatusOptions = ["Pending", "Ordered", "Shipped", "Delivered", "Canceled"];

const profileMenuItems = [
  { label: "AutoDS Academy", icon: LuBadgeCheck },
  { label: "Support Center", icon: LuInbox },
  { label: "Refer a Friend", icon: LuUserRound, muted: true },
  { label: "AutoDS Wallet", icon: LuWalletCards, muted: true },
  { label: "Log out", icon: LuExternalLink, muted: true },
];

const headerNotifications = [
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
const NOTIFICATION_PREVIEW_LIMIT = 4;

const whatsNewItems = [
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

const loadBalanceAmounts = [15, 50, 100, 200, 500, 1000];

const aiCreditPackages = [
  { id: "1000", credits: "1000 Credits", price: "$0.20/10 credits" },
  { id: "5000", credits: "5000 Credits", price: "$0.06/10 credits", badge: "Most Popular" },
  { id: "10000", credits: "10000 Credits", price: "$0.05/10 credits" },
  { id: "20000", credits: "20000 Credits", price: "$0.04/10 credits" },
];

const orderRowsSeed = [
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

const initialOrders = orderRowsSeed.map((item, index) => ({
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

const initialProductAlerts = [
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

const productSeedItems = [
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

const initialProducts = Array.from({ length: 768 }, (_, index) => {
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

const DRAFT_UPLOAD_COUNT = 689;

const initialDrafts = [
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

const draftEditorTemplates = {
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

function buildItem(item) {
  return {
    shipsTo: "United States",
    currency: "USD",
    shippingTag: "Best Sellers",
    gallery: item.gallery?.length ? item.gallery : [item.image],
    ...item,
  };
}

const catalogSections = [
  {
    key: "outdoors",
    title: "Outdoors",
    items: [
      buildItem({
        id: "outdoor-1",
        vendor: "FChiX",
        title: "VIGLT Camping Shower Bag Portable Camping Shower Bag for Camp Shower Trips",
        price: "$19.99",
        shipping: "3 Business Days",
        shippingDays: 3,
        category: "Outdoors",
        subCategory: "Camping",
        shipsFrom: "United States",
        priceRange: "$0 - $25",
        image:
          "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1200&q=80",
        shippingTag: "Fast Shipping",
      }),
      buildItem({
        id: "outdoor-2",
        vendor: "Surplus World Inc.",
        title: "Rothco 2685 5-in-1 Multi-Purpose Tool for Camping and Hiking",
        price: "$23.99",
        shipping: "3 Business Days",
        shippingDays: 3,
        category: "Outdoors",
        subCategory: "Climbing & Hiking",
        shipsFrom: "United States",
        priceRange: "$0 - $25",
        image:
          "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
        shippingTag: "Fast Shipping",
      }),
      buildItem({
        id: "outdoor-3",
        vendor: "Shop103181382 Store",
        title: "LED Sensor Headlamp Camping Search Light Head Flashlight Rechargeable Powerful Headlight",
        price: "$4.82-9.38",
        shipping: "7 Business Days",
        shippingDays: 7,
        category: "Outdoors",
        subCategory: "Camping",
        shipsFrom: "China",
        priceRange: "$0 - $25",
        image:
          "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80",
      }),
      buildItem({
        id: "outdoor-4",
        vendor: "CJ",
        title: "USB Rechargeable LED Bicycle Headlight Bike Head Light Cycling Rear Front Lamp",
        price: "$11.03",
        shipping: "5 Business Days",
        shippingDays: 5,
        category: "Outdoors",
        subCategory: "Cycling",
        shipsFrom: "China",
        priceRange: "$0 - $25",
        image:
          "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=1200&q=80",
      }),
      buildItem({
        id: "outdoor-5",
        vendor: "Outdoor Pro",
        title: "Lightweight Waterproof Camping Tent for Weekend Trips and Hiking Camps",
        price: "$44.90",
        shipping: "6 Business Days",
        shippingDays: 6,
        category: "Outdoors",
        subCategory: "Camping",
        shipsFrom: "Germany",
        priceRange: "$25 - $50",
        image:
          "https://images.unsplash.com/photo-1504851149312-7a075b496cc7?auto=format&fit=crop&w=1200&q=80",
      }),
      buildItem({
        id: "outdoor-6",
        vendor: "FitCore",
        title: "Compact Trekking Poles Pair for Climbing Hiking Trails and Outdoor Travel",
        price: "$28.75",
        shipping: "4 Business Days",
        shippingDays: 4,
        category: "Outdoors",
        subCategory: "Climbing & Hiking",
        shipsFrom: "United States",
        priceRange: "$25 - $50",
        image:
          "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1200&q=80",
      }),
    ],
  },
  {
    key: "best-sellers",
    title: "Best Sellers",
    items: [
      buildItem({
        id: "best-1",
        vendor: "Amazon",
        title:
          "Yuntec Dog Car Seat Cover, Back Seat Cover for Dogs Pet Car Seat Protector Waterproof Bench",
        price: "$26.98",
        shipping: "2 Business Days",
        shippingDays: 2,
        category: "Pets",
        shipsFrom: "United States",
        priceRange: "$25 - $50",
        image:
          "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=1200&q=80",
        gallery: [
          "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?auto=format&fit=crop&w=1200&q=80",
        ],
        shippingTag: "Fast Shipping",
      }),
      buildItem({
        id: "best-2",
        vendor: "Funky Junque Funky Junque",
        title:
          "Funky Junque Kids Beanie Toddler Girls Boys Ribbed Knit Children's Winter Hat Skully Cap",
        price: "$14.93-31.99",
        shipping: "2-7 Business Days",
        shippingDays: 5,
        category: "Clothing, Shoes & Jewelry",
        shipsFrom: "China",
        priceRange: "$25 - $50",
        image:
          "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=1200&q=80",
      }),
      buildItem({
        id: "best-3",
        vendor: "JoymozeDirect",
        title:
          "Joymoze Leisure Backpack for Girls Teenage School Backpack Women Backpack Purse Cat",
        price: "$29.99",
        shipping: "2-3 Business Days",
        shippingDays: 3,
        category: "Clothing, Shoes & Jewelry",
        shipsFrom: "China",
        priceRange: "$25 - $50",
        image:
          "https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=1200&q=80",
      }),
      buildItem({
        id: "best-4",
        vendor: "FINDCOZY DIRECT",
        title:
          "FINDCOZY Extra Large Toiletry Bag with Hanging Hook, Travel Makeup Case for Women, Cosmetic Organizer",
        price: "$20.99-25.99",
        shipping: "2 Business Days",
        shippingDays: 2,
        category: "Beauty & Personal Care",
        shipsFrom: "Germany",
        priceRange: "$25 - $50",
        image:
          "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80",
        shippingTag: "Fast Shipping",
      }),
      buildItem({
        id: "best-5",
        vendor: "Amazon",
        title: "Foldable Storage Organizer with Zipper Compartments for Daily Travel Essentials",
        price: "$24.50",
        shipping: "3 Business Days",
        shippingDays: 3,
        category: "Home & Garden",
        shipsFrom: "United States",
        priceRange: "$0 - $25",
        image:
          "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1200&q=80",
      }),
    ],
  },
  {
    key: "new-arrivals",
    title: "New Arrivals",
    items: [
      buildItem({
        id: "new-1",
        vendor: "BeautyLadyNailArt Store",
        title: "BORN PRETTY 10ml Milky Jelly White Gel Nail Polish UV LED Builder Gel",
        price: "$4.80",
        shipping: "11 Business Days",
        shippingDays: 11,
        category: "Beauty & Personal Care",
        shipsFrom: "China",
        priceRange: "$0 - $25",
        image:
          "https://images.unsplash.com/photo-1607779097040-26e80aa78e66?auto=format&fit=crop&w=1200&q=80",
        gallery: [
          "https://images.unsplash.com/photo-1607779097040-26e80aa78e66?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=1200&q=80",
        ],
      }),
      buildItem({
        id: "new-2",
        vendor: "VENALISA & CANNI Official Store",
        title:
          "Venalisa Factory Supplier Diamond Sticky Gel Super Texture Transparent Clear Color Diamond Glue",
        price: "$2.52-4.56",
        shipping: "11 Business Days",
        shippingDays: 11,
        category: "Beauty & Personal Care",
        shipsFrom: "China",
        priceRange: "$0 - $25",
        image:
          "https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=1200&q=80",
      }),
      buildItem({
        id: "new-3",
        vendor: "VENALISA & CANNI Official Store",
        title:
          "CANNI Gel Nail Polish TPO FREE Fantastic Adhesion Consistency Ultra Gorgeous Color Set",
        price: "$5.81-6.32",
        shipping: "11 Business Days",
        shippingDays: 11,
        category: "Beauty & Personal Care",
        shipsFrom: "China",
        priceRange: "$0 - $25",
        image:
          "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=1200&q=80",
      }),
      buildItem({
        id: "new-4",
        vendor: "VENALISA & CANNI Official Store",
        title:
          "CANNI Gel Nail Polish Blood Red Clear Jelly Red Gorgeous Color HEMA FREE Soak Off UV LED",
        price: "$6.60",
        shipping: "11 Business Days",
        shippingDays: 11,
        category: "Beauty & Personal Care",
        shipsFrom: "China",
        priceRange: "$0 - $25",
        image:
          "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80",
        gallery: [
          "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=1200&q=80",
          "https://images.unsplash.com/photo-1607779097040-26e80aa78e66?auto=format&fit=crop&w=1200&q=80",
        ],
      }),
      buildItem({
        id: "new-5",
        vendor: "BeautyLadyNailArt Store",
        title: "Glossy Nude Jelly Gel Polish Set with Soft White Tips for Salon Finish Nails",
        price: "$5.20",
        shipping: "9 Business Days",
        shippingDays: 9,
        category: "Beauty & Personal Care",
        shipsFrom: "China",
        priceRange: "$0 - $25",
        image:
          "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=1200&q=80",
        shippingTag: "Fast Shipping",
      }),
    ],
  },
  {
    key: "toys-hobbies",
    title: "Toys & Hobbies",
    items: [
      buildItem({
        id: "toy-1",
        vendor: "PlayKids World",
        title: "Challenge Falling Sticks Game with Adjustable Levels for Quick Family Reaction Play",
        price: "$18.95",
        shipping: "6 Business Days",
        shippingDays: 6,
        category: "Toys & Hobbies",
        shipsFrom: "United States",
        priceRange: "$0 - $25",
        image:
          "https://images.unsplash.com/photo-1516627145497-ae6968895b75?auto=format&fit=crop&w=1200&q=80",
      }),
      buildItem({
        id: "toy-2",
        vendor: "Happy Hopper",
        title: "Ocean Activity Jumper for Babies with Rotating Toys and Musical Play Tray",
        price: "$67.99",
        shipping: "5 Business Days",
        shippingDays: 5,
        category: "Toys & Hobbies",
        shipsFrom: "United States",
        priceRange: "$50 - $100",
        image:
          "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=1200&q=80",
        shippingTag: "Fast Shipping",
      }),
      buildItem({
        id: "toy-3",
        vendor: "Battle Joy",
        title: "RC Bumper Rival Cars Set with Rechargeable Controllers for Indoor Play Battles",
        price: "$39.99",
        shipping: "7 Business Days",
        shippingDays: 7,
        category: "Toys & Hobbies",
        shipsFrom: "China",
        priceRange: "$25 - $50",
        image:
          "https://images.unsplash.com/photo-1558060370-d644479cb6f7?auto=format&fit=crop&w=1200&q=80",
      }),
      buildItem({
        id: "toy-4",
        vendor: "PlayKids World",
        title: "Collectible Trading Card Box Set with Booster Packs and Premium Display Finish",
        price: "$31.25",
        shipping: "8 Business Days",
        shippingDays: 8,
        category: "Toys & Hobbies",
        shipsFrom: "Germany",
        priceRange: "$25 - $50",
        image:
          "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=1200&q=80",
      }),
      buildItem({
        id: "toy-5",
        vendor: "Battle Joy",
        title: "Remote Control Racing Car with LED Drift Wheels and Rechargeable Battery Pack",
        price: "$29.80",
        shipping: "6 Business Days",
        shippingDays: 6,
        category: "Toys & Hobbies",
        shipsFrom: "China",
        priceRange: "$25 - $50",
        image:
          "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80",
      }),
    ],
  },
];

const categoryRowBlueprints = [
  {
    key: "home-garden",
    title: "Home & Garden",
    category: "Home & Garden",
    subCategory: "Decor",
    vendors: ["Garden Base", "Amazon", "FINDCOZY DIRECT"],
    images: [
      "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80",
    ],
    titles: [
      "Modern Indoor Planter Stand for Living Room and Patio Decor",
      "Foldable Storage Basket for Home Garden Tools and Daily Organization",
      "Solar Garden Lantern Outdoor Waterproof Decorative Warm Light",
    ],
  },
  {
    key: "electronics-gadgets",
    title: "Electronics & Gadgets",
    category: "Electronics & Gadgets",
    subCategory: "Chargers",
    vendors: ["Gadget Zone", "CJ", "Amazon"],
    images: [
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=1200&q=80",
    ],
    titles: [
      "Portable Bluetooth Speaker with FM Radio and Retro Handle",
      "Fast Wireless Charger Stand for Phone Desk Nightstand Setup",
      "Mini Power Bank Compact Daily Carry USB Charging Backup",
    ],
  },
  {
    key: "clothing-shoes-jewelry",
    title: "Clothing, Shoes & Jewelry",
    category: "Clothing, Shoes & Jewelry",
    subCategory: "Clothing",
    vendors: ["Fashion Store", "Funky Junque", "Target"],
    images: [
      "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80",
    ],
    titles: [
      "Soft Knit Alltag Pullover Top Casual Color Block Sweater",
      "Toddler Boys and Girls Boat Shoes Kids Canvas Sneakers",
      "Lightweight Hoodie Travel Comfort Daily Wear Street Outfit",
    ],
  },
  {
    key: "beauty-personal-care",
    title: "Beauty & Personal Care",
    category: "Beauty & Personal Care",
    subCategory: "Nails",
    vendors: ["Beauty Plus", "BeautyLadyNailArt Store", "Shindel Shindel"],
    images: [
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=1200&q=80",
    ],
    titles: [
      "Grey Hair Restoring Solid Shampoo Bar Bamboo Charcoal Treatment",
      "Edge Control Kit for Women's Hair Strong Hold Smoother Gel",
      "Spa Headbands Makeup Headbands Colorful Bow Hair Bands",
    ],
  },
  {
    key: "automotive-motorcycle",
    title: "Automotive & Motorcycle",
    category: "Automotive & Motorcycle",
    subCategory: "Car Accessories",
    vendors: ["Auto Gear", "Motor World", "CJ"],
    images: [
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?auto=format&fit=crop&w=1200&q=80",
    ],
    titles: [
      "Car Key Remote Shell Cover Protective Case with Signal Reminder",
      "Leather Keychain Car Key Holder Durable Stitching Accessory",
      "Dashboard Cleaning Gel Dust Detailer for Car Interior Vents",
    ],
  },
  {
    key: "sports-fitness",
    title: "Sports & Fitness",
    category: "Sports & Fitness",
    subCategory: "Fitness",
    vendors: ["FitCore", "Outdoor Pro", "Target"],
    images: [
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1200&q=80",
    ],
    titles: [
      "Resistance Bands Set for Daily Home Workouts and Training",
      "Yoga Mat Non Slip Fitness Pilates Stretching Exercise Pad",
      "Adjustable Jump Rope for Cardio Sessions and Speed Training",
    ],
  },
  {
    key: "other-category",
    title: "Other Category",
    category: "Other Category",
    subCategory: "General",
    vendors: ["Tool House", "Walmart", "AliExpress"],
    images: [
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1607082349566-187342175e2f?auto=format&fit=crop&w=1200&q=80",
    ],
    titles: [
      "Multipurpose Storage Basket for Home Office Utility Organization",
      "Foldable Utility Box for Garage Supplies and Easy Carry",
      "Compact Desktop Organizer Holder for Daily Workspace Setup",
    ],
  },
];

const generatedCategorySections = categoryRowBlueprints.map((section) => ({
  key: section.key,
  title: section.title,
  items: Array.from({ length: 6 }, (_, index) =>
    buildItem({
      id: `${section.key}-${index + 1}`,
      vendor: section.vendors[index % section.vendors.length],
      title: `${section.titles[index % section.titles.length]} ${index + 1}`,
      price: `$${(8.95 + index * 4.78).toFixed(2)}`,
      shipping: `${(index % 6) + 2} Business Days`,
      shippingDays: (index % 6) + 2,
      category: section.category,
      subCategory: section.subCategory,
      shipsFrom: index % 2 === 0 ? "United States" : "China",
      priceRange: index < 4 ? "$0 - $25" : "$25 - $50",
      image: section.images[index % section.images.length],
      shippingTag: index % 3 === 0 ? "Fast Shipping" : "Best Sellers",
    }),
  ),
}));

const marketplaceSections = [
  ...catalogSections.filter((section) => section.key !== "outdoors"),
  ...catalogSections.filter((section) => section.key === "outdoors"),
  ...generatedCategorySections,
];

const categoryLabels = categoryFilters
  .filter((category) => category.key !== "all")
  .map((category) => category.label);

function parsePriceValue(price) {
  const match = String(price).match(/(\d+(\.\d+)?)/);
  return match ? Number(match[1]) : 0;
}

function getSectionCategory(section) {
  if (categoryLabels.includes(section.title)) {
    return section.title;
  }

  const categories = new Set(section.items.map((item) => item.category).filter(Boolean));

  if (categories.size === 1) {
    return [...categories][0];
  }

  return "All Categories";
}

function formatDisplayDate(value) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function buildSparklinePoints(values) {
  return values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * 96 + 2;
      const y = 26 - ((value - 1) / 5) * 18;

      return `${x},${y}`;
    })
    .join(" ");
}

function buildPaginationItems(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "...", totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
}

function rewriteProductTitle(title) {
  return title
    .replace(/\.\.\.$/, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/(^\w)/, (match) => match.toUpperCase())
    .concat(" | AI Optimized");
}

function SidebarLink({ item, isOpen, onSelect, onToggle }) {
  const Icon = item.icon;
  const hasChildren = Array.isArray(item.children) && item.children.length > 0;
  const handleClick = () => {
    onSelect?.(item);

    if (hasChildren) {
      onToggle?.();
    }
  };

  return (
    <div className={`marketplace-sidebar__menu-block ${hasChildren ? "marketplace-sidebar__menu-block--parent" : ""}`}>
      <button
        type="button"
        className={`sidebar-link ${item.active ? "sidebar-link-active" : ""} ${item.badge ? "sidebar-link-has-badge" : ""} ${item.marker ? "sidebar-link-has-marker" : ""} ${hasChildren ? "sidebar-link-has-children" : ""}`}
        onClick={handleClick}
        aria-expanded={hasChildren ? isOpen : undefined}
      >
        <span className="marketplace-sidebar__icon">
          <Icon />
        </span>
        <span className="marketplace-sidebar__label">{item.label}</span>
        {item.badge ? <span className="marketplace-sidebar__badge">{item.badge}</span> : null}
        {hasChildren ? (
          <span className={`marketplace-sidebar__caret ${isOpen ? "marketplace-sidebar__caret--open" : ""}`}>
            <LuChevronDown />
          </span>
        ) : null}
        {item.marker ? (
          <span
            className="marketplace-sidebar__marker"
            style={{ backgroundColor: item.marker }}
            aria-hidden="true"
          />
        ) : null}
      </button>

      {hasChildren ? (
        <div
          className={`marketplace-sidebar__submenu-wrap ${isOpen ? "marketplace-sidebar__submenu-wrap--open" : ""}`}
          aria-hidden={!isOpen}
        >
          <div className="marketplace-sidebar__submenu">
            {item.children.map((child) => {
              const ChildIcon = child.icon;

              return (
                <button
                  type="button"
                  key={child.label}
                  className={`marketplace-sidebar__sub-link ${child.badge ? "marketplace-sidebar__sub-link--badge" : ""}`}
                >
                  <span className="marketplace-sidebar__sub-icon">
                    <ChildIcon />
                  </span>
                  <span className="marketplace-sidebar__sub-label">{child.label}</span>
                  {child.badge ? <span className="marketplace-sidebar__badge">{child.badge}</span> : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SelectField({ label, value, options, onChange }) {
  return (
    <label className="marketplace-filter-field">
      <span className="muted-label">{label}</span>
      <span className="marketplace-select-wrap">
        <select className="select-control input-border-style" value={value} onChange={onChange}>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <LuChevronDown className="marketplace-select-wrap__icon" />
      </span>
    </label>
  );
}

function ProductCard({ item }) {
  const gallery = item.gallery?.length ? item.gallery : [item.image];
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    setActiveImage(0);
  }, [item.id]);

  const showGalleryNav = gallery.length > 1;

  const changeImage = (direction) => {
    setActiveImage((current) => {
      const nextIndex = current + direction;

      if (nextIndex < 0) {
        return gallery.length - 1;
      }

      if (nextIndex >= gallery.length) {
        return 0;
      }

      return nextIndex;
    });
  };

  return (
    <article className={`product-card marketplace-product-card ${showGalleryNav ? "marketplace-product-card--gallery" : ""}`}>
      <div className="marketplace-product-card__media">
        <div className="marketplace-product-card__image-wrap">
          <img className="marketplace-product-card__image" src={gallery[activeImage]} alt={item.title} />
        </div>

        {showGalleryNav ? (
          <>
            <button
              type="button"
              className="marketplace-product-card__gallery-btn marketplace-product-card__gallery-btn--prev"
              onClick={() => changeImage(-1)}
              aria-label="Previous product image"
            >
              <LuChevronLeft />
            </button>
            <button
              type="button"
              className="marketplace-product-card__gallery-btn marketplace-product-card__gallery-btn--next"
              onClick={() => changeImage(1)}
              aria-label="Next product image"
            >
              <LuChevronRight />
            </button>
          </>
        ) : null}
      </div>

      <div className="marketplace-product-card__body">
        <a className="marketplace-product-card__vendor" href="/">
          {item.vendor}
        </a>
        <h3 className="marketplace-product-card__title">{item.title}</h3>
        <div className="marketplace-product-card__price">{item.price}</div>
        <div className="marketplace-product-card__shipping">Shipping time: {item.shipping}</div>
      </div>

      <div className="marketplace-product-card__actions">
        <button type="button" className="marketplace-product-card__action-btn">
          <LuPlus />
          <span>Import as Draft &amp; Edit Manually</span>
        </button>
        <button type="button" className="marketplace-product-card__action-btn marketplace-product-card__action-btn--store">
          <LuStore />
          <span>Build a Shopify Store</span>
          <span className="marketplace-product-card__action-badge">NEW</span>
        </button>
      </div>
    </article>
  );
}

function PodProductCard({ item }) {
  return (
    <article className={`pod-product-card ${item.advanced ? "pod-product-card--advanced" : ""}`}>
      <div className="pod-product-card__media">
        <img className="pod-product-card__image" src={item.image} alt={item.title} />
        <span className="pod-product-card__logo">AUTO-DS</span>
        {item.advanced ? (
          <div className="pod-product-card__advanced">
            <span>
              This product requires designs created by advanced tools, such as Photoshop.
              You can download an example file from here.
            </span>
            <span className="pod-product-card__ps">Ps</span>
          </div>
        ) : null}
      </div>

      <div className="pod-product-card__body">
        <h3 className="pod-product-card__title">{item.title}</h3>
        <div className="pod-product-card__price">{item.price}</div>
        <button type="button" className="pod-product-card__edit-btn">
          Edit Product
        </button>
      </div>
    </article>
  );
}

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

function CompactDateRange({ from, to, onFromChange, onToChange, label = "Time:" }) {
  return (
    <div className="compact-date-range">
      <span className="compact-date-range__label">{label}</span>
      <div className="compact-date-range__field">
        <select value={from} onChange={(event) => onFromChange(event.target.value)}>
          {dashboardDateOptions.map((option) => (
            <option key={option} value={option}>
              {formatDisplayDate(option)}
            </option>
          ))}
        </select>
        <span className="compact-date-range__dash" aria-hidden="true">
          -
        </span>
        <select value={to} onChange={(event) => onToChange(event.target.value)}>
          {dashboardDateOptions.map((option) => (
            <option key={option} value={option}>
              {formatDisplayDate(option)}
            </option>
          ))}
        </select>
        <LuChevronDown className="compact-date-range__icon" />
      </div>
    </div>
  );
}

function DashboardSparkline({ values }) {
  return (
    <svg className="dashboard-sparkline" viewBox="0 0 100 28" preserveAspectRatio="none" aria-hidden="true">
      <polyline className="dashboard-sparkline__line" points={buildSparklinePoints(values)} />
      {values.map((value, index) => {
        const x = (index / Math.max(values.length - 1, 1)) * 96 + 2;
        const y = 26 - ((value - 1) / 5) * 18;

        return <circle className="dashboard-sparkline__dot" cx={x} cy={y} key={`${index}-${value}`} r="1.9" />;
      })}
    </svg>
  );
}

function DashboardContent({ searchQuery }) {
  const [fromDate, setFromDate] = useState("2026-04-16");
  const [toDate, setToDate] = useState("2026-04-23");
  const [currency, setCurrency] = useState("USD");
  const [showTutorialNote, setShowTutorialNote] = useState(false);
  const [promoStarted, setPromoStarted] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [overviewEditing, setOverviewEditing] = useState(false);
  const [overviewValues, setOverviewValues] = useState(() =>
    Object.fromEntries(dashboardOverviewRows.map((row) => [row.label, row.value])),
  );

  const visibleProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return dashboardTopProducts.slice(0, 3);
    }

    return dashboardTopProducts.filter((item) => item.title.toLowerCase().includes(query)).slice(0, 3);
  }, [searchQuery]);

  return (
    <section className="dashboard-page-content">
      <section className="dashboard-block">
        <div className="dashboard-block__head dashboard-block__head--controls">
          <div className="dashboard-toolbar">
            <CompactDateRange
              from={fromDate}
              to={toDate}
              onFromChange={setFromDate}
              onToChange={setToDate}
            />

            <label className="dashboard-inline-select">
              <span className="dashboard-inline-select__label">Currency:</span>
              <span className="dashboard-inline-select__field">
                <select value={currency} onChange={(event) => setCurrency(event.target.value)}>
                  {filterOptions.currency.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <LuChevronDown />
              </span>
            </label>
          </div>

          <button
            type="button"
            className="dashboard-secondary-btn"
            onClick={() => setShowTutorialNote((current) => !current)}
          >
            <LuPlay />
            <span>Watch Tutorial</span>
          </button>
        </div>

        {showTutorialNote ? (
          <div className="dashboard-tutorial-note">
            <LuPlay />
            <span>Tutorial ready: this dashboard mirrors the AutoDS overview layout and keeps its controls interactive.</span>
          </div>
        ) : null}

        <div className="dashboard-summary card-wrapper">
          <div className="dashboard-summary__stats">
            {dashboardStatCards.map((item) => {
              const Icon = item.icon;

              return (
                <article className="dashboard-stat" key={item.label}>
                  <span className={`dashboard-stat__icon dashboard-stat__icon--${item.tone}`}>
                    <Icon />
                  </span>

                  <div className="dashboard-stat__copy">
                    <div className="dashboard-stat__value">{item.value}</div>
                    <div className="dashboard-stat__label">
                      <span>{item.label}</span>
                      <span className="dashboard-stat__help">?</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="dashboard-summary__promo">
            <div className="dashboard-summary__promo-copy">
              <span className="dashboard-summary__promo-icon">
                <LuSparkles />
              </span>
              <div>
                <div className="dashboard-summary__promo-title-row">
                  <strong>Want to boost these numbers?</strong>
                  <span className="dashboard-summary__promo-chip">Limited time offer!</span>
                </div>
                <p>
                  Boost your business on TikTok and achieve real results! Take advantage of our limited-time offer -
                  start growing today!
                </p>
              </div>
            </div>

            <button
              type="button"
              className={`dashboard-promo-btn ${promoStarted ? "dashboard-promo-btn--active" : ""}`}
              onClick={() => setPromoStarted((current) => !current)}
            >
              <FaTiktok />
              <span>{promoStarted ? "Campaign Ready" : "Get Started with TikTok Ads"}</span>
            </button>
          </div>
        </div>
      </section>

      <section className="dashboard-analytics">
        <div className="dashboard-analytics__head">
          <h2 className="dashboard-block__title">Sales Overview</h2>

          <div className="dashboard-legend">
            <span className="dashboard-legend__item">
              <span className="dashboard-legend__dot dashboard-legend__dot--revenue" />
              Revenue
            </span>
            <span className="dashboard-legend__item">
              <span className="dashboard-legend__dot dashboard-legend__dot--cost" />
              Product Cost
            </span>
            <span className="dashboard-legend__item">
              <span className="dashboard-legend__dot dashboard-legend__dot--profit" />
              Profit
            </span>
          </div>
        </div>

        <div className="dashboard-analytics__grid">
          <div className="dashboard-sales-board card-wrapper">
            <div className="dashboard-sales-board__grid">
              {[3000, 2000, 1000, 0].map((amount) => (
                <div className="dashboard-sales-board__line" key={amount}>
                  <span className="dashboard-sales-board__amount">${amount}</span>
                </div>
              ))}
              <span className="dashboard-sales-board__empty">No data</span>
            </div>
          </div>

          <aside className="dashboard-overview card-wrapper">
            <div className="dashboard-overview__head">
              <span>Overview</span>
              <button
                type="button"
                aria-label={overviewEditing ? "Save overview" : "Edit overview"}
                onClick={() => setOverviewEditing((current) => !current)}
              >
                <LuPencil />
              </button>
            </div>

            <div className="dashboard-overview__rows">
              {dashboardOverviewRows.map((row) => (
                <div className="dashboard-overview__row" key={row.label}>
                  <span>{row.label}</span>
                  {overviewEditing ? (
                    <input
                      value={overviewValues[row.label]}
                      onChange={(event) =>
                        setOverviewValues((current) => ({
                          ...current,
                          [row.label]: event.target.value,
                        }))
                      }
                    />
                  ) : (
                    <strong>{overviewValues[row.label]}</strong>
                  )}
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="dashboard-bottom-grid">
        <div className="dashboard-card card-wrapper">
          <div className="dashboard-card__head">
            <h2 className="dashboard-block__title">Top 0 Selling Tags</h2>
            <CompactDateRange
              from={fromDate}
              to={toDate}
              onFromChange={setFromDate}
              onToChange={setToDate}
            />
          </div>

          <div className="dashboard-empty-card">
            <span className="dashboard-empty-card__icon">
              <LuEyeOff />
            </span>
            <p>We didn&apos;t find any tags</p>
          </div>
        </div>

        <div className="dashboard-card card-wrapper">
          <div className="dashboard-card__head">
            <h2 className="dashboard-block__title">Top 3 Selling Products</h2>
            <CompactDateRange
              from={fromDate}
              to={toDate}
              onFromChange={setFromDate}
              onToChange={setToDate}
            />
          </div>

          {visibleProducts.length ? (
            <div className="dashboard-top-products">
              {visibleProducts.map((item, index) => (
                <article
                  className={`dashboard-top-products__item ${selectedProductId === item.id ? "dashboard-top-products__item--active" : ""}`}
                  key={item.id}
                  onClick={() => setSelectedProductId(item.id)}
                >
                  <div className="dashboard-top-products__rank">{index + 1}</div>

                  <div className="dashboard-top-products__thumb">
                    <img src={item.image} alt={item.title} />
                  </div>

                  <div className="dashboard-top-products__copy">
                    <h3>{item.title}</h3>
                    <span>{item.sold}</span>
                  </div>

                  <DashboardSparkline values={item.sparkline} />
                </article>
              ))}
            </div>
          ) : (
            <div className="dashboard-empty-card dashboard-empty-card--products">
              <span className="dashboard-empty-card__icon">
                <LuInbox />
              </span>
              <p>No products match the current search.</p>
            </div>
          )}
        </div>
      </section>
    </section>
  );
}

function OrdersContent({ searchQuery }) {
  const [orders, setOrders] = useState(initialOrders);
  const [showWelcomeModal, setShowWelcomeModal] = useState(true);
  const [showTutorialNote, setShowTutorialNote] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showOnlyActive, setShowOnlyActive] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [buyerFilter, setBuyerFilter] = useState("");
  const [fromDate, setFromDate] = useState("2026-04-17");
  const [toDate, setToDate] = useState("2026-04-21");
  const [sortDirection, setSortDirection] = useState("desc");
  const [credits, setCredits] = useState(5);
  const [ordersNotice, setOrdersNotice] = useState("");
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [openStatusId, setOpenStatusId] = useState("");
  const [openActionsId, setOpenActionsId] = useState("");
  const [openDetailsId, setOpenDetailsId] = useState("");
  const tableScrollRef = useRef(null);

  useEffect(() => {
    const handleDocumentClick = () => {
      setOpenStatusId("");
      setOpenActionsId("");
    };

    document.addEventListener("click", handleDocumentClick);

    return () => document.removeEventListener("click", handleDocumentClick);
  }, []);

  const filteredOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const nextOrders = orders.filter((order) => {
      if (showOnlyActive && order.status === "Canceled") {
        return false;
      }

      if (statusFilter !== "All Statuses" && order.status !== statusFilter) {
        return false;
      }

      if (buyerFilter.trim()) {
        if (!order.buyer.toLowerCase().includes(buyerFilter.trim().toLowerCase())) {
          return false;
        }
      }

      if (order.date < fromDate || order.date > toDate) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [
        order.title,
        order.color,
        order.buyer,
        order.itemBuy,
        order.itemSell,
        order.orderSellId,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });

    return nextOrders.sort((left, right) =>
      sortDirection === "desc" ? right.date.localeCompare(left.date) : left.date.localeCompare(right.date),
    );
  }, [buyerFilter, fromDate, orders, searchQuery, showOnlyActive, sortDirection, statusFilter, toDate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredOrders.length, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const visibleOrders = filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const allVisibleSelected =
    visibleOrders.length > 0 && visibleOrders.every((order) => selectedIds.includes(order.id));

  const activeFilterChips = [
    showOnlyActive
      ? {
          key: "active",
          label: "Active",
          onRemove: () => setShowOnlyActive(false),
        }
      : null,
    statusFilter !== "All Statuses"
      ? {
          key: "status",
          label: statusFilter,
          onRemove: () => setStatusFilter("All Statuses"),
        }
      : null,
    buyerFilter.trim()
      ? {
          key: "buyer",
          label: buyerFilter.trim(),
          onRemove: () => setBuyerFilter(""),
        }
      : null,
  ].filter(Boolean);

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds((current) => current.filter((id) => !visibleOrders.some((order) => order.id === id)));
      return;
    }

    setSelectedIds((current) => [...new Set([...current, ...visibleOrders.map((order) => order.id)])]);
  };

  const toggleSelection = (orderId) => {
    setSelectedIds((current) =>
      current.includes(orderId) ? current.filter((id) => id !== orderId) : [...current, orderId],
    );
  };

  const updateOrderStatus = (orderId, nextStatus) => {
    setOrders((current) =>
      current.map((order) => (order.id === orderId ? { ...order, status: nextStatus } : order)),
    );
    setOpenStatusId("");
    setOrdersNotice(`Order ${orderId.replace("order-", "#")} moved to ${nextStatus}.`);
  };

  const scrollTable = (position) => {
    const element = tableScrollRef.current;

    if (!element) {
      return;
    }

    element.scrollTo({
      left: position === "end" ? element.scrollWidth : 0,
      behavior: "smooth",
    });
  };

  const statusMeta = {
    Pending: { icon: LuClock3, className: "pending" },
    Ordered: { icon: LuClipboardList, className: "ordered" },
    Shipped: { icon: LuTruck, className: "shipped" },
    Delivered: { icon: LuBadgeCheck, className: "delivered" },
    Canceled: { icon: LuX, className: "canceled" },
  };

  const handleOrderAction = (orderId, action) => {
    if (action === "edit-order") {
      setOrdersNotice(`Order ${orderId.replace("order-", "#")} opened for editing.`);
    }

    if (action === "edit-product") {
      setOrdersNotice(`Product linked to ${orderId.replace("order-", "#")} opened for editing.`);
    }

    if (action === "ticket") {
      setOrdersNotice(`Support ticket draft created for ${orderId.replace("order-", "#")}.`);
    }

    setOpenActionsId("");
  };

  return (
    <section className="orders-page-content">
      {showWelcomeModal ? (
        <div className="orders-modal">
          <div className="orders-modal__backdrop" onClick={() => setShowWelcomeModal(false)} />
          <div className="orders-modal__card">
            <button
              type="button"
              className="orders-modal__close"
              aria-label="Close orders modal"
              onClick={() => setShowWelcomeModal(false)}
            >
              <LuX />
            </button>

            <div className="orders-modal__celebration">
              <span className="orders-modal__check">
                <LuCheck />
              </span>
            </div>

            <h2>Congratulations!</h2>
            <h3>First Order Received</h3>
            <p>You&apos;ve just received your very first order — amazing job!</p>
            <p>Time to grow your business — take a 1-minute tour to learn the basics.</p>

            <button type="button" className="orders-modal__primary" onClick={() => setShowWelcomeModal(false)}>
              Take a Tour
            </button>
            <button type="button" className="orders-modal__secondary" onClick={() => setShowWelcomeModal(false)}>
              No, I know how to do it
            </button>
          </div>
        </div>
      ) : null}

      <div className="orders-toolbar">
        <div className="orders-toolbar__left">
          <button type="button" className="orders-filter-toggle" onClick={() => setShowFilters((current) => !current)}>
            <LuSlidersHorizontal />
            <span>Add Filter</span>
          </button>

          {activeFilterChips.length ? (
            <div className="orders-filter-chips">
              {activeFilterChips.map((chip) => (
                <button type="button" className="orders-filter-chip" key={chip.key} onClick={chip.onRemove}>
                  <span>x</span>
                  <span>{chip.label}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="orders-toolbar__actions">
          <button type="button" className="orders-tour-btn" onClick={() => setShowWelcomeModal(true)}>
            <LuPlay />
            <span>Take Orders Demo Tour</span>
          </button>
          <button
            type="button"
            className="dashboard-secondary-btn dashboard-secondary-btn--orders"
            onClick={() => setShowTutorialNote((current) => !current)}
          >
            <LuPlay />
            <span>Watch Tutorial</span>
          </button>
        </div>
      </div>

      {showTutorialNote ? (
        <div className="orders-inline-note">
          <LuPlay />
          <span>Orders tutorial is active: use filters, status dropdowns, and row actions to manage order flow.</span>
        </div>
      ) : null}

      {ordersNotice ? (
        <div className="orders-inline-note orders-inline-note--success">
          <LuBadgeCheck />
          <span>{ordersNotice}</span>
          <button type="button" onClick={() => setOrdersNotice("")} aria-label="Dismiss orders note">
            <LuX />
          </button>
        </div>
      ) : null}

      {showFilters ? (
        <div className="orders-filter-panel card-wrapper">
          <label className="orders-filter-panel__field">
            <span>Status</span>
            <div className="orders-filter-panel__select">
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="All Statuses">All Statuses</option>
                {orderStatusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <LuChevronDown />
            </div>
          </label>

          <label className="orders-filter-panel__field">
            <span>Buyer Username</span>
            <input
              type="text"
              value={buyerFilter}
              onChange={(event) => setBuyerFilter(event.target.value)}
              placeholder="Search buyer"
            />
          </label>

          <CompactDateRange
            from={fromDate}
            to={toDate}
            onFromChange={setFromDate}
            onToChange={setToDate}
          />

          <label className="orders-active-toggle">
            <input
              type="checkbox"
              checked={showOnlyActive}
              onChange={(event) => setShowOnlyActive(event.target.checked)}
            />
            <span>Show active orders only</span>
          </label>
        </div>
      ) : null}

      <div className="orders-summary-row">
        <label className="orders-select-all">
          <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAll} />
          <span>{selectedIds.length} Results Selected</span>
        </label>

        <div className="orders-summary-row__actions">
          <div className="orders-credits">
            <LuZap />
            <span>Auto Order Credits: {credits}</span>
            <span className="orders-credits__help">?</span>
          </div>

          <button
            type="button"
            className="orders-buy-btn"
            onClick={() => {
              setCredits((current) => current + 5);
              setOrdersNotice("5 auto order credits added to your balance.");
            }}
          >
            Buy Credits
          </button>

          <button type="button" className="orders-icon-btn" onClick={() => scrollTable("end")} aria-label="Show more columns">
            <LuMenu />
          </button>
          <button type="button" className="orders-icon-btn" onClick={() => scrollTable("start")} aria-label="Return to start">
            <LuExternalLink />
          </button>
        </div>
      </div>

      <div className="orders-table-shell">
        <div className="orders-table-scroll" ref={tableScrollRef}>
          <table className="orders-table">
            <thead>
              <tr>
                <th className="orders-table__checkbox-col" />
                <th>Name</th>
                <th>
                  <button type="button" className="orders-sort-btn" onClick={() => setSortDirection((current) => (current === "desc" ? "asc" : "desc"))}>
                    <span>Date</span>
                    <LuChevronDown className={sortDirection === "asc" ? "orders-sort-btn__icon orders-sort-btn__icon--asc" : "orders-sort-btn__icon"} />
                  </button>
                </th>
                <th>Order Status</th>
                <th>Estimated Arrival</th>
                <th className="orders-table__actions-col" />
                <th>Sourcing Request</th>
                <th>Tracking Number</th>
                <th>Item ID</th>
                <th>Buyer Username</th>
                <th>Price</th>
                <th>Profit</th>
                <th>Fee/Tax</th>
                <th>Order ID</th>
                <th>Tags</th>
              </tr>
            </thead>

            <tbody>
              {visibleOrders.length ? (
                visibleOrders.map((order) => {
                  const meta = statusMeta[order.status];
                  const StatusIcon = meta.icon;

                  return (
                    <tr
                      className={openDetailsId === order.id ? "orders-table__row orders-table__row--active" : "orders-table__row"}
                      key={order.id}
                    >
                      <td className="orders-table__checkbox-col">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(order.id)}
                          onChange={() => toggleSelection(order.id)}
                        />
                      </td>

                      <td>
                        <div className="orders-product">
                          <div className="orders-product__thumb">
                            <img src={order.image} alt={order.title} />
                          </div>
                          <div className="orders-product__copy">
                            <h3>{order.title}</h3>
                            <p>{order.color}</p>
                          </div>
                        </div>
                      </td>

                      <td className="orders-table__date">{formatDisplayDate(order.date)}</td>

                      <td className="orders-table__status-cell">
                        <div className="orders-status-wrap" onClick={(event) => event.stopPropagation()}>
                          <button
                            type="button"
                            className={`orders-status-badge orders-status-badge--${meta.className}`}
                            onClick={() => {
                              setOpenActionsId("");
                              setOpenStatusId((current) => (current === order.id ? "" : order.id));
                            }}
                          >
                            <span className="orders-status-badge__left">
                              <StatusIcon />
                              <span>{order.status}</span>
                            </span>
                            <LuChevronDown />
                          </button>

                          {openStatusId === order.id ? (
                            <div className="orders-status-menu">
                              <button
                                type="button"
                                className="orders-status-menu__header"
                                onClick={() => updateOrderStatus(order.id, "Ordered")}
                              >
                                Send To Auto Order
                              </button>

                              {orderStatusOptions.map((option) => {
                                const optionMeta = statusMeta[option];
                                const OptionIcon = optionMeta.icon;

                                return (
                                  <button
                                    type="button"
                                    className="orders-status-menu__item"
                                    key={option}
                                    onClick={() => updateOrderStatus(order.id, option)}
                                  >
                                    <OptionIcon />
                                    <span>{option}</span>
                                  </button>
                                );
                              })}
                            </div>
                          ) : null}
                        </div>
                      </td>

                      <td className="orders-table__details-cell">
                        <div className="orders-details">
                          <span>{order.estimatedArrival}</span>
                          <button
                            type="button"
                            className="orders-details__link"
                            onClick={() => setOpenDetailsId((current) => (current === order.id ? "" : order.id))}
                          >
                            Details
                          </button>

                          {openDetailsId === order.id ? (
                            <div className="orders-details__popover">
                              <span className="orders-details__icon">
                                <LuInbox />
                              </span>
                              <strong>No details yet</strong>
                            </div>
                          ) : null}
                        </div>
                      </td>

                      <td className="orders-table__actions-col">
                        <div className="orders-row-actions" onClick={(event) => event.stopPropagation()}>
                          <button
                            type="button"
                            className="orders-row-actions__icon"
                            onClick={() => setOpenDetailsId((current) => (current === order.id ? "" : order.id))}
                            aria-label="Open details"
                          >
                            <LuClipboardList />
                          </button>
                          <button
                            type="button"
                            className="orders-row-actions__icon"
                            onClick={() => {
                              setOpenStatusId("");
                              setOpenActionsId((current) => (current === order.id ? "" : order.id));
                            }}
                            aria-label="More options"
                          >
                            <LuEllipsisVertical />
                          </button>

                          {openActionsId === order.id ? (
                            <div className="orders-actions-menu">
                              <button type="button" onClick={() => handleOrderAction(order.id, "edit-order")}>
                                <LuClipboardList />
                                <span>Edit Order</span>
                              </button>
                              <button type="button" onClick={() => handleOrderAction(order.id, "edit-product")}>
                                <LuBox />
                                <span>Edit Product</span>
                              </button>
                              <button type="button" onClick={() => handleOrderAction(order.id, "ticket")}>
                                <LuPencil />
                                <span>Create a ticket about the order</span>
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </td>

                      <td>{order.sourcingRequest}</td>
                      <td>{order.trackingNumber}</td>

                      <td>
                        <div className="orders-paired-values">
                          <div>
                            <span className="orders-paired-values__type">BUY</span>
                            <span className="orders-paired-values__platform">ebay</span>
                            <strong>{order.itemBuy}</strong>
                          </div>
                          <div>
                            <span className="orders-paired-values__type">SELL</span>
                            <span className="orders-paired-values__platform">ebay</span>
                            <strong>{order.itemSell}</strong>
                          </div>
                        </div>
                      </td>

                      <td className="orders-table__buyer">{order.buyer}</td>

                      <td>
                        <div className="orders-paired-values">
                          <div>
                            <span className="orders-paired-values__type">BUY</span>
                            <strong>{order.price}</strong>
                          </div>
                          <div>
                            <span className="orders-paired-values__type">SELL</span>
                            <strong>{order.price}</strong>
                          </div>
                        </div>
                      </td>

                      <td className="orders-table__profit">{order.profit}</td>
                      <td>{order.feeTax}</td>

                      <td>
                        <div className="orders-paired-values">
                          <div>
                            <span className="orders-paired-values__type">BUY</span>
                            <span className="orders-paired-values__platform">ebay</span>
                            <strong>{order.orderBuyId}</strong>
                          </div>
                          <div>
                            <span className="orders-paired-values__type">SELL</span>
                            <span className="orders-paired-values__platform">ebay</span>
                            <strong>{order.orderSellId}</strong>
                          </div>
                        </div>
                      </td>

                      <td>{order.tags}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td className="orders-table__empty" colSpan={15}>
                    <LuInbox />
                    <span>No orders match the current filters.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="orders-table-footer">
          <div className="orders-pagination">
            <button type="button" className="orders-pagination__arrow" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}>
              <LuChevronLeft />
            </button>

            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <button
                type="button"
                className={page === currentPage ? "orders-pagination__page orders-pagination__page--active" : "orders-pagination__page"}
                key={page}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              className="orders-pagination__arrow"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            >
              <LuChevronRight />
            </button>
          </div>

          <div className="orders-table-footer__meta">
            <label>
              <span>Show</span>
              <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={30}>30</option>
              </select>
            </label>
            <span>Orders out of {orders.length}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function HelpCenterContent() {
  const helpCards = [
    {
      title: "Help center",
      subtitle: "Technical information",
      icon: LuHeadphones,
      tone: "mint",
    },
    {
      title: "Feature Request",
      subtitle: "",
      icon: LuMessageCircleMore,
      tone: "aqua",
    },
    {
      title: "From our blog",
      subtitle: "",
      icon: LuFilePenLine,
      tone: "rose",
    },
  ];

  return (
    <section className="help-center-page">
      <div className="help-center__cards">
        {helpCards.map((card) => {
          const Icon = card.icon;

          return (
            <button type="button" className="help-center-card" key={card.title}>
              <span className={`help-center-card__icon help-center-card__icon--${card.tone}`}>
                <Icon />
              </span>
              <span className="help-center-card__copy">
                <strong>{card.title}</strong>
                {card.subtitle ? <span>{card.subtitle}</span> : null}
              </span>
              <LuChevronRight className="help-center-card__arrow" />
            </button>
          );
        })}
      </div>

      <section className="help-center-mentorship">
        <div className="help-center-mentorship__visual" aria-hidden="true">
          <div className="help-center-mentorship__photo help-center-mentorship__photo--top" />
          <div className="help-center-mentorship__photo help-center-mentorship__photo--bottom" />
          <div className="help-center-mentorship__chat">
            <strong>AUTO-DS</strong>
            <span>Hey John, do you find the right products for you?</span>
            <em>Yes! You always helped me a lot!</em>
            <span>Great, we are here for you.</span>
          </div>
        </div>

        <div className="help-center-mentorship__copy">
          <h2>AutoDS` 1-on-1<br />Dropshipping Mentorships</h2>
          <p>Get personal help from expert dropshippers</p>
        </div>

        <button type="button" className="help-center-mentorship__cta">
          START NOW
        </button>
      </section>

      <div className="help-center-links">
        <button type="button">
          <LuPlay />
          <span>YouTube Channel</span>
        </button>
        <button type="button">
          <LuMessageCircleMore />
          <span>Facebook community</span>
        </button>
        <button type="button">
          <LuExternalLink />
          <span>Telegram group</span>
        </button>
        <button type="button">
          <LuCheck />
          <span>System status</span>
        </button>
      </div>
    </section>
  );
}

function WalletContent() {
  const walletBenefits = [
    "Save up to 1.5% on your AutoDS subscription and managed services",
    "Receive your dropshipping sales to a Payoneer issued USD bank account with no landing fee",
    "Cover your business expenses using the Payoneer card for FREE",
    "Save up to 2% on currency conversions",
    "Earn up to 1% cashback on card spend/PPC",
  ];

  return (
    <section className="wallet-page">
      <div className="wallet-card">
        <div className="wallet-card__brand-row">
          <div className="wallet-brand wallet-brand--autods">AUTO-DS-</div>
          <div className="wallet-brand wallet-brand--payoneer">
            <span className="wallet-brand__ring" aria-hidden="true" />
            <span>Payoneer</span>
          </div>
        </div>

        <div className="wallet-card__body">
          <div className="wallet-benefits">
            <h2>Take advantage of Payoneer's exclusive pricing structure with your AutoDS wallet</h2>
            <ul>
              {walletBenefits.map((benefit) => (
                <li key={benefit}>
                  <LuCheck />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="wallet-video" role="img" aria-label="AutoDS Wallet video preview">
            <div className="wallet-video__scrim" />
            <div className="wallet-video__title">
              <span className="wallet-video__channel">DS</span>
              <div>
                <strong>AutoDS Wallet - October 2023 Fees Update</strong>
                <span>AutoDS - Build Your Online Income</span>
              </div>
            </div>
            <button type="button" className="wallet-video__play" aria-label="Play wallet video">
              <LuPlay />
            </button>
            <div className="wallet-video__bottom">
              <div className="wallet-video__tools">
                <button type="button" aria-label="Share video">
                  <LuExternalLink />
                </button>
                <button type="button" aria-label="Watch later">
                  <LuClock3 />
                </button>
              </div>
              <span>
                Watch on <strong>YouTube</strong>
              </span>
            </div>
          </div>
        </div>

        <div className="wallet-card__footer">
          <button type="button" className="wallet-card__primary-btn">
            Sign Up to Payoneer
          </button>
          <button type="button" className="wallet-card__link-btn">
            I already have an account
          </button>
        </div>
      </div>
    </section>
  );
}

function DraftsContent({ searchQuery }) {
  const [drafts, setDrafts] = useState(initialDrafts);
  const [activeTab, setActiveTab] = useState("drafts");
  const [showFilters, setShowFilters] = useState(false);
  const [showTutorialNote, setShowTutorialNote] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [expandedIds, setExpandedIds] = useState(["draft-2"]);
  const [retryingIds, setRetryingIds] = useState([]);
  const [notice, setNotice] = useState("");
  const [openMenuId, setOpenMenuId] = useState("");
  const [editorTabById, setEditorTabById] = useState({
    "draft-2": "product",
  });

  const visibleDrafts = useMemo(() => {
    if (activeTab !== "drafts") {
      return [];
    }

    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return drafts;
    }

    return drafts.filter((item) =>
      [item.title, item.store, item.supplier, item.issue].join(" ").toLowerCase().includes(query),
    );
  }, [activeTab, drafts, searchQuery]);

  const allVisibleSelected =
    visibleDrafts.length > 0 && visibleDrafts.every((item) => selectedIds.includes(item.id));
  const allExpanded =
    visibleDrafts.length > 0 && visibleDrafts.every((item) => expandedIds.includes(item.id));

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds((current) => current.filter((id) => !visibleDrafts.some((item) => item.id === id)));
      return;
    }

    setSelectedIds((current) => [...new Set([...current, ...visibleDrafts.map((item) => item.id)])]);
  };

  const toggleSelectOne = (draftId) => {
    setSelectedIds((current) =>
      current.includes(draftId) ? current.filter((id) => id !== draftId) : [...current, draftId],
    );
  };

  const toggleExpanded = (draftId) => {
    setExpandedIds((current) =>
      current.includes(draftId) ? current.filter((id) => id !== draftId) : [...current, draftId],
    );
  };

  const toggleExpandAll = () => {
    setExpandedIds(allExpanded ? [] : visibleDrafts.map((item) => item.id));
  };

  const setEditorTab = (draftId, nextTab) => {
    setEditorTabById((current) => ({
      ...current,
      [draftId]: nextTab,
    }));
  };

  const runBulkAction = (action) => {
    if (!selectedIds.length) {
      setNotice("Select at least one draft to use this action.");
      return;
    }

    if (action === "remove") {
      setDrafts((current) => current.filter((item) => !selectedIds.includes(item.id)));
      setExpandedIds((current) => current.filter((id) => !selectedIds.includes(id)));
      setNotice(`${selectedIds.length} draft${selectedIds.length === 1 ? "" : "s"} removed from list.`);
      setSelectedIds([]);
      return;
    }

    const labels = {
      edit: "Bulk edit opened",
      import: "Import all started",
      rewrite: "Bulk AI rewrite queued",
      schedule: "Schedule listings opened",
    };

    setNotice(`${labels[action]} for ${selectedIds.length} selected draft${selectedIds.length === 1 ? "" : "s"}.`);
  };

  const retryDraft = (draftId) => {
    setRetryingIds((current) => [...new Set([...current, draftId])]);
    setNotice("Draft retry queued. The row will remain in drafts until upload completes.");
  };

  const handleDraftMenu = (draftId, action) => {
    if (action === "schedule") {
      setNotice("Schedule Listing panel opened for the selected draft.");
    }

    if (action === "delete") {
      setDrafts((current) => current.filter((item) => item.id !== draftId));
      setExpandedIds((current) => current.filter((id) => id !== draftId));
      setSelectedIds((current) => current.filter((id) => id !== draftId));
      setNotice("Draft deleted from the upload list.");
    }

    if (action === "viral") {
      setNotice("Go Viral with TikTok Ads is ready for this draft.");
    }

    setOpenMenuId("");
  };

  const renderDraftEditor = (item) => {
    const baseEditor = draftEditorTemplates[item.id] || draftEditorTemplates["draft-2"];
    const editor = {
      ...baseEditor,
      product: {
        ...baseEditor.product,
        title: item.title,
      },
      variants: baseEditor.variants.slice(0, Math.max(1, item.variants)),
    };

    const activeEditorTab = editorTabById[item.id] || "product";

    return (
      <div className="draft-editor">
        <div className="draft-editor__shell">
          <div className="draft-editor__rail">
            <span />
            <span />
          </div>

          <div className="draft-editor__main">
            <div className="draft-editor__header">
              <div className="draft-editor__heading">
                <img src={item.image} alt={item.title} />
                <div>
                  <h4>{item.title}</h4>
                  <div className="drafts-row__meta">
                    <span>Destination:</span>
                    <span>{item.store}</span>
                    <i aria-hidden="true" />
                    <span className="drafts-row__screen" aria-hidden="true" />
                    <i aria-hidden="true" />
                    <span>Supplier: {item.supplier}</span>
                    <i aria-hidden="true" />
                    <span>Variants: {item.variants}</span>
                    <i aria-hidden="true" />
                    <button type="button">View Source Product</button>
                  </div>
                </div>
              </div>

              <div className="draft-editor__actions">
                <button type="button" className="orders-row-actions__icon" aria-label="Open source product">
                  <LuExternalLink />
                </button>
                <button type="button" className="orders-row-actions__icon" aria-label="Open editor menu">
                  <LuEllipsisVertical />
                </button>
                <button type="button" className="draft-editor__save">
                  <LuCheck />
                  <span>Save</span>
                </button>
                <button type="button" className="draft-editor__retry">
                  <LuRefreshCcw />
                  <span>Save & Retry</span>
                </button>
              </div>
            </div>

            <nav className="draft-editor__tabs" aria-label="Draft editor sections">
              {[
                ["product", "Product"],
                ["description", "Description"],
                ["variants", `Variants (${item.variants})`],
                ["images", "Images"],
                ["specifics", "Item Specifications"],
              ].map(([key, label]) => (
                <button
                  type="button"
                  key={key}
                  className={activeEditorTab === key ? "draft-editor__tab draft-editor__tab--active" : "draft-editor__tab"}
                  onClick={() => setEditorTab(item.id, key)}
                >
                  {label}
                </button>
              ))}
            </nav>

            <div className="draft-editor__panel">
              {activeEditorTab === "product" ? (
                <div className="draft-editor__form">
                  <div className="draft-editor__title-row">
                    <label>
                      <span>
                        Title <em>80/80</em> <button type="button">Optimize Your Title</button>
                      </span>
                      <input type="text" value={editor.product.title} readOnly />
                    </label>
                    <button type="button">Optimize Title With AI</button>
                  </div>

                  <div className="draft-editor__grid draft-editor__grid--single">
                    <label>
                      <span>Category</span>
                      <button type="button" className="draft-editor__select">
                        <span>{editor.product.category}</span>
                        <LuChevronDown />
                      </button>
                    </label>
                  </div>

                  <div className="draft-editor__grid">
                    <label>
                      <span>Tags</span>
                      <button type="button" className="draft-editor__select draft-editor__select--placeholder">
                        <span>Enter Tag</span>
                        <LuChevronDown />
                      </button>
                    </label>
                    <label>
                      <span>Shipping Methods</span>
                      <button type="button" className="draft-editor__select">
                        <span>{editor.product.shippingMethod}</span>
                        <LuChevronDown />
                      </button>
                    </label>
                  </div>

                  <label className="draft-editor__toggle-row">
                    <span className="draft-editor__toggle" />
                    <span>Use Dynamic Policies (Shipping, Payment, Returns)</span>
                    <strong>?</strong>
                  </label>

                  <div className="draft-editor__grid">
                    <label>
                      <span>Payment Policy</span>
                      <button type="button" className="draft-editor__select draft-editor__select--placeholder">
                        <span>{editor.product.paymentPolicy}</span>
                        <LuChevronDown />
                      </button>
                    </label>
                    <label>
                      <span>Shipping Policy</span>
                      <button type="button" className="draft-editor__select draft-editor__select--placeholder">
                        <span>{editor.product.shippingPolicy}</span>
                        <LuChevronDown />
                      </button>
                    </label>
                  </div>

                  <div className="draft-editor__grid">
                    <label>
                      <span>Return Policy</span>
                      <button type="button" className="draft-editor__select draft-editor__select--placeholder">
                        <span>{editor.product.returnPolicy}</span>
                        <LuChevronDown />
                      </button>
                    </label>
                  </div>

                  <div className="draft-editor__grid">
                    <label>
                      <span>Country Location</span>
                      <button type="button" className="draft-editor__select">
                        <span>{editor.product.countryLocation}</span>
                        <LuChevronDown />
                      </button>
                    </label>
                    <label>
                      <span>Default Zipcode</span>
                      <div className="draft-editor__zipcode-row">
                        <input type="text" value={editor.product.zipcode} readOnly />
                        <button type="button" aria-label="Refresh zipcode">
                          <LuRefreshCcw />
                        </button>
                        <button type="button" className="draft-editor__location-chip">
                          <LuStore />
                          <span>{editor.product.suburb}</span>
                        </button>
                      </div>
                    </label>
                  </div>

                  <div className="draft-editor__grid draft-editor__grid--single">
                    <label>
                      <span>Brand</span>
                      <input type="text" value={editor.product.brand} readOnly />
                    </label>
                  </div>

                  <div className="draft-editor__monitoring">
                    <span>Monitoring</span>
                    {editor.product.monitoring.map((label) => (
                      <label className="draft-editor__toggle-row" key={label}>
                        <span className="draft-editor__toggle draft-editor__toggle--active" />
                        <span>{label}</span>
                        <strong>?</strong>
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}

              {activeEditorTab === "description" ? (
                <div className="draft-editor__description-card">
                  <div className="draft-editor__description-head">
                    <h5>Description</h5>
                    <button type="button">Optimize Description With AI</button>
                  </div>
                  <div className="draft-editor__toolbar">
                    {["B", "I", "U", "S", "x", "x", "T", "|", "=", "=", "=", "=", "|", "Font", "Size", "A", "A", "Source", "<", ">"].map((tool) => (
                      <span key={tool}>{tool}</span>
                    ))}
                  </div>
                  <div className="draft-editor__description-body">
                    {editor.description.split("\n").map((line, index) => (
                      <p key={`${line}-${index}`}>{line || "\u00A0"}</p>
                    ))}
                  </div>
                </div>
              ) : null}

              {activeEditorTab === "variants" ? (
                <div className="draft-editor__variants">
                  <div className="draft-editor__variants-head">
                    <span>0 Variant Selected</span>
                    <button type="button">
                      Edit Variations Options <span className="drafts-help">?</span>
                    </button>
                  </div>
                  <div className="draft-editor__variant-list">
                    {editor.variants.map((variant) => (
                      <div className="draft-editor__variant-row" key={variant.id}>
                        <label>
                          <input type="checkbox" />
                        </label>
                        <img src={variant.image} alt={variant.title} />
                        <div>
                          <strong>{variant.title}</strong>
                          <div>
                            <span>IN STOCK</span>
                            <em>Buy ID: {variant.sku}</em>
                            <em>Price: {variant.price}</em>
                          </div>
                        </div>
                        <button type="button" className="orders-row-actions__icon" aria-label="Delete variant">
                          <LuTrash2 />
                        </button>
                        <button type="button" className="draft-editor__edit-btn">
                          <LuPencil />
                          <span>Edit</span>
                        </button>
                      </div>
                    ))}
                  </div>
                  <button type="button" className="draft-editor__add-inline">
                    <LuPlus />
                    <span>Add Variant</span>
                  </button>
                </div>
              ) : null}

              {activeEditorTab === "images" ? (
                <div className="draft-editor__images">
                  <div className="draft-editor__images-head">
                    <span>
                      <strong>?</strong> 0 Image Selected:
                    </span>
                  </div>
                  <div className="draft-editor__images-copy">
                    <h5>Product Images</h5>
                    <p>Upload an image in PNG, JPG, JPEG format. File size should be 5 MB max.</p>
                  </div>
                  <div className="draft-editor__image-grid">
                    {editor.images.map((image) => (
                      <label className={image.primary ? "draft-editor__image draft-editor__image--primary" : "draft-editor__image"} key={image.id}>
                        <input type="checkbox" />
                        <img src={image.src} alt="" />
                        {image.label ? <span className="draft-editor__image-tag">{image.label}</span> : null}
                        {image.primary ? <span className="draft-editor__image-main">Main image</span> : null}
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}

              {activeEditorTab === "specifics" ? (
                <div className="draft-editor__specifics">
                  <div className="draft-editor__specifics-toolbar">
                    <div>
                      <button type="button">
                        <LuPlus />
                        <span>Add Item Specification</span>
                      </button>
                      <button type="button">
                        <LuPencil />
                        <span>Edit All Item Specifications</span>
                      </button>
                      <button type="button">
                        <LuExternalLink />
                        <span>Copy from URL</span>
                      </button>
                    </div>
                    <span>
                      3 Recommended Item specifics <span className="drafts-help">?</span>
                    </span>
                  </div>
                  <div className="draft-editor__specifics-table">
                    {editor.specifics.map((row) => (
                      <div className="draft-editor__specifics-row" key={row.label}>
                        <span>{row.label}</span>
                        <div>{row.value}</div>
                        <button type="button" className="orders-row-actions__icon" aria-label={`Edit ${row.label}`}>
                          <LuPencil />
                        </button>
                        <button type="button" className="orders-row-actions__icon" aria-label={`Delete ${row.label}`}>
                          <LuTrash2 />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const emptyMessage =
    activeTab === "scheduled"
      ? "No scheduled uploads yet."
      : activeTab === "recurring"
        ? "No recurring uploads yet."
        : "No drafts match the current search.";

  return (
    <section className="drafts-page-content">
      <nav className="drafts-tabs" aria-label="Upload sections">
        <button
          type="button"
          className={`drafts-tab ${activeTab === "drafts" ? "drafts-tab--active" : ""}`}
          onClick={() => setActiveTab("drafts")}
        >
          Drafts ({DRAFT_UPLOAD_COUNT})
        </button>
        <button
          type="button"
          className={`drafts-tab ${activeTab === "scheduled" ? "drafts-tab--active" : ""}`}
          onClick={() => setActiveTab("scheduled")}
        >
          Scheduled (0) <span className="drafts-help">?</span>
        </button>
        <button
          type="button"
          className={`drafts-tab ${activeTab === "recurring" ? "drafts-tab--active" : ""}`}
          onClick={() => setActiveTab("recurring")}
        >
          Recurring (0) <span className="drafts-help">?</span>
        </button>
      </nav>

      <div className="drafts-toolbar">
        <button type="button" className="orders-filter-toggle" onClick={() => setShowFilters((current) => !current)}>
          <LuSlidersHorizontal />
          <span>Add Filter</span>
        </button>

        <button
          type="button"
          className="dashboard-secondary-btn dashboard-secondary-btn--orders"
          onClick={() => setShowTutorialNote((current) => !current)}
        >
          <LuPlay />
          <span>Watch Tutorial</span>
        </button>
      </div>

      {showTutorialNote ? (
        <div className="orders-inline-note">
          <LuPlay />
          <span>Drafts tutorial is active: review failed upload details, retry rows, or schedule selected listings.</span>
        </div>
      ) : null}

      {showFilters ? (
        <div className="drafts-filter-panel card-wrapper">
          <label className="orders-filter-panel__field">
            <span>Status</span>
            <div className="orders-filter-panel__select">
              <select defaultValue="Failed">
                <option>Failed</option>
                <option>Ready</option>
                <option>Needs Review</option>
              </select>
              <LuChevronDown />
            </div>
          </label>

          <label className="orders-filter-panel__field">
            <span>Supplier</span>
            <div className="orders-filter-panel__select">
              <select defaultValue="eBay AU">
                <option>eBay AU</option>
                <option>Amazon AU</option>
                <option>CJ</option>
              </select>
              <LuChevronDown />
            </div>
          </label>

          <label className="orders-filter-panel__field">
            <span>Store</span>
            <div className="orders-filter-panel__select">
              <select defaultValue="nrf_enterprise_inc-llc-au">
                <option>nrf_enterprise_inc-llc-au</option>
                <option>sheikh002-au</option>
              </select>
              <LuChevronDown />
            </div>
          </label>
        </div>
      ) : null}

      <div className="drafts-selection-row">
        <div className="drafts-selection-row__left">
          <label className="orders-select-all drafts-select-all">
            <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAll} />
            <span>{selectedIds.length} Results Selected</span>
          </label>

          <div className={`drafts-bulk-actions ${selectedIds.length ? "" : "drafts-bulk-actions--disabled"}`}>
            <button type="button" onClick={() => runBulkAction("edit")}>
              <LuPencil />
              <span>Bulk Edit</span>
            </button>
            <button type="button" onClick={() => runBulkAction("remove")}>
              <LuTrash2 />
              <span>Remove from list</span>
            </button>
            <button type="button" onClick={() => runBulkAction("import")}>
              <LuPlus />
              <span>Import All</span>
              <span className="drafts-help">?</span>
            </button>
            <button type="button" onClick={() => runBulkAction("rewrite")}>
              <LuSparkles />
              <span>Bulk AI Rewrite</span>
            </button>
            <button type="button" onClick={() => runBulkAction("schedule")}>
              <LuClock3 />
              <span>Schedule Listings</span>
            </button>
          </div>
        </div>

        <div className="drafts-selection-row__right">
          <button type="button" onClick={() => setNotice("History panel is ready for the selected upload batch.")}>
            View History
          </button>
          <span aria-hidden="true" />
          <button type="button" onClick={toggleExpandAll}>
            {allExpanded ? "Collapse all" : "Expand all"} <span className="drafts-help">?</span>
          </button>
        </div>
      </div>

      {notice ? (
        <div className="orders-inline-note orders-inline-note--success">
          <LuBadgeCheck />
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice("")} aria-label="Dismiss drafts note">
            <LuX />
          </button>
        </div>
      ) : null}

      <div className="drafts-list card-wrapper">
        {visibleDrafts.length ? (
          visibleDrafts.map((item, index) => {
            const isSelected = selectedIds.includes(item.id);
            const isExpanded = expandedIds.includes(item.id);
            const isRetrying = retryingIds.includes(item.id);

            return (
              <div className="drafts-entry" key={item.id}>
                <article
                  className={`drafts-row ${index === 0 ? "drafts-row--featured" : ""} ${isSelected ? "drafts-row--selected" : ""} ${isExpanded ? "drafts-row--expanded" : ""}`}
                >
                  <label className="drafts-row__check">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectOne(item.id)}
                      aria-label={`Select ${item.title}`}
                    />
                  </label>

                  <button
                    type="button"
                    className={`drafts-row__expand ${isExpanded ? "drafts-row__expand--open" : ""}`}
                    onClick={() => toggleExpanded(item.id)}
                    aria-label={isExpanded ? "Collapse draft details" : "Expand draft details"}
                  >
                    <LuChevronRight />
                  </button>

                  <div className="drafts-row__thumb">
                    <img src={item.image} alt={item.title} />
                  </div>

                  <div className="drafts-row__body">
                    <h3>
                      <span className="drafts-row__error">!</span>
                      <span>{item.title}</span>
                    </h3>

                    <div className="drafts-row__meta">
                      <span>Destination:</span>
                      <span>{item.store}</span>
                      <i aria-hidden="true" />
                      <span className="drafts-row__screen" aria-hidden="true" />
                      <i aria-hidden="true" />
                      <span>Supplier: {item.supplier}</span>
                      <i aria-hidden="true" />
                      <span>Variants: {item.variants}</span>
                      <i aria-hidden="true" />
                      <button type="button">View Source Product</button>
                    </div>

                  </div>

                  <div className="drafts-row__actions">
                    <button type="button" className="orders-row-actions__icon" aria-label="Open source product">
                      <LuExternalLink />
                    </button>
                    <div className="drafts-row__menu-wrap">
                      <button
                        type="button"
                        className="orders-row-actions__icon"
                        aria-label="Open draft menu"
                        onClick={() => setOpenMenuId((current) => (current === item.id ? "" : item.id))}
                      >
                        <LuEllipsisVertical />
                      </button>

                      {openMenuId === item.id ? (
                        <div className="drafts-row__menu">
                          <button type="button" onClick={() => handleDraftMenu(item.id, "schedule")}>
                            <LuClock3 />
                            <span>Schedule Listing</span>
                          </button>
                          <button type="button" onClick={() => handleDraftMenu(item.id, "delete")}>
                            <LuTrash2 />
                            <span>Delete Draft</span>
                          </button>
                          <button type="button" onClick={() => handleDraftMenu(item.id, "viral")}>
                            <LuSparkles />
                            <span>Go Viral with TikTok Ads</span>
                          </button>
                        </div>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      className={`drafts-retry-btn ${isRetrying ? "drafts-retry-btn--active" : ""}`}
                      onClick={() => retryDraft(item.id)}
                    >
                      <LuRefreshCcw />
                      <span>{isRetrying ? "Queued" : "Retry"}</span>
                    </button>
                  </div>
                </article>

                {isExpanded ? renderDraftEditor(item) : null}
              </div>
            );
          })
        ) : (
          <div className="drafts-empty">
            <LuInbox />
            <span>{emptyMessage}</span>
          </div>
        )}
      </div>
    </section>
  );
}

function ProductsContent({ searchQuery }) {
  const [products, setProducts] = useState(initialProducts);
  const [alerts, setAlerts] = useState(initialProductAlerts);
  const [showFilters, setShowFilters] = useState(false);
  const [showTutorialNote, setShowTutorialNote] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [sortDirection, setSortDirection] = useState("desc");
  const [filterDate, setFilterDate] = useState("All Dates");
  const [notice, setNotice] = useState("");
  const [openMenuId, setOpenMenuId] = useState("");
  const [tableView, setTableView] = useState("compact");
  const tableScrollRef = useRef(null);

  useEffect(() => {
    const closeMenus = () => setOpenMenuId("");

    document.addEventListener("click", closeMenus);

    return () => document.removeEventListener("click", closeMenus);
  }, []);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const visible = products.filter((item) => {
      if (filterDate !== "All Dates" && item.uploaded !== filterDate) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [
        item.title,
        item.uploaded,
        item.priceBuy,
        item.priceSell,
        item.itemBuy,
        item.itemSell,
        item.store,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });

    return visible.sort((left, right) =>
      sortDirection === "desc"
        ? right.uploaded.localeCompare(left.uploaded)
        : left.uploaded.localeCompare(right.uploaded),
    );
  }, [filterDate, products, searchQuery, sortDirection]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredProducts.length, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const visibleProducts = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const allVisibleSelected =
    visibleProducts.length > 0 && visibleProducts.every((item) => selectedIds.includes(item.id));
  const paginationItems = buildPaginationItems(currentPage, totalPages);

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds((current) => current.filter((id) => !visibleProducts.some((item) => item.id === id)));
      return;
    }

    setSelectedIds((current) => [...new Set([...current, ...visibleProducts.map((item) => item.id)])]);
  };

  const toggleSelectOne = (productId) => {
    setSelectedIds((current) =>
      current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId],
    );
  };

  const dismissAlert = (alertId) => {
    setAlerts((current) => current.filter((item) => item.id !== alertId));
  };

  const applyBulkAction = (action) => {
    if (!selectedIds.length) {
      setNotice("Select at least one product to use bulk actions.");
      return;
    }

    if (action === "relist") {
      setNotice(`${selectedIds.length} products marked for relist.`);
    }

    if (action === "delete") {
      setProducts((current) => current.filter((item) => !selectedIds.includes(item.id)));
      setNotice(`${selectedIds.length} products removed from the table.`);
      setSelectedIds([]);
    }

    if (action === "rewrite") {
      setProducts((current) =>
        current.map((item) =>
          selectedIds.includes(item.id)
            ? {
                ...item,
                title: rewriteProductTitle(item.title),
              }
            : item,
        ),
      );
      setNotice(`${selectedIds.length} product titles rewritten with AI.`);
    }

    if (action === "edit") {
      setNotice(`${selectedIds.length} products opened for bulk edit.`);
    }
  };

  const handleProductAction = (productId, action) => {
    if (action === "request-sourcing") {
      setProducts((current) =>
        current.map((item) =>
          item.id === productId
            ? {
                ...item,
                sourcingRequested: !item.sourcingRequested,
              }
            : item,
        ),
      );
      setNotice(`Sourcing state updated for ${productId.replace("product-", "product #")}.`);
    }

    if (action === "open-editor") {
      setNotice(`Editor opened for ${productId.replace("product-", "product #")}.`);
    }

    if (action === "delete") {
      setProducts((current) => current.filter((item) => item.id !== productId));
      setSelectedIds((current) => current.filter((id) => id !== productId));
      setNotice(`${productId.replace("product-", "Product #")} deleted.`);
    }

    if (action === "menu-edit") {
      setNotice(`${productId.replace("product-", "Product #")} ready for manual editing.`);
    }

    if (action === "menu-store") {
      setNotice(`${productId.replace("product-", "Product #")} marked for store sync.`);
    }

    setOpenMenuId("");
  };

  const scrollTable = (position) => {
    const element = tableScrollRef.current;

    if (!element) {
      return;
    }

    element.scrollTo({
      left: position === "end" ? element.scrollWidth : 0,
      behavior: "smooth",
    });
  };

  return (
    <section className="products-page-content">
      <div className="products-heading">
        <h2 className="products-heading__title">
          Products ({products.length}) <span>and 1 more untracked products</span>
        </h2>
      </div>

      {alerts.length ? (
        <div className="products-alerts card-wrapper">
          {alerts.map((alert) => (
            <div className="products-alert" key={alert.id}>
              <div className="products-alert__copy">
                <span className={`products-alert__dot products-alert__dot--${alert.tone}`} />
                <span>{alert.message}</span>
                <button type="button" className="products-alert__link">
                  View details
                </button>
              </div>

              <button
                type="button"
                className="products-alert__dismiss"
                aria-label="Dismiss product alert"
                onClick={() => dismissAlert(alert.id)}
              >
                <LuX />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="products-toolbar">
        <button type="button" className="orders-filter-toggle" onClick={() => setShowFilters((current) => !current)}>
          <LuSlidersHorizontal />
          <span>Add Filter</span>
        </button>

        <div className="products-toolbar__actions">
          <button
            type="button"
            className="dashboard-secondary-btn dashboard-secondary-btn--orders"
            onClick={() => setShowTutorialNote((current) => !current)}
          >
            <LuPlay />
            <span>Watch Tutorial</span>
          </button>
          <button
            type="button"
            className="marketplace-search-panel__ugc-btn products-toolbar__ugc-btn"
            onClick={() => setNotice("UGC generation queue started for selected products.")}
          >
            <LuSparkles />
            <span>Generate Sales Ready UGC Ads</span>
          </button>
        </div>
      </div>

      {showTutorialNote ? (
        <div className="orders-inline-note">
          <LuPlay />
          <span>Products tutorial is active: use bulk tools, sourcing requests, and scrollable fields to manage listings.</span>
        </div>
      ) : null}

      {notice ? (
        <div className="orders-inline-note orders-inline-note--success">
          <LuBadgeCheck />
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice("")} aria-label="Dismiss products note">
            <LuX />
          </button>
        </div>
      ) : null}

      {showFilters ? (
        <div className="products-filter-panel card-wrapper">
          <label className="orders-filter-panel__field">
            <span>Uploaded</span>
            <div className="orders-filter-panel__select">
              <select value={filterDate} onChange={(event) => setFilterDate(event.target.value)}>
                <option value="All Dates">All Dates</option>
                {["2026-04-17", "2026-04-18", "2026-04-19", "2026-04-20"].map((option) => (
                  <option key={option} value={option}>
                    {formatDisplayDate(option)}
                  </option>
                ))}
              </select>
              <LuChevronDown />
            </div>
          </label>

          <label className="orders-filter-panel__field">
            <span>View Mode</span>
            <div className="orders-filter-panel__select">
              <select value={tableView} onChange={(event) => setTableView(event.target.value)}>
                <option value="compact">Compact</option>
                <option value="comfortable">Comfortable</option>
              </select>
              <LuChevronDown />
            </div>
          </label>
        </div>
      ) : null}

      <div className="products-selection-row">
        <div className="products-selection-row__left">
          <label className="orders-select-all">
            <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAll} />
            <span>{selectedIds.length} Results Selected</span>
          </label>

          <div className="products-bulk-actions">
            <button type="button" onClick={() => applyBulkAction("edit")}>
              Bulk Edit
            </button>
            <button type="button" onClick={() => applyBulkAction("relist")}>
              Bulk Relist
            </button>
            <button type="button" onClick={() => applyBulkAction("delete")}>
              Bulk Delete
            </button>
            <button type="button" onClick={() => applyBulkAction("rewrite")}>
              Bulk AI Rewrite
            </button>
          </div>
        </div>

        <div className="products-selection-row__right">
          <button
            type="button"
            className={`products-history-btn ${historyVisible ? "products-history-btn--active" : ""}`}
            onClick={() => setHistoryVisible((current) => !current)}
          >
            View History
          </button>
          <button type="button" className="orders-icon-btn" onClick={() => scrollTable("end")} aria-label="Show more columns">
            <LuMenu />
          </button>
          <button type="button" className="orders-icon-btn" onClick={() => scrollTable("start")} aria-label="Return table start">
            <LuExternalLink />
          </button>
        </div>
      </div>

      {historyVisible ? (
        <div className="products-history">
          <span>Recent activity:</span>
          <span>3 sourcing requests sent today, 2 product titles rewritten, 1 product deleted.</span>
        </div>
      ) : null}

      <div className="products-table-shell">
        <div className="products-table-scroll" ref={tableScrollRef}>
          <table className={`products-table ${tableView === "comfortable" ? "products-table--comfortable" : ""}`}>
            <thead>
              <tr className="products-table__group-row">
                <th className="products-table__checkbox-col" rowSpan={2} />
                <th rowSpan={2}>Name</th>
                <th rowSpan={2}>
                  <button
                    type="button"
                    className="orders-sort-btn"
                    onClick={() => setSortDirection((current) => (current === "desc" ? "asc" : "desc"))}
                  >
                    <span>Uploaded</span>
                    <LuChevronDown className={sortDirection === "asc" ? "orders-sort-btn__icon orders-sort-btn__icon--asc" : "orders-sort-btn__icon"} />
                  </button>
                </th>
                <th rowSpan={2}>Sourcing Request</th>
                <th className="products-table__actions-col" rowSpan={2} />
                <th className="products-table__group products-table__group--divider" colSpan={6}>
                  Variations
                </th>
                <th rowSpan={2}>Profit</th>
                <th rowSpan={2}>Item ID</th>
                <th rowSpan={2}>Sold</th>
                <th rowSpan={2}>DWS</th>
                <th rowSpan={2}>Store</th>
                <th rowSpan={2}>Asin</th>
                <th rowSpan={2}>Views</th>
                <th rowSpan={2}>Watchers</th>
                <th rowSpan={2}>Days Left</th>
                <th rowSpan={2}>Tags</th>
              </tr>
              <tr className="products-table__sub-row">
                <th className="products-table__group--divider">Available</th>
                <th>On Hold</th>
                <th>Out Of Stock</th>
                <th>Total</th>
                <th>OOS Days</th>
                <th>Price</th>
              </tr>
            </thead>

            <tbody>
              {visibleProducts.length ? (
                visibleProducts.map((item) => (
                  <tr className="products-table__row" key={item.id}>
                    <td className="products-table__checkbox-col">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={() => toggleSelectOne(item.id)}
                      />
                    </td>

                    <td>
                      <div className="products-item">
                        <div className="products-item__thumb">
                          <img src={item.image} alt={item.title} />
                        </div>
                        <div className="products-item__copy">
                          <h3>{item.title}</h3>
                        </div>
                      </div>
                    </td>

                    <td className="products-table__date">{formatDisplayDate(item.uploaded)}</td>

                    <td>
                      <button
                        type="button"
                        className={`products-sourcing-btn ${item.sourcingRequested ? "products-sourcing-btn--active" : ""}`}
                        onClick={() => handleProductAction(item.id, "request-sourcing")}
                      >
                        <LuSparkles />
                        <span>{item.sourcingRequested ? "Requested" : "Request Sourcing"}</span>
                      </button>
                    </td>

                    <td className="products-table__actions-col">
                      <div className="products-row-actions" onClick={(event) => event.stopPropagation()}>
                        <button
                          type="button"
                          className="orders-row-actions__icon"
                          onClick={() => handleProductAction(item.id, "open-editor")}
                          aria-label="Open product editor"
                        >
                          <LuExternalLink />
                        </button>
                        <button
                          type="button"
                          className="orders-row-actions__icon"
                          onClick={() => setOpenMenuId((current) => (current === item.id ? "" : item.id))}
                          aria-label="Open product menu"
                        >
                          <LuEllipsisVertical />
                        </button>

                        {openMenuId === item.id ? (
                          <div className="products-actions-menu">
                            <button type="button" onClick={() => handleProductAction(item.id, "menu-edit")}>
                              <LuPencil />
                              <span>Edit Product</span>
                            </button>
                            <button type="button" onClick={() => handleProductAction(item.id, "menu-store")}>
                              <LuStore />
                              <span>Sync To Store</span>
                            </button>
                            <button type="button" onClick={() => handleProductAction(item.id, "delete")}>
                              <LuX />
                              <span>Delete Product</span>
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </td>

                    <td className="products-table__group--divider">
                      <span className="products-count products-count--green">{item.available}</span>
                    </td>
                    <td>
                      <span className="products-count products-count--amber">{item.onHold}</span>
                    </td>
                    <td>
                      <span className="products-count products-count--red">{item.outOfStock}</span>
                    </td>
                    <td>{item.total}</td>
                    <td>{item.oosDays}</td>

                    <td>
                      <div className="products-paired-values">
                        <div>
                          <span className="orders-paired-values__type">BUY</span>
                          <strong>{item.priceBuy}</strong>
                        </div>
                        <div>
                          <span className="orders-paired-values__type">SELL</span>
                          <strong>{item.priceSell}</strong>
                        </div>
                      </div>
                    </td>

                    <td>{item.profit}</td>

                    <td>
                      <div className="products-paired-values">
                        <div>
                          <span className="orders-paired-values__type">BUY</span>
                          <span className="orders-paired-values__platform">ebay</span>
                          <strong>{item.itemBuy}</strong>
                        </div>
                        <div>
                          <span className="orders-paired-values__type">SELL</span>
                          <span className="orders-paired-values__platform">ebay</span>
                          <strong>{item.itemSell}</strong>
                        </div>
                      </div>
                    </td>

                    <td>{item.sold}</td>
                    <td>{item.dws}</td>
                    <td className="products-table__store">{item.store}</td>
                    <td>{item.asin}</td>
                    <td>{item.views}</td>
                    <td>{item.watchers}</td>
                    <td>{item.daysLeft}</td>
                    <td>{item.tags}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="orders-table__empty" colSpan={20}>
                    <LuInbox />
                    <span>No products match the current search.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="orders-table-footer products-table-footer">
          <div className="orders-pagination">
            <button
              type="button"
              className="orders-pagination__arrow"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            >
              <LuChevronLeft />
            </button>

            {paginationItems.map((page, index) =>
              page === "..." ? (
                <span className="products-pagination__ellipsis" key={`ellipsis-${index}`}>
                  ...
                </span>
              ) : (
                <button
                  type="button"
                  className={page === currentPage ? "orders-pagination__page orders-pagination__page--active" : "orders-pagination__page"}
                  key={page}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ),
            )}

            <button
              type="button"
              className="orders-pagination__arrow"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            >
              <LuChevronRight />
            </button>
          </div>

          <div className="orders-table-footer__meta">
            <label>
              <span>Show</span>
              <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
                <option value={20}>20</option>
                <option value={30}>30</option>
                <option value={40}>40</option>
              </select>
            </label>
            <span>Products out of {products.length}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

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

const MarketplaceDashboard = () => {
  const { background, changeBackground } = useContext(ThemeContext);
  const [activePage, setActivePage] = useState("marketplace");
  const [searchAnything, setSearchAnything] = useState("");
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [addProductsMenuOpen, setAddProductsMenuOpen] = useState(false);
  const [addProductModalOpen, setAddProductModalOpen] = useState(false);
  const [addProductModalMode, setAddProductModalMode] = useState("single");
  const [storeSwitcherOpen, setStoreSwitcherOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [whatsNewOpen, setWhatsNewOpen] = useState(false);
  const [balanceMenuOpen, setBalanceMenuOpen] = useState(false);
  const [balanceTab, setBalanceTab] = useState("managed");
  const [loadBalanceModalOpen, setLoadBalanceModalOpen] = useState(false);
  const [aiCreditsModalOpen, setAiCreditsModalOpen] = useState(false);
  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false);
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  const [selectedLoadAmount, setSelectedLoadAmount] = useState(15);
  const [selectedAiPackage, setSelectedAiPackage] = useState("5000");
  const [addProductUrl, setAddProductUrl] = useState("");
  const [multipleProductsTab, setMultipleProductsTab] = useState("urls");
  const [multipleProductsUrls, setMultipleProductsUrls] = useState("");
  const [multipleProductsCsvFile, setMultipleProductsCsvFile] = useState("");
  const [finderSelections, setFinderSelections] = useState({
    basic: 0,
    popular: 0,
    "best-sellers": 0,
  });
  const [stores, setStores] = useState(storeSwitcherItems);
  const [sidebarStoreId, setSidebarStoreId] = useState(storeSwitcherItems[0].id);
  const [selectedStoreIds, setSelectedStoreIds] = useState(storeSwitcherItems.map((store) => store.id));
  const [pendingSelectedStoreIds, setPendingSelectedStoreIds] = useState(storeSwitcherItems.map((store) => store.id));
  const [storeSwitcherSearch, setStoreSwitcherSearch] = useState("");
  const [storeSwitcherMenuId, setStoreSwitcherMenuId] = useState("");
  const [renamingStoreId, setRenamingStoreId] = useState("");
  const [storeRenameValue, setStoreRenameValue] = useState("");
  const [keywordSearch, setKeywordSearch] = useState("");
  const [activePodCategory, setActivePodCategory] = useState("All Products");
  const [shipsTo, setShipsTo] = useState("United States");
  const [currency, setCurrency] = useState("USD");
  const [shipsFrom, setShipsFrom] = useState("Select Ships From");
  const [priceRange, setPriceRange] = useState("Select Price Range");
  const [supplier, setSupplier] = useState("Select Supplier");
  const [activeCategory, setActiveCategory] = useState("All Categories");
  const [activeSubfilter, setActiveSubfilter] = useState("");
  const [expandedProductsTitle, setExpandedProductsTitle] = useState("");
  const [selectedPill, setSelectedPill] = useState("");
  const [sortBy, setSortBy] = useState("By Relevance");
  const [openMenus, setOpenMenus] = useState({
    Marketplace: true,
  });
  const profileMenuRef = useRef(null);
  const addProductsMenuRef = useRef(null);
  const notificationsRef = useRef(null);
  const balanceMenuRef = useRef(null);

  useEffect(() => {
    const closeHeaderPopovers = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }

      if (addProductsMenuRef.current && !addProductsMenuRef.current.contains(event.target)) {
        setAddProductsMenuOpen(false);
      }

      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }

      if (
        balanceMenuRef.current &&
        !balanceMenuRef.current.contains(event.target) &&
        !loadBalanceModalOpen &&
        !aiCreditsModalOpen
      ) {
        setBalanceMenuOpen(false);
      }

      if (!event.target.closest(".store-switcher-modal__menu-wrap")) {
        setStoreSwitcherMenuId("");
      }
    };

    document.addEventListener("mousedown", closeHeaderPopovers);

    return () => document.removeEventListener("mousedown", closeHeaderPopovers);
  }, [aiCreditsModalOpen, loadBalanceModalOpen]);

  useEffect(() => {
    const closeSidebarOnDesktop = () => {
      if (window.innerWidth > 760) {
        setSidebarMobileOpen(false);
      }
    };

    closeSidebarOnDesktop();
    window.addEventListener("resize", closeSidebarOnDesktop);

    return () => window.removeEventListener("resize", closeSidebarOnDesktop);
  }, []);

  useEffect(() => {
    setSidebarMobileOpen(false);
  }, [activePage]);

  useEffect(() => {
    const notificationsAvailable = headerNotifications.length > 0;
    const shouldLockScroll =
      addProductModalOpen ||
      storeSwitcherOpen ||
      notificationsModalOpen ||
      loadBalanceModalOpen ||
      aiCreditsModalOpen ||
      (notificationsOpen && !notificationsAvailable);

    const { body, documentElement } = document;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyTouchAction = body.style.touchAction;
    const previousHtmlOverflow = documentElement.style.overflow;
    const previousHtmlTouchAction = documentElement.style.touchAction;

    if (shouldLockScroll) {
      body.style.overflow = "hidden";
      body.style.touchAction = "none";
      documentElement.style.overflow = "hidden";
      documentElement.style.touchAction = "none";
    }

    return () => {
      body.style.overflow = previousBodyOverflow;
      body.style.touchAction = previousBodyTouchAction;
      documentElement.style.overflow = previousHtmlOverflow;
      documentElement.style.touchAction = previousHtmlTouchAction;
    };
  }, [addProductModalOpen, aiCreditsModalOpen, loadBalanceModalOpen, notificationsModalOpen, notificationsOpen, storeSwitcherOpen]);

  const currentSubfilters = subfilterOptions[activeCategory] || [];
  const profileTheme = background.value;
  const isDarkTheme = profileTheme === "dark";
  const hasNotifications = headerNotifications.length > 0;
  const previewNotifications = headerNotifications.slice(0, NOTIFICATION_PREVIEW_LIMIT);
  const hasMoreNotifications = headerNotifications.length > NOTIFICATION_PREVIEW_LIMIT;
  const activeSidebarStore = stores.find((store) => store.id === sidebarStoreId) || stores[0];
  const publishStore = stores.find((store) => store.id === "store-nrf-enterprise") || activeSidebarStore;
  const filteredStores = useMemo(() => {
    const query = storeSwitcherSearch.trim().toLowerCase();

    if (!query) {
      return stores;
    }

    return stores.filter((store) =>
      [store.name, store.country, store.marketplace, store.sidebarName].join(" ").toLowerCase().includes(query),
    );
  }, [storeSwitcherSearch, stores]);
  const hasPendingStoreChanges =
    renamingStoreId !== "" ||
    pendingSelectedStoreIds.length !== selectedStoreIds.length ||
    pendingSelectedStoreIds.some((storeId) => !selectedStoreIds.includes(storeId));
  const finderTotalCredits = useMemo(
    () =>
      finderPlans.reduce((total, plan) => total + (finderSelections[plan.id] || 0) * plan.credits, 0),
    [finderSelections],
  );

  const filteredMarketplace = useMemo(() => {
    const query = `${searchAnything} ${keywordSearch}`.trim().toLowerCase();

    const matchesFilters = (item) => {
      if (query) {
        const searchable = [
          item.vendor,
          item.title,
          item.category,
          item.subCategory,
          item.shipsFrom,
          item.price,
        ]
          .join(" ")
          .toLowerCase();

        if (!searchable.includes(query)) {
          return false;
        }
      }

      if (supplier !== "Select Supplier") {
        if (!item.vendor.toLowerCase().includes(supplier.toLowerCase())) {
          return false;
        }
      }

      if (activeCategory !== "All Categories" && item.category !== activeCategory) {
        return false;
      }

      if (activeSubfilter && item.subCategory !== activeSubfilter) {
        return false;
      }

      if (shipsTo && item.shipsTo !== shipsTo) {
        return false;
      }

      if (currency && item.currency !== currency) {
        return false;
      }

      if (shipsFrom !== "Select Ships From" && item.shipsFrom !== shipsFrom) {
        return false;
      }

      if (priceRange !== "Select Price Range" && item.priceRange !== priceRange) {
        return false;
      }

      if (selectedPill && item.shippingTag !== selectedPill) {
        return false;
      }

      return true;
    };

    const sortItems = (items) => {
      const nextItems = [...items];

      if (sortBy === "Newest") {
        nextItems.sort((a, b) => String(b.id).localeCompare(String(a.id)));
      }

      if (sortBy === "Fastest Shipping") {
        nextItems.sort((a, b) => a.shippingDays - b.shippingDays);
      }

      if (sortBy === "Lowest Price") {
        nextItems.sort((a, b) => parsePriceValue(a.price) - parsePriceValue(b.price));
      }

      return nextItems;
    };

    const sections = marketplaceSections
      .map((section) => ({
        ...section,
        items: sortItems(section.items.filter(matchesFilters)),
      }))
      .filter((section) => section.items.length > 0);

    const uniqueProducts = new Map();

    marketplaceSections.forEach((section) => {
      section.items.forEach((item) => {
        if (matchesFilters(item)) {
          uniqueProducts.set(item.id, item);
        }
      });
    });

    return {
      products: sortItems([...uniqueProducts.values()]),
      sections,
    };
  }, [
    activeCategory,
    activeSubfilter,
    currency,
    keywordSearch,
    priceRange,
    searchAnything,
    selectedPill,
    shipsFrom,
    shipsTo,
    sortBy,
    supplier,
  ]);

  const filteredPodProducts = useMemo(() => {
    const query = searchAnything.trim().toLowerCase();

    return podProducts.filter((item) => {
      if (activePodCategory !== "All Products" && item.category !== activePodCategory) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [item.title, item.price, item.category].join(" ").toLowerCase().includes(query);
    });
  }, [activePodCategory, searchAnything]);

  const visibleSections = filteredMarketplace.sections;
  const visibleProducts = filteredMarketplace.products;

  const openProductsView = (section) => {
    const sectionCategory = getSectionCategory(section);

    setActiveCategory(sectionCategory);
    setActiveSubfilter("");
    setExpandedProductsTitle(sectionCategory === "All Categories" ? section.title : sectionCategory);

    setSelectedPill(section.key === "best-sellers" ? "Best Sellers" : "");
  };

  const selectCategory = (category) => {
    const nextCategory = category.key === "all" ? "All Categories" : category.label;

    setActiveCategory(nextCategory);
    setActiveSubfilter("");
    setExpandedProductsTitle(nextCategory === "All Categories" ? "" : nextCategory);
  };

  const resetMarketplaceView = () => {
    setActiveCategory("All Categories");
    setActiveSubfilter("");
    setExpandedProductsTitle("");
    setSelectedPill("");
  };

  const openMarketplacePage = () => {
    setActivePage("marketplace");
    resetMarketplaceView();
  };

  const openPrintOnDemandPage = () => {
    setActivePage("print-on-demand");
    setActivePodCategory("All Products");
    setSearchAnything("");
    setKeywordSearch("");
  };

  const openDashboardPage = () => {
    setActivePage("dashboard");
    setSearchAnything("");
  };

  const openOrdersPage = () => {
    setActivePage("orders");
    setSearchAnything("");
  };

  const openProductsPage = () => {
    setActivePage("products");
    setSearchAnything("");
  };

  const openDraftsPage = () => {
    setActivePage("drafts");
    setSearchAnything("");
  };

  const openCustomerSupportPage = () => {
    setActivePage("customer-support");
    setSearchAnything("");
  };

  const openSettingsPage = () => {
    setActivePage("settings");
    setSearchAnything("");
  };

  const openSupportCenterPage = () => {
    setActivePage("support-center");
    setSearchAnything("");
  };

  const openWalletPage = () => {
    setActivePage("wallet");
    setSearchAnything("");
  };

  const handleProfileMenuItem = (label) => {
    if (label === "Support Center") {
      openSupportCenterPage();
    }

    if (label === "AutoDS Wallet") {
      openWalletPage();
    }

    setProfileMenuOpen(false);
  };

  const openAddProductModal = (mode = "single") => {
    setAddProductsMenuOpen(false);
    setAddProductModalMode(mode);
    if (mode === "single") {
      setAddProductUrl("");
    }
    if (mode === "multiple") {
      setMultipleProductsTab("urls");
      setMultipleProductsUrls("");
      setMultipleProductsCsvFile("");
      setFinderSelections({
        basic: 0,
        popular: 0,
        "best-sellers": 0,
      });
    }
    setAddProductModalOpen(true);
  };

  const openStoreSwitcherModal = () => {
    setStoreSwitcherOpen(true);
    setStoreSwitcherSearch("");
    setStoreSwitcherMenuId("");
    setRenamingStoreId("");
    setStoreRenameValue("");
    setPendingSelectedStoreIds(selectedStoreIds);
  };

  const closeStoreSwitcherModal = () => {
    setStoreSwitcherOpen(false);
    setStoreSwitcherMenuId("");
    setRenamingStoreId("");
    setStoreRenameValue("");
    setPendingSelectedStoreIds(selectedStoreIds);
  };

  const togglePendingStore = (storeId) => {
    setPendingSelectedStoreIds((current) =>
      current.includes(storeId) ? current.filter((item) => item !== storeId) : [...current, storeId],
    );
  };

  const beginStoreRename = (storeId) => {
    const nextStore = stores.find((store) => store.id === storeId);

    if (!nextStore) {
      return;
    }

    setStoreSwitcherMenuId("");
    setRenamingStoreId(storeId);
    setStoreRenameValue(nextStore.name);
  };

  const saveStoreRename = (storeId) => {
    const nextName = storeRenameValue.trim();

    if (!nextName) {
      return;
    }

    setStores((current) =>
      current.map((store) =>
        store.id === storeId
          ? {
              ...store,
              name: nextName,
              sidebarName: store.id === sidebarStoreId ? nextName : store.sidebarName,
            }
          : store,
      ),
    );
    setRenamingStoreId("");
    setStoreRenameValue("");
  };

  const handleStoreSwitcherAction = (actionId, storeId) => {
    if (actionId === "rename") {
      beginStoreRename(storeId);
      return;
    }

    if (actionId === "settings") {
      setStoreSwitcherOpen(false);
      setStoreSwitcherMenuId("");
      setActivePage("settings");
      setSearchAnything("");
      return;
    }

    if (actionId === "delete") {
      if (stores.length === 1) {
        setStoreSwitcherMenuId("");
        return;
      }

      setStores((current) => current.filter((store) => store.id !== storeId));
      setSelectedStoreIds((current) => current.filter((id) => id !== storeId));
      setPendingSelectedStoreIds((current) => current.filter((id) => id !== storeId));
      if (sidebarStoreId === storeId) {
        const nextStore = stores.find((store) => store.id !== storeId);
        if (nextStore) {
          setSidebarStoreId(nextStore.id);
        }
      }
    }

    setStoreSwitcherMenuId("");
  };

  const applyStoreSwitcherChanges = () => {
    setSelectedStoreIds(pendingSelectedStoreIds);

    if (pendingSelectedStoreIds.length) {
      setSidebarStoreId((current) => (pendingSelectedStoreIds.includes(current) ? current : pendingSelectedStoreIds[0]));
    }

    setStoreSwitcherOpen(false);
    setStoreSwitcherMenuId("");
    setRenamingStoreId("");
    setStoreRenameValue("");
  };

  const handleAddProductsMenuItem = (item) => {
    setAddProductsMenuOpen(false);

    if (item.action === "open-add-product-modal") {
      openAddProductModal("single");
    }

    if (item.action === "open-multiple-products-modal") {
      openAddProductModal("multiple");
    }
  };

  const adjustFinderSelection = (planId, delta) => {
    setFinderSelections((current) => ({
      ...current,
      [planId]: Math.max(0, (current[planId] || 0) + delta),
    }));
  };

  const multipleProductsActionDisabled =
    multipleProductsTab === "urls"
      ? !multipleProductsUrls.trim()
      : multipleProductsTab === "csv"
        ? !multipleProductsCsvFile
        : finderTotalCredits === 0;

  const pageTitle =
    activePage === "print-on-demand"
      ? "Print On Demand"
      : activePage === "dashboard"
        ? "Dashboard"
        : activePage === "orders"
          ? `Orders (${initialOrders.length})`
          : activePage === "products"
            ? `Products (${initialProducts.length})`
            : activePage === "drafts"
              ? `Upload (${DRAFT_UPLOAD_COUNT})`
              : activePage === "customer-support"
                ? "Customer Support"
                : activePage === "support-center"
                  ? "Help Center"
                  : activePage === "wallet"
                    ? "AutoDS Wallet"
                    : activePage === "settings"
                      ? "Settings"
                      : "Marketplace";

  const pageTitleContent =
    activePage === "wallet" ? (
      <>
        <span>AutoDS Wallet</span>
        <span className="marketplace-header__title-addon">Powered by Payoneer</span>
      </>
    ) : (
      pageTitle
    );

  const alertDays =
    activePage === "settings"
      ? 2
      : activePage === "dashboard" ||
          activePage === "orders" ||
          activePage === "products" ||
          activePage === "drafts" ||
          activePage === "customer-support" ||
          activePage === "support-center" ||
          activePage === "wallet"
        ? 3
        : 4;

  return (
    <div className={isDarkTheme ? "marketplace-dashboard-page marketplace-dashboard-page--dark" : "marketplace-dashboard-page"}>
      {sidebarMobileOpen ? (
        <button
          type="button"
          className="marketplace-sidebar-backdrop"
          aria-label="Close navigation menu"
          onClick={() => setSidebarMobileOpen(false)}
        />
      ) : null}

      <aside className={sidebarMobileOpen ? "marketplace-sidebar marketplace-sidebar--mobile-open" : "marketplace-sidebar"}>
        <div className="marketplace-sidebar__logo-block">
          <div className="marketplace-sidebar__logo">AUTO-DS-</div>
        </div>

        <div className="marketplace-sidebar__store-block">
          <div className="marketplace-sidebar__store-avatar">{activeSidebarStore.initials}</div>
          <div className="marketplace-sidebar__store-copy">
            <button type="button" className="marketplace-sidebar__store-name" onClick={openStoreSwitcherModal}>
              {activeSidebarStore.sidebarName}
            </button>
          </div>
          <button type="button" className="marketplace-sidebar__edit-btn" aria-label="Edit store" onClick={openStoreSwitcherModal}>
            <LuPencil />
          </button>
        </div>

        <div
          className="marketplace-sidebar__action-wrap"
          ref={addProductsMenuRef}
          onMouseEnter={() => setAddProductsMenuOpen(true)}
          onMouseLeave={() => setAddProductsMenuOpen(false)}
        >
          <button
            type="button"
            className={addProductsMenuOpen ? "marketplace-sidebar__add-btn marketplace-sidebar__add-btn--open" : "marketplace-sidebar__add-btn"}
            aria-haspopup="menu"
            aria-expanded={addProductsMenuOpen}
            onClick={openAddProductModal}
          >
            <LuPlus />
            <span>Add Products</span>
          </button>

          {addProductsMenuOpen ? (
            <div className="marketplace-sidebar__add-menu" role="menu" aria-label="Add products">
              {addProductsMenuItems.map((item) => {
                const ItemIcon = item.icon;

                return (
                  <button
                    type="button"
                    key={item.id}
                    className="marketplace-sidebar__add-menu-item"
                    role="menuitem"
                    onClick={() => handleAddProductsMenuItem(item)}
                  >
                    <span className="marketplace-sidebar__add-menu-icon">
                      <ItemIcon />
                    </span>
                    <span className="marketplace-sidebar__add-menu-copy">
                      <strong>{item.title}</strong>
                      <span>{item.description}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        <nav className="marketplace-sidebar__nav" aria-label="Marketplace navigation">
          {sidebarGroups.map((group, groupIndex) => (
            <div className="marketplace-sidebar__group" key={`group-${groupIndex}`}>
              {group.map((item) => {
                const navItem = {
                  ...item,
                  active:
                    (activePage === "marketplace" && item.label === "Marketplace") ||
                    (activePage === "print-on-demand" && item.label === "Print On Demand") ||
                    (activePage === "dashboard" && item.label === "Dashboard") ||
                    (activePage === "orders" && item.label === "Orders") ||
                    (activePage === "products" && item.label === "Products") ||
                    (activePage === "drafts" && item.label === "Drafts") ||
                    (activePage === "customer-support" && item.label === "Customer Support") ||
                    (activePage === "settings" && item.label === "Settings"),
                };

                return (
                  <SidebarLink
                    item={navItem}
                    key={item.label}
                    isOpen={Boolean(openMenus[item.label])}
                    onSelect={(selectedItem) => {
                      if (selectedItem.label === "Marketplace") {
                        openMarketplacePage();
                      }

                      if (selectedItem.label === "Print On Demand") {
                        openPrintOnDemandPage();
                      }

                      if (selectedItem.label === "Dashboard") {
                        openDashboardPage();
                      }

                      if (selectedItem.label === "Orders") {
                        openOrdersPage();
                      }

                      if (selectedItem.label === "Products") {
                        openProductsPage();
                      }

                      if (selectedItem.label === "Drafts") {
                        openDraftsPage();
                      }

                      if (selectedItem.label === "Customer Support") {
                        openCustomerSupportPage();
                      }

                      if (selectedItem.label === "Settings") {
                        openSettingsPage();
                      }
                    }}
                    onToggle={() =>
                      setOpenMenus((current) => ({
                        ...current,
                        [item.label]: !current[item.label],
                      }))
                    }
                  />
                );
              })}
            </div>
          ))}
        </nav>

        <div className="marketplace-sidebar__footer">
          <button type="button" className="marketplace-sidebar__guide-btn">
            <span className="marketplace-sidebar__guide-copy">
              <LuPackagePlus />
              <span>Store Setup Guide</span>
            </span>
            <LuChevronDown />
          </button>

          <button type="button" className="marketplace-sidebar__collapse-btn" aria-label="Collapse sidebar">
            <LuChevronsLeft />
          </button>
        </div>
      </aside>

      <section className="marketplace-main">
        <div className="topbar-alert">
          <span className="topbar-alert__icon">!</span>
          <span>
            Your account will be disabled in {alertDays} days. <a href="/">Change Your Payment Method</a>
          </span>
        </div>

        <div className="marketplace-main__scroll">
          <header className="marketplace-header">
            <div className="marketplace-header__title-group">
              <button
                type="button"
                className="marketplace-header__menu-toggle"
                aria-label="Open navigation menu"
                aria-expanded={sidebarMobileOpen}
                onClick={() => setSidebarMobileOpen(true)}
              >
                <LuMenu />
              </button>
              <h1 className="section-title marketplace-header__title">{pageTitleContent}</h1>
            </div>

            <div className="marketplace-header__search">
              <LuSearch />
              <input
                type="text"
                className="marketplace-header__search-input"
                placeholder="Search anything"
                value={searchAnything}
                onChange={(event) => setSearchAnything(event.target.value)}
              />
            </div>

            <div className="marketplace-header__controls">
              <div className="marketplace-header__balance" ref={balanceMenuRef}>
                <button
                  type="button"
                  className={balanceMenuOpen ? "marketplace-header__control marketplace-header__control--active" : "marketplace-header__control"}
                  aria-label="Open balance menu"
                  aria-expanded={balanceMenuOpen}
                  onClick={() => {
                    setBalanceMenuOpen((current) => !current);
                    setNotificationsOpen(false);
                    setNotificationsModalOpen(false);
                    setProfileMenuOpen(false);
                    setWhatsNewOpen(false);
                  }}
                >
                  <LuWalletCards />
                  <span>$0 AI:30</span>
                </button>

                {balanceMenuOpen ? (
                  <div className={balanceTab === "ai" ? "balance-popover balance-popover--ai" : "balance-popover"} role="dialog" aria-label="Balance">
                    <div className="balance-popover__tabs">
                      <button
                        type="button"
                        className={balanceTab === "managed" ? "balance-popover__tab balance-popover__tab--active" : "balance-popover__tab"}
                        onClick={() => setBalanceTab("managed")}
                      >
                        Managed Balance
                      </button>
                      <button
                        type="button"
                        className={balanceTab === "ai" ? "balance-popover__tab balance-popover__tab--active" : "balance-popover__tab"}
                        onClick={() => setBalanceTab("ai")}
                      >
                        AI Credits
                      </button>
                    </div>

                    {balanceTab === "managed" ? (
                      <div className="balance-popover__managed">
                        <strong className="balance-popover__balance">Balance: $0</strong>

                        <div className="balance-popover__video" role="img" aria-label="Managed balance video preview">
                          <div className="balance-popover__video-title">
                            <span>DS</span>
                            <div>
                              <strong>Fulfilled By AutoDS Quick-Load Demo</strong>
                              <em>AutoDS - Build Your Online Income</em>
                            </div>
                          </div>
                          <button type="button" className="balance-popover__play" aria-label="Play managed balance video">
                            <LuPlay />
                          </button>
                          <div className="balance-popover__video-bottom">
                            <span>
                              Watch on <strong>YouTube</strong>
                            </span>
                          </div>
                        </div>

                        <p>
                          Save hours on manual work by activating the Fulfilled by AutoDS service. Load balance and
                          let your dropshipping orders and returns be fully automated and managed from AutoDS' own
                          accounts.
                        </p>

                        <div className="balance-popover__actions">
                          <button
                            type="button"
                            className="balance-popover__primary"
                            onClick={() => setLoadBalanceModalOpen(true)}
                          >
                            Load Balance
                          </button>
                          <button type="button" className="balance-popover__link">
                            Learn More
                          </button>
                        </div>

                        <div className="balance-popover__footer">
                          <button type="button">
                            <LuClock3 />
                            <span>View Purchase History</span>
                          </button>
                          <button type="button">
                            <LuExternalLink />
                            <span>Download Invoices</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="balance-popover__ai">
                        <strong>Balance: AI 30</strong>
                        <button type="button" onClick={() => setAiCreditsModalOpen(true)}>
                          Buy Credits
                        </button>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
              <button
                type="button"
                className={whatsNewOpen ? "marketplace-header__icon-btn marketplace-header__icon-btn--active" : "marketplace-header__icon-btn"}
                aria-label="Open what's new"
                aria-expanded={whatsNewOpen}
                onClick={() => {
                  setWhatsNewOpen((current) => !current);
                  setNotificationsOpen(false);
                  setNotificationsModalOpen(false);
                  setProfileMenuOpen(false);
                  setBalanceMenuOpen(false);
                }}
              >
                <LuVolume2 />
              </button>
              <div className="marketplace-header__notifications" ref={notificationsRef}>
                <button
                  type="button"
                  className={hasNotifications ? "marketplace-header__icon-btn marketplace-header__icon-btn--bell" : "marketplace-header__icon-btn"}
                  aria-label="Open notifications"
                  aria-expanded={notificationsOpen}
                  onClick={() => {
                    setNotificationsOpen((current) => !current);
                    setNotificationsModalOpen(false);
                    setProfileMenuOpen(false);
                    setWhatsNewOpen(false);
                    setBalanceMenuOpen(false);
                  }}
                >
                  <LuBell />
                </button>

                {notificationsOpen ? (
                  hasNotifications ? (
                    <div className="notification-popover" role="dialog" aria-label="Notifications">
                      <div className="notification-popover__head">
                        <div className="notification-popover__title">
                          <LuBell />
                          <h2>Notifications</h2>
                          <span>{headerNotifications.length}</span>
                        </div>
                        <button
                          type="button"
                          className="notification-popover__close"
                          aria-label="Close notifications"
                          onClick={() => setNotificationsOpen(false)}
                        >
                          <LuX />
                        </button>
                      </div>

                      <div className="notification-popover__list">
                        {previewNotifications.map((notification) => (
                          <button type="button" className="notification-popover__item" key={notification.id}>
                            <span className="notification-popover__dot" />
                            <span className="notification-popover__copy">
                              <strong>{notification.title}</strong>
                              <span>{notification.message}</span>
                            </span>
                            <span className="notification-popover__time">{notification.time}</span>
                          </button>
                        ))}
                      </div>

                      {hasMoreNotifications ? (
                        <div className="notification-popover__footer">
                          <button
                            type="button"
                            className="notification-popover__see-more"
                            onClick={() => {
                              setNotificationsOpen(false);
                              setNotificationsModalOpen(true);
                            }}
                          >
                            See more
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="notification-empty-backdrop"
                        aria-label="Close notifications"
                        onClick={() => setNotificationsOpen(false)}
                      />
                      <section className="notification-empty-modal" role="dialog" aria-label="Notifications">
                        <div className="notification-empty-modal__head">
                          <div className="notification-popover__title">
                            <LuBell />
                            <h2>Notifications</h2>
                            <span>0</span>
                          </div>
                          <button
                            type="button"
                            className="notification-popover__close"
                            aria-label="Close notifications"
                            onClick={() => setNotificationsOpen(false)}
                          >
                            <LuX />
                          </button>
                        </div>
                      </section>
                    </>
                  )
                ) : null}
              </div>
              {notificationsModalOpen ? (
                <div className="notification-modal-layer" role="dialog" aria-label="All notifications">
                  <button
                    type="button"
                    className="notification-modal-layer__backdrop"
                    aria-label="Close notifications modal"
                    onClick={() => setNotificationsModalOpen(false)}
                  />
                  <section className="notification-modal">
                    <div className="notification-modal__head">
                      <div className="notification-popover__title">
                        <LuBell />
                        <h2>Notifications</h2>
                        <span>{headerNotifications.length}</span>
                      </div>
                      <button
                        type="button"
                        className="notification-popover__close"
                        aria-label="Close all notifications"
                        onClick={() => setNotificationsModalOpen(false)}
                      >
                        <LuX />
                      </button>
                    </div>

                    <div className="notification-modal__body">
                      {headerNotifications.map((notification) => (
                        <button type="button" className="notification-popover__item" key={`modal-${notification.id}`}>
                          <span className="notification-popover__dot" />
                          <span className="notification-popover__copy">
                            <strong>{notification.title}</strong>
                            <span>{notification.message}</span>
                          </span>
                          <span className="notification-popover__time">{notification.time}</span>
                        </button>
                      ))}
                    </div>
                  </section>
                </div>
              ) : null}
              <div className="marketplace-header__profile-wrap" ref={profileMenuRef}>
                <button
                  type="button"
                  className="marketplace-header__profile"
                  aria-label="Open profile menu"
                  aria-expanded={profileMenuOpen}
                  onClick={() => {
                    setProfileMenuOpen((current) => !current);
                    setNotificationsOpen(false);
                    setNotificationsModalOpen(false);
                    setWhatsNewOpen(false);
                    setBalanceMenuOpen(false);
                  }}
                >
                  <span>atif</span>
                  <span className="marketplace-header__avatar">
                    <LuUserRound />
                  </span>
                  <LuChevronDown className={profileMenuOpen ? "marketplace-header__profile-chevron marketplace-header__profile-chevron--open" : "marketplace-header__profile-chevron"} />
                </button>

                {profileMenuOpen ? (
                  <div className="profile-dropdown" role="menu">
                    <div className="profile-dropdown__card">
                      <div className="profile-dropdown__identity">
                        <span className="profile-dropdown__avatar">
                          <LuUserRound />
                        </span>
                        <div>
                          <strong>atif butt</strong>
                          <span>roserime9900@gmail.com</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="profile-dropdown__settings"
                        onClick={() => {
                          openSettingsPage();
                          setProfileMenuOpen(false);
                        }}
                      >
                        <LuSettings2 />
                        <span>Settings</span>
                      </button>
                    </div>

                    <div className="profile-dropdown__menu profile-dropdown__menu--top">
                      {profileMenuItems.slice(0, 2).map((item) => {
                        const Icon = item.icon;

                        return (
                          <button type="button" key={item.label} role="menuitem" onClick={() => handleProfileMenuItem(item.label)}>
                            <span className="profile-dropdown__item-icon">
                              <Icon />
                            </span>
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="profile-dropdown__menu">
                      {profileMenuItems.slice(2).map((item) => {
                        const Icon = item.icon;

                        return (
                          <button type="button" key={item.label} role="menuitem" onClick={() => handleProfileMenuItem(item.label)}>
                            <span className="profile-dropdown__item-icon profile-dropdown__item-icon--muted">
                              <Icon />
                            </span>
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="profile-dropdown__theme" aria-label="Theme preference">
                      <button
                        type="button"
                        className={profileTheme === "light" ? "profile-dropdown__theme-btn profile-dropdown__theme-btn--active" : "profile-dropdown__theme-btn"}
                        onClick={() => changeBackground({ value: "light", label: "Light" })}
                      >
                        <LuSun />
                        <span>Light</span>
                      </button>
                      <button
                        type="button"
                        className={profileTheme === "dark" ? "profile-dropdown__theme-btn profile-dropdown__theme-btn--active" : "profile-dropdown__theme-btn"}
                        onClick={() => changeBackground({ value: "dark", label: "Dark" })}
                      >
                        <LuMoon />
                        <span>Dark</span>
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </header>

	          {whatsNewOpen ? (
            <>
              <button
                type="button"
                className="whats-new-overlay"
                aria-label="Close what's new"
                onClick={() => setWhatsNewOpen(false)}
              />
              <aside className="whats-new-drawer" aria-label="What's new on AutoDS">
                <div className="whats-new-drawer__head">
                  <h2>What's new on AutoDS</h2>
                  <div className="whats-new-drawer__actions">
                    <button type="button" aria-label="Search what's new">
                      <LuSearch />
                    </button>
                    <button type="button" aria-label="Close what's new" onClick={() => setWhatsNewOpen(false)}>
                      <LuX />
                    </button>
                  </div>
                </div>

                <div className="whats-new-drawer__list">
                  {whatsNewItems.map((item) => (
                    <article className="whats-new-card" key={item.id}>
                      <div className="whats-new-card__meta">
                        <span>{item.label}</span>
                        <time>{item.date}</time>
                        <button type="button" aria-label={`Share ${item.title}`}>
                          <LuExternalLink />
                        </button>
                      </div>
                      <h3>{item.title}</h3>
                      {item.copy.map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                      ))}
                      <img src={item.image} alt="" />
                      <a href="/" onClick={(event) => event.preventDefault()}>
                        {item.linkLabel} <LuChevronRight />
                      </a>
                    </article>
                  ))}
                </div>
              </aside>
            </>
	          ) : null}

          {storeSwitcherOpen ? (
            <div className="store-switcher-modal-layer" role="presentation">
              <button
                type="button"
                className="store-switcher-modal-layer__backdrop"
                aria-label="Close store selector"
                onClick={closeStoreSwitcherModal}
              />

              <section className="store-switcher-modal" role="dialog" aria-modal="true" aria-label="Store selector">
                <button
                  type="button"
                  className="balance-modal__close"
                  aria-label="Close store selector"
                  onClick={closeStoreSwitcherModal}
                >
                  <LuX />
                </button>

                <label className="store-switcher-modal__search">
                  <LuSearch />
                  <input
                    type="search"
                    value={storeSwitcherSearch}
                    onChange={(event) => setStoreSwitcherSearch(event.target.value)}
                    placeholder="Search anything"
                  />
                </label>

                <div className="store-switcher-modal__group-head">
                  <div className="store-switcher-modal__group-label">
                    <span>ebay</span>
                    <strong>eBay ({stores.length})</strong>
                  </div>
                  <button type="button" onClick={() => setPendingSelectedStoreIds([])}>
                    Unselect all
                  </button>
                </div>

                <div className="store-switcher-modal__list">
                  {filteredStores.map((store) => {
                    const isSelected = pendingSelectedStoreIds.includes(store.id);
                    const isRenaming = renamingStoreId === store.id;

                    return (
                      <article className="store-switcher-modal__item" key={store.id}>
                        <label className="store-switcher-modal__check">
                          <input type="checkbox" checked={isSelected} onChange={() => togglePendingStore(store.id)} />
                          <span />
                        </label>

                        <div className="store-switcher-modal__avatar">{store.initials}</div>

                        <div className="store-switcher-modal__body">
                          {isRenaming ? (
                            <div className="store-switcher-modal__rename">
                              <input
                                type="text"
                                value={storeRenameValue}
                                onChange={(event) => setStoreRenameValue(event.target.value)}
                                autoFocus
                              />
                              <button type="button" aria-label="Save store name" onClick={() => saveStoreRename(store.id)}>
                                <LuCheck />
                              </button>
                              <button
                                type="button"
                                aria-label="Cancel renaming store"
                                onClick={() => {
                                  setRenamingStoreId("");
                                  setStoreRenameValue("");
                                }}
                              >
                                <LuX />
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="store-switcher-modal__title-row">
                                <strong>{store.name}</strong>
                                <button type="button" aria-label={`Edit ${store.name}`} onClick={() => beginStoreRename(store.id)}>
                                  <LuExternalLink />
                                </button>
                                <span>{store.country}</span>
                              </div>

                              <div className="store-switcher-modal__meta">
                                <span>
                                  <LuClipboardList />
                                  {store.orders}
                                </span>
                                <span>
                                  <LuPackage2 />
                                  {store.products}
                                </span>
                              </div>

                              <p>
                                Stock Limit: {store.stockLimit} limit | Price Limit: {store.priceLimit} | {store.connection}
                              </p>
                            </>
                          )}
                        </div>

                        <div className="store-switcher-modal__menu-wrap">
                          <button
                            type="button"
                            className="store-switcher-modal__menu-btn"
                            aria-label={`Open actions for ${store.name}`}
                            onClick={() => setStoreSwitcherMenuId((current) => (current === store.id ? "" : store.id))}
                          >
                            <LuEllipsisVertical />
                          </button>

                          {storeSwitcherMenuId === store.id ? (
                            <div className="store-switcher-modal__menu">
                              {storeSwitcherMenuItems.map((item) => {
                                const ItemIcon = item.icon;

                                return (
                                  <button
                                    type="button"
                                    key={item.id}
                                    className={item.id === "rename" ? "store-switcher-modal__menu-item store-switcher-modal__menu-item--active" : "store-switcher-modal__menu-item"}
                                    onClick={() => handleStoreSwitcherAction(item.id, store.id)}
                                  >
                                    <ItemIcon />
                                    <span>{item.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                          ) : null}
                        </div>
                      </article>
                    );
                  })}
                </div>

                <div className="store-switcher-modal__footer">
                  <button type="button" className="store-switcher-modal__add-btn">
                    <LuPlus />
                    <span>Add Store</span>
                  </button>

                  <button
                    type="button"
                    className="store-switcher-modal__update-btn"
                    disabled={!hasPendingStoreChanges}
                    onClick={applyStoreSwitcherChanges}
                  >
                    Update
                  </button>
                </div>
              </section>
            </div>
          ) : null}

          {addProductModalOpen ? (
            <div className="add-product-modal-layer" role="presentation">
              <button
                type="button"
                className="add-product-modal-layer__backdrop"
                aria-label="Close add product modal"
                onClick={() => setAddProductModalOpen(false)}
              />
              <section
                className={addProductModalMode === "multiple" ? "add-product-modal add-product-modal--multiple" : "add-product-modal"}
                role="dialog"
                aria-modal="true"
                aria-label={addProductModalMode === "multiple" ? "Add Products" : "Add Product"}
              >
                <button
                  type="button"
                  className="balance-modal__close"
                  aria-label="Close add product modal"
                  onClick={() => setAddProductModalOpen(false)}
                >
                  <LuX />
                </button>

                <div className="add-product-modal__head">
                  <div className="add-product-modal__title-icon" aria-hidden="true">
                    <LuBox />
                    <span>+</span>
                  </div>
                  <div className="add-product-modal__title-copy">
                    <h2>{addProductModalMode === "multiple" ? "Add Products" : "Add Product"}</h2>
                    <div className="add-product-modal__publish-row">
                      <span>
                        Publish to: <strong>{publishStore.name}</strong>
                      </span>
                      <button type="button" aria-label="Edit publish store" onClick={openStoreSwitcherModal}>
                        <LuPencil />
                      </button>
                    </div>
                  </div>
                </div>

                {addProductModalMode === "multiple" ? (
                  <>
                    <div className="add-products-modal__tabs" role="tablist" aria-label="Add products methods">
                      {multipleProductsTabs.map((tab) => (
                        <button
                          type="button"
                          key={tab.id}
                          role="tab"
                          aria-selected={multipleProductsTab === tab.id}
                          className={multipleProductsTab === tab.id ? "add-products-modal__tab add-products-modal__tab--active" : "add-products-modal__tab"}
                          onClick={() => setMultipleProductsTab(tab.id)}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {multipleProductsTab === "urls" ? (
                      <div className="add-products-modal__panel">
                        <label className="add-product-modal__field">
                          <span>
                            Supplier Url or Product ID (Buy)
                            <em> (For multiple products, click &lt;enter&gt; to separate them)</em>
                            <button type="button" className="add-products-modal__info" aria-label="Multiple product instructions">
                              ?
                            </button>
                          </span>
                          <textarea
                            value={multipleProductsUrls}
                            onChange={(event) => setMultipleProductsUrls(event.target.value)}
                            placeholder=""
                          />
                        </label>
                      </div>
                    ) : null}

                    {multipleProductsTab === "csv" ? (
                      <div className="add-products-modal__panel add-products-modal__panel--csv">
                        <button
                          type="button"
                          className="add-products-modal__dropzone"
                          onClick={() => setMultipleProductsCsvFile("products-upload.csv")}
                        >
                          <span className="add-products-modal__dropzone-icon">
                            <LuUpload />
                          </span>
                          <strong>{multipleProductsCsvFile ? multipleProductsCsvFile : "Drop CSV file"}</strong>
                          <span>{multipleProductsCsvFile ? "Ready to import into your selected store." : "Or select file from your computer"}</span>
                        </button>

                        <div className="add-products-modal__csv-card">
                          <strong>CSV format</strong>
                          <p>
                            The file must be a CSV file with the following fields as column titles:
                          </p>
                          <ul>
                            <li>BuyId (Required)</li>
                            <li>Title (Optional)</li>
                            <li>Price (Optional)</li>
                          </ul>
                          <button type="button">Download Example File</button>
                        </div>
                      </div>
                    ) : null}

                    {multipleProductsTab === "finder" ? (
                      <div className="add-products-modal__panel add-products-modal__panel--finder">
                        <div className="add-products-modal__finder-head">
                          <strong>Let us find the perfect products for your store</strong>
                          <span>
                            Your Credits: 400 <button type="button">Buy more</button>
                          </span>
                        </div>

                        <div className="add-products-modal__finder-grid">
                          {finderPlans.map((plan) => {
                            const PlanIcon = plan.icon;
                            const quantity = finderSelections[plan.id] || 0;

                            return (
                              <article className="add-products-modal__finder-card" key={plan.id}>
                                <span className="add-products-modal__finder-label">{plan.label}</span>
                                <span className={`add-products-modal__finder-icon add-products-modal__finder-icon--${plan.id}`}>
                                  <PlanIcon />
                                </span>
                                <strong>{plan.sales}</strong>
                                <span>{plan.credits} Credits per product</span>

                                <div className="add-products-modal__finder-counter">
                                  <div>Select amount</div>
                                  <div className="add-products-modal__finder-counter-row">
                                    <button type="button" onClick={() => adjustFinderSelection(plan.id, -1)}>
                                      -
                                    </button>
                                    <span>{quantity}</span>
                                    <button type="button" onClick={() => adjustFinderSelection(plan.id, 1)}>
                                      +
                                    </button>
                                  </div>
                                </div>
                              </article>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}

                    <div className="add-products-modal__meta-footer">
                      <div className="add-product-modal__meta-row">
                        <span>
                          Supplier Source:
                          <button type="button">
                            <span className="add-product-modal__meta-dot" />
                            Aliexpress
                            <LuChevronDown />
                          </button>
                        </span>
                        <i />
                        <span>
                          Ship From Warehouse:
                          <button type="button">
                            China
                            <LuChevronDown />
                          </button>
                        </span>
                        <button type="button" className="add-product-modal__hint" aria-label="Warehouse info">
                          ?
                        </button>
                      </div>

                      <div className="add-products-modal__footer-row">
                        <span className="add-products-modal__credits">
                          {multipleProductsTab === "finder" ? `Total cost: ${finderTotalCredits} credits` : ""}
                        </span>
                        <div className="add-products-modal__submit-wrap">
                          <button type="button" className="add-products-modal__submit-main" disabled={multipleProductsActionDisabled}>
                            Add As draft
                          </button>
                          <button type="button" className="add-products-modal__submit-toggle" disabled={multipleProductsActionDisabled} aria-label="More add product actions">
                            <LuChevronDown />
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <label className="add-product-modal__field">
                      <span>Supplier Url or Product ID (Buy)</span>
                      <input
                        type="text"
                        value={addProductUrl}
                        onChange={(event) => setAddProductUrl(event.target.value)}
                        placeholder="Enter URL or Product ID"
                      />
                    </label>

                    <div className="add-product-modal__meta-row">
                      <span>
                        Supplier Source:
                        <button type="button">
                          <span className="add-product-modal__meta-dot" />
                          Aliexpress
                          <LuChevronDown />
                        </button>
                      </span>
                      <i />
                      <span>
                        Ship From Warehouse:
                        <button type="button">
                          China
                          <LuChevronDown />
                        </button>
                      </span>
                      <button type="button" className="add-product-modal__hint" aria-label="Warehouse info">
                        ?
                      </button>
                    </div>

                    <div className="add-product-modal__actions">
                      <button type="button" disabled={!addProductUrl.trim()}>
                        Publish to Store
                      </button>
                      <button type="button" disabled={!addProductUrl.trim()}>
                        Add as Draft (Simple page)
                      </button>
                    </div>
                  </>
                )}
              </section>
            </div>
          ) : null}

	          {loadBalanceModalOpen || aiCreditsModalOpen ? (
            <div className="balance-modal-layer" role="presentation">
              <button
                type="button"
                className="balance-modal-layer__backdrop"
                aria-label="Close balance modal"
                onClick={() => {
                  setLoadBalanceModalOpen(false);
                  setAiCreditsModalOpen(false);
                }}
              />

              {loadBalanceModalOpen ? (
                <section className="load-balance-modal" role="dialog" aria-modal="true" aria-label="Load AutoDS Managed Order Balance">
                  <button
                    type="button"
                    className="balance-modal__close"
                    aria-label="Close load balance modal"
                    onClick={() => setLoadBalanceModalOpen(false)}
                  >
                    <LuX />
                  </button>
                  <h2>Load AutoDS Managed Order Balance</h2>
                  <p>Add balance to be able to use the Fulfilled by AutoDS managed orders service.</p>

                  <div className="load-balance-modal__amount-head">
                    <span>Choose amount:</span>
                    <strong>Current balance: $0.00</strong>
                  </div>

                  <div className="load-balance-modal__amount-grid">
                    {loadBalanceAmounts.map((amount) => (
                      <button
                        type="button"
                        key={amount}
                        className={selectedLoadAmount === amount ? "load-balance-modal__amount load-balance-modal__amount--active" : "load-balance-modal__amount"}
                        onClick={() => setSelectedLoadAmount(amount)}
                      >
                        {amount === 15 ? <span>First load offer!</span> : null}
                        <strong>${amount}</strong>
                      </button>
                    ))}
                  </div>

                  <label className="load-balance-modal__label">Select Payment Method:</label>
                  <div className="load-balance-modal__payment-row">
                    <button type="button" className="load-balance-modal__payment-select">
                      <LuWalletCards />
                      <span>Credit Card</span>
                      <LuChevronDown />
                    </button>
                    <span className="load-balance-modal__fee-note">
                      <span>i</span>
                      Credit cards charge a non-refundable 5% fee
                    </span>
                  </div>

                  <button type="button" className="load-balance-modal__add-account">
                    <LuPlus />
                    <span>Add account</span>
                  </button>

                  <div className="load-balance-modal__footer">
                    <button type="button">Add Account</button>
                  </div>
                </section>
              ) : null}

              {aiCreditsModalOpen ? (
                <section className="ai-credits-modal" role="dialog" aria-modal="true" aria-label="Add AI Credits">
                  <button
                    type="button"
                    className="balance-modal__close"
                    aria-label="Close AI credits modal"
                    onClick={() => setAiCreditsModalOpen(false)}
                  >
                    <LuX />
                  </button>

                  <div className="ai-credits-modal__icon">
                    <LuShoppingCart />
                  </div>
                  <h2>
                    Add AI Credits <span>?</span>
                  </h2>
                  <strong className="ai-credits-modal__price">$29.90</strong>

                  <div className="ai-credits-modal__options">
                    {aiCreditPackages.map((item) => (
                      <label className="ai-credits-modal__option" key={item.id}>
                        <input
                          type="radio"
                          name="aiCredits"
                          value={item.id}
                          checked={selectedAiPackage === item.id}
                          onChange={() => setSelectedAiPackage(item.id)}
                        />
                        <span>{item.credits}</span>
                        {item.badge ? <em>{item.badge}</em> : null}
                        <strong>{item.price}</strong>
                      </label>
                    ))}
                  </div>

                  <button type="button" className="ai-credits-modal__coupon">
                    I have a coupon!
                  </button>
                  <button type="button" className="ai-credits-modal__buy">
                    Buy Now
                  </button>
                  <div className="ai-credits-modal__links">
                    <a href="/" onClick={(event) => event.preventDefault()}>
                      Terms &amp; Conditions
                    </a>
                    <a href="/" onClick={(event) => event.preventDefault()}>
                      Privacy Policy
                    </a>
                  </div>
                </section>
              ) : null}
            </div>
          ) : null}

          <main className="dashboard-container marketplace-content-wrapper">
            {activePage === "print-on-demand" ? (
              <PrintOnDemandContent
                activeCategory={activePodCategory}
                onCategoryChange={setActivePodCategory}
                products={filteredPodProducts}
              />
            ) : activePage === "dashboard" ? (
              <DashboardContent searchQuery={searchAnything} />
            ) : activePage === "orders" ? (
              <OrdersContent searchQuery={searchAnything} />
            ) : activePage === "products" ? (
              <ProductsContent searchQuery={searchAnything} />
            ) : activePage === "drafts" ? (
              <DraftsContent searchQuery={searchAnything} />
            ) : activePage === "customer-support" ? (
              <CustomerSupportContent searchQuery={searchAnything} />
            ) : activePage === "support-center" ? (
              <HelpCenterContent />
            ) : activePage === "wallet" ? (
              <WalletContent />
            ) : activePage === "settings" ? (
              <MarketplaceSettingsPage />
            ) : (
              <>
                <section className="marketplace-search-panel card-wrapper">
                  <div className="marketplace-search-panel__top-row">
                    <div className="marketplace-main-search">
                      <LuSearch />
                      <input
                        type="text"
                        className="form-control-ui input-border-style"
                        placeholder="Search by product title, supplier or product description..."
                        value={keywordSearch}
                        onChange={(event) => setKeywordSearch(event.target.value)}
                      />
                    </div>

                    <button type="button" className="button-base button-primary marketplace-search-panel__submit">
                      Search
                    </button>

                    <button type="button" className="marketplace-search-panel__ugc-btn">
                      <LuSparkles />
                      <span>Generate Sales Ready UGC Ads</span>
                    </button>
                  </div>

                  <div className="marketplace-search-panel__filters">
                    <SelectField
                      label="Ships To"
                      value={shipsTo}
                      options={filterOptions.shipsTo}
                      onChange={(event) => setShipsTo(event.target.value)}
                    />
                    <SelectField
                      label="Currency"
                      value={currency}
                      options={filterOptions.currency}
                      onChange={(event) => setCurrency(event.target.value)}
                    />
                    <SelectField
                      label="Ships From"
                      value={shipsFrom}
                      options={filterOptions.shipsFrom}
                      onChange={(event) => setShipsFrom(event.target.value)}
                    />
                    <SelectField
                      label="Price Range"
                      value={priceRange}
                      options={filterOptions.priceRange}
                      onChange={(event) => setPriceRange(event.target.value)}
                    />
                    <SelectField
                      label="Supplier"
                      value={supplier}
                      options={filterOptions.supplier}
                      onChange={(event) => setSupplier(event.target.value)}
                    />
                  </div>

                  <div className="marketplace-category-row" aria-label="Category filters">
                    {categoryFilters.map((category) => {
                      const Icon = category.icon;
                      const isActive =
                        activeCategory === category.label ||
                        (category.key === "all" && activeCategory === "All Categories");

                      return (
                        <button
                          type="button"
                          key={category.key}
                          className={`marketplace-category-item ${isActive ? "marketplace-category-item--active" : ""}`}
                          onClick={() => selectCategory(category)}
                        >
                          <span className="marketplace-category-item__icon">
                            <Icon />
                          </span>
                          <span className="marketplace-category-item__label">{category.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {currentSubfilters.length ? (
                    <div className="marketplace-subfilters">
                      <div className="marketplace-subfilters__title">{activeCategory}</div>
                      <div className="marketplace-subfilters__chips">
                        {currentSubfilters.map((subfilter) => (
                          <button
                            type="button"
                            key={subfilter}
                            className={`marketplace-subfilters__chip ${activeSubfilter === subfilter ? "marketplace-subfilters__chip--active" : ""}`}
                            onClick={() =>
                              setActiveSubfilter((current) => (current === subfilter ? "" : subfilter))
                            }
                          >
                            {subfilter}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </section>

                <section className="marketplace-toolbar">
                  <div className="marketplace-toolbar__left">
                    {filterPills.map((item) => {
                      const Icon = item.icon;
                      const isActive = selectedPill === item.label;

                      return (
                        <button
                          type="button"
                          key={item.label}
                          className={`filter-pill ${isActive ? "filter-pill--active" : ""}`}
                          onClick={() =>
                            setSelectedPill((current) => (current === item.label ? "" : item.label))
                          }
                        >
                          <Icon />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="marketplace-toolbar__right">
                    <span className="marketplace-toolbar__sort-label">Sort By:</span>
                    <div className="marketplace-toolbar__sort-control">
                      <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                        {filterOptions.sortBy.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      <LuChevronDown />
                    </div>
                  </div>
                </section>

                <div className="marketplace-sections">
                  {expandedProductsTitle ? (
                    <section className="marketplace-expanded-products">
                      <div className="marketplace-expanded-products__head">
                        <h2 className="marketplace-section__title">{expandedProductsTitle}</h2>
                        <button
                          type="button"
                          className="marketplace-section__see-more"
                          onClick={resetMarketplaceView}
                        >
                          Back to all categories
                        </button>
                      </div>

                      {visibleProducts.length ? (
                        <div className="marketplace-expanded-products__grid">
                          {visibleProducts.map((item) => (
                            <ProductCard item={item} key={item.id} />
                          ))}
                        </div>
                      ) : (
                        <div className="marketplace-products__empty">
                          <LuSlidersHorizontal />
                          <p>No products match the current filters.</p>
                        </div>
                      )}
                    </section>
                  ) : visibleSections.length ? (
                    visibleSections.map((section) => (
                      <CarouselSection key={section.key} onSeeMore={openProductsView} section={section} />
                    ))
                  ) : (
                    <div className="marketplace-products__empty">
                      <LuSlidersHorizontal />
                      <p>No products match the current filters.</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </main>

          <button type="button" className="marketplace-help-btn" aria-label="Open support chat">
            <LuMessageCircleMore />
          </button>
        </div>
      </section>
    </div>
  );
};

export default MarketplaceDashboard;
