// Main application entry point
import { auth } from './auth.js';
import { api } from './api.js';
import { paymentConfig } from './config.js';
import { authenticate, showConnect, getUserSession, disconnect } from '@stacks/connect';


class SFlowApp {
    constructor() {
        this.auth = auth;
        this.api = api;
        this.config = paymentConfig;
        this.init();
    }

    async init() {
        // Handle auth callback first (both success and error cases)
        if (window.location.hash.includes('access_token') || window.location.hash.includes('error=')) {
            // Import and handle callback
            const { default: AuthCallback } = await import('./auth-callback.js');
            return; // Let callback handler take over
        }

        // Check authentication state
        const session = await this.auth.getSession();
        
        if (session) {
            // Redirect to dashboard if on auth pages
            if (window.location.pathname.includes('signup') || 
                window.location.pathname.includes('login') ||
                window.location.pathname === '/' ||
                window.location.pathname.includes('landing')) {
                window.location.href = '/dashboard.html';
            }
        } else {
            // Redirect to landing if on protected pages
            if (window.location.pathname.includes('dashboard')) {
                window.location.href = '/landing.html';
            }
        }

        this.bindEvents();
        this.setupAuthListener();
    }

    setupAuthListener() {
        this.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN') {
                window.location.href = '/dashboard.html';
            } else if (event === 'SIGNED_OUT') {
                window.location.href = '/landing.html';
            }
        });
    }

    bindEvents() {
        // Navigation events
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-navigate]')) {
                e.preventDefault();
                const page = e.target.dataset.navigate;
                this.navigate(page);
            }
        });

        // Form submissions
        document.addEventListener('submit', (e) => {
            
            if (e.target.id === 'signup-form') {
                e.preventDefault();
                this.handleSignup(e.target);
            }
            if (e.target.id === 'login-form') {
                e.preventDefault();
                this.handleLogin(e.target);
            }
        });
    }

    navigate(page) {
        const routes = {
            'landing': '/landing.html',
            'signup': '/signup.html',
            'login': '/login.html',
            'dashboard': '/dashboard.html'
        };
        
        if (routes[page]) {
            window.location.href = routes[page];
        }
    }

    async handleSignup(form) {
        const formData = new FormData(form);
        const username = formData.get('username');
        const email = formData.get('email');
        const phone = formData.get('phone');
        const password = formData.get('password');

        try {
            this.showLoading(form);
            
            // Step 1: Create Supabase account
            
            
           
                // Step 2: Connect wallet before merchant registration
                const walletAddress = await this.connectWallet();
                const result = await this.auth.signup(email, password, username, phone);
                
                // Step 3: Register merchant with wallet address
                await this.registerMerchant(result.user, walletAddress);
                
                this.showSuccess('Account created successfully! Check your email for verification.');
                setTimeout(() => {
                    window.location.href = '/login.html';
                }, 2000);
           
        } catch (error) {
            if (error.message.includes('User rejected') || error.message.includes('cancelled')) {
                this.showError('Wallet connection required to complete merchant registration');
            } else {
                this.showError(error.message);
            }
        } finally {
            this.hideLoading(form);
        }
    }


    

    async connectWallet() {
        let result = null;
        await authenticate({
            appDetails: {
                name: 'sPay',
                icon: window.location.origin + '/vite.svg'
            },
           
            onFinish: (data) => {

                console.log('Authentication finished:', data);
            }
        });
       
        console.log('Authentication data:', result);
        return  result?.profile?.stxAddress?.testnet;
    }


    async registerMerchant(user, walletAddress) {
        try {
            // Register merchant with actual wallet address
            const merchantData = {
                fee_destination: walletAddress,
                yield_enabled: true,
                yield_percentage: 500, // 5% in basis points
                multi_sig_enabled: false,
                required_signatures: 1,
                user_id: user.id,
                email: user.email
            };

            const result = await api.registerMerchant(merchantData);
            
            if (result.success) {
                // Store merchant info with wallet address
                const merchantInfo = {
                    ...result.data,
                    wallet_address: walletAddress
                };
                localStorage.setItem('merchant_data', JSON.stringify(merchantInfo));
            }
        } catch (error) {
            console.error('Merchant registration failed:', error);
            throw error; // Fail signup if merchant registration fails
        }
    }

    async handleLogin(form) {
        const formData = new FormData(form);
        const email = formData.get('email');
        const password = formData.get('password');

        try {
            this.showLoading(form);
            const result = await this.auth.login(email, password);
            await this.connectWallet();
            
            if (result.success) {
                this.showSuccess('Login successful! Redirecting...');
                setTimeout(() => {
                    window.location.href = '/dashboard.html';
                }, 1500);
            } else {
                this.showError(result.message);
            }
        } catch (error) {
            this.showError(error.message);
        } finally {
            this.hideLoading(form);
        }
    }

    showLoading(form) {
        const button = form.querySelector('button[type="submit"]');
        button.disabled = true;
        button.textContent = 'Loading...';
    }

    hideLoading(form) {
        const button = form.querySelector('button[type="submit"]');
        button.disabled = false;
        button.textContent = button.dataset.originalText || 'Submit';
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
            type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.sflowApp = new SFlowApp();
});