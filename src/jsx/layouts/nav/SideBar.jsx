import { useReducer, useContext, useState, useEffect, Fragment } from "react";
import { Link } from "react-router-dom";
import { MenuList } from "./Menu";
import { useScrollPosition } from "@n8tb1t/use-scroll-position";
import { ThemeContext } from "../../../context/ThemeContext";
import { Collapse } from "react-bootstrap";

const reducer = (previousState, updatedState) => ({
  ...previousState,
  ...updatedState,
});

const initialState = {
  active: "",
  activeSubmenu: "",
};

function SideBar() {
  const {
    iconHover,
    sidebarposition,
    headerposition,
    sidebarLayout,
    ChangeIconSidebar,
  } = useContext(ThemeContext);

  const [state, setState] = useReducer(reducer, initialState);
  const [hideOnScroll, setHideOnScroll] = useState(true);

  useScrollPosition(
    ({ prevPos, currPos }) => {
      const isShow = currPos.y > prevPos.y;
      if (isShow !== hideOnScroll) setHideOnScroll(isShow);
    },
    [hideOnScroll],
  );

  const handleMenuActive = (status) => {
    setState({
      active: state.active === status ? "" : status,
      activeSubmenu: state.active === status ? state.activeSubmenu : "",
    });
  };

  const handleSubmenuActive = (status) => {
    setState({
      activeSubmenu: state.activeSubmenu === status ? "" : status,
    });
  };

  let path = window.location.pathname;
  path = path.split("/");
  path = path[path.length - 1];

  const hasActiveNestedPath = (items = []) => {
    return items.some((item) => {
      if (item.to === path) return true;
      if (item.content?.length) {
        return item.content.some((sub) => sub.to === path);
      }
      return false;
    });
  };

  const hasActiveChildPath = (item) => {
    if (item.to === path) return true;
    if (item.content?.length) {
      return item.content.some((sub) => sub.to === path);
    }
    return false;
  };

  useEffect(() => {
    MenuList.forEach((menu) => {
      if (menu.content?.length) {
        menu.content.forEach((item) => {
          if (item.to === path) {
            setState({ active: menu.title });
          }

          item.content?.forEach((ele) => {
            if (ele.to === path) {
              setState({
                active: menu.title,
                activeSubmenu: item.title,
              });
            }
          });
        });
      } else if (menu.to === path) {
        setState({ active: menu.title, activeSubmenu: "" });
      }
    });
  }, [path]);

  return (
    <div
      onMouseEnter={() => ChangeIconSidebar(true)}
      onMouseLeave={() => ChangeIconSidebar(false)}
      className={`ic-sidenav ${iconHover} ${
        sidebarposition.value === "fixed" &&
        sidebarLayout.value === "horizontal" &&
        headerposition.value === "static"
          ? hideOnScroll > 120
            ? "fixed"
            : ""
          : ""
      }`}
    >
      <div className="ic-sidenav-scroll">
        <ul className="metismenu" id="menu">
          {MenuList.map((menu, index) => {
            const menuClass = menu.classsChange;

            if (menuClass === "menu-title") {
              return (
                <li className={menuClass} key={index}>
                  {menu.title}
                </li>
              );
            }

            const parentIsActive =
              state.active === menu.title ||
              menu.to === path ||
              hasActiveNestedPath(menu.content || []);

            return (
              <li
                className={`${parentIsActive ? "mm-active" : ""}`}
                key={index}
              >
                {menu.content && menu.content.length > 0 ? (
                  <>
                    <Link
                      to="#"
                      className="has-arrow"
                      onClick={() => handleMenuActive(menu.title)}
                    >
                      {menu.iconStyle}
                      <span className="nav-text">{menu.title}</span>
                      {menu.update ? (
                        <span className="badge badge-xs style-1 badge-danger">
                          {menu.update}
                        </span>
                      ) : null}
                    </Link>

                    <Collapse in={parentIsActive}>
                      <ul
                        className={`${menuClass === "mm-collapse" ? "mm-show" : ""}`}
                      >
                        {menu.content.map((item, childIndex) => {
                          const childIsActive =
                            state.activeSubmenu === item.title ||
                            hasActiveChildPath(item);

                          return (
                            <li
                              key={childIndex}
                              className={`${childIsActive ? "mm-active" : ""}`}
                            >
                              {item.content && item.content.length > 0 ? (
                                <>
                                  <Link
                                    to={item.to || "#"}
                                    className={`${item.hasMenu ? "has-arrow" : ""} ${
                                      childIsActive ? "mm-active" : ""
                                    }`}
                                    onClick={() =>
                                      handleSubmenuActive(item.title)
                                    }
                                  >
                                    {item.title}
                                  </Link>

                                  <Collapse in={childIsActive}>
                                    <ul
                                      className={`${
                                        menuClass === "mm-collapse"
                                          ? "mm-show"
                                          : ""
                                      }`}
                                    >
                                      {item.content.map((subItem, subIndex) => (
                                        <Fragment key={subIndex}>
                                          <li
                                            className={`${
                                              path === subItem.to
                                                ? "mm-active"
                                                : ""
                                            }`}
                                          >
                                            <Link
                                              className={`${
                                                path === subItem.to
                                                  ? "mm-active"
                                                  : ""
                                              }`}
                                              to={subItem.to}
                                            >
                                              {subItem.title}
                                            </Link>
                                          </li>
                                        </Fragment>
                                      ))}
                                    </ul>
                                  </Collapse>
                                </>
                              ) : (
                                <Link
                                  to={item.to}
                                  className={`${item.to === path ? "mm-active" : ""}`}
                                >
                                  {item.title}
                                </Link>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </Collapse>
                  </>
                ) : (
                  <Link
                    to={menu.to}
                    className={`${menu.to === path ? "mm-active" : ""}`}
                  >
                    {menu.iconStyle}
                    <span className="nav-text">{menu.title}</span>
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export default SideBar;
