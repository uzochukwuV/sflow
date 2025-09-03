// Merchant Status Checker with Debugging
import { api } from './api.js';
import { auth } from './auth.js';

class MerchantStatusChecker {
    constructor() {
        this.debugMode = true;
        this.checkInterval = null;
        this.log('MerchantStatusChecker initialized');
    }

    log(message, data = null) {
        if (this.debugMode) {
            console.log(`[MerchantStatus] ${message}`, data || '');
        }
    }

    error(message, error = null) {
        console.error(`[MerchantStatus ERROR] ${message}`, error || '');
    }

    async checkFullStatus() {
        this.log('Starting full status check...');
        
        const status = {
            timestamp: new Date().toISOString(),
            auth: {
                isAuthenticated: false,
                user: null,
                session: null
            },
            merchant: {
                isRegistered: false,
                profile: null,
                error: null
            },
            api: {
                isReachable: false,
                error: null
            }
        };

        try {
            // Step 1: Check API reachability
            this.log('Step 1: Checking API reachability...');
            try {
                const healthResponse = await fetch('/api/v1/health');
                const healthData = await healthResponse.json();
                status.api.isReachable = healthResponse.ok;
                this.log('API health check:', healthData);
            } catch (error) {
                status.api.error = error.message;
                this.error('API health check failed', error);
            }

            // Step 2: Check authentication
            this.log('Step 2: Checking authentication...');
            try {
                const session = await auth.getSession();
                const user = await auth.getCurrentUser();
                
                status.auth.session = session;
                status.auth.user = user;
                status.auth.isAuthenticated = !!(session && user);
                
                this.log('Auth status:', {
                    hasSession: !!session,
                    hasUser: !!user,
                    isAuthenticated: status.auth.isAuthenticated
                });
            } catch (error) {
                this.error('Auth check failed', error);
            }

            // Step 3: Check merchant registration (only if authenticated)
            if (status.auth.isAuthenticated) {
                this.log('Step 3: Checking merchant registration...');
                try {
                    const merchantProfile = await api.getMerchantProfile();
                    status.merchant.isRegistered = merchantProfile.success;
                    status.merchant.profile = merchantProfile.data;
                    
                    this.log('Merchant check result:', {
                        isRegistered: status.merchant.isRegistered,
                        profile: status.merchant.profile
                    });
                } catch (error) {
                    status.merchant.error = error.message;
                    this.log('Merchant not registered (expected for new merchants)', error.message);
                }
            } else {
                this.log('Skipping merchant check - not authenticated');
            }

            this.log('Full status check completed:', status);
            return status;

        } catch (error) {
            this.error('Full status check failed', error);
            return {
                ...status,
                error: error.message
            };
        }
    }

    async quickMerchantCheck() {
        this.log('Quick merchant registration check...');
        
        try {
            const isRegistered = await api.isMerchantRegistered();
            this.log('Quick check result:', { isRegistered });
            return isRegistered;
        } catch (error) {
            this.error('Quick merchant check failed', error);
            return false;
        }
    }

    startPeriodicCheck(intervalMs = 30000) {
        this.log(`Starting periodic status check every ${intervalMs}ms`);
        
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }

        this.checkInterval = setInterval(async () => {
            try {
                const status = await this.checkFullStatus();
                this.updateStatusDisplay(status);
            } catch (error) {
                this.error('Periodic check failed', error);
            }
        }, intervalMs);

