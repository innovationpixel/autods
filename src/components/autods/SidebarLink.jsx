import { LuChevronDown } from "react-icons/lu";

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

export default SidebarLink;
