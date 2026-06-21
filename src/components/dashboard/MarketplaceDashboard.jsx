import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
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
  LuLogOut,
  LuMenu,
  LuMessageCircleMore,
  LuMoon,
  LuPackage2,
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
  LuLoader,
} from "react-icons/lu";
import "../../assets/css/marketplace-utilities.css";
import "../../assets/css/marketplace-dashboard.css";
import { ThemeContext } from "../../context/ThemeContext";
import MarketplaceSettingsPage from "./MarketplaceSettingsPage";
import CustomerSupportContent from "./CustomerSupportPage";
import SourcingRequestContent from '../autods/pages/SourcingRequestContent';
import { filterPills, addProductsMenuItems, storeSwitcherMenuItems, multipleProductsTabs, finderPlans, categoryFilters, subfilterOptions, filterOptions, podCategoryFilters, podProducts, profileMenuItems, headerNotifications, NOTIFICATION_PREVIEW_LIMIT, whatsNewItems, loadBalanceAmounts, aiCreditPackages, importSuppliers } from '../autods/constants';
import { sidebarGroups, marketplacePages } from '../autods/menu';
import { buildItem, parsePriceValue, getSectionCategory } from '../autods/helpers';
import SidebarLink from '../autods/SidebarLink';
import SelectField from '../autods/SelectField';
import ConnectEbayModal from '../autods/ConnectEbayModal';
import AddProductModal from '../autods/AddProductModal';
import MarketplaceSections from '../autods/pages/MarketplaceSections';
import PrintOnDemandContent from '../autods/pages/PrintOnDemandContent';
import DashboardContent from '../autods/pages/DashboardContent';
import OrdersContent from '../autods/pages/OrdersContent';
import ProductsContent from '../autods/pages/ProductsContent';
import DraftsContent from '../autods/pages/DraftsContent';
import HelpCenterContent from '../autods/pages/HelpCenterContent';
import WalletContent from '../autods/pages/WalletContent';
import OrderProcessingContent from '../autods/pages/OrderProcessingContent';
import CalculationsContent from '../autods/pages/CalculationsContent';
import NotFoundContent from '../autods/pages/NotFoundContent';
import { fetchEbayStatus, disconnectEbayAction, fetchEbayDrafts, fetchEbayListings } from '../../store/actions/EbayActions';
import { selectEbayConnections, selectEbayConnectionsLoading, selectEbayListingsMeta, selectEbayDraftsMeta } from '../../store/selectors/EbaySelectors';
import { selectUser } from '../../store/selectors/AuthSelectors';
import { getUserEmail, getUserFullName, getUserShortName } from '../../utils/userDisplay';
import { getEbayAuthUrl } from '../../services/EbayService';
import {
  mapEbayConnectionToStore,
  parseEbayConnectionId,
} from '../../utils/ebayStore';
import { searchAliExpressAction, fetchAliExpressStatus } from '../../store/actions/AliExpressActions';
import { logoutAction } from '../../store/actions/AuthActions';
import { getAccountAlert } from '../../services/BillingService';
import { useOAuthHandler } from '../../hooks/useOAuthHandler';
import {
  openOAuthPopup,
  openAliExpressOAuth,
  watchOAuthPopup,
  markOAuthReturnOrigin,
  ALIEXPRESS_OAUTH_HINT,
} from '../../utils/oauthBridge';
import {
  selectAliItems,
  selectAliLoading,
  selectAliError,
  selectAliRequiresAuth,
  selectAliCredentialsMissing,
  selectAliConnected,
  selectAliCredentialsConfigured,
} from '../../store/selectors/AliExpressSelectors';
import { getAliExpressAuthUrl } from '../../services/AliExpressService';
import { importProduct, importProductsBulk, getImportBatch } from '../../services/ProductService';
import {
  applyDetectedImportSupplier,
  importSupplierHint,
  isImportSupplierEnabled,
} from '../../utils/detectImportSupplier';
import PlansPage from '../autods/pages/PlansPage';
import AdminPlansPage from '../autods/pages/AdminPlansPage';
import { toast } from '../../utils/toast';
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
const ALIEXPRESS_CATEGORY_MAP = {
  "Toys & Hobbies":             "1511",
  "Home & Garden":              "13",
  "Home Improvements & Tools":  "1420",
  "Outdoors":                   "100006792",
  "Sports & Fitness":           "18",
  "Pets":                       "322",
  "Electronics & Gadgets":      "44",
  "Clothing, Shoes & Jewelry":  "3",
  "Beauty & Personal Care":     "66",
  "Automotive & Motorcycle":    "34",
};