        // Run initial check
        this.checkFullStatus().then(status => {
            this.updateStatusDisplay(status);
        });
    }

    stopPeriodicCheck() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
            this.log('Periodic check stopped');
        }
    }

    updateStatusDisplay(status) {
        this.log('Updating status display...', status);

        // Update debug panel if it exists
        const debugAuth = document.getElementById('debug-auth');
        const debugMerchant = document.getElementById('debug-merchant');
        const debugStatus = document.getElementById('debug-status');
        const debugApi = document.getElementById('debug-api');

        if (debugAuth) {
            debugAuth.textContent = status.auth.isAuthenticated ? 'Authenticated' : 'Not authenticated';
            debugAuth.className = status.auth.isAuthenticated ? 'text-green-400' : 'text-red-400';
        }

        if (debugMerchant) {
            if (status.auth.isAuthenticated) {
                debugMerchant.textContent = status.merchant.isRegistered ? 'Registered' : 'Not registered';
                debugMerchant.className = status.merchant.isRegistered ? 'text-green-400' : 'text-yellow-400';
            } else {
                debugMerchant.textContent = 'Unknown (not authenticated)';
                debugMerchant.className = 'text-zinc-400';
            }
        }

        if (debugStatus) {
            if (!status.api.isReachable) {
                debugStatus.textContent = 'API Unreachable';
                debugStatus.className = 'text-red-400';
            } else if (!status.auth.isAuthenticated) {
                debugStatus.textContent = 'Authentication Required';
                debugStatus.className = 'text-yellow-400';
            } else if (!status.merchant.isRegistered) {
                debugStatus.textContent = 'Registration Required';
                debugStatus.className = 'text-yellow-400';
            } else {
                debugStatus.textContent = 'Ready';
                debugStatus.className = 'text-green-400';
            }
        }

        if (debugApi) {
            debugApi.textContent = status.api.isReachable ? 'Connected' : 'Disconnected';
            debugApi.className = status.api.isReachable ? 'text-green-400' : 'text-red-400';
        }

        // Update merchant registration form if it exists
        this.updateRegistrationForm(status);

        // Emit custom event for other components
        window.dispatchEvent(new CustomEvent('merchantStatusUpdate', {
            detail: status
        }));
    }

    updateRegistrationForm(status) {
        const form = document.getElementById('merchant-registration-form');
        const statusDiv = document.getElementById('registration-status');
        
        if (!form || !statusDiv) return;

        if (status.merchant.isRegistered && status.merchant.profile) {
            // Show registration success
            statusDiv.className = 'mt-6 p-4 rounded-lg border border-green-500 bg-green-500/10';
            statusDiv.innerHTML = `
                <div class="flex items-center space-x-2">
                    <svg class="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                    </svg>
                    <span class="text-green-400 font-medium">Merchant Already Registered</span>
                </div>
                <div class="mt-2 text-sm text-green-300">
                    <p>Merchant ID: ${status.merchant.profile.merchant}</p>
                    <p>Registered: ${new Date(status.merchant.profile.created_at).toLocaleDateString()}</p>
                </div>
                <div class="mt-3">
                    <a href="/dashboard.html" class="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                        Go to Dashboard →
                    </a>
                </div>
            `;
            statusDiv.classList.remove('hidden');
            
            // Disable form
            const inputs = form.querySelectorAll('input, button');
            inputs.forEach(input => input.disabled = true);
            
        } else if (!status.auth.isAuthenticated) {
            // Show authentication required
            statusDiv.className = 'mt-6 p-4 rounded-lg border border-yellow-500 bg-yellow-500/10';
            statusDiv.innerHTML = `
                <div class="flex items-center space-x-2">
                    <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                    </svg>
                    <span class="text-yellow-400 font-medium">Authentication Required</span>
                </div>
                <div class="mt-2 text-sm text-yellow-300">
                    <p>Please log in to register as a merchant.</p>
                </div>
                <div class="mt-3">
                    <a href="/login.html" class="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">
                        Login →
                    </a>
                </div>
            `;
            statusDiv.classList.remove('hidden');
            
            // Disable form
            const inputs = form.querySelectorAll('input, button');
            inputs.forEach(input => input.disabled = true);
        } else {
            // Ready for registration
            statusDiv.classList.add('hidden');
            
            // Enable form
            const inputs = form.querySelectorAll('input, button');
            inputs.forEach(input => input.disabled = false);
        }
    }

    // Test all API endpoints
    async testApiEndpoints() {
        this.log('Testing API endpoints...');
        
        const endpoints = [
            { name: 'Health Check', method: 'GET', url: '/api/v1/health' },
            { name: 'Merchant Profile', method: 'GET', url: '/api/v1/merchants/me' },
            { name: 'Merchant Stats', method: 'GET', url: '/api/v1/merchants/stats' }
        ];

        const results = [];

        for (const endpoint of endpoints) {
            try {
                this.log(`Testing ${endpoint.name}...`);
                
                const response = await fetch(endpoint.url, {
                    method: endpoint.method,
                    headers: {
                        'Authorization': 'Bearer sk_test_1234567890abcdef',
                        'Content-Type': 'application/json'
                    }
                });

                const data = await response.json();
                
                results.push({
                    ...endpoint,
                    status: response.status,
                    success: response.ok,
                    data: data,
                    error: response.ok ? null : data.error?.message
                });

                this.log(`${endpoint.name} result:`, {
                    status: response.status,
                    success: response.ok
                });

            } catch (error) {
                results.push({
                    ...endpoint,
                    status: 0,
                    success: false,
                    data: null,
                    error: error.message
                });

                this.error(`${endpoint.name} failed:`, error);
            }
        }

        this.log('API endpoint test results:', results);
        return results;
    }
}

// Export singleton instance
export const merchantStatus = new MerchantStatusChecker();

// Auto-start periodic checking when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    merchantStatus.log('DOM loaded, starting status monitoring...');
    merchantStatus.startPeriodicCheck(10000); // Check every 10 seconds
});