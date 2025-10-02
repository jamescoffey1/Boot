import React, { useState, useRef } from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation, useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AiOutlineHome, AiOutlineHistory } from "react-icons/ai";
import { FaBitcoin, FaUniversity, FaBars, FaTimes } from "react-icons/fa";
import { MdOutlineSupportAgent, MdOutlineMail } from "react-icons/md";
import { FiLogOut } from "react-icons/fi";
import History from "./History";
import TopUp from "./TopUp";
import Banks from "./Banks";
import Login from "./Login";
import MatrixBackground from "./MatrixBackground";
import { BankLogs } from "./Banks";
import "./App.css";

function Home() {
  return (
    <main className="main-content">
      <h1>Welcome to Bootlegger private store!</h1>
      <p className="subtitle">
        Our store boasts a self-written engine, an anti-DDoS system, and a bulletproof server. Don't journal!
      </p>
      <div className="attention">
        <b>Attention! New return format. After purchasing the item, you will have a return countdown, at the moment it is</b>
      </div>
      <ol className="rules">
        <li>Персональные данные клиентов хранятся в базе данных с нестандартным шифрованием и гарантированной безопасностью.</li>
        <li>Запрещена передача своих аккаунтов и ссылка на магазин 3-м лицам</li>
        <li>For all questions, please contact the chat directly in the store, or by Telegram: @bootleggersupport</li>
        <li>Replacing the invalid - return the cost account to an account in your personal account</li>
        <li>Accounts inactive for a month are - deleted for security reasons!</li>
        <li>За несоблюдение правил - удаление аккаунта без права восстановления.</li>
      </ol>
      <div className="return-policy">
        СОГЛАСНО ПРАВИЛАМ ВОЗВРАТА НАПИСАТЬ И УКАЗЫВАТЬ В ЖАБРАХ ПЕРЕД ПОКУПКОЙ!
      </div>
    </main>
  );
}

const pageVariants = {
  initial: { y: 40, opacity: 0 },
  animate: { y: 0, opacity: 1, transition: { duration: 0.4, ease: "easeOut" } },
  exit: { y: -40, opacity: 0, transition: { duration: 0.3, ease: "easeIn" } },
};

