import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LuBadgeCheck,
  LuBox,
  LuBriefcaseBusiness,
  LuCar,
  LuCheck,
  LuChevronDown,
  LuChevronLeft,
  LuChevronRight,
  LuClipboardList,
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
  LuPlus,
  LuRefreshCcw,
  LuSearch,
  LuSettings2,
  LuShirt,
  LuSlidersHorizontal,
  LuStore,
  LuSun,
  LuTabletSmartphone,
  LuTruck,
  LuUmbrella,
  LuUpload,
  LuUserRound,
  LuVolume2,
  LuWallet,
  LuChartLine,
  LuWrench,
  LuTrash2,
  LuX,
  LuZap,
  LuLoader,
} from "react-icons/lu";
import "../../assets/css/marketplace-utilities.css";
import "../../assets/css/marketplace-dashboard.css";
import "../../assets/css/autoprime-theme.css";
import { ThemeContext } from "../../context/ThemeContext";
import MarketplaceSettingsPage from "./MarketplaceSettingsPage";
import CustomerSupportContent from "./CustomerSupportPage";
import SourcingRequestContent from '../autods/pages/SourcingRequestContent';
import HeaderNotifications from '../autods/HeaderNotifications';
import { filterPills, addProductsMenuItems, storeSwitcherMenuItems, multipleProductsTabs, finderPlans, categoryFilters, subfilterOptions, filterOptions, podCategoryFilters, podProducts, profileMenuItems, whatsNewItems, importSuppliers } from '../autods/constants';
import { sidebarGroups, marketplacePages } from '../autods/menu';
import { mapAliItemToCard } from '../autods/helpers';
import SidebarLink from '../autods/SidebarLink';
import SelectField from '../autods/SelectField';
import ConnectEbayModal from '../autods/ConnectEbayModal';
import AddProductModal from '../autods/AddProductModal';
import MarketplaceSections from '../autods/pages/MarketplaceSections';
import CuratedProductsPage from '../autods/pages/CuratedProductsPage';
import PrintOnDemandContent from '../autods/pages/PrintOnDemandContent';
import DashboardContent from '../autods/pages/DashboardContent';
import OrdersContent from '../autods/pages/OrdersContent';
import ReturnsDisputesContent from '../autods/pages/ReturnsDisputesContent';
import ProductsContent from '../autods/pages/ProductsContent';
import DraftsContent from '../autods/pages/DraftsContent';
import HelpCenterContent from '../autods/pages/HelpCenterContent';
import UsageUpgradeContent from '../autods/pages/UsageUpgradeContent';
import WalletContent from '../autods/pages/WalletContent';
import OrderProcessingContent from '../autods/pages/OrderProcessingContent';
import CalculationsContent from '../autods/pages/CalculationsContent';
import NotFoundContent from '../autods/pages/NotFoundContent';
import AiVideoGenerationContent from '../autods/pages/AiVideoGenerationContent';
import { fetchEbayStatus, disconnectEbayAction, fetchEbayDrafts, fetchEbayListings } from '../../store/actions/EbayActions';
import { selectEbayConnections, selectEbayConnectionsLoading, selectEbayListingsMeta, selectEbayDraftsMeta } from '../../store/selectors/EbaySelectors';
import { selectUser } from '../../store/selectors/AuthSelectors';
import { getUserEmail, getUserFullName, getUserShortName } from '../../utils/userDisplay';
import { getEbayAuthUrl, updateEbayStoreName } from '../../services/EbayService';
import {
  mapEbayConnectionToStore,
  parseEbayConnectionId,
} from '../../utils/ebayStore';

const STORE_OVERRIDES_STORAGE_KEY = 'autods_store_overrides_v1';

