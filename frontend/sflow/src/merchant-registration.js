// Merchant Registration with Comprehensive Debugging
import { api } from './api.js';
import { auth } from './auth.js';

class MerchantRegistration {
    constructor() {
        this.debugMode = true;
        this.initializeToast();
        this.log('MerchantRegistration initialized');
    }

    log(message, data = null) {
        if (this.debugMode) {
            console.log(`[MerchantRegistration] ${message}`, data || '');
        }
    }

    error(message, error = null) {
        console.error(`[MerchantRegistration ERROR] ${message}`, error || '');
        this.showToast(message, 'error');
    }

    success(message) {
        console.log(`[MerchantRegistration SUCCESS] ${message}`);
        this.showToast(message, 'success');
    }

    initializeToast() {
        // Create toast container if it doesn't exist
        if (!document.getElementById('toast-container')) {
            const container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'fixed top-4 right-4 z-50 space-y-2';
            document.body.appendChild(container);
        }
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        
        const colors = {
            success: 'bg-green-600',
            error: 'bg-red-600',
            warning: 'bg-yellow-600',
            info: 'bg-zinc-600'
        };

        toast.className = `${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 translate-x-full opacity-0`;
        toast.textContent = message;
        
        container.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.classList.remove('translate-x-full', 'opacity-0');
        }, 100);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            toast.classList.add('translate-x-full', 'opacity-0');
            setTimeout(() => container.removeChild(toast), 300);
        }, 5000);
    }

    async checkAuthStatus() {
        this.log('Checking authentication status...');
        
        try {
            const session = await auth.getSession();
            this.log('Session check result:', session);
            
            if (!session) {
                this.error('No active session found');
                return false;
            }
            
            const user = await auth.getCurrentUser();
            this.log('Current user:', user);
            
            if (!user) {
                this.error('No authenticated user found');
                return false;
            }
            
            this.success('Authentication verified');
            return true;
        } catch (error) {
            this.error('Authentication check failed', error);
            return false;
        }
    }

    async checkMerchantStatus() {
        this.log('Checking merchant registration status...');
        
        try {
            const response = await api.getMerchantProfile();
            this.log('Merchant profile response:', response);
            
            if (response.success) {
                this.success('Merchant already registered');
                return {
                    isRegistered: true,
                    merchant: response.data
                };
            } else {
                this.log('Merchant not registered yet');
                return {
                    isRegistered: false,
                    merchant: null
                };
            }
        } catch (error) {
            this.log('Merchant not registered (expected for new merchants)', error.message);
            return {
                isRegistered: false,
                merchant: null
            };
        }
    }

    validateRegistrationForm(formData) {
        this.log('Validating registration form...', formData);
        
        const errors = [];
        
        // Validate fee destination (should be a Stacks address)
        if (!formData.fee_destination) {
            errors.push('Fee destination is required');
        } else if (!this.isValidStacksAddress(formData.fee_destination)) {
            errors.push('Fee destination must be a valid Stacks address');
        }
        
        // Validate yield percentage
        if (formData.yield_enabled) {
            const yieldPercentage = parseInt(formData.yield_percentage);
            if (isNaN(yieldPercentage) || yieldPercentage < 0 || yieldPercentage > 10000) {
                errors.push('Yield percentage must be between 0 and 10000 (100%)');
            }
        }
        
        // Validate multi-sig settings
        if (formData.multi_sig_enabled) {
            const requiredSigs = parseInt(formData.required_signatures);
            if (isNaN(requiredSigs) || requiredSigs < 1 || requiredSigs > 5) {
                errors.push('Required signatures must be between 1 and 5');
            }
        }
        
        this.log('Validation result:', { errors, isValid: errors.length === 0 });
        
        if (errors.length > 0) {
            this.error(`Validation failed: ${errors.join(', ')}`);
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    isValidStacksAddress(address) {
        // Basic Stacks address validation
        const stacksAddressRegex = /^S[TPMNX][0-9A-Z]{38,40}$/;
        return stacksAddressRegex.test(address);
    }

    async registerMerchant(formData) {
        this.log('Starting merchant registration process...', formData);
        
        try {
            // Step 1: Check authentication
            this.log('Step 1: Checking authentication...');
            const isAuthenticated = await this.checkAuthStatus();
            if (!isAuthenticated) {
                throw new Error('Authentication required');
            }
            
            // Step 2: Validate form data
            this.log('Step 2: Validating form data...');
            const validation = this.validateRegistrationForm(formData);
            if (!validation.isValid) {
                throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
            }
            
            // Step 3: Check if already registered
            this.log('Step 3: Checking existing registration...');
            const merchantStatus = await this.checkMerchantStatus();
            if (merchantStatus.isRegistered) {
                this.success('Merchant already registered');
                return {
                    success: true,
                    merchant: merchantStatus.merchant,
                    message: 'Already registered'
                };
            }
            
            // Step 4: Prepare registration data
            this.log('Step 4: Preparing registration data...');
            const registrationData = {
                fee_destination: formData.fee_destination,
                yield_enabled: formData.yield_enabled || false,
                yield_percentage: formData.yield_enabled ? parseInt(formData.yield_percentage) : 0,
                multi_sig_enabled: formData.multi_sig_enabled || false,
                required_signatures: formData.multi_sig_enabled ? parseInt(formData.required_signatures) : 1
            };
            
            this.log('Registration data prepared:', registrationData);
            
            // Step 5: Call API
            this.log('Step 5: Calling registration API...');
            const response = await api.registerMerchant(registrationData);
            this.log('API response:', response);
            
            if (response.success) {
                // Step 6: Store merchant data locally
                this.log('Step 6: Storing merchant data locally...');
                localStorage.setItem('merchant_data', JSON.stringify(response.data));
                
                this.success('Merchant registration successful!');
                return {
                    success: true,
                    merchant: response.data,
                    message: 'Registration successful'
                };
            } else {
                throw new Error(response.error?.message || 'Registration failed');
            }
            
        } catch (error) {
            this.error('Merchant registration failed', error);
            return {
                success: false,
                error: error.message,
                message: 'Registration failed'
            };
        }
    }

    async initializeRegistrationForm() {
        this.log('Initializing registration form...');
        
        const form = document.getElementById('merchant-registration-form');
        if (!form) {
            this.error('Registration form not found');
            return;
        }
        
        // Add form submission handler
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            this.log('Form submitted');
            
            const submitButton = form.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            
            try {
                // Show loading state
                submitButton.textContent = 'Registering...';
                submitButton.disabled = true;
                
                // Collect form data
                const formData = new FormData(form);
                const data = {
                    fee_destination: formData.get('fee_destination'),
                    yield_enabled: formData.get('yield_enabled') === 'on',
                    yield_percentage: formData.get('yield_percentage') || '0',
                    multi_sig_enabled: formData.get('multi_sig_enabled') === 'on',
                    required_signatures: formData.get('required_signatures') || '1'
                };
                
                this.log('Form data collected:', data);
                
                // Register merchant
                const result = await this.registerMerchant(data);
                
                if (result.success) {
                    // Redirect to dashboard on success
                    setTimeout(() => {
                        window.location.href = '/dashboard.html';
                    }, 2000);
                }
                
            } catch (error) {
                this.error('Form submission error', error);
            } finally {
                // Reset button state
                submitButton.textContent = originalText;
                submitButton.disabled = false;
            }
        });
        
        // Add real-time validation
        this.addFormValidation(form);
        
        this.log('Registration form initialized successfully');
    }

    addFormValidation(form) {
        this.log('Adding form validation...');
        
        const feeDestinationInput = form.querySelector('input[name="fee_destination"]');
        if (feeDestinationInput) {
            feeDestinationInput.addEventListener('blur', (e) => {
                const value = e.target.value;
                if (value && !this.isValidStacksAddress(value)) {
                    this.showToast('Invalid Stacks address format', 'warning');
                    e.target.classList.add('border-red-600');
                } else {
                    e.target.classList.remove('border-red-600');
                }
            });
        }
        
        const yieldCheckbox = form.querySelector('input[name="yield_enabled"]');
        const yieldPercentageInput = form.querySelector('input[name="yield_percentage"]');
        
        if (yieldCheckbox && yieldPercentageInput) {
            yieldCheckbox.addEventListener('change', (e) => {
                yieldPercentageInput.disabled = !e.target.checked;
                if (!e.target.checked) {
                    yieldPercentageInput.value = '0';
                }
            });
        }
        
        const multiSigCheckbox = form.querySelector('input[name="multi_sig_enabled"]');
        const requiredSigsInput = form.querySelector('input[name="required_signatures"]');
        
        if (multiSigCheckbox && requiredSigsInput) {
            multiSigCheckbox.addEventListener('change', (e) => {
                requiredSigsInput.disabled = !e.target.checked;
                if (!e.target.checked) {
                    requiredSigsInput.value = '1';
                }
            });
        }
    }

    // Auto-populate form with default values
    populateDefaultValues() {
        this.log('Populating default values...');
        
        const form = document.getElementById('merchant-registration-form');
        if (!form) return;
        
        // Set default fee destination to current user's address (if available)
        const feeDestinationInput = form.querySelector('input[name="fee_destination"]');
        if (feeDestinationInput && !feeDestinationInput.value) {
            // You could set a default Stacks address here
            feeDestinationInput.placeholder = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
        }
        
        // Set default yield percentage
        const yieldPercentageInput = form.querySelector('input[name="yield_percentage"]');
        if (yieldPercentageInput && !yieldPercentageInput.value) {
            yieldPercentageInput.value = '500'; // 5%
        }
        
        // Set default required signatures
        const requiredSigsInput = form.querySelector('input[name="required_signatures"]');
        if (requiredSigsInput && !requiredSigsInput.value) {
            requiredSigsInput.value = '2';
        }
    }
}

// Export singleton instance
export const merchantRegistration = new MerchantRegistration();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    merchantRegistration.log('DOM loaded, initializing...');
    merchantRegistration.initializeRegistrationForm();
    merchantRegistration.populateDefaultValues();
});