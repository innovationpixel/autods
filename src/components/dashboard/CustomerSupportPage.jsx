import { useMemo, useState } from "react";
import {
  LuCalendar,
  LuChevronLeft,
  LuChevronRight,
  LuFilter,
  LuRefreshCcw,
  LuStar,
} from "react-icons/lu";
import "../../assets/css/customer-support.css";

const conversations = [
  {
    id: 1,
    message: "Further verification needed – stakeholder details",
    buyer: "eBay",
    type: "System Conversation",
    time: "7 hours",
    unread: true,
  },
  {
    id: 2,
    message: "Further verification needed – stakeholder details",
    buyer: "eBay",
    type: "System Conversation",
    time: "9 hours",
    unread: true,
  },
  {
    id: 3,
    message:
      "Okay, we will verify with our warehouse and proceed with issuing a refund for the returned product.",
    buyer: "juvazque309",
    type: "Pre Sale Conversation",
    time: "12 hours",
    unread: true,
  },
  {
    id: 4,
    message:
      "Okay dear customer, in this case we will issue a partial refund. Please place your order again, and we will help.",
    buyer: "scientifical",
    type: "Pre Sale Conversation",
    time: "12 hours",
    unread: true,
  },
  {
    id: 5,
    message: "Okay, we will check with our warehouse and issue a refund for the returned product.",
    buyer: "yi-537969",
    type: "Pre Sale Conversation",
    time: "12 hours",
    unread: true,
  },
  {
    id: 6,
    message: "The product is the same. Please check again.",
    buyer: "dagar1064",
    type: "Pre Sale Conversation",
    time: "12 hours",
    unread: true,
  },
  {
    id: 7,
    message: "Your order has been updated. Kindly check your order status for the latest details.",
    buyer: "oldp4948",
    type: "Pre Sale Conversation",
    time: "12 hours",
    unread: true,
  },
  {
    id: 8,
    message: "Your order has been updated. Kindly check your order status for the latest details.",
    buyer: "p.mr34",
    type: "Pre Sale Conversation",
    time: "12 hours",
    unread: true,
  },
  {
    id: 9,
    message:
      "We're sorry, but we cannot cancel your order as it is already in process. Thank you for your understanding.",
    buyer: "coly-2919",
    type: "Pre Sale Conversation",
    time: "13 hours",
    unread: true,
  },
  {
    id: 10,
    message: "Please see the description and images of the product.",
    buyer: "briabr5nicssl",
    type: "Pre Sale Conversation",
    time: "13 hours",
    unread: true,
  },
  {
    id: 11,
    message: "A buyer wants to cancel an order",
    buyer: "eBay",
    type: "System Conversation",
    time: "16 hours",
    unread: true,
  },
  {
    id: 12,
    message: "The offer you received has been retracted",
    buyer: "eBay",
    type: "System Conversation",
    time: "19 hours",
    unread: true,
  },
  {
    id: 13,
    message: "You have a new offer: $5.00 for NEW Gel Nano Silicon... (389414777845)",
    buyer: "eBay",
    type: "System Conversation",
    time: "19 hours",
    unread: true,
    messageIcon: "calendar",
  },
  {
    id: 14,
    message: "Action required: update business stakeholder details",
    buyer: "eBay",
    type: "System Conversation",
    time: "a day",
    unread: true,
  },
  {
    id: 15,
    message: "Action required: verify your business details",
    buyer: "eBay",
    type: "System Conversation",
    time: "a day",
    unread: true,
  },
  {
    id: 16,
    message: "Return 5317732326: You have a message",
    buyer: "eBay",
    type: "System Conversation",
    time: "a day",
    unread: true,
  },
  {
    id: 17,
    message: "We removed some of your listings: Single-use plastic products policy",
    buyer: "eBay",
    type: "System Conversation",
    time: "a day",
    unread: true,
  },
  {
    id: 18,
    message: "We hid some of your listings: Offering to buy or sell outside of eBay policy",
    buyer: "eBay",
    type: "System Conversation",
    time: "a day",
    unread: true,
  },
  {
    id: 19,
    message:
      "Dear Customer, Please send us a picture of the item you received so we can check and assist you further.",
    buyer: "x3steego",
    type: "Pre Sale Conversation",
    time: "2 days",
    unread: false,
  },
  {
    id: 20,
    message:
      "Dear Customer, Your order is currently in process. The tracking information will be updated to your order soon.",
    buyer: "kwikserv",
    type: "Pre Sale Conversation",
    time: "2 days",
    unread: false,
  },
];

const sortableColumns = {
  status: "status",
  type: "type",
  time: "time",
};

function SortHeader({ children, column, sort, onSort }) {
  const active = sort.key === column;

  return (
    <button
      type="button"
      className={`support-sort ${active ? "support-sort--active" : ""}`}
      onClick={() => onSort(column)}
    >
      <span>{children}</span>
      <span className={`support-sort__chevrons support-sort__chevrons--${active ? sort.direction : "idle"}`}>
        <span />
        <span />
      </span>
    </button>
  );
}