function loadStoredStoreOverrides() {
  try {
    const raw = localStorage.getItem(STORE_OVERRIDES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
import { searchAliExpressAction, fetchAliExpressStatus } from '../../store/actions/AliExpressActions';
import { logoutAction, updateProfileAction, updateUserStateAction, fetchFreshUserAction } from '../../store/actions/AuthActions';
import { getStoredToken, getStoredUser } from '../../services/AuthService';
import {
  ORDERS_NEW_COUNT_EVENT,
  ORDERS_NEW_COUNT_STORAGE_KEY,
  dispatchNewOrdersCount,
  getNewOrdersCount,
  markOrdersSeen,
} from '../../services/OrderService';
import { getAccountAlert } from '../../services/BillingService';
import { useOAuthHandler } from '../../hooks/useOAuthHandler';
import EbayOAuthSetupBanner from '../autods/EbayOAuthSetupBanner';
import {
  openOAuthTab,
  watchOAuthTab,
  markOAuthReturnOrigin,
  OAUTH_TAB_HINT,
} from '../../utils/oauthBridge';
import {
  selectAliItems,
  selectAliLoading,
  selectAliError,
  selectAliCredentialsMissing,
  selectAliPlatformReady,
  selectAliPlatformUnavailable,
  selectAliConnectionLoading,
  selectAliCredentialsConfigured,
  selectAliCurrentPage,
  selectAliTotalPages,
} from '../../store/selectors/AliExpressSelectors';
import { importProduct, importProductsBulk, getImportBatch } from '../../services/ProductService';
import {
  applyDetectedImportSupplier,
  importSupplierHint,
  isImportSupplierEnabled,
} from '../../utils/detectImportSupplier';
import PlansPage from '../autods/pages/PlansPage';
import { getAddonPricing, getCurrentPlan } from '../../services/PlanService';
import { toast } from '../../utils/toast';

function Search({
  className = "",
  placeholder = "",
  value = "",
  allowClear = false,
  enterButton = "Search",
  loading = false,
  onChange,
  onSearch,
  ...props
}) {
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      onSearch?.(value);
    }
  };

  return (
    <div className={`marketplace-ant-search ant-input-search ant-input-group-wrapper ${className}`}>
      <div className="ant-input-wrapper ant-input-group">
        <span className="ant-input-affix-wrapper">
          <input
            type="text"
            className="ant-input"
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            onKeyDown={handleKeyDown}
            {...props}
          />
          {allowClear && value ? (
            <span
              className="ant-input-clear-icon"
              role="button"
              tabIndex={0}
              onClick={() => {
                onChange?.({ target: { value: "" } });
                onSearch?.("");
              }}
            >
              ✕
            </span>
          ) : null}
        </span>
        <span className="ant-input-group-addon">
          <button
            type="button"
            className="ant-input-search-button"
            onClick={() => onSearch?.(value)}
            disabled={loading}
          >
            {loading ? <LuLoader className="spin-icon" /> : enterButton}
          </button>
        </span>
      </div>
    </div>
  );
}

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

function formatHeaderWalletBalance(amount, currency = "USD") {
  const numericAmount = Number(amount);
  const safeAmount = Number.isFinite(numericAmount) ? numericAmount : 0;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(safeAmount);
  } catch {
    return `$${safeAmount.toFixed(2)}`;
  }
}