function AnimatedRoutes({ onLogout, updateBalance }) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <motion.div
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <Home />
            </motion.div>
          }
        />
        <Route
          path="/history"
          element={
            <motion.div
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <History />
            </motion.div>
          }
        />
        <Route
          path="/topup"
          element={
            <motion.div
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <TopUp updateBalance={updateBalance} />
            </motion.div>
          }
        />
        <Route
          path="/banks"
          element={
            <motion.div
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <Banks />
            </motion.div>
          }
        />
        <Route
          path="/bank/:bankName"
          element={
            <motion.div
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <BankLogRouteWrapper />
            </motion.div>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

const banksMenu = [
  {
    category: "USA",
    items: [
      "Wells Fargo", "Chase bank", "M&T bank", "Chime logs", "AFCU bank", "Navy Federal Bank",
      "Woodforest Bank", "BOA", "Citizens bank", "DCU bank", "TD bank", "53rd Bank + HELOC",
      "Huntington Bank", "TD BANK", "USAA bank", "Citi bank", "CIBC", "Truist Bank"
    ]
  },
  {
    category: "Other",
    items: [
      "Dumps", "Clone Cards", "Paypal", "Cash App Logs"
    ]
  },
  {
    category: "Canada",
    items: [
      "Royal Bank of Canada", "Canadian Western Bank", "HSBC Bank",
      "Bank Of Canada", "BMO BANK of Montreal", "TD Bank",
      "Regions Bank"
    ]
  },
  {
    category: "UK",
    items: [
      "HSBC Holdings Plc", "Lloyds Banking Group", "Barclays Plc"
    ]
  }
];

// Helper to convert bank name to slug and back
function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
function unslugify(str) {
  return str.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

// Wrapper to extract the bank name from the route param
function BankLogRouteWrapper() {
  const { bankName } = useParams();
  // Try to prettify the bank name
  const pretty = bankName
    .split("-")
    .map(w => w.length > 2 ? w.charAt(0).toUpperCase() + w.slice(1) : w.toUpperCase())
    .join(" ");
  return <BankLogs bank={pretty} />;
}

function BanksDropdown() {
  const [open, setOpen] = useState(false);
  const btnRef = useRef();
  const [dropdownPos, setDropdownPos] = useState({ left: 0, top: 0, width: 0 });
  const navigate = useNavigate();

  function handleEnter() {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setDropdownPos({ left: rect.left, top: rect.bottom, width: rect.width });
    }
    setOpen(true);
  }
  function handleLeave() {
    setOpen(false);
  }

  // Helper to split an array into N columns
  function splitIntoColumns(arr, numCols) {
    const cols = Array.from({ length: numCols }, () => []);
    arr.forEach((item, i) => {
      cols[i % numCols].push(item);
    });
    return cols;
  }

  const dropdown = open
    ? ReactDOM.createPortal(
        <div
          className="banks-navbar-dropdown"
          style={{
            position: "fixed",
            left: dropdownPos.left,
            top: dropdownPos.top + 4,
            minWidth: 420,
            maxWidth: 600,
            zIndex: 9999,
            opacity: 1,
            visibility: "visible",
            pointerEvents: "auto",
            display: "block"
          }}
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
        >
          {banksMenu.map((section, idx) => {
            const cols = splitIntoColumns(section.items, 3);
            return (
              <React.Fragment key={section.category}>
                <div className="banks-dropdown-section">
                  <div className="banks-navbar-dropdown-title banks-dropdown-heading">{section.category}</div>
                  <div className="banks-dropdown-grid">
                    {cols.map((col, i) => (
                      <div className="banks-dropdown-col" key={i}>
                        {col.map((item) => (
                          <div
                            key={item}
                            className="banks-navbar-dropdown-item"
                            onClick={() => {
                              setOpen(false);
                              navigate(`/bank/${slugify(item)}`);
                            }}
                            style={{ cursor: "pointer" }}
                          >
                            {item}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
                {idx !== banksMenu.length - 1 && <div style={{ height: 12 }} />}
              </React.Fragment>
            );
          })}
        </div>,
        document.body
      )
    : null;

  return (
    <div
      className="banks-navbar-dropdown-wrapper"
      style={{ display: 'flex', alignItems: 'center', position: 'relative' }}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <NavLink to="/banks" end className={({isActive}) => "pixel-nav-btn banks-navbar-btn" + (isActive ? " active" : "")} ref={btnRef}>
        <FaUniversity style={{ marginRight: 8, fontSize: 20, verticalAlign: "middle" }} />
        <span style={{fontWeight: 600, whiteSpace: 'nowrap'}}>Banks</span>
      </NavLink>
      {dropdown}
    </div>
  );
}

function HamburgerMenu({ onLogout, usdBalance }) {
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();
  const [banksOpen, setBanksOpen] = React.useState(false);

  // Only show on mobile
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 700 && open) setOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [open]);

  // Helper to close menu on navigation
  function handleNav(path) {
    setOpen(false);
    navigate(path);
  }

  return (
    <>
      {/* Hamburger icon (only on mobile) */}
      <button
        className="hamburger-btn"
        onClick={() => setOpen(true)}
        style={{ display: "block" }}
      >
        <FaBars size={28} />
      </button>
      {open && (
        <div className="hamburger-overlay">
          <nav className="hamburger-menu">
            <button className="hamburger-close" onClick={() => setOpen(false)}>
              <FaTimes size={32} />
            </button>
            <div style={{flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'auto'}}>
              <NavLink to="/" onClick={() => handleNav("/")} className="hamburger-link">
                <AiOutlineHome style={{marginRight: 12, fontSize: 22}} /> Home
              </NavLink>
              <NavLink to="/history" onClick={() => handleNav("/history")} className="hamburger-link">
                <AiOutlineHistory style={{marginRight: 12, fontSize: 22}} /> History
              </NavLink>
              <NavLink to="/topup" onClick={() => handleNav("/topup")} className="hamburger-link">
                <FaBitcoin style={{marginRight: 12, fontSize: 22}} /> Top-up
              </NavLink>
              <div className="hamburger-link" onClick={() => setBanksOpen((v) => !v)} style={{fontWeight: 700, color: '#fff'}}>
                <FaUniversity style={{marginRight: 12, fontSize: 22}} /> BANKS {banksOpen ? "▲" : "▼"}
              </div>
              {banksOpen && (
                <div className="hamburger-banks-list">
                  {banksMenu.map(section => (
                    <React.Fragment key={section.category}>
                      <div style={{ color: '#e53935', fontWeight: 700, marginBottom: 4 }}>{section.category}</div>
                      {section.items.map(item => (
                        <div
                          className="hamburger-bank-item"
                          key={item}
                          onClick={() => handleNav(`/bank/${slugify(item)}`)}
                        >
                          {item}
                        </div>
                      ))}
                    </React.Fragment>
                  ))}
                </div>
              )}
              <a href="https://web.telegram.org/a/#7854826672" target="_blank" rel="noopener noreferrer" className="hamburger-link" style={{color: '#fff'}}>
                <MdOutlineMail style={{marginRight: 12, fontSize: 22}} /> Customer Care
              </a>
              <button className="hamburger-link" onClick={() => { setOpen(false); onLogout(); }}>
                <FiLogOut style={{marginRight: 12, fontSize: 22}} /> Logout
              </button>
            </div>
            <div className="hamburger-balance">
              <FaBitcoin style={{marginRight: 8, fontSize: 20}} />
              Balance ${usdBalance.toFixed(2)}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [userBalance, setUserBalance] = useState(0);
  const [usdBalance, setUsdBalance] = useState(0);
  const location = useLocation();

  React.useEffect(() => {
    const user = localStorage.getItem("bootlegger_user");
    if (user) {
      const userData = JSON.parse(user);
      setLoggedIn(true);
      setUserBalance(userData.balance || 0);
      setUsdBalance(userData.usdBalance || 0);
    }
  }, []);

  function handleLogout() {
    localStorage.removeItem("bootlegger_user");
    setLoggedIn(false);
    setUserBalance(0);
    setUsdBalance(0);
  }

  function updateBalance(newBalance, newUsdBalance) {
    setUserBalance(newBalance);
    setUsdBalance(newUsdBalance);
    // Also update the stored user data
    const user = localStorage.getItem("bootlegger_user");
    if (user) {
      const userData = JSON.parse(user);
      userData.balance = newBalance;
      userData.usdBalance = newUsdBalance;
      localStorage.setItem("bootlegger_user", JSON.stringify(userData));
    }
  }

  // If not logged in, show login page
  if (!loggedIn) {
    return (
      <>
        <MatrixBackground />
        <Login onLogin={() => {
          const user = localStorage.getItem("bootlegger_user");
          if (user) {
            const userData = JSON.parse(user);
            setUserBalance(userData.balance || 0);
            setUsdBalance(userData.usdBalance || 0);
          }
          setLoggedIn(true);
        }} />
      </>
    );
  }

  // If logged in, show the main app
  return (
    <>
      <MatrixBackground />
      <div className="app-bg">
        {/* Show hamburger on mobile, navbar on desktop */}
        <div className="mobile-nav-wrapper">
          <HamburgerMenu onLogout={handleLogout} usdBalance={usdBalance} />
        </div>
        <nav className="navbar pixel-navbar desktop-navbar">
          <div className="navbar-content pixel-navbar-content">
            <div className="navbar-links pixel-navbar-links">
              <NavLink to="/" end className={({isActive}) => "pixel-nav-btn" + (isActive ? " active" : "")}> <AiOutlineHome style={{marginRight: 8, fontSize: 20, verticalAlign: "middle"}} /><span>Home</span> </NavLink>
              <NavLink to="/history" className={({isActive}) => "pixel-nav-btn" + (isActive ? " active" : "")}> <AiOutlineHistory style={{marginRight: 8, fontSize: 20, verticalAlign: "middle"}} /><span>History</span> </NavLink>
              <NavLink to="/topup" className={({isActive}) => "pixel-nav-btn" + (isActive ? " active" : "")}> <FaBitcoin style={{marginRight: 8, fontSize: 20, verticalAlign: "middle"}} /><span>Top-up</span> </NavLink>
              <BanksDropdown />
              <button className="pixel-nav-btn" onClick={() => window.open('https://web.telegram.org/a/#7854826672', '_blank', 'noopener,noreferrer')}><MdOutlineMail style={{marginRight: 8, fontSize: 20, verticalAlign: "middle"}} /><span>Customer Care</span></button>
            </div>
            <div className="navbar-user-actions">
              <button className="pixel-nav-btn" onClick={handleLogout}><FiLogOut style={{marginRight: 8, fontSize: 20, verticalAlign: "middle"}} /><span>Logout</span></button>
              <div className="navbar-balance pixel-navbar-balance">
                <button className="balance-btn pixel-balance-btn">
                  <FaBitcoin style={{marginRight: 8, fontSize: 18, verticalAlign: "middle"}} />
                  <span style={{fontWeight: 500, fontSize: '0.97rem', fontFamily: 'Inter, Arial, sans-serif', letterSpacing: '0.01em', whiteSpace: 'nowrap', minWidth: 0}}>
                    Balance ${usdBalance.toFixed(2)}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </nav>
        <AnimatedRoutes updateBalance={updateBalance} />
        <footer className="footer">
          Copyright © Bootlegger | All rights reserved.
        </footer>
      </div>
    </>
  );
}

function AppWithRouter() {
  return (
    <Router>
      <App />
    </Router>
  );
}

export default AppWithRouter; 