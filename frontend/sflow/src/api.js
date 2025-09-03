// API service for Bitcoin Payment Gateway
import { auth } from './auth.js';

const API_BASE_URL = '/api/v1';

export class ApiService {
    constructor() {
        this.baseURL = API_BASE_URL;
    }

    async request(endpoint, options = {}) {
        console.log(`[API] Making request to: ${endpoint}`, options);
        
        const session = await auth.getSession();
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        // Use test API key for now (in production, this would come from auth)
        headers['Authorization'] = 'Bearer sk_test_1234567890abcdef';
        
        console.log('[API] Request headers:', headers);

        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                ...options,
                headers
            });

            console.log(`[API] Response status: ${response.status}`);
            
            const responseData = await response.json();
            console.log('[API] Response data:', responseData);

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} - ${responseData.error?.message || response.statusText}`);
            }

            return responseData;
        } catch (error) {
            console.error('[API] Request failed:', error);
            throw error;
        }
    }


    async getMerchantProfile() {
        console.log('[API] Fetching merchant profile...');
        
        try {
            const response = await this.request('/merchants/me');
            console.log('[API] Merchant profile response:', response);
            return response;
        } catch (error) {
            console.error('[API] Failed to fetch merchant profile:', error);
            throw error;
        }
    }

    // Wave 1 & 2: Multi-Layer Payment Intents
    async createPaymentIntent(paymentData) {
        return this.request('/payments/intents', {
            method: 'POST',
            body: JSON.stringify({
                ...paymentData,
                // Support all 4 Bitcoin layers
                method: paymentData.method || 1, // 1=sBTC, 2=Lightning, 3=BTC L1, 4=Liquid
            })
        });
    }

    async getPaymentIntent(intentId) {
        return this.request(`/payments/intents/${intentId}`);
    }

    async getPayments(filters = {}) {
        const params = new URLSearchParams(filters);
        return this.request(`/payments?${params}`);
    }

    // Wave 3: Yield Generation
    async getYieldPositions() {
        return this.request('/merchants/yield-positions');
    }

    async createYieldPosition(yieldData) {
        return this.request('/merchants/yield-positions', {
            method: 'POST',
            body: JSON.stringify(yieldData)
        });
    }

    // Wave 3: Subscription Billing
    async createSubscription(subscriptionData) {
        return this.request('/subscriptions', {
            method: 'POST',
            body: JSON.stringify(subscriptionData)
        });
    }

    async getSubscriptions() {
        return this.request('/subscriptions');
    }

    // Dashboard Analytics
    async getDashboardStats() {
        try {
            return await this.request('/merchants/stats');
        } catch (error) {
            // Return mock data structure if API fails
            return {
                success: false,
                data: {
                    total_volume: '847.32',
                    active_payments: 127,
                    yield_earned: '12.67',
                    success_rate: '99.7'
                }
            };
        }
    }

    // Enhanced merchant registration with detailed logging
    async registerMerchant(merchantData) {
        console.log('[API] Registering merchant with data:', merchantData);
        
        try {
            const response = await this.request('/merchants/register', {
                method: 'POST',
                body: JSON.stringify(merchantData)
            });
            
            console.log('[API] Merchant registration response:', response);
            return response;
        } catch (error) {
            console.error('[API] Merchant registration failed:', error);
            return {
                success: false,
                error: {
                    message: error.message,
                    details: error.stack
                }
            };
        }
    }

    // Check if merchant is registered
    async isMerchantRegistered() {
        console.log('[API] Checking merchant registration status...');
        
        try {
            const response = await this.getMerchantProfile();
            console.log('[API] Merchant profile check result:', response);
            return response.success;
        } catch (error) {
            console.log('[API] Merchant not registered (expected for new merchants):', error.message);
            return false;
        }
    }
}

export const api = new ApiService();