const MarketplaceDashboard = () => {
  const { background, changeBackground } = useContext(ThemeContext);
  const dispatch   = useDispatch();
  const aliItems        = useSelector(selectAliItems);
  const aliLoading      = useSelector(selectAliLoading);
  const aliError        = useSelector(selectAliError);
  const aliCredentialsMissing = useSelector(selectAliCredentialsMissing);
  const aliPlatformReady = useSelector(selectAliPlatformReady);
  const aliPlatformUnavailable = useSelector(selectAliPlatformUnavailable);
  const aliConnectionLoading = useSelector(selectAliConnectionLoading);
  const aliCredentialsConfigured = useSelector(selectAliCredentialsConfigured);
  const aliCurrentPage = useSelector(selectAliCurrentPage);
  const aliTotalPages = useSelector(selectAliTotalPages);
  const [aliPage, setAliPage] = useState(1);
  const [importingCardId, setImportingCardId] = useState(null);
  const ebayConnections = useSelector(selectEbayConnections);
  const ebayConnectionsLoading = useSelector(selectEbayConnectionsLoading);
  const listingsMeta = useSelector(selectEbayListingsMeta);
  const draftsMeta = useSelector(selectEbayDraftsMeta);
  const authUser = useSelector(selectUser);

  const isVA = authUser?.role === "va" || Boolean(authUser?.parent_id);
  const vaModules = useMemo(() => {
    if (Array.isArray(authUser?.admin_modules)) return authUser.admin_modules;
    if (Array.isArray(authUser?.modules)) return authUser.modules;
    return [];
  }, [authUser]);

  const [addonCatalog, setAddonCatalog] = useState(null);
  const canAccessOrders = !isVA || vaModules.includes("orders");
  const [newOrdersCount, setNewOrdersCount] = useState(() => {
    const initial = Number(getStoredUser()?.new_orders_count ?? 0);
    return Number.isFinite(initial) ? Math.max(0, Math.floor(initial)) : 0;
  });

  const fetchAddonCatalog = async () => {
    try {
      const res = await getAddonPricing();
      if (res.data?.addons) {
        setAddonCatalog(res.data.addons);
      }
    } catch {
      // Fallback to page-level gated responses
    }
  };

  useEffect(() => {
    fetchAddonCatalog();
    const handleRefreshAddons = () => fetchAddonCatalog();
    const handleStorage = (event) => {
      if (event.key === "autods_addon_updated_at") {
        fetchAddonCatalog();
      }
    };
    window.addEventListener("autods_refresh_addons", handleRefreshAddons);
    window.addEventListener("focus", handleRefreshAddons);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("autods_refresh_addons", handleRefreshAddons);
      window.removeEventListener("focus", handleRefreshAddons);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const filteredSidebarGroups = useMemo(() => {
    const checkPageAllowed = (page) => {
      if (!isVA) return true;
      if (!page || page === "dashboard") return true;

      const moduleMapping = {
        marketplace: "finder",
        "print-on-demand": "finder",
        "order-processing": "orders",
        calculations: "products",
        orders: "orders",
        "returns-disputes": "returns",
        "sourcing-request": "sourcing",
        products: "products",
        drafts: "products",
        "ai-image-generation": "products",
        "customer-support": "messages",
        tickets: "messages",
        settings: "settings",
        wallet: "billing",
      };

      if (page === "usage-upgrade") return false;
      const requiredModule = moduleMapping[page];
      if (!requiredModule) return true;
      return vaModules.includes(requiredModule);
    };

    const getCuratedChildBadge = (curatedKey) => {
      if (!addonCatalog || authUser?.role === "super_admin") {
        return undefined;
      }
      const addonKey = curatedKey === "trending" ? "trending_products" : "hand_picked_products";
      const cfg = addonCatalog[addonKey];
      if (!cfg) return undefined;

      const enabled = cfg.enabled !== false;
      const price = Math.max(0, Number(cfg.price ?? 0));
      const isFree = enabled && price <= 0;
      const entitled = Boolean(cfg.entitled) || isFree;

      if (!enabled && !entitled) {
        return "Off";
      }
      if (!entitled) {
        return `$${price % 1 === 0 ? price.toFixed(0) : price.toFixed(2)}`;
      }
      return undefined;
    };

    const groups = !isVA
      ? sidebarGroups
      : sidebarGroups
          .map((group) => group.filter((item) => checkPageAllowed(item.page)))
          .filter((group) => group.length > 0);

    return groups.map((group) =>
      group.map((item) => {
        let updatedItem = item;
        if (item.page === "orders" && newOrdersCount > 0) {
          updatedItem = {
            ...updatedItem,
            badge: newOrdersCount > 99 ? "99+" : String(newOrdersCount),
            badgeTone: "counter",
          };
        }

        if (!Array.isArray(updatedItem.children) || updatedItem.children.length === 0) {
          return updatedItem;
        }
        return {
          ...updatedItem,
          children: updatedItem.children.map((child) => {
            if (!child.curatedType) return child;
            const dynamicBadge = getCuratedChildBadge(child.curatedType);
            return dynamicBadge ? { ...child, badge: dynamicBadge } : child;
          }),
        };
      }),
    );
  }, [isVA, vaModules, addonCatalog, authUser?.role, newOrdersCount]);
  const profileShortName = useMemo(() => getUserShortName(authUser), [authUser]);
  const profileFullName = useMemo(() => getUserFullName(authUser), [authUser]);
  const profileEmail = useMemo(() => getUserEmail(authUser), [authUser]);
  const [ebayConnecting, setEbayConnecting] = useState(false);
  const [storeOverrides, setStoreOverrides] = useState(loadStoredStoreOverrides);
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
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
  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false);
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState(null);

  const fetchPlanQuota = async () => {
    try {
      const res = await getCurrentPlan();
      setSubscriptionData(res.data);
    } catch {}
  };

  useEffect(() => {
    fetchPlanQuota();
    const handleRefreshQuota = () => fetchPlanQuota();
    window.addEventListener("autods_refresh_drafts", handleRefreshQuota);
    window.addEventListener("autods_refresh_quota", handleRefreshQuota);
    return () => {
      window.removeEventListener("autods_refresh_drafts", handleRefreshQuota);
      window.removeEventListener("autods_refresh_quota", handleRefreshQuota);
    };
  }, []);

  const currentPlan = subscriptionData?.current_plan;
  const quotaUsage = subscriptionData?.usage ?? {};
  const quotaLimit = Number(quotaUsage?.products_limit ?? currentPlan?.products_limit ?? 200);
  const quotaUsed = Number(quotaUsage?.products_quota_used ?? quotaUsage?.listings_count ?? 0);
  const isQuotaBreached = Boolean(quotaUsage?.products_quota_breached || (quotaLimit > 0 && quotaUsed >= quotaLimit));
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
  const [marketplaceSearchInput, setMarketplaceSearchInput] = useState("");
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
  const [curatedType, setCuratedType] = useState(() => {
    const param = new URLSearchParams(search).get("curated");
    return param === "trending" || param === "hand_picked" ? param : null;
  });

  useEffect(() => {
    if (activePage !== "marketplace") {
      return;
    }
    const param = new URLSearchParams(search).get("curated");
    if (param === "trending" || param === "hand_picked") {
      setCuratedType(param);
    } else {
      setCuratedType(null);
    }
  }, [activePage, search]);
  const [sortBy, setSortBy] = useState("By Relevance");
  const [openMenus, setOpenMenus] = useState({
    Marketplace: true,
  });
  const profileMenuRef = useRef(null);
  const addProductsMenuRef = useRef(null);
  const notificationsRef = useRef(null);
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

      if (!event.target.closest(".store-switcher-modal__menu-wrap")) {
        setStoreSwitcherMenuId("");
      }
    };

    document.addEventListener("mousedown", closeHeaderPopovers);

    return () => document.removeEventListener("mousedown", closeHeaderPopovers);
  }, []);

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
    try {
      const saved = localStorage.getItem("autods_active_import_batch");
      if (saved) {
        const batch = JSON.parse(saved);
        if (batch && (batch.id || batch.batch_id)) {
          setImportBatchProgress(batch);
          if (batch.status === "processing") {
            pollImportBatch(batch.id || batch.batch_id);
          }
        }
      }
    } catch {}

    const handleDismiss = () => {
      setImportBatchProgress(null);
    };
    window.addEventListener("autods_import_batch_dismiss", handleDismiss);
    return () => window.removeEventListener("autods_import_batch_dismiss", handleDismiss);
  }, []);

  useEffect(() => {
    const shouldLockScroll =
      addProductModalOpen ||
      storeSwitcherOpen ||
      connectEbayModalOpen ||
      notificationsModalOpen;

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
  }, [addProductModalOpen, connectEbayModalOpen, notificationsModalOpen, storeSwitcherOpen]);

  useEffect(() => {
    dispatch(fetchEbayStatus());
    dispatch(fetchAliExpressStatus());
    dispatch(fetchFreshUserAction());
  }, [dispatch]);

  useEffect(() => {
    const applyBalancePatch = (detail) => {
      const stored = getStoredUser() || {};
      const patch = {};

      if (
        detail?.ai_credits !== undefined &&
        Number.isFinite(Number(detail.ai_credits)) &&
        Number(stored.ai_credits) !== Number(detail.ai_credits)
      ) {
        patch.ai_credits = Number(detail.ai_credits);
      }

      if (
        detail?.wallet_balance !== undefined &&
        Number.isFinite(Number(detail.wallet_balance)) &&
        Number(stored.wallet_balance) !== Number(detail.wallet_balance)
      ) {
        patch.wallet_balance = Number(detail.wallet_balance);
      }

      if (detail?.wallet_currency && stored.wallet_currency !== detail.wallet_currency) {
        patch.wallet_currency = detail.wallet_currency;
      }

      if (Object.keys(patch).length > 0) {
        dispatch(updateUserStateAction(patch));
      }
    };

    const handleCreditsUpdate = (event) => {
      const detail = event?.detail;
      if (detail?.fromAuthAction) {
        return;
      }
      if (detail?.ai_credits !== undefined || detail?.wallet_balance !== undefined) {
        applyBalancePatch(detail);
      } else {
        dispatch(fetchFreshUserAction());
      }
    };

    const handleWalletUpdate = (event) => {
      const detail = event?.detail;
      if (detail?.wallet_balance !== undefined) {
        applyBalancePatch(detail);
      } else {
        dispatch(fetchFreshUserAction());
      }
    };

    const handleFocus = () => {
      dispatch(fetchFreshUserAction());
    };

    window.addEventListener("ai_credits_updated", handleCreditsUpdate);
    window.addEventListener("wallet_balance_updated", handleWalletUpdate);
    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("ai_credits_updated", handleCreditsUpdate);
      window.removeEventListener("wallet_balance_updated", handleWalletUpdate);
      window.removeEventListener("focus", handleFocus);
    };
  }, [dispatch]);

  useEffect(() => {
    if (!canAccessOrders) {
      setNewOrdersCount(0);
      return;
    }

    if (authUser?.new_orders_count !== undefined && Number.isFinite(Number(authUser.new_orders_count))) {
      setNewOrdersCount(Math.max(0, Math.floor(Number(authUser.new_orders_count))));
    }
  }, [authUser?.new_orders_count, canAccessOrders]);

  useEffect(() => {
    if (!canAccessOrders || !getStoredToken()) {
      setNewOrdersCount(0);
      return undefined;
    }

    let cancelled = false;
    const refreshNewOrdersCount = () => {
      getNewOrdersCount()
        .then((res) => {
          if (cancelled) return;
          const next = Number(res.data?.new_orders_count ?? 0);
          setNewOrdersCount(Number.isFinite(next) ? Math.max(0, Math.floor(next)) : 0);
        })
        .catch(() => {});
    };

    if (activePage !== "orders") {
      refreshNewOrdersCount();
    }

    const handleNewOrdersEvent = (event) => {
      const next = Number(event?.detail?.new_orders_count ?? 0);
      if (Number.isFinite(next)) {
        setNewOrdersCount(Math.max(0, Math.floor(next)));
      }
    };

    const handleStorage = (event) => {
      if (event.key === ORDERS_NEW_COUNT_STORAGE_KEY && event.newValue !== null) {
        const next = Number(event.newValue);
        if (Number.isFinite(next)) {
          setNewOrdersCount(Math.max(0, Math.floor(next)));
        }
      }
    };

    const handleFocus = () => {
      if (activePage !== "orders") {
        refreshNewOrdersCount();
      }
    };

    window.addEventListener(ORDERS_NEW_COUNT_EVENT, handleNewOrdersEvent);
    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", handleFocus);

    return () => {
      cancelled = true;
      window.removeEventListener(ORDERS_NEW_COUNT_EVENT, handleNewOrdersEvent);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleFocus);
    };
  }, [canAccessOrders, activePage]);

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
    }),
    [dispatch],
  );

  useOAuthHandler(oauthHandlers);

  const startEbayOAuthFlow = async () => {
    try {
      setEbayConnecting(true);
      markOAuthReturnOrigin();

      const res = await getEbayAuthUrl(ebaySiteId);
      const tab = openOAuthTab(res.data.url);

      if (!tab) {
        setEbayConnecting(false);
        toast.error('Your browser blocked the new tab. Allow popups for this site and try again.');
        return;
      }

      toast.info(OAUTH_TAB_HINT, { autoClose: 8000 });

      watchOAuthTab(tab, () => {
        setEbayConnecting(false);
        setConnectEbayModalOpen(false);
        dispatch(fetchEbayStatus());
      });
    } catch (err) {
      setEbayConnecting(false);
      toast.error(err.response?.data?.error ?? 'Failed to start eBay authorization.');
    }
  };

  const connectEbay = () => {
    setStoreSwitcherOpen(false);
    setConnectEbayModalOpen(true);
  };

  // AliExpress browse — uses the platform account connected by super admin
  useEffect(() => {
    if (activePage !== "marketplace") return;
    if (curatedType) return;
    if (!aliCredentialsConfigured) return;
    if (aliConnectionLoading) return;
    if (!aliPlatformReady) return;

    if (aliSearchTimer.current) clearTimeout(aliSearchTimer.current);

    aliSearchTimer.current = setTimeout(() => {
      const categoryId = ALIEXPRESS_CATEGORY_MAP[activeCategory];

      let sort = ALIEXPRESS_SORT_MAP[sortBy] ?? "volumeDesc";
      if (selectedPill === "Best Sellers") sort = "volumeDesc";
      if (selectedPill === "Fast Shipping") sort = "priceAsc";

      const params = {
        sort,
        limit: 20,
        page_no: aliPage,
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
    aliConnectionLoading,
    aliPlatformReady,
    keywordSearch,
    aliPage,
    curatedType,
  ]);

  // Jump back to page 1 whenever the active filters change (a new filter combo is a new result set).
  useEffect(() => {
    setAliPage(1);
  }, [activeCategory, activeSubfilter, selectedPill, sortBy, priceRange, shipsTo, currency, keywordSearch]);

  const currentSubfilters = subfilterOptions[activeCategory] || [];
  const profileTheme = background.value;
  const isDarkTheme = profileTheme === "dark";
  const activeSidebarStore = useMemo(() => {
    if (stores.length === 0) {
      return {
        id: 'no-store',
        name: 'connect-ebay',
        sidebarName: 'Connect eBay',
        platformLabel: 'Platform',
        platformDisplay: 'EBAY',
        siteDisplay: 'Connect Store',
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
      [store.name, store.country, store.marketplace, store.sidebarName, store.siteDisplay].join(" ").toLowerCase().includes(query),
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
    setMarketplaceSearchInput("");
    setCuratedType(null);
    if (activePage === "marketplace" && new URLSearchParams(search).get("curated")) {
      navigate("/marketplace", { replace: true });
    }
  };

  const openMarketplacePage = () => {
    resetMarketplaceView();
    navigate("/marketplace");
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
    setNewOrdersCount(0);
    dispatchNewOrdersCount(0);
    markOrdersSeen().catch(() => {});
    setActivePage("orders");
    setSearchAnything("");
  };

  const openReturnsDisputesPage = () => {
    setActivePage("returns-disputes");
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

  const openAiImageGenerationPage = () => {
    setActivePage("ai-image-generation");
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
    fetchPlanQuota();
  };

  const handleMarketplaceCardImport = async (item) => {
    if (isQuotaBreached) {
      toast.error(`Product listing limit reached (${quotaUsed}/${quotaLimit} used, counting variations). Please upgrade your plan to import products.`);
      navigate("/plans");
      return;
    }
    const connectionIds = getSelectedConnectionIds();
    if (!connectionIds.length) {
      toast.error("Select at least one eBay store.");
      return;
    }

    const urlOrId = item.listingUrl || item.id;
    if (!urlOrId) {
      toast.error("This product is missing a valid AliExpress link.");
      return;
    }

    setImportingCardId(item.id);
    try {
      const res = await importProduct({
        url_or_id: urlOrId,
        connection_ids: connectionIds,
        action: "draft",
        warehouse: importWarehouse,
        supplier: "appmarketplace",
      });
      toast.success(res.data?.message ?? "Product imported to Drafts.");
      refreshProductData();
    } catch (err) {
      toast.error(err.response?.data?.error ?? "Import failed.");
    } finally {
      setImportingCardId(null);
    }
  };

  const pollImportBatch = (batchId) => {
    if (window._autodsImportBatchInterval) {
      clearInterval(window._autodsImportBatchInterval);
    }

    const interval = setInterval(async () => {
      try {
        const res = await getImportBatch(batchId);
        const batch = res.data;
        const total = Number(batch.total ?? 0);
        const completed = Number(batch.completed ?? 0);
        const failed = Number(batch.failed ?? 0);
        const isDone =
          batch.status === "completed" ||
          batch.status === "failed" ||
          (total > 0 && completed + failed >= total);

        const updatedBatch = {
          ...batch,
          id: batch.id || batchId,
          batch_id: batch.id || batchId,
          total,
          completed,
          failed,
          status: isDone
            ? (batch.status === "failed" || (failed === total && total > 0) ? "failed" : "completed")
            : "processing",
          failures: Array.isArray(batch.failures) ? batch.failures : [],
        };

        setImportBatchProgress(updatedBatch);
        try {
          localStorage.setItem("autods_active_import_batch", JSON.stringify(updatedBatch));
        } catch {}

        window.dispatchEvent(new CustomEvent("autods_import_batch_update", { detail: updatedBatch }));

        if (isDone) {
          clearInterval(interval);
          window._autodsImportBatchInterval = null;
          setImportSubmitting(false);
          refreshProductData();
          window.dispatchEvent(new CustomEvent("autods_refresh_drafts"));
        } else if (completed > 0) {
          refreshProductData();
          window.dispatchEvent(new CustomEvent("autods_refresh_drafts"));
        }
      } catch {
        clearInterval(interval);
        window._autodsImportBatchInterval = null;
        setImportSubmitting(false);
      }
    }, 1500);

    window._autodsImportBatchInterval = interval;
  };

  const handleSingleImport = async (action) => {
    if (isQuotaBreached) {
      toast.error(`Product listing limit reached (${quotaUsed}/${quotaLimit} used, counting variations). Please upgrade your plan.`);
      navigate("/plans");
      return;
    }
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
    if (isQuotaBreached) {
      toast.error(`Product listing limit reached (${quotaUsed}/${quotaLimit} used, counting variations). Please upgrade your plan.`);
      navigate("/plans");
      return;
    }
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
        const total = Number(res.data.total ?? 0);
        const initialBatch = {
          id: batchId,
          batch_id: batchId,
          total,
          completed: 0,
          failed: 0,
          status: "processing",
          failures: [],
        };
        setImportBatchProgress(initialBatch);
        try {
          localStorage.setItem("autods_active_import_batch", JSON.stringify(initialBatch));
        } catch {}

        // Immediately close modal and redirect to Drafts
        setAddProductModalOpen(false);
        setImportSubmitting(false);
        setActivePage("drafts");
        navigate("/drafts");

        toast.info(`Importing ${total} products in background...`);
        pollImportBatch(batchId);
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
    setStoreRenameValue(nextStore.sidebarName);
  };

  const saveStoreRename = async (storeId) => {
    const nextName = storeRenameValue.trim();

    if (!nextName) {
      return;
    }

    const nextOverrides = {
      ...storeOverrides,
      [storeId]: {
        ...(storeOverrides[storeId] ?? {}),
        name: nextName,
        sidebarName: nextName,
        storeName: nextName,
      },
    };

    setStoreOverrides(nextOverrides);
    try {
      localStorage.setItem(STORE_OVERRIDES_STORAGE_KEY, JSON.stringify(nextOverrides));
    } catch {}

    setRenamingStoreId("");
    setStoreRenameValue("");

    const connId = parseEbayConnectionId(storeId);
    if (connId) {
      try {
        await updateEbayStoreName(connId, nextName);
        dispatch(fetchEbayStatus());
      } catch {}
    }
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
          : activePage === "returns-disputes"
            ? "Returns & Disputes"
          : activePage === "sourcing-request"
            ? "Sourcing Request"
          : activePage === "products"
            ? `Products (${listingsMeta?.total ?? 0})`
            : activePage === "drafts"
              ? `Upload (${draftsMeta?.total ?? 0})`
              : activePage === "plans"
                ? "Plans"
              : activePage === "customer-support"
                ? "Customer Support"
                : activePage === "support-center" || activePage === "tickets"
                  ? "Support Tickets"
                  : activePage === "usage-upgrade"
                    ? "Usage & Upgrade"
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

  const rawAiCredits = Number(authUser?.ai_credits ?? 0);
  const formattedAiCredits = (Number.isFinite(rawAiCredits) ? rawAiCredits : 0).toLocaleString("en-US");
  const formattedWalletBalance = formatHeaderWalletBalance(
    authUser?.wallet_balance ?? 0,
    authUser?.wallet_currency || "USD",
  );

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
          <img className="marketplace-sidebar__brand-logo" src="/autoprime-logo.png" alt="AutoDropshipPrime" />
        </div>

        <div className="marketplace-sidebar__store-block">
          <div className="marketplace-sidebar__store-avatar">{activeSidebarStore.initials}</div>
          <div className="marketplace-sidebar__store-copy">
            <button type="button" className="marketplace-sidebar__store-name" onClick={openStoreSwitcherModal}>
              <span className="marketplace-sidebar__store-platform-label">{activeSidebarStore.platformLabel}</span>
              <span className="marketplace-sidebar__store-site">{activeSidebarStore.sidebarName}</span>
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
          {filteredSidebarGroups.map((group, groupIndex) => (
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
                        "returns-disputes": openReturnsDisputesPage,
                        "sourcing-request": openSourcingRequestPage,
                        products: openProductsPage,
                        drafts: openDraftsPage,
                        wallet: openWalletPage,
                        "ai-image-generation": openAiImageGenerationPage,
                        "customer-support": openCustomerSupportPage,
                        settings: openSettingsPage,
                      };

                      if (pageHandlers[selectedItem.page]) {
                        pageHandlers[selectedItem.page]();
                      } else {
                        setActivePage(selectedItem.page);
                        setSearchAnything("");
                      }
                    }}
                    onSelectChild={(child) => {
                      if (!child.curatedType) {
                        return;
                      }

                      setSearchAnything("");
                      setCuratedType(child.curatedType);
                      navigate(`/marketplace?curated=${child.curatedType}`);
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
              <button
                type="button"
                className={activePage === "wallet" ? "marketplace-header__wallet-box marketplace-header__wallet-box--active" : "marketplace-header__wallet-box"}
                aria-label={`Open Wallet — AI Credits: ${formattedAiCredits}, Wallet Balance: ${formattedWalletBalance}`}
                title={`Open Wallet (AI Credits: ${formattedAiCredits} | Wallet Balance: ${formattedWalletBalance})`}
                aria-current={activePage === "wallet" ? "page" : undefined}
                onClick={() => {
                  setNotificationsOpen(false);
                  setNotificationsModalOpen(false);
                  setProfileMenuOpen(false);
                  setWhatsNewOpen(false);
                  openWalletPage();
                }}
              >
                <span className="marketplace-header__wallet-segment marketplace-header__wallet-segment--credits">
                  <LuZap className="marketplace-header__wallet-icon marketplace-header__wallet-icon--credits" aria-hidden="true" />
                  <span className="marketplace-header__wallet-copy">
                    <span className="marketplace-header__wallet-label">
                      AI<span className="marketplace-header__wallet-label-extra"> Credits</span>
                    </span>
                    <strong className="marketplace-header__wallet-value">{formattedAiCredits}</strong>
                  </span>
                </span>
                <span className="marketplace-header__wallet-divider" aria-hidden="true" />
                <span className="marketplace-header__wallet-segment marketplace-header__wallet-segment--balance">
                  <LuWallet className="marketplace-header__wallet-icon marketplace-header__wallet-icon--wallet" aria-hidden="true" />
                  <span className="marketplace-header__wallet-copy">
                    <span className="marketplace-header__wallet-label marketplace-header__wallet-label--wallet">
                      Wallet
                    </span>
                    <strong className="marketplace-header__wallet-value">{formattedWalletBalance}</strong>
                  </span>
                </span>
              </button>
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
                }}
              >
                <LuVolume2 />
              </button>
              <HeaderNotifications
                notificationsRef={notificationsRef}
                open={notificationsOpen}
                setOpen={setNotificationsOpen}
                modalOpen={notificationsModalOpen}
                setModalOpen={setNotificationsModalOpen}
                onBeforeOpen={() => {
                  setProfileMenuOpen(false);
                  setWhatsNewOpen(false);
                }}
                onNavigate={(targetPath) => navigate(targetPath)}
              />
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

                    {/* <div className="profile-dropdown__theme" aria-label="Theme preference">
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
                    </div> */}
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
                                <strong>{store.sidebarName}</strong>
                                {store.isPrimary ? (
                                  <span style={{ fontSize: 10, fontWeight: 700, color: '#065f46', marginLeft: 6 }}>PRIMARY</span>
                                ) : null}
                                <button type="button" aria-label={`Rename ${store.sidebarName}`} onClick={() => beginStoreRename(store.id)}>
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
                            aria-label={`Open actions for ${store.sidebarName}`}
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
            quotaBreached={isQuotaBreached}
            quotaUsed={quotaUsed}
            quotaLimit={quotaLimit}
            onUpgradePlan={() => {
              setAddProductModalOpen(false);
              navigate("/plans");
            }}
          />

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
            ) : activePage === "returns-disputes" ? (
              <ReturnsDisputesContent searchQuery={searchAnything} />
            ) : activePage === "sourcing-request" ? (
              <SourcingRequestContent searchQuery={searchAnything} />
            ) : activePage === "products" ? (
              <ProductsContent searchQuery={searchAnything} />
            ) : activePage === "drafts" ? (
              <DraftsContent
                searchQuery={searchAnything}
                importBatchProgress={importBatchProgress}
                onDismissImportBatch={() => {
                  setImportBatchProgress(null);
                  try {
                    localStorage.removeItem("autods_active_import_batch");
                  } catch {}
                  window.dispatchEvent(new CustomEvent("autods_import_batch_dismiss"));
                }}
              />
            ) : activePage === "customer-support" ? (
              <CustomerSupportContent searchQuery={searchAnything} />
            ) : activePage === "support-center" || activePage === "tickets" ? (
              <HelpCenterContent />
            ) : activePage === "usage-upgrade" ? (
              <UsageUpgradeContent onNavigateToPlans={() => { setActivePage("plans"); navigate("/plans"); }} />
            ) : activePage === "wallet" ? (
              <WalletContent />
            ) : activePage === "ai-image-generation" ? (
              <AiVideoGenerationContent />
            ) : activePage === "settings" ? (
              <MarketplaceSettingsPage />
            ) : activePage === "plans" ? (
              <PlansPage />
            ) : (
              <>
                <section className="marketplace-search-panel card-wrapper">
                  <div className="marketplace-search-panel__top-row">
                    <Search
                      className="marketplace-ant-search"
                      placeholder="Search by product title, supplier or product description..."
                      value={marketplaceSearchInput}
                      allowClear
                      size="large"
                      enterButton="Search"
                      loading={aliLoading}
                      aria-label="Search marketplace products"
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        setMarketplaceSearchInput(nextValue);
                        if (!nextValue.trim() && keywordSearch) {
                          setKeywordSearch("");
                          setAliPage(1);
                        }
                      }}
                      onSearch={(value) => {
                        const nextKeyword = value.trim();
                        setMarketplaceSearchInput(value);
                        setKeywordSearch(nextKeyword);
                        setAliPage(1);
                        setExpandedProductsTitle("");
                      }}
                    />
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
                  {curatedType ? (
                    <CuratedProductsPage
                      type={curatedType}
                      title={curatedType === "trending" ? "Trending Products" : "Hand-Picked Products"}
                      onBack={resetMarketplaceView}
                      onImport={handleMarketplaceCardImport}
                      importingId={importingCardId}
                    />
                  ) : (
                    <MarketplaceSections
                      aliLoading={aliLoading}
                      aliError={aliError}
                      aliPlatformUnavailable={aliPlatformUnavailable}
                      aliConnectionLoading={aliConnectionLoading}
                      aliCredentialsMissing={aliCredentialsMissing}
                      aliCredentialsConfigured={aliCredentialsConfigured}
                      aliPlatformReady={aliPlatformReady}
                      aliItems={aliItems}
                      aliCurrentPage={aliCurrentPage}
                      aliTotalPages={aliTotalPages}
                      onAliPageChange={setAliPage}
                      expandedProductsTitle={expandedProductsTitle}
                      activeCategory={activeCategory}
                      keywordSearch={keywordSearch}
                      onResetView={resetMarketplaceView}
                      onImport={handleMarketplaceCardImport}
                      importingId={importingCardId}
                    />
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