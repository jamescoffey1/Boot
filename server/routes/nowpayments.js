const router = require('express').Router();
const User = require('../models/user.model');
const axios = require('axios');

const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY || '';
const NOWPAYMENTS_API_URL = process.env.NOWPAYMENTS_API_URL || 'https://api.nowpayments.io/v1';
const NOWPAYMENTS_IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET || '';

const nowpaymentsHeaders = {
  'x-api-key': NOWPAYMENTS_API_KEY,
  'Content-Type': 'application/json'
};

router.post('/create-payment', async (req, res) => {
  try {
    const { userId, priceAmount, priceCurrency = 'USD', payCurrency = 'btc', orderDescription } = req.body;

    if (!userId || !priceAmount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: userId and priceAmount' 
      });
    }

    if (!NOWPAYMENTS_API_KEY) {
      return res.status(500).json({ 
        success: false, 
        message: 'NowPayments API key is not configured' 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    const paymentData = {
      price_amount: priceAmount,
      price_currency: priceCurrency,
      pay_currency: payCurrency,
      order_id: `${userId}_${Date.now()}`,
      order_description: orderDescription || `Top-up for ${user.username}`,
      ipn_callback_url: `${process.env.APP_URL || ''}/users/nowpayments/ipn`
    };

    const response = await axios.post(
      `${NOWPAYMENTS_API_URL}/payment`,
      paymentData,
      { headers: nowpaymentsHeaders, timeout: 10000 }
    );

    const payment = response.data;

    res.json({
      success: true,
      payment: {
        payment_id: payment.payment_id,
        pay_address: payment.pay_address,
        pay_amount: payment.pay_amount,
        pay_currency: payment.pay_currency,
        price_amount: payment.price_amount,
        price_currency: payment.price_currency,
        payment_status: payment.payment_status,
        order_id: payment.order_id
      }
    });

  } catch (error) {
    console.error('NowPayments create payment error:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false, 
      message: error.response?.data?.message || 'Error creating payment' 
    });
  }
});

router.get('/payment-status/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;

    if (!NOWPAYMENTS_API_KEY) {
      return res.status(500).json({ 
        success: false, 
        message: 'NowPayments API key is not configured' 
      });
    }

    const response = await axios.get(
      `${NOWPAYMENTS_API_URL}/payment/${paymentId}`,
      { headers: nowpaymentsHeaders, timeout: 10000 }
    );

    const payment = response.data;

    res.json({
      success: true,
      payment: {
        payment_id: payment.payment_id,
        payment_status: payment.payment_status,
        pay_address: payment.pay_address,
        pay_amount: payment.pay_amount,
        pay_currency: payment.pay_currency,
        price_amount: payment.price_amount,
        price_currency: payment.price_currency,
        actually_paid: payment.actually_paid,
        order_id: payment.order_id
      }
    });

  } catch (error) {
    console.error('NowPayments get payment status error:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false, 
      message: error.response?.data?.message || 'Error fetching payment status' 
    });
  }
});

router.post('/ipn', async (req, res) => {
  try {
    const paymentData = req.body;

    console.log('Received IPN:', paymentData);

    if (paymentData.payment_status === 'finished' || paymentData.payment_status === 'confirmed') {
      const orderId = paymentData.order_id;
      const userId = orderId.split('_')[0];
      
      const user = await User.findById(userId);
      if (!user) {
        console.error('User not found for IPN:', userId);
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      if (user.processedTransactions && user.processedTransactions.includes(paymentData.payment_id)) {
        console.log('Payment already processed:', paymentData.payment_id);
        return res.json({ success: true, message: 'Payment already processed' });
      }

      const usdAmount = parseFloat(paymentData.price_amount);
      const cryptoAmount = parseFloat(paymentData.actually_paid || paymentData.pay_amount);

      const newUsdBalance = user.usdBalance + usdAmount;
      const newBalance = user.balance + cryptoAmount;
      const processedTransactions = user.processedTransactions || [];
      processedTransactions.push(paymentData.payment_id);

      await User.findByIdAndUpdate(userId, {
        balance: newBalance,
        usdBalance: newUsdBalance,
        processedTransactions: processedTransactions
      });

      console.log(`Updated balance for user ${userId}: +$${usdAmount}`);
    }

    res.json({ success: true });

  } catch (error) {
    console.error('IPN processing error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error processing IPN' 
    });
  }
});

router.get('/currencies', async (req, res) => {
  try {
    if (!NOWPAYMENTS_API_KEY) {
      return res.status(500).json({ 
        success: false, 
        message: 'NowPayments API key is not configured' 
      });
    }

    const response = await axios.get(
      `${NOWPAYMENTS_API_URL}/currencies`,
      { headers: nowpaymentsHeaders, timeout: 10000 }
    );

    res.json({
      success: true,
      currencies: response.data.currencies
    });

  } catch (error) {
    console.error('NowPayments get currencies error:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false, 
      message: error.response?.data?.message || 'Error fetching currencies' 
    });
  }
});

router.get('/estimate', async (req, res) => {
  try {
    const { amount, currency_from = 'usd', currency_to = 'btc' } = req.query;

    if (!amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Amount is required' 
      });
    }

    if (!NOWPAYMENTS_API_KEY) {
      return res.status(500).json({ 
        success: false, 
        message: 'NowPayments API key is not configured' 
      });
    }

    const response = await axios.get(
      `${NOWPAYMENTS_API_URL}/estimate`,
      { 
        params: { amount, currency_from, currency_to },
        headers: nowpaymentsHeaders, 
        timeout: 10000 
      }
    );

    res.json({
      success: true,
      estimate: response.data
    });

  } catch (error) {
    console.error('NowPayments estimate error:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false, 
      message: error.response?.data?.message || 'Error getting estimate' 
    });
  }
});

module.exports = router;
