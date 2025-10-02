const router = require('express').Router();
const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const { BIP32Factory } = require('bip32');
const ecc = require('tiny-secp256k1');
const bip32 = BIP32Factory(ecc);
const bitcoin = require('bitcoinjs-lib');
const axios = require('axios');

function zpubToXpub(zpub) {
  const decoded = base58check.decode(zpub);
  // Re-encode the payload with the xpub prefix (0x0488b21e).
  return base58check.encode(decoded.data, '0488b21e');
}

// Signup
router.post('/signup', async (req, res) => {
  console.log("Signup route hit. Processing new user.");
  try {
    const { username, email, password } = req.body;
    console.log(`Received signup request for username: ${username}, email: ${email}`);

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      console.log("Signup failed: User already exists.");
      return res.status(400).json({ msg: 'User with this email or username already exists.' });
    }
    console.log("User does not exist, proceeding.");

    // --- Bitcoin Address Generation ---
    console.log("Starting Bitcoin address generation...");
    const xpubKey = process.env.XPUB_KEY;
    if (!xpubKey) {
      console.error("CRITICAL: XPUB_KEY not set in environment variables.");
      throw new Error("XPUB_KEY not set in the .env file.");
    }
    console.log("XPUB_KEY found.");

    const zpubNetwork = {
      ...bitcoin.networks.bitcoin,
      bip32: {
        public: 0x04b24746, // zpub
        private: 0x04b2430c, // zprv
      },
    };

    const userCount = await User.countDocuments();
    console.log(`Current user count: ${userCount}. Deriving new address.`);
    const node = bip32.fromBase58(xpubKey, zpubNetwork);
    const child = node.derive(0).derive(userCount);
    console.log("Address derivation successful.");

    // FIX: Ensure the public key is a Buffer before creating the address
    const btcAddress = bitcoin.payments.p2wpkh({ pubkey: Buffer.from(child.publicKey) }).address;
    console.log(`Generated BTC Address: ${btcAddress}`);
    // --- End Address Generation ---

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log("Password hashed.");

    const newUser = new User({
      email,
      password: hashedPassword,
      username,
      btcAddress,
    });

    const savedUser = await newUser.save();
    console.log("New user saved to database successfully.");
    res.json({
        id: savedUser._id,
        username: savedUser.username,
        email: savedUser.email,
        btcAddress: savedUser.btcAddress,
        balance: savedUser.balance,
        usdBalance: savedUser.usdBalance,
        processedTransactions: savedUser.processedTransactions || []
    });

  } catch (err) {
    console.error("SIGNUP ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { login, password } = req.body; // 'login' can be username or email
    
    const user = await User.findOne({ $or: [{ email: login }, { username: login }] });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials.' });
    }
    
    // For now, we'll just send back a success message and user info
    // In a real app, we would issue a JWT token here
    res.json({
      msg: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        btcAddress: user.btcAddress,
        balance: user.balance,
        usdBalance: user.usdBalance,
        processedTransactions: user.processedTransactions || []
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Payment Verification
router.post('/verify-payment', async (req, res) => {
  try {
    const { txId, userId, expectedAddress } = req.body;

    if (!txId || !userId || !expectedAddress) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: txId, userId, or expectedAddress' 
      });
    }

    // Validate transaction ID format (64 character hex string)
    if (!/^[a-fA-F0-9]{64}$/.test(txId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid transaction ID format' 
      });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Verify the expected address matches the user's address
    if (user.btcAddress !== expectedAddress) {
      return res.status(400).json({ 
        success: false, 
        message: 'Address mismatch' 
      });
    }

    // Check if this transaction has already been processed
    if (user.processedTransactions && user.processedTransactions.includes(txId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Transaction has already been processed' 
      });
    }

    // Fetch transaction details from blockchain API
    let transactionData;
    try {
      // Try Blockstream API first (mainnet)
      const response = await axios.get(`https://blockstream.info/api/tx/${txId}`, {
        timeout: 10000
      });
      transactionData = response.data;
    } catch (error) {
      // If Blockstream fails, try alternative API
      try {
        const response = await axios.get(`https://blockchain.info/rawtx/${txId}?format=json`, {
          timeout: 10000
        });
        transactionData = response.data;
      } catch (altError) {
        console.error('Blockchain API errors:', { blockstream: error.message, blockchain: altError.message });
        return res.status(500).json({ 
          success: false, 
          message: 'Unable to fetch transaction data. Please try again later.' 
        });
      }
    }

    // Validate transaction
    let isValidTransaction = false;
    let btcAmount = 0;

    if (transactionData.out) {
      // Blockstream API format
      for (const output of transactionData.out) {
        if (output.scriptpubkey_address === expectedAddress) {
          isValidTransaction = true;
          btcAmount = output.value / 100000000; // Convert satoshis to BTC
          break;
        }
      }
    } else if (transactionData.outputs) {
      // Blockchain.info API format
      for (const output of transactionData.outputs) {
        if (output.addr === expectedAddress) {
          isValidTransaction = true;
          btcAmount = output.value / 100000000; // Convert satoshis to BTC
          break;
        }
      }
    }

    if (!isValidTransaction) {
      return res.status(400).json({ 
        success: false, 
        message: 'Transaction does not contain payment to your address' 
      });
    }

    if (btcAmount <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid payment amount' 
      });
    }

    // Check if transaction is confirmed (at least 1 confirmation)
    let isConfirmed = false;
    if (transactionData.status && transactionData.status.confirmed) {
      isConfirmed = true;
    } else if (transactionData.confirmations && transactionData.confirmations > 0) {
      isConfirmed = true;
    }

    if (!isConfirmed) {
      return res.status(400).json({ 
        success: false, 
        message: 'Transaction is not yet confirmed. Please wait for at least 1 confirmation.' 
      });
    }

    // Get current Bitcoin price to calculate USD value at deposit time
    let btcPrice = 65000; // Fallback price
    try {
      const priceResponse = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd', {
        timeout: 5000
      });
      btcPrice = priceResponse.data.bitcoin.usd;
    } catch (error) {
      console.error('Error fetching Bitcoin price:', error);
      // Use fallback price
    }

    // Calculate USD value at deposit time
    const usdValueAtDeposit = btcAmount * btcPrice;

    // Update user balance and mark transaction as processed
    const newBalance = user.balance + btcAmount;
    const newUsdBalance = user.usdBalance + usdValueAtDeposit;
    const processedTransactions = user.processedTransactions || [];
    processedTransactions.push(txId);

    await User.findByIdAndUpdate(userId, {
      balance: newBalance,
      usdBalance: newUsdBalance,
      processedTransactions: processedTransactions
    });

    res.json({
      success: true,
      message: `Payment verified successfully! ${btcAmount.toFixed(8)} BTC ($${usdValueAtDeposit.toFixed(2)}) added to your balance.`,
      amount: btcAmount,
      usdAmount: usdValueAtDeposit,
      newBalance: newBalance,
      newUsdBalance: newUsdBalance,
      txId: txId
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during payment verification' 
    });
  }
});

// Get user balance
router.get('/balance/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      balance: user.balance,
      usdBalance: user.usdBalance,
      username: user.username
    });

  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching balance' 
    });
  }
});

// Test route for payment verification (for development only)
router.get('/test-verification', async (req, res) => {
  try {
    // This is a test transaction ID - in real use, users would provide actual transaction IDs
    const testTxId = 'a1075db55d416d3ca199f55b6084e2115b9345e16c5cf302fc80e9d5fbf5d48d';
    
    res.json({
      message: 'Payment verification system is ready',
      testTxId: testTxId,
      note: 'Use this test transaction ID to verify the system works. In production, users will provide real transaction IDs from their Bitcoin wallets.'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 