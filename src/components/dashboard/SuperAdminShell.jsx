import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LuChevronDown,
  LuLogOut,
  LuMenu,
  LuMoon,
  LuSun,
  LuUserRound,
} from "react-icons/lu";
import "../../assets/css/marketplace-utilities.css";
import "../../assets/css/marketplace-dashboard.css";
import { ThemeContext } from "../../context/ThemeContext";
import { adminPages, adminSidebarItems } from "../autods/menu";
import SidebarLink from "../autods/SidebarLink";
import AdminDashboardPage from "../autods/pages/AdminDashboardPage";
import AdminClientsPage from "../autods/pages/AdminClientsPage";
import AdminPlansPage from "../autods/pages/AdminPlansPage";
import AdminSettingsPage from "../autods/pages/AdminSettingsPage";
import { selectUser } from "../../store/selectors/AuthSelectors";
import { getUserEmail, getUserFullName, getUserShortName } from "../../utils/userDisplay";
import { logoutAction } from "../../store/actions/AuthActions";

function SuperAdminShell() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const authUser = useSelector(selectUser);
  const { background, changeBackground } = useContext(ThemeContext);

  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  const activePage = pathname === "/" ? "admin" : pathname.slice(1);
  const isDarkTheme = background.value === "dark";

  const profileShortName = useMemo(() => getUserShortName(authUser), [authUser]);
  const profileFullName = useMemo(() => getUserFullName(authUser), [authUser]);
  const profileEmail = useMemo(() => getUserEmail(authUser), [authUser]);

  useEffect(() => {
    if (pathname === "/" || !adminPages.includes(activePage)) {
      navigate("/admin", { replace: true });
    }
  }, [activePage, navigate, pathname]);

  useEffect(() => {
    const closeProfileMenu = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", closeProfileMenu);
    return () => document.removeEventListener("mousedown", closeProfileMenu);
  }, []);

  useEffect(() => {
    setSidebarMobileOpen(false);
  }, [pathname]);

  const setActivePage = (page) => {
    navigate(page === "admin" ? "/admin" : `/${page}`);
  };

  const pageTitles = {
    admin: "Dashboard",
    "admin/clients": "Clients",
    "admin/plans": "Plans",
    "admin/settings": "Settings",
  };

  const pageTitle = pageTitles[activePage] ?? "Super Admin";

  const pageHandlers = {
    admin: () => setActivePage("admin"),
    "admin/clients": () => setActivePage("admin/clients"),
    "admin/plans": () => setActivePage("admin/plans"),
    "admin/settings": () => setActivePage("admin/settings"),
  };

  if (pathname === "/" || !adminPages.includes(activePage)) {
    return null;
  }

  return (
    <div className={isDarkTheme ? "marketplace-dashboard-page marketplace-dashboard-page--dark super-admin-shell" : "marketplace-dashboard-page super-admin-shell"}>
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

        <nav className="marketplace-sidebar__nav" aria-label="Admin navigation">
          <div className="marketplace-sidebar__group">
            {adminSidebarItems.map((item) => (
              <SidebarLink
                item={{
                  ...item,
                  active: activePage === item.page,
                }}
                key={item.label}
                onSelect={(selectedItem) => {
                  pageHandlers[selectedItem.page]?.();
                  setSidebarMobileOpen(false);
                }}
              />
            ))}
          </div>
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
        <div className="marketplace-main__scroll">
          <header className="marketplace-header super-admin-shell__header">
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

            <div className="marketplace-header__controls">
              <div className="marketplace-header__profile-wrap" ref={profileMenuRef}>
                <button
                  type="button"
                  className="marketplace-header__profile"
                  aria-label="Open profile menu"
                  aria-expanded={profileMenuOpen}
                  onClick={() => setProfileMenuOpen((current) => !current)}
                >
                  <span>{profileShortName}</span>
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
                    </div>

                    <div className="profile-dropdown__theme" aria-label="Theme preference">
                      <button
                        type="button"
                        className={background.value === "light" ? "profile-dropdown__theme-btn profile-dropdown__theme-btn--active" : "profile-dropdown__theme-btn"}
                        onClick={() => changeBackground({ value: "light", label: "Light" })}
                      >
                        <LuSun />
                        <span>Light</span>
                      </button>
                      <button
                        type="button"
                        className={background.value === "dark" ? "profile-dropdown__theme-btn profile-dropdown__theme-btn--active" : "profile-dropdown__theme-btn"}
                        onClick={() => changeBackground({ value: "dark", label: "Dark" })}
                      >
                        <LuMoon />
                        <span>Dark</span>
                      </button>
                    </div>

                    <div className="profile-dropdown__menu">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => dispatch(logoutAction(navigate))}
                      >
                        <span className="profile-dropdown__item-icon profile-dropdown__item-icon--muted">
                          <LuLogOut />
                        </span>
                        <span>Log out</span>
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </header>

          <main className="dashboard-container marketplace-content-wrapper">
            {activePage === "admin/clients" ? (
              <AdminClientsPage />
            ) : activePage === "admin/plans" ? (
              <AdminPlansPage />
            ) : activePage === "admin/settings" ? (
              <AdminSettingsPage />
            ) : (
              <AdminDashboardPage />
            )}
          </main>
        </div>
      </section>
    </div>
  );
}

export default SuperAdminShell;
