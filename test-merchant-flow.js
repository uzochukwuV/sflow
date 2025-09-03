// Complete Merchant Flow Test Suite for Backend
// Tests: Register Merchant → Create Payment → Create Subscription
// Uses Clarinet simnet addresses with funds
import axios from 'axios';
import crypto from 'crypto';



class MerchantFlowTest {
    constructor() {
        this.baseURL = 'http://localhost:5000/api/v1';
        
        // Clarinet simnet addresses with funds
        this.addresses = {
            deployer: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
            merchant: 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5', // wallet_1
            customer: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG', // wallet_2
            treasury: 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC'  // wallet_3
        };
        
        this.merchantData = null;
        this.apiKey = null;
    }

    // Generate unique IDs
    generateId() {
        return crypto.randomBytes(8).toString('hex');
    }

    // API request helper
    async apiRequest(endpoint, method = 'GET', data = null, headers = {}) {
        try {
            const config = {
                method,
                url: `${this.baseURL}${endpoint}`,
                headers: {
                    'Content-Type': 'application/json',
                    ...headers
                }
            };

            if (data) {
                config.data = data;
            }

            const response = await axios(config);
            return {
                success: true,
                data: response.data,
                status: response.status
            };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data || error.message,
                status: error.response?.status
            };
        }
    }

    // Test 1: Register Merchant
    async testRegisterMerchant() {
        console.log('\n🏪 Testing Merchant Registration...');
        
        const merchantRegistration = {
            fee_destination: this.addresses.merchant,
            yield_enabled: true,
            yield_percentage: 800, // 8% in basis points
            multi_sig_enabled: false,
            required_signatures: 1
        };

        const result = await this.apiRequest('/merchants/register', 'POST', merchantRegistration, {
            'Authorization': `Bearer sk_test_1234567890abcdef`
        });
        
        if (result.success) {
            console.log(result.data)
            console.log('✅ Merchant registered successfully');
            console.log(`   Merchant: ${result.data.merchant || this.addresses.merchant}`);
            console.log(`   API Key: ${result.data.api_key || 'Generated'}`);
            console.log(`   Success: ${result.data.success}`);
            
            // Generate mock API key if not provided
            this.merchantData = result.data;
            this.apiKey = result.data.api_key || `sk_test_${this.generateId()}`;
            return true;
        } else {
            console.log('❌ Merchant registration failed:', result.error);
            return false;
        }
    }

    // Test 2: Create Payment Intent
    async testCreatePayment() {
        console.log('\n💳 Testing Payment Creation...');
        
        if (!this.apiKey) {
            console.log('❌ No API key available. Using default API key for testing.');
            this.apiKey = 'sk_test_1234567890abcdef';
        }

        const paymentData = {
            merchant: this.addresses.merchant,
            amount: 100000, // 100,000 satoshis = 0.001 BTC
            currency: 'BTC',
            method: 1, // sBTC
            expires_in_blocks: 144, // 24 hours
            description: 'Test payment for coffee'
        };

        const result = await this.apiRequest('/payments/intents', 'POST', paymentData, {
            'Authorization': `Bearer ${this.apiKey}`
        });

        if (result.success) {
            console.log('✅ Payment intent created successfully');
            console.log(`   Payment ID: ${result.data.data.id}`);
            console.log(`   Amount: ${result.data.data.amount} sats`);
            console.log(`   Method: ${result.data.data.method} (sBTC)`);
            console.log(`   Status: ${result.data.data.status}`);
            console.log(`   Expires: ${result.data.data.expires_at}`);
            
            this.paymentId = result.data.data.id;
            return true;
        } else {
            console.log('❌ Payment creation failed:', result.error);
            return false;
        }
    }

    // Test 3: Get Payment Status
    async testGetPaymentStatus() {
        console.log('\n📊 Testing Payment Status Check...');
        
        if (!this.paymentId || !this.apiKey) {
            console.log('❌ No payment ID or API key available.');
            return false;
        }

        const result = await this.apiRequest(`/payments/intents/${this.paymentId}`, 'GET', null, {
            'Authorization': `Bearer ${this.apiKey}`
        });

        if (result.success) {
            console.log('✅ Payment status retrieved successfully');
            console.log(`   Payment ID: ${result.data.data.id}`);
            console.log(`   Status: ${result.data.data.status}`);
            console.log(`   Amount: ${result.data.data.amount} sats`);
            console.log(`   Created: ${result.data.data.created_at}`);
            return true;
        } else {
            console.log('❌ Payment status check failed:', result.error);
            return false;
        }
    }

    // Test 4: Create Subscription
    async testCreateSubscription() {
        console.log('\n🔄 Testing Subscription Creation...');
        
        if (!this.apiKey) {
            this.apiKey = 'sk_test_1234567890abcdef';
        }

        const subscriptionData = {
            merchant: this.addresses.merchant,
            amount: 50000, // 50,000 sats monthly
            interval_blocks: 1008, // ~1 week (144 blocks/day * 7)
            max_payments: 12, // 12 payments total
            description: 'Monthly Premium Subscription'
        };

        const result = await this.apiRequest('/merchants/subscriptions', 'POST', subscriptionData, {
            'Authorization': `Bearer ${this.apiKey}`
        });

        if (result.success) {
            console.log('✅ Subscription created successfully');
            console.log(`   Subscription ID: ${result.data.data.subscription_id}`);
            console.log(`   Amount: ${result.data.data.amount} sats`);
            console.log(`   Interval: ${result.data.data.interval_blocks} blocks`);
            console.log(`   Max Payments: ${result.data.data.max_payments || 'N/A'}`);
            console.log(`   Status: ${result.data.data.active ? 'active' : 'inactive'}`);
            
            this.subscriptionId = result.data.data.subscription_id;
            return true;
        } else {
            console.log('❌ Subscription creation failed:', result.error);
            return false;
        }
    }

    // Test 5: Get Merchant Stats
    async testGetMerchantStats() {
        console.log('\n📈 Testing Merchant Stats...');
        
        if (!this.apiKey) {
            this.apiKey = 'sk_test_1234567890abcdef';
        }

        const result = await this.apiRequest('/merchants/stats', 'GET', null, {
            'Authorization': `Bearer ${this.apiKey}`
        });

        if (result.success) {
            console.log('✅ Merchant stats retrieved successfully');
            console.log(`   Total Volume: ${result.data.total_volume || 0} sats`);
            console.log(`   Active Payments: ${result.data.active_payments || 0}`);
            console.log(`   Success Rate: ${result.data.success_rate || 0}%`);
            console.log(`   Yield Earned: ${result.data.yield_earned || 0} sats`);
            return true;
        } else {
            console.log('❌ Merchant stats failed:', result.error);
            return false;
        }
    }

    // Test 6: Create Yield Position
    async testCreateYieldPosition() {
        console.log('\n💰 Testing Yield Position Creation...');
        
        if (!this.apiKey) {
            this.apiKey = 'sk_test_1234567890abcdef';
        }

        const yieldData = {
            merchant: this.addresses.merchant,
            amount: 1000000, // 1M sats = 0.01 BTC
            strategy: 'STACKING',
            duration_blocks: 2016 // ~2 weeks
        };

        const result = await this.apiRequest('/merchants/yield-positions', 'POST', yieldData, {
            'Authorization': `Bearer ${this.apiKey}`
        });

        if (result.success) {
            console.log('✅ Yield position created successfully');
            console.log(`   Position ID: ${result.data.position_id}`);
            console.log(`   Amount: ${result.data.amount} sats`);
            console.log(`   Strategy: ${result.data.strategy}`);
            console.log(`   Expected APY: ${result.data.expected_apy}%`);
            return true;
        } else {
            console.log('❌ Yield position creation failed:', result.error);
            return false;
        }
    }

    // Test 7: List All Payments
    async testListPayments() {
        console.log('\n📋 Testing Payment List...');
        
        if (!this.apiKey) {
            this.apiKey = 'sk_test_1234567890abcdef';
        }

        const result = await this.apiRequest('/payments?limit=10', 'GET', null, {
            'Authorization': `Bearer ${this.apiKey}`
        });

        if (result.success) {
            console.log('✅ Payment list retrieved successfully');
            console.log(`   Total Payments: ${result.data.payments?.length || 0}`);
            
            if (result.data.payments && result.data.payments.length > 0) {
                result.data.payments.forEach((payment, index) => {
                    console.log(`   ${index + 1}. ${payment.payment_id} - ${payment.amount} sats - ${payment.status}`);
                });
            }
            return true;
        } else {
            console.log('❌ Payment list failed:', result.error);
            return false;
        }
    }
       

     
   

    // Run all tests
    async runAllTests() {
        console.log('🚀 Starting Complete Merchant Flow Test Suite');
        console.log('================================================');
        console.log(`Backend URL: ${this.baseURL}`);
        console.log(`Merchant Address: ${this.addresses.merchant}`);
        console.log(`Customer Address: ${this.addresses.customer}`);
        
        const tests = [
            { name: 'Register Merchant', fn: () => this.testRegisterMerchant() },
            { name: 'Create Payment', fn: () => this.testCreatePayment() },
            { name: 'Get Payment Status', fn: () => this.testGetPaymentStatus() },
            { name: 'Create Subscription', fn: () => this.testCreateSubscription() },
            { name: 'Get Merchant Stats', fn: () => this.testGetMerchantStats() },
            { name: 'Create Yield Position', fn: () => this.testCreateYieldPosition() },
            { name: 'List Payments', fn: () => this.testListPayments() }
        ];

        let passed = 0;
        let failed = 0;

        for (const test of tests) {
            try {
                const result = await test.fn();
                if (result) {
                    passed++;
                } else {
                    failed++;
                }
            } catch (error) {
                console.log(`❌ ${test.name} threw error:`, error.message);
                failed++;
            }
            
            // Wait between tests
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log('\n================================================');
        console.log('🏁 Test Suite Complete');
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`📊 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
        
        if (this.merchantData) {
            console.log('\n📝 Test Data Summary:');
            console.log(`   Merchant ID: ${this.merchantData.merchant_id}`);
            console.log(`   API Key: ${this.apiKey}`);
            console.log(`   Payment ID: ${this.paymentId || 'N/A'}`);
            console.log(`   Subscription ID: ${this.subscriptionId || 'N/A'}`);
        }
    }
}

// Run the test suite
async function main() {
    const tester = new MerchantFlowTest();
    await tester.runAllTests();
}

// Execute if run directly
main().catch(console.error);

