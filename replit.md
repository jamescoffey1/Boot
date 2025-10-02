# Overview

This is a Bootlegger Private Store - a React-based e-commerce application for digital goods (bank logs) with cryptocurrency payment integration. The application features a full-stack architecture with a React frontend and Node.js/Express backend, using MongoDB for data persistence. The system implements cryptocurrency payment processing through NowPayments API integration, supporting multiple cryptocurrencies (BTC, ETH, USDT, LTC, DOGE, BNB, TRX).

## Recent Changes (October 2, 2025)
- **NowPayments Integration**: Replaced Bitcoin-only payment verification with NowPayments API for multi-cryptocurrency support
- **Updated TopUp UI**: New payment flow - users enter USD amount, select crypto, create payment, and track status
- **Backend API Routes**: Added `/nowpayments/*` endpoints for payment creation, status checking, currency listing, and IPN handling
- **Environment Setup**: Configured for Replit deployment with proper host settings and backend/frontend separation

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Technology Stack**: React 18.2.0 with Create React App

**Key Design Decisions**:
- **Single Page Application (SPA)**: Uses React Router DOM for client-side routing without page reloads
- **Animation Library**: Framer Motion for page transitions and UI animations
- **State Management**: Local component state with useState hooks; no global state management library
- **Persistent Authentication**: User data stored in localStorage for session persistence
- **Styling Approach**: CSS-in-JS with custom CSS files; no CSS framework used

**Component Structure**:
- `App.js`: Main application shell with routing and navigation
- `Login.js`: Authentication interface (login/signup)
- `TopUp.js`: Cryptocurrency payment interface
- `Banks.js`: Product listing with filtering, sorting, and pagination
- `History.js`: Purchase history display
- `MatrixBackground.js`: Animated canvas background effect

**Rationale**: Chose React for component reusability and virtual DOM performance. Avoided state management libraries to keep the architecture simple for this application size.

## Backend Architecture

**Technology Stack**: Node.js with Express.js framework

**Server Configuration**:
- **Development**: Runs on localhost:3001
- **Production**: Serves built React application as static files
- **API Design**: RESTful endpoints with JSON payloads
- **CORS**: Enabled for cross-origin requests during development

**Key Design Decisions**:
- **Monorepo Structure**: Frontend and backend in same repository with separate package.json files
- **Deployment Strategy**: Express serves both API routes and React build files in production
- **Error Handling**: Basic try-catch blocks with error messages returned to client
- **Security**: Password hashing with bcryptjs (10 salt rounds implied)

**API Routes**:
- `/users/*`: User authentication, balance management, Bitcoin verification
- `/nowpayments/*`: NowPayments integration for multi-cryptocurrency support

**Rationale**: Express chosen for simplicity and extensive middleware ecosystem. Monorepo structure simplifies deployment while maintaining clear separation of concerns.

## Data Layer

**Database**: MongoDB with Mongoose ODM

**User Schema**:
```javascript
{
  username: String (unique, required)
  email: String (unique, required)
  password: String (hashed, required)
  balance: Number (BTC balance, default: 0)
  usdBalance: Number (USD equivalent, default: 0)
  btcAddress: String (unique Bitcoin address per user)
  processedTransactions: Array<String> (TxID tracking for double-spend prevention)
  timestamps: true (createdAt, updatedAt)
}
```

**Key Design Decisions**:
- **Address Generation**: HD wallet derivation using BIP32 for unique Bitcoin addresses per user
- **Transaction Tracking**: Array of processed transaction IDs prevents duplicate credits
- **Dual Balance System**: Separate BTC and USD balances for flexibility

**Rationale**: MongoDB chosen for flexible schema and ease of integration with Node.js. Document model fits user-centric data structure well.

## Cryptocurrency Integration

**Bitcoin Address Generation**:
- **Technology**: BIP32 hierarchical deterministic wallets with bitcoinjs-lib
- **Derivation Path**: Uses XPUB key with sequential derivation (m/0/userIndex)
- **Address Format**: Native SegWit (bc1q...) using zpub prefix
- **Security**: Master private key never exposed; only XPUB stored in environment

**Payment Verification System**:

1. **NowPayments Integration** (Primary):
   - Multi-cryptocurrency support (BTC, ETH, USDT, LTC, DOGE, BNB, TRX)
   - Automated payment creation and tracking
   - IPN callbacks for status updates
   - Managed payment flow with invoice generation

2. **Direct Blockchain Verification** (Alternative):
   - Manual TxID submission by users
   - Dual API verification (Blockstream.info and Blockchain.info)
   - Confirmation requirement (minimum 1 block)
   - Address validation against user's unique address
   - Exact amount extraction from blockchain data

**Rationale**: Dual payment system provides flexibility - NowPayments for user convenience and automation, direct blockchain verification for cost savings and transparency. HD wallet ensures each user gets unique address for proper payment attribution.

# External Dependencies

## Third-Party APIs

**Blockchain Data**:
- **Blockstream.info API**: Primary Bitcoin transaction verification
- **Blockchain.info API**: Fallback Bitcoin transaction data
- **Usage**: GET requests to fetch transaction details by TxID
- **No Authentication Required**: Public APIs

**Payment Processing**:
- **NowPayments API**: Cryptocurrency payment gateway
- **Authentication**: API key via x-api-key header
- **Environment Variables**: 
  - `NOWPAYMENTS_API_KEY`: API authentication
  - `NOWPAYMENTS_API_URL`: Base endpoint (default: https://api.nowpayments.io/v1)
  - `NOWPAYMENTS_IPN_SECRET`: IPN callback verification
- **Features**: Multi-currency support, payment creation, status tracking

## Database Service

**MongoDB Atlas**:
- **Connection**: Via Mongoose ODM
- **Environment Variable**: `ATLAS_URI`
- **Configuration**: useNewUrlParser and useUnifiedTopology flags enabled
- **Purpose**: User data persistence, transaction history

## Environment Variables Required

```
ATLAS_URI=<MongoDB connection string>
XPUB_KEY=<Bitcoin HD wallet extended public key>
NOWPAYMENTS_API_KEY=<NowPayments API key>
NOWPAYMENTS_API_URL=<NowPayments base URL>
NOWPAYMENTS_IPN_SECRET=<IPN callback secret>
APP_URL=<Application base URL for callbacks>
PORT=<Server port, default: 3001>
```

## NPM Dependencies

**Frontend**:
- `react`, `react-dom`: UI framework
- `react-router-dom`: Client-side routing
- `framer-motion`: Animations
- `react-icons`: Icon library
- `axios`: HTTP client
- `react-scripts`: Build tooling

**Backend**:
- `express`: Web framework
- `mongoose`: MongoDB ODM
- `bcryptjs`: Password hashing
- `bitcoinjs-lib`: Bitcoin operations
- `bip32`: HD wallet derivation
- `tiny-secp256k1`: Elliptic curve cryptography
- `base58check`: Bitcoin address encoding
- `axios`: HTTP client for API calls
- `cors`: Cross-origin resource sharing
- `dotenv`: Environment variable management
- `nodemon`: Development auto-restart (dev dependency)