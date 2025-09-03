// Payment Methods Integration
import { SBTCPayment } from './sbtc-payment.js';
import { api } from './api.js';

export class PaymentMethods {
    constructor() {
        this.sbtc = new SBTCPayment('testnet');
        this.supportedMethods = {
            1: { name: 'sBTC', handler: this.sbtc, icon: '₿', color: 'orange' },
            2: { name: 'Lightning', handler: null, icon: '⚡', color: 'yellow' },
            3: { name: 'Bitcoin L1', handler: null, icon: '₿', color: 'orange' },
            4: { name: 'Liquid', handler: null, icon: '🌊', color: 'blue' }
        };
    }

    // Create payment intent for any method
    async createPaymentIntent(merchantAddress, amount, currency, method, options = {}) {
        const methodConfig = this.supportedMethods[method];
        if (!methodConfig) {
            throw new Error(`Unsupported payment method: ${method}`);
        }

        // Create payment intent via API first
        const apiResponse = await api.createPaymentIntent({
            merchant: merchantAddress,
            amount: amount,
            currency: currency || 'BTC',
            method: method,
            expires_in_blocks: options.expiresInBlocks || 144,
            metadata: options.metadata || {}
        });

        if (!apiResponse.success) {
            throw new Error(apiResponse.error.message);
        }

        return {
            success: true,
            paymentId: apiResponse.data.id,
            method: method,
            amount: amount,
            merchant: merchantAddress,
            status: 'pending',
            expiresAt: apiResponse.data.expires_at,
            qrCode: this.generatePaymentQR(apiResponse.data.id, amount, method)
        };
    }

    // Process payment for any method
    async processPayment(paymentId) {
        try {
            const result = await api.request(`/payments/intents/${paymentId}/process`, {
                method: 'POST'
            });
            
            return result;
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Complete payment
    async completePayment(paymentId) {
        try {
            const result = await api.request(`/payments/intents/${paymentId}/complete`, {
                method: 'POST'
            });
            
            return result;
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Lightning Payment (placeholder)
    async createLightningPayment(amount, options = {}) {
        // TODO: Implement Lightning Network integration
        return {
            success: false,
            error: 'Lightning payments not yet implemented'
        };
    }

    // Bitcoin L1 Payment (placeholder)
    async createBitcoinPayment(amount, recipientAddress, options = {}) {
        // TODO: Implement Bitcoin L1 integration
        return {
            success: false,
            error: 'Bitcoin L1 payments not yet implemented'
        };
    }

    // Liquid Payment (placeholder)
    async createLiquidPayment(amount, recipientAddress, options = {}) {
        // TODO: Implement Liquid Network integration
        return {
            success: false,
            error: 'Liquid payments not yet implemented'
        };
    }

    // Generate payment QR code
    generatePaymentQR(paymentId, amount, method) {
        const paymentUrl = `${window.location.origin}/pay/${paymentId}`;
        return `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="white"/><text x="100" y="100" text-anchor="middle" font-size="12">QR: ${paymentId}</text></svg>`)}`;
    }

    // Get payment status
    async getPaymentStatus(paymentId) {
        try {
            const result = await api.request(`/payments/intents/${paymentId}/status`);
            return result;
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get payment method info
    getMethodInfo(method) {
        return this.supportedMethods[method] || null;
    }

    // Validate address for method
    isValidAddress(method, address) {
        switch (method) {
            case 1: // sBTC
                return this.sbtc.isValidAddress(address);
            case 2: // Lightning
                // TODO: Implement Lightning address validation
                return false;
            case 3: // Bitcoin L1
                // TODO: Implement Bitcoin address validation
                return /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/.test(address);
            case 4: // Liquid
                // TODO: Implement Liquid address validation
                return false;
            default:
                return false;
        }
    }

    // Format amount for display
    formatAmount(method, satoshis) {
        const methodConfig = this.supportedMethods[method];
        if (!methodConfig) return `${satoshis} sats`;

        switch (method) {
            case 1: // sBTC
                return this.sbtc.formatAmount(satoshis);
            default:
                return `${(satoshis / 100000000).toFixed(8)} BTC`;
        }
    }
}

export const paymentMethods = new PaymentMethods();