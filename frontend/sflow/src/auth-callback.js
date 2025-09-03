// Handle Supabase auth callback
import { auth } from './auth.js';

class AuthCallback {
    constructor() {
        this.handleCallback();
    }

    async handleCallback() {
        // Check if we have auth tokens or errors in URL hash
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const error = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');

        // Handle errors first
        if (error) {
            console.error('Auth callback error:', error, errorDescription);
            
            let errorMessage = 'Authentication failed.';
            if (error === 'access_denied' && errorDescription?.includes('expired')) {
                errorMessage = 'Email verification link has expired. Please request a new one.';
            } else if (error === 'access_denied') {
                errorMessage = 'Email verification was denied or cancelled.';
            }
            
            this.showError(errorMessage);
            setTimeout(() => {
                window.location.href = '/signup.html';
            }, 3000);
            return;
        }

        // Handle successful tokens
        if (accessToken) {
            try {
                // Set the session with the tokens
                const { data, error } = await auth.supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken
                });

                if (error) {
                    console.error('Auth callback error:', error);
                    this.showError('Authentication failed. Please try again.');
                    setTimeout(() => window.location.href = '/login.html', 2000);
                    return;
                }

                // Clear the hash from URL
                window.history.replaceState({}, document.title, window.location.pathname);

                // Show success and redirect
                this.showSuccess('Email verified successfully! Redirecting to dashboard...');
                setTimeout(() => {
                    window.location.href = '/dashboard.html';
                }, 1500);

            } catch (error) {
                console.error('Session setup error:', error);
                this.showError('Authentication failed. Please try again.');
                setTimeout(() => window.location.href = '/login.html', 2000);
            }
        } else {
            // No tokens and no error - redirect to signup
            window.location.href = '/signup.html';
        }
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
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

// Initialize callback handler
document.addEventListener('DOMContentLoaded', () => {
    new AuthCallback();
});