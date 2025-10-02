import React, { useState, useEffect } from "react";
import "./App.css";

export default function TopUp({ updateBalance }) {
  const [user, setUser] = useState({ username: "", email: "" });
  const [balance, setBalance] = useState(0);
  const [usdBalance, setUsdBalance] = useState(0);
  
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("btc");
  const [currencies, setCurrencies] = useState([]);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [payment, setPayment] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [message, setMessage] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001');

  useEffect(() => {
    const storedUser = localStorage.getItem("bootlegger_user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      setBalance(userData.balance || 0);
      setUsdBalance(userData.usdBalance || 0);
    }
    
    fetchCurrencies();
  }, []);

  const fetchCurrencies = async () => {
    try {
      const response = await fetch(`${API_URL}/nowpayments/currencies`);
      const result = await response.json();
      
      if (result.success && result.currencies) {
        const popularCurrencies = ['btc', 'eth', 'usdt', 'ltc', 'doge', 'bnb', 'trx'];
        const filtered = result.currencies.filter(c => popularCurrencies.includes(c.toLowerCase()));
        setCurrencies(filtered.length > 0 ? filtered : result.currencies.slice(0, 10));
      }
    } catch (error) {
      console.error('Error fetching currencies:', error);
      setCurrencies(['btc', 'eth', 'usdt', 'ltc']);
    }
  };

  const createPayment = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setMessage({ success: false, text: "Please enter a valid amount" });
      return;
    }

    setIsCreatingPayment(true);
    setMessage(null);

    try {
      const response = await fetch(`${API_URL}/nowpayments/create-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user._id || user.id,
          priceAmount: parseFloat(amount),
          priceCurrency: 'USD',
          payCurrency: currency,
          orderDescription: `Top-up for ${user.username}`
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setPayment(result.payment);
        setMessage({ 
          success: true, 
          text: `Payment created! Send ${result.payment.pay_amount} ${result.payment.pay_currency.toUpperCase()} to the address below.` 
        });
      } else {
        setMessage({ success: false, text: result.message || 'Error creating payment' });
      }
    } catch (error) {
      setMessage({ 
        success: false, 
        text: "Error creating payment. Please check if NowPayments API key is configured." 
      });
    } finally {
      setIsCreatingPayment(false);
    }
  };

  const checkPaymentStatus = async () => {
    if (!payment || !payment.payment_id) return;

    setIsCheckingStatus(true);

    try {
      const response = await fetch(`${API_URL}/nowpayments/payment-status/${payment.payment_id}`);
      const result = await response.json();
      
      if (result.success) {
        setPaymentStatus(result.payment);
        
        if (result.payment.payment_status === 'finished' || result.payment.payment_status === 'confirmed') {
          setMessage({ 
            success: true, 
            text: `Payment confirmed! $${result.payment.price_amount} has been added to your balance.` 
          });
          
          const newUsdBalance = usdBalance + parseFloat(result.payment.price_amount);
          setUsdBalance(newUsdBalance);
          
          const updatedUser = { ...user, usdBalance: newUsdBalance };
          localStorage.setItem("bootlegger_user", JSON.stringify(updatedUser));
          
          if (updateBalance) {
            updateBalance(balance, newUsdBalance);
          }
          
          setTimeout(() => {
            setPayment(null);
            setPaymentStatus(null);
            setAmount("");
          }, 3000);
        } else {
          setMessage({ 
            success: false, 
            text: `Payment status: ${result.payment.payment_status}. Please wait...` 
          });
        }
      } else {
        setMessage({ success: false, text: result.message || 'Error checking payment status' });
      }
    } catch (error) {
      setMessage({ 
        success: false, 
        text: "Error checking payment status. Please try again." 
      });
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'waiting': '#ffa500',
      'confirming': '#ffeb3b',
      'confirmed': '#4caf50',
      'finished': '#4caf50',
      'failed': '#f44336',
      'expired': '#9e9e9e'
    };
    return statusColors[status] || '#9e9e9e';
  };

  return (
    <div className="main-content topup-page">
      <h1 className="topup-welcome">Welcome, {user.username}</h1>
      <div className="topup-grid">
        <div className="topup-left">
          <div className="topup-card telegram-card">
            <div className="telegram-icon">📩</div>
            <div className="telegram-text">Send us a message on Telegram</div>
          </div>
          <div className="topup-card profile-card">
            <div className="profile-title">Profile Info.</div>
            <div>Username: {user.username}</div>
            <div>Email: {user.email}</div>
            <div>Current Balance: ${usdBalance.toFixed(2)}</div>
            <button className="change-password-btn">Change Password</button>
          </div>
        </div>
        <div className="topup-card topup-right">
          <h2 className="topup-title">Top-Up Balance with Crypto</h2>
          
          {!payment ? (
            <>
              <div className="topup-desc">
                Enter the amount in USD you want to top up and select your preferred cryptocurrency.
              </div>
              
              <div className="payment-form">
                <div className="form-group">
                  <label className="form-label">Amount (USD)</label>
                  <input
                    type="number"
                    placeholder="Enter amount in USD"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="form-input"
                    disabled={isCreatingPayment}
                    min="1"
                    step="0.01"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Pay with</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="form-select"
                    disabled={isCreatingPayment}
                  >
                    {currencies.map(c => (
                      <option key={c} value={c}>{c.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
                
                <button
                  onClick={createPayment}
                  disabled={isCreatingPayment || !amount}
                  className="create-payment-btn"
                >
                  {isCreatingPayment ? "Creating..." : "Create Payment"}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="payment-details">
                <h3 className="payment-title">Payment Details</h3>
                
                <div className="payment-info">
                  <div className="info-row">
                    <span className="info-label">Amount to Pay:</span>
                    <span className="info-value">{payment.pay_amount} {payment.pay_currency.toUpperCase()}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">USD Value:</span>
                    <span className="info-value">${payment.price_amount}</span>
                  </div>
                </div>
                
                <div className="btc-label">🪙 Payment Address</div>
                <div className="btc-address">{payment.pay_address}</div>
                
                <div className="payment-actions">
                  <button 
                    className="copy-address-btn" 
                    onClick={() => navigator.clipboard.writeText(payment.pay_address)}
                  >
                    Copy Address
                  </button>
                  
                  <button
                    onClick={checkPaymentStatus}
                    disabled={isCheckingStatus}
                    className="check-status-btn"
                  >
                    {isCheckingStatus ? "Checking..." : "Check Payment Status"}
                  </button>
                </div>
                
                {paymentStatus && (
                  <div className="payment-status" style={{ borderColor: getStatusColor(paymentStatus.payment_status) }}>
                    <div>Status: <span style={{ color: getStatusColor(paymentStatus.payment_status) }}>
                      {paymentStatus.payment_status.toUpperCase()}
                    </span></div>
                    {paymentStatus.actually_paid && (
                      <div>Paid: {paymentStatus.actually_paid} {paymentStatus.pay_currency.toUpperCase()}</div>
                    )}
                  </div>
                )}
                
                <button
                  onClick={() => {
                    setPayment(null);
                    setPaymentStatus(null);
                    setAmount("");
                    setMessage(null);
                  }}
                  className="cancel-payment-btn"
                >
                  Cancel / Create New Payment
                </button>
              </div>
              
              <div className="topup-warning">
                *Send the exact amount to the address above. Payments are usually confirmed within minutes.
              </div>
            </>
          )}
          
          {message && (
            <div className={`verification-result ${message.success ? 'success' : 'error'}`}>
              {message.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
