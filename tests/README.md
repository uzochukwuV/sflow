# Bitcoin Payment Gateway - Test Suite

## Test Structure

### Phase 1: Foundation Layer Tests (`sflow_test.ts`)
- ✅ Merchant registration (success/failure cases)
- ✅ Payment intent creation and validation
- ✅ Payment processing state machine
- ✅ Basic security checks

### Phase 2: Multi-Layer Bitcoin Support Tests
- ✅ Payment method validation (sBTC, Lightning, BTC L1, Liquid)
- ✅ Invalid payment method handling
- ✅ Method-specific processing logic

### Phase 3: DeFi Features Tests
- ✅ Yield allocation system
- ✅ Yield-enabled vs disabled merchants
- ✅ Treasury management functions

### Phase 4: Enterprise Features Tests
- ✅ Subscription billing system
- ✅ Emergency pause/unpause functionality
- ✅ Access control validation

### Edge Cases & Security Tests (`sflow_edge_cases_test.ts`)
- ✅ Input validation (amounts, expiry, percentages)
- ✅ Duplicate prevention
- ✅ State transition validation
- ✅ Security boundary testing
- ✅ Integration flow testing

## Running Tests

```bash
# Run all tests
clarinet test

# Run specific test file
clarinet test --filter sflow_test

# Run with coverage
clarinet test --coverage
```

## Test Coverage

### Core Functions Tested:
- `register-merchant` - ✅ Complete coverage
- `create-payment-intent` - ✅ Complete coverage  
- `process-payment` - ✅ Complete coverage
- `complete-payment` - ✅ Complete coverage
- `allocate-to-yield-pool` - ✅ Complete coverage
- `create-subscription` - ✅ Complete coverage
- `process-subscription-payment` - ✅ Complete coverage
- `emergency-pause/unpause` - ✅ Complete coverage

### Read-Only Functions Tested:
- `get-payment-intent` - ✅ Covered
- `get-payment-status` - ✅ Covered
- `is-merchant-registered` - ✅ Covered
- `calculate-fees` - ⚠️ Needs coverage

### Error Conditions Tested:
- ✅ ERR_UNAUTHORIZED (u1000)
- ✅ ERR_PAYMENT_NOT_FOUND (u1001)
- ✅ ERR_INVALID_STATE (u1002)
- ✅ ERR_EXPIRED (u1003)
- ✅ ERR_INSUFFICIENT_AMOUNT (u1004)
- ✅ ERR_INVALID_MERCHANT (u1005)
- ✅ Merchant registration errors (u2001-u2007)
- ✅ Yield allocation errors (u4001-u4002)
- ✅ Emergency pause errors (u5001)
- ✅ Subscription errors (u6001-u6004)

## Test Data Patterns

### Standard Test Accounts:
- `deployer` - Contract owner
- `wallet_1` - Primary merchant
- `wallet_2` - Customer/Secondary merchant
- `wallet_3` - Fee destination

### Standard Test Values:
- Payment amounts: 10,000 units (above minimum)
- Yield percentages: 500 basis points (5%)
- Expiry blocks: 144 blocks (~1 day)
- Subscription intervals: Variable for testing

## Performance Benchmarks

Target metrics from implementation guide:
- Payment processing latency < 2s ⏱️
- 99.9% uptime reliability 🔄
- Support for 4 Bitcoin layers 🔗

## Next Steps

1. Add performance/load testing
2. Add integration tests with actual sBTC contracts
3. Add fuzz testing for edge cases
4. Add gas optimization tests
5. Add multi-signature workflow tests