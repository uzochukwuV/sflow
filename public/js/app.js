// SFlow Payment Gateway - Frontend Application
class SFlowApp {
    constructor() {
        this.apiKey = localStorage.getItem('sflow_api_key') || '';
        this.baseURL = '/api/v1';
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadDashboard();
        this.loadSettings();
    }

    bindEvents() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.showSection(e.target.dataset.section);
            });
        });

        // Payment form
        const createPaymentBtn = document.getElementById('create-payment-btn');
        if (createPaymentBtn) {
            createPaymentBtn.addEventListener('click', () => this.showModal('create-payment-modal'));
        }

        const createPaymentForm = document.getElementById('create-payment-form');
        if (createPaymentForm) {
            createPaymentForm.addEventListener('submit', (e) => this.handleCreatePayment(e));
        }

        // Merchant form
        const registerMerchantBtn = document.getElementById('register-merchant-btn');
        if (registerMerchantBtn) {
            registerMerchantBtn.addEventListener('click', () => this.showModal('register-merchant-modal'));
        }

        const registerMerchantForm = document.getElementById('register-merchant-form');
        if (registerMerchantForm) {
            registerMerchantForm.addEventListener('submit', (e) => this.handleRegisterMerchant(e));
        }

        // Settings
        const saveSettingsBtn = document.getElementById('save-settings');
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', () => this.saveSettings());
        }

        // Modal close buttons
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.hideModal(e.target.closest('.modal').id);
            });
        });

        // API key toggle
        const toggleApiKeyBtn = document.getElementById('toggle-api-key');
        if (toggleApiKeyBtn) {
            toggleApiKeyBtn.addEventListener('click', () => this.toggleApiKey());
        }
    }

    showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });

        // Show selected section
        document.getElementById(sectionId).classList.add('active');

        // Update nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionId}"]`).classList.add('active');

        // Load section-specific data
        this.loadSectionData(sectionId);
    }

    loadSectionData(sectionId) {
        switch(sectionId) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'payments':
                this.loadPayments();
                break;
            case 'merchants':
                this.loadMerchantInfo();
                break;
        }
    }

    async loadDashboard() {
        try {
            // Mock dashboard data
            document.getElementById('total-volume').textContent = '₿ 0.00';
            document.getElementById('active-payments').textContent = '0';
            document.getElementById('yield-earned').textContent = '₿ 0.00';
            document.getElementById('success-rate').textContent = '0%';
        } catch (error) {
            console.error('Error loading dashboard:', error);
        }
    }

    async loadPayments() {
        try {
            if (!this.apiKey) {
                this.showNotification('Please set your API key in settings', 'error');
                return;
            }

            const response = await this.apiCall('/payments');
            const paymentsData = await response.json();

            if (paymentsData.success) {
                this.renderPayments(paymentsData.data.payments);
            }
        } catch (error) {
            console.error('Error loading payments:', error);
            this.showNotification('Failed to load payments', 'error');
        }
    }

    renderPayments(payments) {
        const tbody = document.getElementById('payments-tbody');
        
        if (!payments || payments.length === 0) {
            tbody.innerHTML = '<tr class="no-data-row"><td colspan="6">No payments found</td></tr>';
            return;
        }

        tbody.innerHTML = payments.map(payment => `
            <tr>
                <td>${payment.id.substring(0, 8)}...</td>
                <td>${payment.amount}</td>
                <td>${this.getMethodName(payment.method)}</td>
                <td><span class="status-${payment.status}">${payment.status}</span></td>
                <td>${new Date(payment.created_at).toLocaleDateString()}</td>
                <td>
                    <button class="btn-secondary" onclick="app.viewPayment('${payment.id}')">View</button>
                </td>
            </tr>
        `).join('');
    }

    getMethodName(method) {
        const methods = {1: 'sBTC', 2: 'Lightning', 3: 'BTC L1', 4: 'Liquid'};
        return methods[method] || 'Unknown';
    }

    async handleCreatePayment(e) {
        e.preventDefault();
        this.showLoading();

        try {
            const formData = new FormData(e.target);
            const paymentData = {
                merchant: formData.get('merchant'),
                amount: parseInt(formData.get('amount')),
                currency: formData.get('currency'),
                method: parseInt(formData.get('method')),
                expires_in_blocks: parseInt(formData.get('expires'))
            };

            const response = await this.apiCall('/payments/intents', 'POST', paymentData);
            const result = await response.json();

            if (result.success) {
                this.showNotification('Payment intent created successfully', 'success');
                this.hideModal('create-payment-modal');
                e.target.reset();
                this.loadPayments();
            } else {
                throw new Error(result.error.message);
            }
        } catch (error) {
            this.showNotification(error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    async handleRegisterMerchant(e) {
        e.preventDefault();
        this.showLoading();

        try {
            const formData = new FormData(e.target);
            const merchantData = {
                fee_destination: formData.get('fee_destination'),
                yield_enabled: formData.get('yield_enabled') === 'on',
                yield_percentage: parseInt(formData.get('yield_percentage')) * 100, // Convert to basis points
                multi_sig_enabled: formData.get('multi_sig_enabled') === 'on',
                required_signatures: parseInt(formData.get('required_signatures'))
            };

            const response = await this.apiCall('/merchants/register', 'POST', merchantData);
            const result = await response.json();

            if (result.success) {
                this.showNotification('Merchant registered successfully', 'success');
                this.hideModal('register-merchant-modal');
                e.target.reset();
                this.loadMerchantInfo();
            } else {
                throw new Error(result.error.message);
            }
        } catch (error) {
            this.showNotification(error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    async loadMerchantInfo() {
        try {
            if (!this.apiKey) return;

            const response = await this.apiCall('/merchants/me');
            const result = await response.json();

            const statusCard = document.getElementById('merchant-status');
            
            if (result.success) {
                statusCard.innerHTML = `
                    <h4>✅ Registered Merchant</h4>
                    <p><strong>Merchant ID:</strong> ${result.data.merchant.substring(0, 20)}...</p>
                    <p><strong>Name:</strong> ${result.data.name}</p>
                    <p><strong>Registered:</strong> ${new Date(result.data.created_at).toLocaleDateString()}</p>
                `;
            } else {
                statusCard.innerHTML = `
                    <h4>❌ Not Registered</h4>
                    <p>Register as a merchant to start accepting payments</p>
                `;
            }
        } catch (error) {
            console.error('Error loading merchant info:', error);
        }
    }

    loadSettings() {
        const apiKeyInput = document.getElementById('api-key');
        if (apiKeyInput && this.apiKey) {
            apiKeyInput.value = this.apiKey;
        }
    }

    saveSettings() {
        const apiKey = document.getElementById('api-key').value;
        const webhookUrl = document.getElementById('webhook-url').value;
        const network = document.getElementById('network').value;
        const contractAddress = document.getElementById('contract-address').value;

        if (apiKey) {
            this.apiKey = apiKey;
            localStorage.setItem('sflow_api_key', apiKey);
        }

        if (webhookUrl) {
            localStorage.setItem('sflow_webhook_url', webhookUrl);
        }

        if (network) {
            localStorage.setItem('sflow_network', network);
        }

        if (contractAddress) {
            localStorage.setItem('sflow_contract_address', contractAddress);
        }

        this.showNotification('Settings saved successfully', 'success');
    }

    toggleApiKey() {
        const input = document.getElementById('api-key');
        const button = document.getElementById('toggle-api-key');
        
        if (input.type === 'password') {
            input.type = 'text';
            button.textContent = 'Hide';
        } else {
            input.type = 'password';
            button.textContent = 'Show';
        }
    }

    showModal(modalId) {
        document.getElementById(modalId).classList.add('active');
    }

    hideModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    }

    showLoading() {
        document.getElementById('loading-spinner').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loading-spinner').style.display = 'none';
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notification-container');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        container.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }

    async apiCall(endpoint, method = 'GET', data = null) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (this.apiKey) {
            options.headers.Authorization = `Bearer ${this.apiKey}`;
        }

        if (data) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(`${this.baseURL}${endpoint}`, options);
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'API call failed');
        }

        return response;
    }

    async viewPayment(paymentId) {
        try {
            const response = await this.apiCall(`/payments/intents/${paymentId}`);
            const result = await response.json();

            if (result.success) {
                alert(`Payment Details:\n${JSON.stringify(result.data, null, 2)}`);
            }
        } catch (error) {
            this.showNotification('Failed to load payment details', 'error');
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new SFlowApp();
});