const ALIEXPRESS_SORT_MAP = {
  "By Relevance":     "volumeDesc",
  "Newest":           "volumeDesc",
  "Fastest Shipping": "volumeAsc",
  "Lowest Price":     "priceAsc",
};

const MarketplaceDashboard = () => {
  const { background, changeBackground } = useContext(ThemeContext);
  const dispatch   = useDispatch();
  const aliItems        = useSelector(selectAliItems);
  const aliLoading      = useSelector(selectAliLoading);
  const aliError        = useSelector(selectAliError);
  const aliRequiresAuth = useSelector(selectAliRequiresAuth);
  const aliCredentialsMissing = useSelector(selectAliCredentialsMissing);
  const aliConnected    = useSelector(selectAliConnected);
  const aliCredentialsConfigured = useSelector(selectAliCredentialsConfigured);
  const ebayConnections = useSelector(selectEbayConnections);
  const ebayConnectionsLoading = useSelector(selectEbayConnectionsLoading);
  const listingsMeta = useSelector(selectEbayListingsMeta);
  const draftsMeta = useSelector(selectEbayDraftsMeta);
  const authUser = useSelector(selectUser);
  const profileShortName = useMemo(() => getUserShortName(authUser), [authUser]);
  const profileFullName = useMemo(() => getUserFullName(authUser), [authUser]);
  const profileEmail = useMemo(() => getUserEmail(authUser), [authUser]);
  const [aliConnecting, setAliConnecting] = useState(false);
  const [ebayConnecting, setEbayConnecting] = useState(false);
  const [storeOverrides, setStoreOverrides] = useState({});
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const activePage = pathname === "/" ? "dashboard" : pathname.slice(1);
  const isUnknownPage = !marketplacePages.includes(activePage);
  const setActivePage = (page) => navigate(page === "dashboard" ? "/" : `/${page}`);
  const [searchAnything, setSearchAnything] = useState("");
  const [accountAlert, setAccountAlert] = useState(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [addProductsMenuOpen, setAddProductsMenuOpen] = useState(false);
  const [addProductModalOpen, setAddProductModalOpen] = useState(false);
  const [addProductModalMode, setAddProductModalMode] = useState("single");
  const [storeSwitcherOpen, setStoreSwitcherOpen] = useState(false);
  const [connectEbayModalOpen, setConnectEbayModalOpen] = useState(false);
  const [ebaySiteId, setEbaySiteId] = useState("EBAY_US");
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
  const [importSupplier, setImportSupplier] = useState("aliexpress");
  const [importWarehouse, setImportWarehouse] = useState("CN");
  const [multipleProductsTab, setMultipleProductsTab] = useState("urls");
  const [multipleProductsUrls, setMultipleProductsUrls] = useState("");
  const [multipleProductsCsvFile, setMultipleProductsCsvFile] = useState("");
  const [csvFileObject, setCsvFileObject] = useState(null);
  const [importSubmitting, setImportSubmitting] = useState(false);
  const [importBatchProgress, setImportBatchProgress] = useState(null);
  const csvFileInputRef = useRef(null);
  const [finderSelections, setFinderSelections] = useState({
    basic: 0,
    popular: 0,
    "best-sellers": 0,
  });
  const [sidebarStoreId, setSidebarStoreId] = useState('');
  const [selectedStoreIds, setSelectedStoreIds] = useState([]);
  const [pendingSelectedStoreIds, setPendingSelectedStoreIds] = useState([]);
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
  const aliSearchTimer = useRef(null);

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
      connectEbayModalOpen ||
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
  }, [addProductModalOpen, aiCreditsModalOpen, connectEbayModalOpen, loadBalanceModalOpen, notificationsModalOpen, notificationsOpen, storeSwitcherOpen]);

  useEffect(() => {
    dispatch(fetchEbayStatus());
    dispatch(fetchAliExpressStatus());
  }, [dispatch]);

  useEffect(() => {
    if (!authUser) {
      setAccountAlert(null);
      return;
    }

    getAccountAlert()
      .then((res) => setAccountAlert(res.data ?? null))
      .catch(() => setAccountAlert({ show: false }));
  }, [authUser, pathname]);

  const stores = useMemo(
    () =>
      ebayConnections.map((connection) => {
        const base = mapEbayConnectionToStore(connection);
        const override = storeOverrides[base.id] ?? {};

        return {
          ...base,
          ...override,
          sidebarName:
            sidebarStoreId === base.id && override.sidebarName
              ? override.sidebarName
              : override.sidebarName ?? base.sidebarName,
        };
      }),
    [ebayConnections, storeOverrides, sidebarStoreId],
  );

  const connectionIdsKey = ebayConnections.map((c) => c.id).join(',');

  useEffect(() => {
    if (!ebayConnections.length) {
      setSidebarStoreId('');
      setSelectedStoreIds([]);
      setPendingSelectedStoreIds([]);
      return;
    }

    const ids = ebayConnections.map((c) => mapEbayConnectionToStore(c).id);
    const primary = ebayConnections.find((c) => c.is_primary) ?? ebayConnections[0];
    const primaryStoreId = mapEbayConnectionToStore(primary).id;

    setSelectedStoreIds((prev) => {
      const valid = prev.filter((id) => ids.includes(id));
      return valid.length ? valid : ids;
    });

    setPendingSelectedStoreIds((prev) => {
      const valid = prev.filter((id) => ids.includes(id));
      return valid.length ? valid : ids;
    });

    setSidebarStoreId((prev) => (prev && ids.includes(prev) ? prev : primaryStoreId));
  }, [connectionIdsKey, ebayConnections]);

  const oauthHandlers = useMemo(
    () => ({
      onEbayConnected: () => {
        dispatch(fetchEbayStatus());
      },
      onEbayError: () => {
        dispatch(fetchEbayStatus());
      },
      onAliConnected: () => {
        setAliConnecting(false);
        dispatch(fetchAliExpressStatus());
      },
      onAliError: () => setAliConnecting(false),
    }),
    [dispatch],
  );

  useOAuthHandler(oauthHandlers);

  const connectEbay = async () => {
    try {
      setEbayConnecting(true);
      markOAuthReturnOrigin();
      const res = await getEbayAuthUrl();
      const popup = openOAuthPopup(res.data.url, 'ebay_oauth');

      if (!popup) {
        setEbayConnecting(false);
        toast.error('Browser blocked the eBay window. Allow popups for this site and try again.');
        return;
      }

      watchOAuthPopup(popup, () => {
        setEbayConnecting(false);
        setConnectEbayModalOpen(false);
        dispatch(fetchEbayStatus());
      });
    } catch (err) {
      setEbayConnecting(false);
      toast.error(err.response?.data?.error ?? 'Failed to start eBay authorization.');
    }
  };

  const connectAliExpress = async () => {
    try {
      setAliConnecting(true);
      markOAuthReturnOrigin();
      const res = await getAliExpressAuthUrl();
      const popup = openAliExpressOAuth(res.data.url);

      if (!popup) {
        setAliConnecting(false);
        toast.error("Browser blocked the AliExpress window. Allow popups for this site and try again.");
        return;
      }

      toast.info(ALIEXPRESS_OAUTH_HINT, { autoClose: 8000 });

      watchOAuthPopup(popup, () => {
        setAliConnecting(false);
        dispatch(fetchAliExpressStatus());
      });
    } catch (err) {
      setAliConnecting(false);
      toast.error(err.response?.data?.error ?? "Failed to start AliExpress authorization.");
    }
  };

  // AliExpress browse — fires when marketplace is active and filters change
  useEffect(() => {
    if (activePage !== "marketplace") return;
    if (!aliCredentialsConfigured) return;

    if (aliSearchTimer.current) clearTimeout(aliSearchTimer.current);

    aliSearchTimer.current = setTimeout(() => {
      const categoryId = ALIEXPRESS_CATEGORY_MAP[activeCategory];

      let sort = ALIEXPRESS_SORT_MAP[sortBy] ?? "volumeDesc";
      if (selectedPill === "Best Sellers") sort = "volumeDesc";
      if (selectedPill === "Fast Shipping") sort = "priceAsc";

      const params = {
        sort,
        limit: 20,
        ships_to: shipsTo,
        currency,
      };

      if (keywordSearch.trim()) {
        params.q = keywordSearch.trim();
      }

      if (categoryId) params.category_id = categoryId;

      if (priceRange !== "Select Price Range") {
        const parts = priceRange.replace(/\$/g, "").split(" - ");
        if (parts[0]) params.price_min = parseFloat(parts[0]);
        if (parts[1] && !parts[1].includes("+")) params.price_max = parseFloat(parts[1]);
      }

      dispatch(searchAliExpressAction(params));
    }, 500);

    return () => clearTimeout(aliSearchTimer.current);
  }, [
    activePage,
    dispatch,
    shipsTo,
    priceRange,
    sortBy,
    activeCategory,
    activeSubfilter,
    selectedPill,
    currency,
    aliCredentialsConfigured,
    aliConnected,
    keywordSearch,
  ]);

  const currentSubfilters = subfilterOptions[activeCategory] || [];
  const profileTheme = background.value;
  const isDarkTheme = profileTheme === "dark";
  const hasNotifications = headerNotifications.length > 0;
  const previewNotifications = headerNotifications.slice(0, NOTIFICATION_PREVIEW_LIMIT);
  const hasMoreNotifications = headerNotifications.length > NOTIFICATION_PREVIEW_LIMIT;
  const activeSidebarStore = useMemo(() => {
    if (stores.length === 0) {
      return {
        id: 'no-store',
        name: 'connect-ebay',
        sidebarName: 'Connect eBay',
        initials: 'EB',
        country: '—',
        marketplace: 'eBay',
      };
    }

    return stores.find((store) => store.id === sidebarStoreId) ?? stores[0];
  }, [stores, sidebarStoreId]);


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
    setKeywordSearch("");
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

  const openOrderProcessingPage = () => {
    setActivePage("order-processing");
    setSearchAnything("");
  };

  const openCalculationsPage = () => {
    setActivePage("calculations");
    setSearchAnything("");
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

  const openSourcingRequestPage = () => {
    setActivePage("sourcing-request");
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

    if (label === "Log out") {
      dispatch(logoutAction(navigate));
    }

    setProfileMenuOpen(false);
  };

  const openAddProductModal = (mode = "single") => {
    setAddProductsMenuOpen(false);
    setAddProductModalMode(mode);
    setImportBatchProgress(null);
    if (mode === "single") {
      setAddProductUrl("");
    }
    if (mode === "multiple") {
      setMultipleProductsTab("urls");
      setMultipleProductsUrls("");
      setMultipleProductsCsvFile("");
      setCsvFileObject(null);
      setFinderSelections({
        basic: 0,
        popular: 0,
        "best-sellers": 0,
      });
    }
    setAddProductModalOpen(true);
  };

  const getSelectedConnectionIds = () =>
    selectedStoreIds
      .map((storeId) => parseEbayConnectionId(storeId))
      .filter(Boolean);

  const validateImportPrerequisites = () => {
    if (!isImportSupplierEnabled(importSupplier)) {
      toast.error(`${importSuppliers.find((s) => s.id === importSupplier)?.label ?? "This supplier"} import is not available yet.`);
      return false;
    }
    if (importSupplier === "aliexpress" && !aliConnected) {
      toast.error("Connect your AliExpress account in Settings first.");
      return false;
    }
    const connectionIds = getSelectedConnectionIds();
    if (!connectionIds.length) {
      toast.error("Select at least one eBay store.");
      return false;
    }
    return connectionIds;
  };

  const handleAddProductUrlChange = (url) => {
    setAddProductUrl(url);
    applyDetectedImportSupplier(url, {
      onSupplierChange: setImportSupplier,
      onWarehouseChange: setImportWarehouse,
    });
  };

  const handleMultipleProductsUrlsChange = (urls) => {
    setMultipleProductsUrls(urls);
    const firstLine = urls.split(/[\r\n]+/).map((line) => line.trim()).find(Boolean) ?? "";
    applyDetectedImportSupplier(firstLine, {
      onSupplierChange: setImportSupplier,
      onWarehouseChange: setImportWarehouse,
    });
  };

  const refreshProductData = () => {
    dispatch(fetchEbayDrafts());
    dispatch(fetchEbayListings());
  };

  const pollImportBatch = (batchId) => {
    const interval = setInterval(async () => {
      try {
        const res = await getImportBatch(batchId);
        const batch = res.data;
        setImportBatchProgress(batch);
        if (batch.status === "completed" || batch.status === "failed") {
          clearInterval(interval);
          setImportSubmitting(false);
          refreshProductData();
          toast.success(`Import finished: ${batch.completed} succeeded, ${batch.failed} failed.`);
        }
      } catch {
        clearInterval(interval);
        setImportSubmitting(false);
      }
    }, 1500);
  };

  const handleSingleImport = async (action) => {
    const connectionIds = validateImportPrerequisites();
    if (!connectionIds) return;
    if (!addProductUrl.trim()) {
      toast.warn(importSupplierHint(importSupplier));
      return;
    }

    setImportSubmitting(true);
    try {
      const res = await importProduct({
        url_or_id: addProductUrl.trim(),
        connection_ids: connectionIds,
        action,
        warehouse: importWarehouse,
        supplier: importSupplier,
      });
      toast.success(res.data?.message ?? "Product imported.");
      setAddProductModalOpen(false);
      refreshProductData();
      if (action === "publish") {
        navigate("/products");
      } else {
        navigate("/drafts");
      }
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Import failed.");
    } finally {
      setImportSubmitting(false);
    }
  };

  const handleBulkImport = async () => {
    const connectionIds = validateImportPrerequisites();
    if (!connectionIds) return;

    setImportSubmitting(true);
    try {
      let res;
      if (multipleProductsTab === "csv" && csvFileObject) {
        const formData = new FormData();
        formData.append("csv_file", csvFileObject);
        connectionIds.forEach((id) => formData.append("connection_ids[]", id));
        formData.append("action", "draft");
        formData.append("warehouse", importWarehouse);
        formData.append("supplier", importSupplier);
        res = await importProductsBulk(formData);
      } else if (multipleProductsTab === "urls") {
        const urls = multipleProductsUrls.split(/[\r\n]+/).map((l) => l.trim()).filter(Boolean);
        res = await importProductsBulk({
          urls,
          connection_ids: connectionIds,
          action: "draft",
          warehouse: importWarehouse,
          supplier: importSupplier,
        });
      } else {
        toast.warn("Finder import is not available yet.");
        setImportSubmitting(false);
        return;
      }

      const batchId = res.data?.batch_id;
      if (batchId) {
        setImportBatchProgress({ total: res.data.total, completed: 0, failed: 0, status: "processing" });
        pollImportBatch(batchId);
        toast.info("Bulk import started.");
      }
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Bulk import failed.");
      setImportSubmitting(false);
    }
  };

  const toggleModalStoreSelection = (storeId) => {
    setSelectedStoreIds((current) =>
      current.includes(storeId)
        ? current.filter((id) => id !== storeId)
        : [...current, storeId],
    );
  };

  const selectedStoreLabel =
    selectedStoreIds.length === 0
      ? "No store selected"
      : selectedStoreIds.length === 1
        ? stores.find((s) => s.id === selectedStoreIds[0])?.sidebarName ?? "1 store"
        : `${selectedStoreIds.length} stores`;

  const openStoreSwitcherModal = () => {
    if (stores.length === 0 && !ebayConnectionsLoading) {
      setConnectEbayModalOpen(true);
      return;
    }

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

    setStoreOverrides((current) => ({
      ...current,
      [storeId]: {
        ...current[storeId],
        name: nextName,
        sidebarName: storeId === sidebarStoreId ? nextName : current[storeId]?.sidebarName,
      },
    }));
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
      const connectionId = parseEbayConnectionId(storeId);
      if (connectionId && window.confirm('Disconnect this eBay account from Auto DS?')) {
        dispatch(disconnectEbayAction(connectionId));
      }
      setStoreSwitcherMenuId("");
      return;
    }

    if (actionId === "copy-token" || actionId === "renew-token" || actionId === "resync" || actionId === "convert") {
      toast.info('This action is not available yet.');
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
    importSubmitting ||
    (multipleProductsTab === "urls" ? !multipleProductsUrls.trim() : !csvFileObject);

  const importSupplierEnabled =
    importSuppliers.find((supplier) => supplier.id === importSupplier)?.enabled !== false;

  const pageTitle = isUnknownPage
    ? "Page Not Found"
    : activePage === "print-on-demand"
      ? "Print On Demand"
      : activePage === "order-processing"
        ? "Order Processing"
        : activePage === "calculations"
          ? "Calculations"
          : activePage === "dashboard"
        ? "Dashboard"
        : activePage === "orders"
          ? `Orders`
          : activePage === "sourcing-request"
            ? "Sourcing Request"
          : activePage === "products"
            ? `Products (${listingsMeta?.total ?? 0})`
            : activePage === "drafts"
              ? `Upload (${draftsMeta?.total ?? 0})`
              : activePage === "plans"
                ? "Plans"
                : activePage === "admin/plans"
                  ? "Manage Plans"
              : activePage === "customer-support"
                ? "Customer Support"
                : activePage === "support-center"
                  ? "Help Center"
                  : activePage === "wallet"
                    ? "AutoDS Wallet"
                    : activePage === "settings"
                      ? "Settings"
                      : "Marketplace";

  const handleAccountAlertAction = (event) => {
    event.preventDefault();
    const target = accountAlert?.action_path ?? "/settings?tab=billing";
    navigate(target.startsWith("/") ? target : `/${target}`);
  };

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
                  active: item.page ? activePage === item.page : false,
                };

                return (
                  <SidebarLink
                    item={navItem}
                    key={item.label}
                    isOpen={Boolean(openMenus[item.label])}
                    onSelect={(selectedItem) => {
                      if (!selectedItem.page) {
                        return;
                      }

                      const pageHandlers = {
                        marketplace: openMarketplacePage,
                        "print-on-demand": openPrintOnDemandPage,
                        "order-processing": openOrderProcessingPage,
                        calculations: openCalculationsPage,
                        dashboard: openDashboardPage,
                        orders: openOrdersPage,
                        "sourcing-request": openSourcingRequestPage,
                        products: openProductsPage,
                        drafts: openDraftsPage,
                        "customer-support": openCustomerSupportPage,
                        settings: openSettingsPage,
                      };

                      pageHandlers[selectedItem.page]?.();
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
          <button
            type="button"
            className="marketplace-sidebar__guide-btn marketplace-sidebar__logout-btn"
            onClick={() => dispatch(logoutAction(navigate))}
          >
            <span className="marketplace-sidebar__guide-copy">
              <LuLogOut />
              <span>Log out</span>
            </span>
          </button>
        </div>
      </aside>

      <section className="marketplace-main">
        {accountAlert?.show ? (
          <div className={`topbar-alert topbar-alert--${accountAlert.severity === "critical" ? "critical" : "warning"}`}>
            <span className="topbar-alert__icon">!</span>
            <span>
              {accountAlert.message}{" "}
              {accountAlert.action_label ? (
                <a href={accountAlert.action_path ?? "/settings?tab=billing"} onClick={handleAccountAlertAction}>
                  {accountAlert.action_label}
                </a>
              ) : null}
            </span>
          </div>
        ) : null}

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
              <h1 className="section-title marketplace-header__title">{pageTitle}</h1>
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
                  <span>{profileShortName}</span>
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
                          <strong>{profileFullName}</strong>
                          <span>{profileEmail || "—"}</span>
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
                  {ebayConnectionsLoading && stores.length === 0 ? (
                    <div className="store-switcher-modal__empty" style={{ padding: '24px 16px', textAlign: 'center', color: '#6b7280' }}>
                      <LuLoader className="spin-icon" style={{ margin: '0 auto 8px', display: 'block' }} />
                      Loading eBay accounts…
                    </div>
                  ) : null}

                  {!ebayConnectionsLoading && filteredStores.length === 0 ? (
                    <div className="store-switcher-modal__empty" style={{ padding: '24px 16px', textAlign: 'center' }}>
                      <p style={{ margin: '0 0 12px', color: '#6b7280' }}>No eBay accounts connected yet.</p>
                      <button
                        type="button"
                        className="store-switcher-modal__update-btn"
                        onClick={connectEbay}
                        disabled={ebayConnecting}
                      >
                        {ebayConnecting ? 'Opening eBay…' : 'Connect eBay Account'}
                      </button>
                    </div>
                  ) : null}

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
                                {store.isPrimary ? (
                                  <span style={{ fontSize: 10, fontWeight: 700, color: '#065f46', marginLeft: 6 }}>PRIMARY</span>
                                ) : null}
                                <button type="button" aria-label={`Rename ${store.name}`} onClick={() => beginStoreRename(store.id)}>
                                  <LuPencil />
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
                  <button
                    type="button"
                    className="store-switcher-modal__add-btn"
                    onClick={connectEbay}
                    disabled={ebayConnecting}
                  >
                    {ebayConnecting ? <LuLoader className="spin-icon" /> : <LuPlus />}
                    <span>{ebayConnecting ? 'Opening eBay…' : 'Add Store'}</span>
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

          <ConnectEbayModal
            open={connectEbayModalOpen}
            onClose={() => setConnectEbayModalOpen(false)}
            onConnect={connectEbay}
            connecting={ebayConnecting}
            siteId={ebaySiteId}
            onSiteChange={setEbaySiteId}
          />

          <AddProductModal
            open={addProductModalOpen}
            mode={addProductModalMode}
            onClose={() => setAddProductModalOpen(false)}
            selectedStoreLabel={selectedStoreLabel}
            onEditStores={openStoreSwitcherModal}
            addProductUrl={addProductUrl}
            onAddProductUrlChange={handleAddProductUrlChange}
            multipleProductsTab={multipleProductsTab}
            onMultipleProductsTabChange={setMultipleProductsTab}
            multipleProductsUrls={multipleProductsUrls}
            onMultipleProductsUrlsChange={handleMultipleProductsUrlsChange}
            multipleProductsCsvFile={multipleProductsCsvFile}
            csvFileObject={csvFileObject}
            onCsvFileChange={(file) => {
              setCsvFileObject(file);
              setMultipleProductsCsvFile(file?.name ?? "");
            }}
            finderSelections={finderSelections}
            onAdjustFinderSelection={adjustFinderSelection}
            importSupplier={importSupplier}
            onImportSupplierChange={setImportSupplier}
            importWarehouse={importWarehouse}
            onImportWarehouseChange={setImportWarehouse}
            importSubmitting={importSubmitting}
            importBatchProgress={importBatchProgress}
            finderTotalCredits={finderTotalCredits}
            multipleProductsActionDisabled={multipleProductsActionDisabled}
            onSingleImport={handleSingleImport}
            onBulkImport={handleBulkImport}
            supplierEnabled={importSupplierEnabled}
          />

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
            {isUnknownPage ? (
              <NotFoundContent />
            ) : activePage === "print-on-demand" ? (
              <PrintOnDemandContent
                activeCategory={activePodCategory}
                onCategoryChange={setActivePodCategory}
                products={filteredPodProducts}
              />
            ) : activePage === "order-processing" ? (
              <OrderProcessingContent />
            ) : activePage === "calculations" ? (
              <CalculationsContent searchQuery={searchAnything} />
            ) : activePage === "dashboard" ? (
              <DashboardContent searchQuery={searchAnything} />
            ) : activePage === "orders" ? (
              <OrdersContent searchQuery={searchAnything} />
            ) : activePage === "sourcing-request" ? (
              <SourcingRequestContent searchQuery={searchAnything} />
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
            ) : activePage === "plans" ? (
              <PlansPage />
            ) : activePage === "admin/plans" ? (
              <AdminPlansPage />
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
                      <span aria-hidden="true">✦</span>
                      <span>UGC Video Ads</span>
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
                  <MarketplaceSections
                    aliLoading={aliLoading}
                    aliError={aliError}
                    aliRequiresAuth={aliRequiresAuth}
                    aliCredentialsMissing={aliCredentialsMissing}
                    aliCredentialsConfigured={aliCredentialsConfigured}
                    aliItems={aliItems}
                    aliConnecting={aliConnecting}
                    onConnectAliExpress={connectAliExpress}
                    expandedProductsTitle={expandedProductsTitle}
                    visibleProducts={visibleProducts}
                    visibleSections={visibleSections}
                    keywordSearch={keywordSearch}
                    onSeeMore={openProductsView}
                    onResetView={resetMarketplaceView}
                  />
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