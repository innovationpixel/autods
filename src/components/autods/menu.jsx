import {
  LuBadgeCheck,
  LuChartLine,
  LuClipboardList,
  LuFilePenLine,
  LuGauge,
  LuHeadphones,
  LuLayers,
  LuPackage2,
  LuPackageSearch,
  LuSettings2,
  LuShieldCheck,
  LuStore,
  LuUsers,
  LuVideo,
  LuWalletCards,
} from "react-icons/lu";

/** Marketplace dashboard sidebar — edit groups and items here. */
export const sidebarGroups = [
  [
    { label: "Dashboard", page: "dashboard", icon: LuGauge, marker: "#f6c6c4" },
    {
      label: "Marketplace",
      page: "marketplace",
      icon: LuStore,
      active: true,
      children: [
        { label: "Hand-Picked Products", icon: LuBadgeCheck, curatedType: "hand_picked" },
        { label: "Trending Products", icon: LuChartLine, curatedType: "trending" },
      ],
    },
    { label: "Order Processing", page: "order-processing", icon: LuClipboardList },
    { label: "Calculations", page: "calculations", icon: LuChartLine },
  ],
  [
    { label: "Orders", page: "orders", icon: LuClipboardList },
    { label: "Sourcing Request", page: "sourcing-request", icon: LuPackageSearch, marker: "#f1b45c" },
    { label: "Products", page: "products", icon: LuPackage2, marker: "#9ad2c0" },
    { label: "Drafts", page: "drafts", icon: LuFilePenLine },
    { label: "Wallet", page: "wallet", icon: LuWalletCards },
    { label: "AI Video Generation", page: "ai-video-generation", icon: LuVideo, marker: "#c7b8f5" },
    { label: "Customer Support", page: "customer-support", icon: LuHeadphones },
    { label: "Settings", page: "settings", icon: LuSettings2 },
  ],
];

/** Super admin sidebar items. Each item's `page` doubles as its permission module key
 *  (see backend UserController::ADMIN_MODULES / frontend ADMIN_MODULES in constants.js),
 *  except "admin" (Dashboard), which is always visible. */
export const adminSidebarItems = [
  { label: "Dashboard", page: "admin", icon: LuGauge, marker: "#c4b5fd" },
  { label: "Clients", page: "admin/clients", icon: LuUsers, marker: "#93c5fd" },
  { label: "All Listings", page: "admin/listings", icon: LuPackage2, marker: "#9ad2c0" },
  { label: "All Orders", page: "admin/orders", icon: LuClipboardList, marker: "#f1b45c" },
  { label: "Wire Transfer Deposits", page: "admin/wallet-deposits", icon: LuWalletCards, marker: "#93c5fd" },
  { label: "Plans", page: "admin/plans", icon: LuBadgeCheck, marker: "#f6c6c4" },
  { label: "Categories", page: "admin/categories", icon: LuLayers, marker: "#a5d8ff" },
  { label: "Trending Products", page: "admin/trending-products", icon: LuChartLine, marker: "#ffd8a8" },
  { label: "Hand-Picked Products", page: "admin/hand-picked-products", icon: LuBadgeCheck, marker: "#b2f2bb" },
  { label: "Admin Users", page: "admin/admin-users", icon: LuShieldCheck, marker: "#d0bfff" },
  { label: "Customer Support", page: "admin/support", icon: LuHeadphones, marker: "#f1b45c" },
  { label: "Settings", page: "admin/settings", icon: LuSettings2, marker: "#9ad2c0" },
];

/** Maps an admin sidebar `page` to the permission module key that gates it. */
export const adminPageModuleMap = {
  "admin": null,
  "admin/clients": "clients",
  "admin/listings": "listings",
  "admin/orders": "orders",
  "admin/wallet-deposits": "wallet_deposits",
  "admin/plans": "plans",
  "admin/categories": "categories",
  "admin/trending-products": "trending_products",
  "admin/hand-picked-products": "hand_picked_products",
  "admin/admin-users": "admin_users",
  // Not module-gated on the backend yet (support-tickets routes have no admin_module middleware),
  // so it stays visible to any super admin regardless of their module toggles.
  "admin/support": null,
  "admin/settings": "settings",
};

/** Super admin routes — separate from the client marketplace shell. */
export const adminPages = [
  "admin",
  "admin/clients",
  "admin/listings",
  "admin/orders",
  "admin/wallet-deposits",
  "admin/plans",
  "admin/categories",
  "admin/trending-products",
  "admin/hand-picked-products",
  "admin/admin-users",
  "admin/support",
  "admin/settings",
];

/** Routes reachable in the marketplace shell (sidebar + header shortcuts). */
export const marketplacePages = [
  ...sidebarGroups
    .flat()
    .map((item) => item.page)
    .filter(Boolean),
  "support-center",
  "wallet",
  "plans",
];
