// Payment Creation Modal
import { paymentMethods } from './payment-methods.js';
import QRCode from 'qrcode';

export class PaymentModal {
    constructor() {
        this.isOpen = false;
        this.currentPayment = null;
        this.createModal();
    }

    createModal() {
        const modalHTML = `
            <div id="payment-modal" class="fixed inset-0 z-50 hidden bg-black/50 backdrop-blur-sm">
                <div class="flex items-center justify-center min-h-screen p-4">
                    <div class="bg-[#1a1a1a] rounded-xl border border-gray-700 w-full max-w-md">
                        <div class="p-6">
                            <div class="flex justify-between items-center mb-6">
                                <h3 class="text-xl font-bold text-white">Create Payment</h3>
                                <button id="close-modal" class="text-gray-400 hover:text-white">
                                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                    </svg>
                                </button>
                            </div>
                            
                            <form id="payment-form" class="space-y-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-300 mb-2">Payment Method</label>
                                    <select id="payment-method" class="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white">
                                        <option value="1">₿ sBTC</option>
                                        <option value="2" disabled>⚡ Lightning (Coming Soon)</option>
                                        <option value="3" disabled>₿ Bitcoin L1 (Coming Soon)</option>
                                        <option value="4" disabled>🌊 Liquid (Coming Soon)</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-300 mb-2">Amount (satoshis)</label>
                                    <input type="number" id="payment-amount" class="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white" placeholder="100000" min="1000">
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-300 mb-2">Recipient Address</label>
                                    <input type="text" id="recipient-address" class="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white" placeholder="ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM">
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-300 mb-2">Memo (Optional)</label>
                                    <input type="text" id="payment-memo" class="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white" placeholder="Payment description">
                                </div>
                                
                                <div class="flex gap-3 pt-4">
                                    <button type="button" id="cancel-payment" class="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors">
                                        Cancel
                                    </button>
                                    <button type="submit" class="flex-1 bg-orange-500 hover:bg-orange-600 text-black py-2 px-4 rounded-lg font-semibold transition-colors">
                                        Create Payment
                                    </button>
                                </div>
                            </form>
                            
                            <!-- Payment Result -->
                            <div id="payment-result" class="hidden">
                                <div class="text-center">
                                    <div class="mb-4">
                                        <canvas id="qr-canvas" class="mx-auto bg-white p-4 rounded-lg"></canvas>
                                    </div>
                                    <div class="space-y-2 text-sm">
                                        <p class="text-gray-300">Payment Amount:</p>
                                        <p class="text-white font-semibold" id="display-amount"></p>
                                        <p class="text-gray-300">Estimated Fee:</p>
                                        <p class="text-white" id="display-fee"></p>
                                        <p class="text-gray-300">Confirmation Time:</p>
                                        <p class="text-white" id="display-time"></p>
                                    </div>
                                    <div class="flex gap-3 mt-6">
                                        <button id="execute-payment" class="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-semibold transition-colors">
                                            Execute Payment
                                        </button>
                                        <button id="new-payment" class="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors">
                                            New Payment
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.bindEvents();
    }

    bindEvents() {
        const modal = document.getElementById('payment-modal');
        const closeBtn = document.getElementById('close-modal');
        const cancelBtn = document.getElementById('cancel-payment');
        const form = document.getElementById('payment-form');
        const executeBtn = document.getElementById('execute-payment');
        const newPaymentBtn = document.getElementById('new-payment');

        closeBtn.addEventListener('click', () => this.close());
        cancelBtn.addEventListener('click', () => this.close());
        form.addEventListener('submit', (e) => this.handleCreatePayment(e));
        executeBtn.addEventListener('click', () => this.executePayment());
        newPaymentBtn.addEventListener('click', () => this.resetForm());

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.close();
        });
    }

    show() {
        this.isOpen = true;
        document.getElementById('payment-modal').classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    close() {
        this.isOpen = false;
        document.getElementById('payment-modal').classList.add('hidden');
        document.body.style.overflow = '';
        this.resetForm();
    }

    resetForm() {
        document.getElementById('payment-form').classList.remove('hidden');
        document.getElementById('payment-result').classList.add('hidden');
        document.getElementById('payment-form').reset();
        this.currentPayment = null;
    }

    async handleCreatePayment(e) {
        e.preventDefault();
        
        const method = parseInt(document.getElementById('payment-method').value);
        const amount = parseInt(document.getElementById('payment-amount').value);
        const recipient = document.getElementById('recipient-address').value;
        const memo = document.getElementById('payment-memo').value;

        // Get merchant address from localStorage
        const merchantData = JSON.parse(localStorage.getItem('merchant_data') || '{}');
        const merchantAddress = merchantData.wallet_address;
        
        if (!merchantAddress) {
            this.showError('Merchant wallet not connected');
            return;
        }

        // Validate inputs
        if (!amount || amount < 1000) {
            this.showError('Amount must be at least 1000 satoshis');
            return;
        }

        try {
            this.showLoading();
            
            const paymentIntent = await paymentMethods.createPaymentIntent(
                merchantAddress,
                amount,
                'BTC',
                method,
                {
                    memo: memo,
                    expiresInBlocks: 144,
                    metadata: { recipient }
                }
            );

            if (!paymentIntent.success) {
                throw new Error(paymentIntent.error);
            }

            this.currentPayment = paymentIntent;
            await this.showPaymentResult(paymentIntent);
            
        } catch (error) {
            this.showError(error.message);
        } finally {
            this.hideLoading();
        }
    }

    async showPaymentResult(payment) {
        // Generate QR code
        const canvas = document.getElementById('qr-canvas');
        await QRCode.toCanvas(canvas, payment.qrCode.data, {
            width: 200,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });

        // Update display
        document.getElementById('display-amount').textContent = `${(payment.amount / 100000000).toFixed(8)} BTC`;
        document.getElementById('display-fee').textContent = '~250 sats';
        document.getElementById('display-time').textContent = '~2 seconds';

        // Show result view
        document.getElementById('payment-form').classList.add('hidden');
        document.getElementById('payment-result').classList.remove('hidden');
    }

    async executePayment() {
        if (!this.currentPayment) return;

        try {
            this.showLoading();
            
            // Process payment through API
            const result = await paymentMethods.processPayment(this.currentPayment.paymentId);
            
            if (result.success) {
                // Complete payment
                const completeResult = await paymentMethods.completePayment(this.currentPayment.paymentId);
                
                if (completeResult.success) {
                    this.showSuccess('Payment completed successfully!');
                    setTimeout(() => {
                        this.close();
                        // Refresh dashboard
                        window.location.reload();
                    }, 2000);
                } else {
                    this.showError(completeResult.error);
                }
            } else {
                this.showError(result.error);
            }
            
        } catch (error) {
            this.showError(error.message);
        } finally {
            this.hideLoading();
        }
    }

    showLoading() {
        // Add loading state to buttons
        const buttons = document.querySelectorAll('#payment-modal button');
        buttons.forEach(btn => {
            btn.disabled = true;
            if (btn.type === 'submit' || btn.id === 'execute-payment') {
                btn.textContent = 'Processing...';
            }
        });
    }

    hideLoading() {
        const buttons = document.querySelectorAll('#payment-modal button');
        buttons.forEach(btn => {
            btn.disabled = false;
        });
        
        const submitBtn = document.querySelector('#payment-modal button[type="submit"]');
        if (submitBtn) submitBtn.textContent = 'Create Payment';
        
        const executeBtn = document.getElementById('execute-payment');
        if (executeBtn) executeBtn.textContent = 'Execute Payment';
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
            type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

export const paymentModal = new PaymentModal();