function CustomerSupportContent({ searchQuery = "" }) {
  const [sort, setSort] = useState({ key: "", direction: "asc" });
  const [selectedRows, setSelectedRows] = useState([]);
  const [favoriteRows, setFavoriteRows] = useState([]);

  const filteredRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const rows = conversations
      .filter((row) => {
        if (!query) {
          return true;
        }

        return [row.message, row.buyer, row.type, row.time, "New", "nrf_enterprise_inc-llc-au"]
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .map((row) => ({ ...row, status: "New", store: "nrf_enterprise_inc-llc-au" }));

    if (!sort.key) {
      return rows;
    }

    return [...rows].sort((a, b) => {
      const left = String(a[sort.key]).toLowerCase();
      const right = String(b[sort.key]).toLowerCase();
      const result = left.localeCompare(right, undefined, { numeric: true });

      return sort.direction === "asc" ? result : -result;
    });
  }, [searchQuery, sort]);

  const allSelected = selectedRows.length === filteredRows.length && filteredRows.length > 0;

  const toggleSort = (column) => {
    setSort((current) => {
      if (current.key !== column) {
        return { key: column, direction: "asc" };
      }

      return { key: column, direction: current.direction === "asc" ? "desc" : "asc" };
    });
  };

  const toggleAllRows = () => {
    setSelectedRows(allSelected ? [] : filteredRows.map((row) => row.id));
  };

  const toggleRow = (id) => {
    setSelectedRows((current) =>
      current.includes(id) ? current.filter((rowId) => rowId !== id) : [...current, id]
    );
  };

  const toggleFavorite = (id) => {
    setFavoriteRows((current) =>
      current.includes(id) ? current.filter((rowId) => rowId !== id) : [...current, id]
    );
  };

  return (
    <div className="customer-support-content">
      <section className="support-toolbar" aria-label="Conversation controls">
        <div className="support-toolbar__left">
          <button type="button" className="support-view-btn">
            My Views
          </button>
          <button type="button" className="support-filter-btn">
            <LuFilter aria-hidden="true" />
            <span>Add Filter</span>
          </button>
        </div>

        <button type="button" className="support-refresh-btn">
          <LuRefreshCcw aria-hidden="true" />
          <span>Refresh</span>
        </button>
      </section>

      <main className="support-table-shell">
        <div className="support-table-scroll">
          <table className="support-table">
            <colgroup>
              <col className="support-col-check" />
              <col className="support-col-star" />
              <col className="support-col-message" />
              <col className="support-col-buyer" />
              <col className="support-col-status" />
              <col className="support-col-type" />
              <col className="support-col-time" />
              <col className="support-col-store" />
            </colgroup>
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    className="support-checkbox"
                    aria-label="Select all conversations"
                    checked={allSelected}
                    onChange={toggleAllRows}
                  />
                </th>
                <th aria-label="Favorite" />
                <th>Message</th>
                <th>Buyer</th>
                <th>
                  <SortHeader column={sortableColumns.status} sort={sort} onSort={toggleSort}>
                    Status
                  </SortHeader>
                </th>
                <th>
                  <SortHeader column={sortableColumns.type} sort={sort} onSort={toggleSort}>
                    Type
                  </SortHeader>
                </th>
                <th>
                  <SortHeader column={sortableColumns.time} sort={sort} onSort={toggleSort}>
                    Time
                  </SortHeader>
                </th>
                <th>Store</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => {
                const isSelected = selectedRows.includes(row.id);
                const isFavorite = favoriteRows.includes(row.id);

                return (
                  <tr key={row.id} className={isSelected ? "support-table__row support-table__row--selected" : "support-table__row"}>
                    <td>
                      <input
                        type="checkbox"
                        className="support-checkbox"
                        aria-label={`Select conversation ${row.id}`}
                        checked={isSelected}
                        onChange={() => toggleRow(row.id)}
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`support-star ${isFavorite ? "support-star--active" : ""}`}
                        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                        aria-pressed={isFavorite}
                        onClick={() => toggleFavorite(row.id)}
                      >
                        <LuStar />
                      </button>
                    </td>
                    <td>
                      <div className="support-message">
                        <span className="support-message__dot" aria-hidden="true" />
                        {row.messageIcon === "calendar" ? (
                          <span className="support-message__mini-icon" aria-hidden="true">
                            <LuCalendar />
                          </span>
                        ) : null}
                        <span className={`support-message__text ${row.unread ? "support-message__text--unread" : ""}`}>
                          {row.message}
                        </span>
                      </div>
                    </td>
                    <td className="support-table__buyer">{row.buyer}</td>
                    <td>
                      <span className="support-status-badge">New</span>
                    </td>
                    <td>
                      <span className="support-type-badge">{row.type}</span>
                    </td>
                    <td className="support-table__time">{row.time}</td>
                    <td className="support-table__store">nrf_enterprise_inc-llc-au</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>

      <footer className="support-footer">
        <nav className="support-pagination" aria-label="Conversation pages">
          <button type="button" className="support-pagination__arrow" aria-label="Previous page">
            <LuChevronLeft />
          </button>
          {[1, 2, 3, 4].map((page) => (
            <button
              type="button"
              key={page}
              className={`support-pagination__page ${page === 1 ? "support-pagination__page--active" : ""}`}
              aria-current={page === 1 ? "page" : undefined}
            >
              {page}
            </button>
          ))}
          <button type="button" className="support-pagination__arrow" aria-label="Next page">
            <LuChevronRight />
          </button>
        </nav>

        <div className="support-footer__meta">
          <label>
            <span>Show</span>
            <select defaultValue="20" aria-label="Conversations per page">
              <option value="20">20</option>
              <option value="40">40</option>
              <option value="60">60</option>
            </select>
          </label>
          <span>Conversations out of 72</span>
        </div>
      </footer>
    </div>
  );
}

export default CustomerSupportContent;
