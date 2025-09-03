// API service for Bitcoin Payment Gateway
import { auth } from './auth.js';

const API_BASE_URL = '/api/v1';

export class ApiService {
    constructor() {
        this.baseURL = API_BASE_URL;
    }

    async request(endpoint, options = {}) {
        const session = await auth.getSession();
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (session?.access_token) {
            headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        // Add API key from merchant data if available
        const merchantData = localStorage.getItem('merchant_data');
        if (merchantData) {
            const merchant = JSON.parse(merchantData);
            if (merchant.api_key) {
                headers['X-API-Key'] = merchant.api_key;
            }
        }

        const response = await fetch(`${this.baseURL}${endpoint}`, {
            ...options,
            headers
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        return response.json();
    }

    // Wave 1: Foundation - Merchant Registration
    async registerMerchant(merchantData) {
        return this.request('/merchants/register', {
            method: 'POST',
            body: JSON.stringify(merchantData)
        });
    }

    async getMerchantProfile() {
        return this.request('/merchants/me');
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

    // Register merchant with backend
    async registerMerchant(merchantData) {
        try {
            return await this.request('/merchants/register', {
                method: 'POST',
                body: JSON.stringify(merchantData)
            });
        } catch (error) {
            console.error('Merchant registration failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

export const api = new ApiService();