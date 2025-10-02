import React, { useState, useMemo, useRef } from "react";
import "./App.css";

const ENTRIES_PER_PAGE = 10;
const DESCRIPTIONS = [
  "(Online access)+(Account/Routine Number)+(Name And Address)+(Email access)+(Personal Questions)",
  "(Online access)+(Account/Routine Number)+(Name And Address)+(Email access)"
];

function getRandomPriceAndBalance() {
  // Price: $300 - $1200, Balance: price * random factor (30-50)
  const price = Math.floor(Math.random() * 901) + 300;
  const balance = (price * (30 + Math.random() * 20)).toFixed(2);
  return { price: `$${price.toLocaleString()}.00`, balance: `$${Number(balance).toLocaleString()}` };
}

function getInitialData() {
  return Array.from({ length: 42 }, () => {
    const { price, balance } = getRandomPriceAndBalance();
    const description = DESCRIPTIONS[Math.floor(Math.random() * DESCRIPTIONS.length)];
    return { description, price, balance };
  });
}

const allColumns = [
  { key: "description", label: "Description" },
  { key: "price", label: "Price" },
  { key: "balance", label: "Balance" },
  { key: "actions", label: "Actions" },
];

export function BankLogs({ bank }) {
  const dataRef = useRef(getInitialData());
  const [filter, setFilter] = useState("");
  const [columns, setColumns] = useState({
    description: true,
    price: true,
    balance: true,
    actions: true,
  });
  const [page, setPage] = useState(0);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [sort, setSort] = useState({ key: null, direction: null });
  const [errorMsg, setErrorMsg] = useState("");

  // Get user balance from localStorage
  let userBalance = 0;
  try {
    const user = localStorage.getItem("bootlegger_user");
    if (user) {
      const userData = JSON.parse(user);
      userBalance = userData.usdBalance || 0;
    }
  } catch (e) {}

  const filteredData = useMemo(() => {
    let data = dataRef.current.filter((row) =>
      row.balance.includes(filter) || row.price.includes(filter)
    );
    if (sort.key && sort.direction) {
      data = [...data].sort((a, b) => {
        const aVal = Number(a[sort.key].replace(/[^\d.]/g, ""));
        const bVal = Number(b[sort.key].replace(/[^\d.]/g, ""));
        if (sort.direction === "asc") return aVal - bVal;
        else return bVal - aVal;
      });
    }
    return data;
  }, [filter, sort]);

  const pagedData = filteredData.slice(
    page * ENTRIES_PER_PAGE,
    (page + 1) * ENTRIES_PER_PAGE
  );

  function handleSortToggle(key) {
    setSort((prev) => {
      if (prev.key === key) {
        if (prev.direction === "desc") return { key, direction: "asc" };
        if (prev.direction === "asc") return { key: null, direction: null };
      }
      return { key, direction: "desc" };
    });
  }

  function renderSortButton(key) {
    let icon = "";
    if (sort.key === key) {
      icon = sort.direction === "desc" ? "▼" : "▲";
    } else {
      icon = "⇅";
    }
    return (
      <button
        className={`banks-sort-btn single${sort.key === key ? " active" : ""}`}
        onClick={() => handleSortToggle(key)}
        title="Sort"
      >
        {icon}
      </button>
    );
  }

  // Determine if the bank is from the 'Other' category
  const otherOptions = [
    "Dumps", "Clone Cards", "Paypal", "Cash App Logs"
  ];
  const isOther = otherOptions.map(x => x.toLowerCase()).includes((bank || '').toLowerCase());
  // Fix: Only append 'Logs' if bank name does not already end with 'logs'
  const header = bank
    ? (isOther
        ? bank
        : bank.trim().toLowerCase().endsWith('logs')
          ? bank
          : `${bank} Logs`)
    : "PayPal Logs";
  // Optionally, you could customize the description per bank
  const desc = DESCRIPTIONS[0];

  return (
    <div className="main-content banks-page refined-banks-page">
      <div className="banks-header-row refined-header-row">
        <h1 className="banks-title refined-title">{header}</h1>
      </div>
      <div className="banks-toolbar-row refined-toolbar-row">
        <input
          className="banks-filter refined-filter"
          placeholder="Filter Balance..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <div className="banks-desc refined-desc">{desc}</div>
      </div>
      <div className="banks-table-container banks-table-centered refined-table-container">
        <table className="banks-table refined-table">
          <thead>
            <tr>
              {columns.description && <th>Description</th>}
              {columns.price && (
                <th>
                  Price {renderSortButton("price")}
                </th>
              )}
              {columns.balance && (
                <th>
                  Balance {renderSortButton("balance")}
                </th>
              )}
              {columns.actions && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {pagedData.map((row, i) => (
              <tr key={i}>
                {columns.description && <td>{row.description}</td>}
                {columns.price && <td>{row.price}</td>}
                {columns.balance && <td>{row.balance}</td>}
                {columns.actions && (
                  <td>
                    <button
                      className="banks-buy-btn refined-buy-btn"
                      onClick={() => {
                        // Parse price as number
                        const priceNum = Number(row.price.replace(/[^\d.]/g, ""));
                        if (userBalance < priceNum) {
                          setErrorMsg("Insufficient balance to buy this item.");
                        } else {
                          setErrorMsg("");
                          // TODO: Implement buy logic here
                        }
                      }}
                    >
                      Buy
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {/* Fill empty rows for consistent height */}
            {pagedData.length < ENTRIES_PER_PAGE &&
              Array.from({ length: ENTRIES_PER_PAGE - pagedData.length }).map((_, idx) => (
                <tr key={`empty-${idx}`} className="banks-table-empty-row">
                  {columns.description && <td></td>}
                  {columns.price && <td></td>}
                  {columns.balance && <td></td>}
                  {columns.actions && <td></td>}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {errorMsg && (
        <div className="banks-error-msg refined-error-msg">{errorMsg}</div>
      )}
      <div className="banks-pagination refined-pagination">
        <button
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
        >
          Previous
        </button>
        <button
          onClick={() =>
            setPage((p) =>
              (p + 1) * ENTRIES_PER_PAGE < filteredData.length ? p + 1 : p
            )
          }
          disabled={(page + 1) * ENTRIES_PER_PAGE >= filteredData.length}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default function Banks() {
  return <BankLogs />;
} 