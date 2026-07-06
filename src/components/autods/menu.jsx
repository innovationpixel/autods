import {
  LuBadgeCheck,
  LuChartLine,
  LuClipboardList,
  LuFilePenLine,
  LuGauge,
  LuHeadphones,
  LuPackage2,
  LuPackageSearch,
  LuSettings2,
  LuStore,
  LuUsers,
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
        { label: "Hand-Picked Products", icon: LuBadgeCheck },
        { label: "Trending Products", icon: LuChartLine },
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
    { label: "Customer Support", page: "customer-support", icon: LuHeadphones },
    { label: "Settings", page: "settings", icon: LuSettings2 },
  ],
];

/** Super admin sidebar items. */
export const adminSidebarItems = [
  { label: "Dashboard", page: "admin", icon: LuGauge, marker: "#c4b5fd" },
  { label: "Clients", page: "admin/clients", icon: LuUsers, marker: "#93c5fd" },
  { label: "Plans", page: "admin/plans", icon: LuBadgeCheck, marker: "#f6c6c4" },
  { label: "Settings", page: "admin/settings", icon: LuSettings2, marker: "#9ad2c0" },
];

/** Super admin routes — separate from the client marketplace shell. */
export const adminPages = [
  "admin",
  "admin/clients",
  "admin/plans",
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
