# Bitcoin Payment Verification System

## Overview

This system provides secure Bitcoin payment verification using real blockchain data. Users can send Bitcoin to their dedicated address and then verify the payment by providing the transaction ID (TxID).

## How It Works

### 1. User Flow
1. User signs up/logs in and gets a unique Bitcoin address
2. User sends Bitcoin from their wallet to their dedicated address
3. User's wallet provides a Transaction ID (TxID)
4. User pastes the TxID into the verification form
5. System validates the transaction against the blockchain
6. If valid, user's balance is updated with the exact amount sent

### 2. Security Features
- **Real Blockchain Validation**: Uses public APIs (Blockstream.info and Blockchain.info) to verify transactions
- **Address Verification**: Ensures payment was sent to the user's specific address
- **Double-Spend Prevention**: Tracks processed transactions to prevent duplicate credits
- **Confirmation Check**: Requires at least 1 blockchain confirmation
- **Amount Validation**: Extracts exact Bitcoin amount from transaction data

### 3. API Endpoints

#### Verify Payment
```
POST /users/verify-payment
Content-Type: application/json

{
  "txId": "a1075db55d416d3ca199f55b6084e2115b9345e16c5cf302fc80e9d5fbf5d48d",
  "userId": "user_id_here",
  "expectedAddress": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"
}
```

#### Get User Balance
```
GET /users/balance/:userId
```

#### Test Verification (Development)
```
GET /users/test-verification
```

### 4. Frontend Integration

The TopUp page now includes:
- Transaction ID input field
- Verify Payment button
- Real-time verification status
- Success/error messages
- Automatic balance updates

### 5. Database Schema Updates

User model now includes:
```javascript
{
  // ... existing fields
  balance: { type: Number, default: 0 },
  processedTransactions: { type: [String], default: [] }
}
```

### 6. Error Handling

The system handles various error scenarios:
- Invalid transaction ID format
- Transaction not found on blockchain
- Payment not sent to correct address
- Transaction not yet confirmed
- Already processed transactions
- Network/API errors

### 7. Testing

For development testing, you can use the test route to get a sample transaction ID:
```
GET http://localhost:5000/users/test-verification
```

### 8. Production Considerations

- **Rate Limiting**: Consider implementing rate limiting on verification endpoints
- **API Keys**: For production, consider using paid APIs with higher rate limits
- **Monitoring**: Monitor API usage and implement fallback mechanisms
- **Security**: Implement proper authentication and authorization
- **Backup APIs**: The system uses multiple blockchain APIs for redundancy

## Installation

1. Install dependencies:
```bash
cd server
npm install
```

2. Set up environment variables:
```env
ATLAS_URI=your_mongodb_connection_string
XPUB_KEY=your_bitcoin_xpub_key
```

3. Start the server:
```bash
npm start
```

## Usage Example

1. User creates account and gets Bitcoin address
2. User sends 0.001 BTC to their address
3. User copies TxID from their wallet
4. User pastes TxID in verification form
5. System validates and credits 0.001 BTC to user's balance

This system provides a secure, real-world solution for Bitcoin payment verification without requiring users to sign up for external services or API keys. 