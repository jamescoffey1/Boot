import React, { useEffect, useState } from "react";
import "./App.css";

export default function History() {
  const [user, setUser] = useState({ username: "-", email: "-" });

  useEffect(() => {
    const storedUser = localStorage.getItem("bootlegger_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  return (
    <div className="main-content history-page">
      <div className="history-header-row">
        <h1 className="history-title">Purchase History</h1>
        <div className="history-info">
          Your personal data from all purchases is stored here. For security, we do not store full logs of purchases.
          <br /><br />
          - BANK LOGS - E-MAIL ACCESS - FULLZ - MSR - DOB - SSN - ADDRESS - ZIP - CITY - STATE -
          <br />
          - COOKIES - IP/UA - AN/RN - PHONE# - RDP ACCESS CARRIER PIN - DL - CVV/EXP - BILLPAY OFF
          <br /><br />
          <b>User:</b> {user.username}<br />
          <b>Email:</b> {user.email}<br />
          <b>Total Purchase:</b> 0
        </div>
      </div>
      <div className="history-no-data">No History available.</div>
    </div>
  );
} 