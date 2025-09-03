# sPay API Documentation

## Base URL
```
http://localhost:5000/api/v1
```

## Authentication
All endpoints require Bearer token authentication:
```
Authorization: Bearer sk_test_1234567890abcdef
```

## Response Format
All responses follow this structure:
```json
{
  "success": boolean,
  "data": object,
  "error": {
    "message": string,
    "details": string
  }
}
```

---

## 🏪 Merchants API

### Register Merchant
**POST** `/merchants/register`

Register a new merchant in the smart contract.

**Request Body:**
```json
{
  "fee_destination": "ST219X1CZBCMQC37QC4GBYH8E1XW1X11EXNQ3SFWZ",
  "yield_enabled": true,
  "yield_percentage": 500,
  "multi_sig_enabled": false,
  "required_signatures": 1,
  "user_id": "uuid",
  "email": "merchant@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "merchant": "sk_test_1234567890abcdef",
    "api_key": "sk_test_1234567890abcdef",
    "fee_destination": "ST219X1CZBCMQC37QC4GBYH8E1XW1X11EXNQ3SFWZ",
    "yield_enabled": true,
    "yield_percentage": 500,
    "multi_sig_enabled": false,
    "required_signatures": 1,
    "tx_id": "0x123...",
    "registered_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### Check Merchant Registration
**GET** `/merchants/check/{address}`

Check if a wallet address is registered as a merchant in the smart contract.

**Response:**
```json
{
  "success": true,
  "data": {
    "address": "ST219X1CZBCMQC37QC4GBYH8E1XW1X11EXNQ3SFWZ",
    "registered": true,
    "checked_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### Get Merchant Profile
**GET** `/merchants/{address}`

Get merchant information by wallet address.

**Parameters:**
- `address` - Merchant wallet address (e.g., ST219X1CZBCMQC37QC4GBYH8E1XW1X11EXNQ3SFWZ)

**Response:**
```json
{
  "success": true,
  "data": {
    "merchant": "ST219X1CZBCMQC37QC4GBYH8E1XW1X11EXNQ3SFWZ",
    "registered": true,
    "checked_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### Get Merchant Stats
**GET** `/merchants/stats/{address}`

Get merchant dashboard statistics by wallet address.

**Parameters:**
- `address` - Merchant wallet address (e.g., ST219X1CZBCMQC37QC4GBYH8E1XW1X11EXNQ3SFWZ)

**Response:**
```json
{
  "success": true,
  "data": {
    "merchant": "ST219X1CZBCMQC37QC4GBYH8E1XW1X11EXNQ3SFWZ",
    "total_volume": 0,
    "active_payments": 0,
    "success_rate": 100,
    "yield_earned": 0
  }
}
```

---

## 💳 Payments API

### Create Payment Intent
**POST** `/payments/intents`

Create a new payment intent across multiple Bitcoin layers.

**Request Body:**
```json
{
  "merchant": "ST219X1CZBCMQC37QC4GBYH8E1XW1X11EXNQ3SFWZ",
  "amount": 100000,
  "currency": "BTC",
  "method": 1,
  "expires_in_blocks": 144,
  "metadata": {}
}
```

**Payment Methods:**
- `1` - sBTC
- `2` - Lightning Network
- `3` - Bitcoin L1
- `4` - Liquid Network

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "abc123def456",
    "merchant": "ST219X1CZBCMQC37QC4GBYH8E1XW1X11EXNQ3SFWZ",
    "amount": 100000,
    "currency": "BTC",
    "method": 1,
    "status": "pending",
    "created_at": "2024-01-01T00:00:00.000Z",
    "expires_at": "2024-01-02T00:00:00.000Z",
    "metadata": {},
    "tx_id": "0x123..."
  }
}
```

### Get Payment Intent
**GET** `/payments/intents/{id}`

Retrieve payment intent details.

### Process Payment
**POST** `/payments/intents/{id}/process`

Process a pending payment intent.

**Response:**
```json
{
  "success": true,
  "data": {
    "payment_id": "abc123def456",
    "status": "confirmed",
    "tx_id": "0x123...",
    "processed_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### Complete Payment
**POST** `/payments/intents/{id}/complete`

Complete a confirmed payment.

### Cancel Payment
**POST** `/payments/intents/{id}/cancel`

Cancel a pending payment.

### Get Payment Status
**GET** `/payments/intents/{id}/status`

Check payment status.

### List Payments
**GET** `/payments`

List payments with pagination.

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `status` - Filter by status
- `merchant` - Filter by merchant

---

## ⚡ Lightning Network API

### Create Lightning Invoice
**POST** `/lightning/invoices`

Create a Lightning Network invoice.

**Request Body:**
```json
{
  "amount_sats": 1000,
  "description": "Payment description",
  "expiry": 3600
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "payment_request": "lnbc10u1p...",
    "payment_hash": "abc123...",
    "amount_sats": 1000,
    "description": "Payment description",
    "expires_at": "2024-01-01T01:00:00.000Z",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### Decode Lightning Invoice
**POST** `/lightning/invoices/decode`

Decode a Lightning Network invoice.

### Pay Lightning Invoice
**POST** `/lightning/payments`

Pay a Lightning Network invoice.

### Get Lightning Payment Status
**GET** `/lightning/payments/{payment_hash}`

Check Lightning payment status.

### Estimate Lightning Fee
**GET** `/lightning/fees/estimate/{amount_sats}`

Estimate Lightning routing fees.

---

## 🔄 Atomic Swaps API

### Initiate Atomic Swap
**POST** `/swaps/atomic`

Initiate a Bitcoin ↔ sBTC atomic swap.

**Request Body:**
```json
{
  "btc_txid": "abc123...",
  "btc_output_index": 0,
  "amount": 100000,
  "btc_address": "bc1q...",
  "recipient": "ST219X1CZBCMQC37QC4GBYH8E1XW1X11EXNQ3SFWZ"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "swap_id": "def456abc789",
    "btc_txid": "abc123...",
    "btc_output_index": 0,
    "amount": 100000,
    "btc_address": "bc1q...",
    "recipient": "ST219X1CZBCMQC37QC4GBYH8E1XW1X11EXNQ3SFWZ",
    "status": "initiated",
    "expires_at": "2024-01-02T00:00:00.000Z",
    "contract_tx_id": "0x789...",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### Claim Atomic Swap
**POST** `/swaps/atomic/{id}/claim`

Claim an atomic swap with Bitcoin proof.

### Get Atomic Swap
**GET** `/swaps/atomic/{id}`

Get atomic swap details.

### Create Swap Quote
**POST** `/swaps/quote`

Get exchange rate quote for cross-chain swap.

**Request Body:**
```json
{
  "from_currency": "BTC",
  "to_currency": "STX",
  "amount": 100000,
  "swap_type": "atomic"
}
```

### Execute Swap
**POST** `/swaps/execute`

Execute a cross-chain swap.

**Request Body:**
```json
{
  "from_currency": "BTC",
  "to_currency": "STX",
  "amount": 100000,
  "recipient_address": "ST219X1CZBCMQC37QC4GBYH8E1XW1X11EXNQ3SFWZ",
  "swap_type": "atomic",
  "quote_id": "quote_abc123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "swap_id": "swap_def456",
    "from_currency": "BTC",
    "to_currency": "STX",
    "input_amount": 100000,
    "recipient_address": "ST219X1CZBCMQC37QC4GBYH8E1XW1X11EXNQ3SFWZ",
    "swap_type": "atomic",
    "status": "pending",
    "estimated_completion": "2024-01-01T00:10:00.000Z",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## 📊 Yield & DeFi API

### Create Yield Position
**POST** `/merchants/yield-positions`

Create a new yield farming position.

**Request Body:**
```json
{
  "merchant": "ST219X1CZBCMQC37QC4GBYH8E1XW1X11EXNQ3SFWZ",
  "amount": 100000,
  "strategy": "STACKING",
  "duration_blocks": 2016
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "position_id": "pos_abc123",
    "merchant": "ST219X1CZBCMQC37QC4GBYH8E1XW1X11EXNQ3SFWZ",
    "amount": 100000,
    "strategy": "STACKING",
    "duration_blocks": 2016,
    "expected_apy": "8.5",
    "status": "active",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### Get Yield Position
**GET** `/merchants/yield`

Get current yield position.

### Estimate Yield
**GET** `/merchants/yield/estimate/{amount}/{duration}`

Estimate yield for given amount and duration.

---

## 🔄 Subscriptions API

### Create Subscription
**POST** `/merchants/subscriptions`

Create recurring payment subscription.

**Request Body:**
```json
{
  "customer": "ST1CUSTOMER...",
  "amount": 10000,
  "interval_blocks": 144
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "subscription_id": "sub_abc123",
    "merchant": "ST219X1CZBCMQC37QC4GBYH8E1XW1X11EXNQ3SFWZ",
    "customer": "ST1CUSTOMER...",
    "amount": 10000,
    "interval_blocks": 144,
    "next_payment": "2024-01-02T00:00:00.000Z",
    "active": true,
    "tx_id": "0x456...",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### Process Subscription Payment
**POST** `/merchants/subscriptions/{id}/process`

Process next subscription payment.

---

## 🔐 Multi-Signature API

### Create Multi-Sig Transaction
**POST** `/merchants/multisig/transactions`

Create multi-signature transaction.

### Sign Multi-Sig Transaction
**POST** `/merchants/multisig/transactions/{id}/sign`

Sign a multi-signature transaction.

---

## 🔗 Webhooks API

### Payment Update Webhook
**POST** `/webhooks/payment-update`

Receive payment status updates from external services.

### Lightning Update Webhook
**POST** `/webhooks/lightning-update`

Receive Lightning Network payment updates.

### Test Webhook
**POST** `/webhooks/test`

Test webhook endpoint.

---

## 💰 Fee Calculation API

### Calculate Fees
**GET** `/payments/fees/{amount}`

Calculate protocol fees for given amount.

**Response:**
```json
{
  "success": true,
  "data": {
    "amount": 100000,
    "protocol_fee": 250,
    "net_amount": 99750
  }
}
```

---

## 🏥 Health Check

### Health Status
**GET** `/health`

Check API health status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "service": "SFlow Payment Gateway"
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Invalid API key |
| 404 | Not Found - Resource not found |
| 500 | Internal Server Error |

## Rate Limiting

- 100 requests per 15 minutes per IP
- Authenticated requests have higher limits

## Supported Networks

- **Testnet** (Development)
- **Mainnet** (Production)

## Smart Contract Integration

All payment operations interact with the Stacks smart contract:
- Contract Address: `ST219X1CZBCMQC37QC4GBYH8E1XW1X11EXNQ3SFWZ.sflow`
- Network: Stacks Testnet