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


    async getMerchantProfile(walletAddress) {
        console.log('[API] Fetching merchant profile for:', walletAddress);
        
        try {
            const response = await this.request(`/merchants/${walletAddress}`);
            console.log('[API] Merchant profile response:', response);
            return response;
        } catch (error) {
            console.error('[API] Failed to fetch merchant profile:', error);
            throw error;
        }
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
    async getDashboardStats(walletAddress) {
        try {
            if (!walletAddress) {
                throw new Error('Wallet address required');
            }
            return await this.request(`/merchants/stats/${walletAddress}`);
        } catch (error) {
            console.log('[API] Using mock stats data:', error.message);
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
        // /api/v1/merchants/register endpoint
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

    // Create payment intent with proper merchant validation
    async createPaymentIntent(paymentData) {
        console.log('[API] Creating payment intent:', paymentData);
        
        try {
            const response = await this.request('/payments/intents', {
                method: 'POST',
                body: JSON.stringify(paymentData)
            });
            
            console.log('[API] Payment intent response:', response);
            return response;
        } catch (error) {
            console.error('[API] Payment intent creation failed:', error);
            throw error;
        }
    }

    // Check if merchant is registered in smart contract
    async isMerchantRegistered(walletAddress) {
        console.log('[API] Checking merchant registration status for:', walletAddress);
        
        try {
            const response = await this.request(`/merchants/check/${walletAddress}`);
            console.log('[API] Merchant registration check result:', response);
            return response.success && response.data.registered;
        } catch (error) {
            console.log('[API] Merchant registration check failed:', error.message);
            return false;
        }
    }

    // Check if merchant is registered (legacy method)
    async getMerchantRegistrationStatus(walletAddress) {
        console.log('[API] Checking merchant registration status...');
        
        try {
            const response = await this.getMerchantProfile(walletAddress);
            console.log('[API] Merchant profile check result:', response);
            return response.success;
        } catch (error) {
            console.log('[API] Merchant not registered (expected for new merchants):', error.message);
            return false;
        }
    }
}

export const api = new ApiService();