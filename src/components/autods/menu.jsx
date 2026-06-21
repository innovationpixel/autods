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

/** Routes reachable in the marketplace shell (sidebar + header shortcuts). */
export const marketplacePages = [
  ...sidebarGroups
    .flat()
    .map((item) => item.page)
    .filter(Boolean),
  "support-center",
  "wallet",
  "plans",
  "admin/plans",
];
