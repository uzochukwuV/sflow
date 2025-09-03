import { createClient } from '@supabase/supabase-js';
import { supabaseConfig } from './config.js';
import {  disconnect } from '@stacks/connect';


// Initialize Supabase client
const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey);

export class AuthService {
    constructor() {
        this.supabase = supabase;
    }

    async signup(email, password, username, phone) {
        try {
            const { data, error } = await this.supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        display_name: username,
                        phone_number: phone
                    }
                }
            });

            if (error) {
                return { success: false, message: error.message };
            }

            return { 
                success: true, 
                user: data.user,
                message: 'Check your email for verification link (expires in 1 hour)'
            };
        } catch (error) {
            return { success: false, message: 'Network error. Please try again.' };
        }
    }

    async resendVerification(email) {
        try {
            const { error } = await this.supabase.auth.resend({
                type: 'signup',
                email: email
            });

            if (error) {
                return { success: false, message: error.message };
            }

            return { 
                success: true, 
                message: 'New verification email sent! Check your inbox.'
            };
        } catch (error) {
            return { success: false, message: 'Failed to resend email. Please try again.' };
        }
    }

    async login(email, password) {
        try {
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                return { success: false, message: error.message };
            }

            return { 
                success: true, 
                user: data.user,
                session: data.session
            };
        } catch (error) {
            return { success: false, message: 'Network error. Please try again.' };
        }
    }

    async logout() {
        const { error } = await this.supabase.auth.signOut();
        
        disconnect();
    
        if (!error) {
            window.location.href = '/landing.html';
        }
        return !error;
    }

    async getCurrentUser() {
        const { data: { user } } = await this.supabase.auth.getUser();
        return user;
    }

    async getSession() {
        const { data: { session } } = await this.supabase.auth.getSession();
        return session;
    }

    isAuthenticated() {
        return this.getSession().then(session => !!session);
    }

    onAuthStateChange(callback) {
        return this.supabase.auth.onAuthStateChange(callback);
    }
}

export const auth = new AuthService();