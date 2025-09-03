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
    async createPaymentIntent(method, amount, recipientAddress, options = {}) {
        const methodConfig = this.supportedMethods[method];
        if (!methodConfig) {
            throw new Error(`Unsupported payment method: ${method}`);
        }

        switch (method) {
            case 1: // sBTC
                return await this.createSBTCPayment(amount, recipientAddress, options);
            case 2: // Lightning
                return await this.createLightningPayment(amount, options);
            case 3: // Bitcoin L1
                return await this.createBitcoinPayment(amount, recipientAddress, options);
            case 4: // Liquid
                return await this.createLiquidPayment(amount, recipientAddress, options);
            default:
                throw new Error(`Method ${method} not implemented`);
        }
    }

    // sBTC Payment Implementation
    async createSBTCPayment(amount, recipientAddress, options = {}) {
        try {
            // Create payment intent via API
            const apiResponse = await api.createPaymentIntent({
                method: 1,
                amount: amount,
                recipient: recipientAddress,
                memo: options.memo || '',
                expires_in_blocks: options.expiresInBlocks || 144 // 24 hours
            });

            if (!apiResponse.success) {
                throw new Error(apiResponse.error.message);
            }

            // Create blockchain payment intent
            const blockchainIntent = await this.sbtc.createPaymentIntent(
                amount,
                recipientAddress,
                options.memo
            );

            return {
                success: true,
                paymentId: apiResponse.data.payment_id,
                method: 1,
                amount: amount,
                recipient: recipientAddress,
                qrCode: this.sbtc.generatePaymentQR(amount, recipientAddress, options.memo),
                blockchainTx: blockchainIntent.txOptions,
                estimatedFee: blockchainIntent.estimatedFee,
                confirmationTime: blockchainIntent.confirmationTime,
                expiresAt: new Date(Date.now() + (options.expiresInBlocks || 144) * 10 * 60 * 1000)
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Execute sBTC payment
    async executeSBTCPayment(paymentIntent) {
        return new Promise((resolve) => {
            this.sbtc.executePayment(
                paymentIntent,
                (result) => {
                    if (result.success) {
                        // Update payment status via API
                        this.updatePaymentStatus(paymentIntent.paymentId, 'COMPLETED', result.txId);
                    }
                    resolve(result);
                },
                () => {
                    resolve({ success: false, error: 'Payment cancelled by user' });
                }
            );
        });
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

    // Update payment status
    async updatePaymentStatus(paymentId, status, txId = null) {
        try {
            await api.request(`/payments/${paymentId}/status`, {
                method: 'PUT',
                body: JSON.stringify({
                    status: status,
                    transaction_id: txId
                })
            });
        } catch (error) {
            console.error('Failed to update payment status:', error);
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