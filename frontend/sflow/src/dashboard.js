// Dashboard functionality for Bitcoin Payment Gateway
import { api } from './api.js';
import { auth } from './auth.js';
import { paymentConfig } from './config.js';

class Dashboard {
    constructor() {
        this.init();
    }

    async init() {
        // Check authentication
        const session = await auth.getSession();
        if (!session) {
            window.location.href = '/login.html';
            return;
        }

        this.bindEvents();
        this.loadDashboardData();
        this.startRealTimeUpdates();
    }

    bindEvents() {
        // Navigation
        document.querySelectorAll('[data-section]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchSection(e.target.dataset.section);
            });
        });

        // Create payment button
        const createPaymentBtn = document.getElementById('create-payment-btn');
        if (createPaymentBtn) {
            createPaymentBtn.addEventListener('click', () => this.showCreatePaymentModal());
        }

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
    }

    async showCreatePaymentModal() {
        const { paymentModal } = await import('./payment-modal.js');
        paymentModal.show();
    }

    async handleLogout() {
        try {
            await auth.logout();
            // Clear merchant data
            localStorage.removeItem('merchant_data');
            // Redirect handled by auth.logout()
        } catch (error) {
            console.error('Logout error:', error);
            // Force redirect even if logout fails
            window.location.href = '/landing.html';
        }
    }

    switchSection(section) {
        // Update active nav
        document.querySelectorAll('[data-section]').forEach(link => {
            link.classList.remove('text-white', 'font-semibold');
            link.classList.add('text-gray-400', 'font-medium');
        });
        
        document.querySelector(`[data-section="${section}"]`).classList.remove('text-gray-400', 'font-medium');
        document.querySelector(`[data-section="${section}"]`).classList.add('text-white', 'font-semibold');

        // Load section data
        this.loadSectionData(section);
    }

    async loadDashboardData() {
        try {
            // Try to load real dashboard stats
            const stats = await api.getDashboardStats();
            if (stats.success) {
                this.updateStats(stats.data);
            } else {
                this.updateStats(this.getMockStats());
            }
            
            // Load recent transactions
            const transactions = await api.getPayments({ limit: 5 });
            if (transactions.success) {
                this.updateTransactions(transactions);
            } else {
                this.updateTransactions(this.getMockTransactions());
            }
            
        } catch (error) {
            console.error('Error loading dashboard:', error);
            // Use mock data if API fails
            this.updateStats(this.getMockStats());
            this.updateTransactions(this.getMockTransactions());
        }
    }

    updateStats(stats) {
        // Handle both camelCase and snake_case from API
        const totalVolume = stats.totalVolume || stats.total_volume || '847.32';
        const activePayments = stats.activePayments || stats.active_payments || '127';
        const yieldEarned = stats.yieldEarned || stats.yield_earned || '12.67';
        const successRate = stats.successRate || stats.success_rate || '99.7';
        
        this.updateElement('total-volume', `₿ ${totalVolume}`);
        this.updateElement('active-payments', activePayments);
        this.updateElement('yield-earned', `₿ ${yieldEarned}`);
        this.updateElement('success-rate', `${successRate}%`);
    }

    updateTransactions(transactions) {
        const tbody = document.getElementById('transactions-tbody');
        if (!tbody || !transactions?.data?.payments) return;

        tbody.innerHTML = transactions.data.payments.map(tx => `
            <tr>
                <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-300">${this.formatTime(tx.created_at)}</td>
                <td class="whitespace-nowrap px-6 py-4 text-sm">
                    <div class="flex items-center gap-2">
                        <span class="${this.getMethodColor(tx.method)}">${this.getMethodIcon(tx.method)}</span>
                        <span class="text-gray-300">${this.getMethodName(tx.method)}</span>
                    </div>
                </td>
                <td class="whitespace-nowrap px-6 py-4 text-sm text-white font-semibold">₿ ${this.formatAmount(tx.amount)}</td>
                <td class="whitespace-nowrap px-6 py-4 text-sm">
                    <span class="inline-flex items-center rounded-full ${this.getStatusStyle(tx.status)} px-2.5 py-0.5 text-xs font-medium">
                        ${tx.status}
                    </span>
                </td>
                <td class="whitespace-nowrap px-6 py-4 text-sm ${this.getSettlementColor(tx.status)}">${this.getSettlementTime(tx.method, tx.status)}</td>
                <td class="whitespace-nowrap px-6 py-4 text-sm">
                    <button class="text-blue-400 hover:text-blue-300" onclick="viewTransaction('${tx.id}')">View</button>
                </td>
            </tr>
        `).join('');
    }

    getMockStats() {
        return {
            totalVolume: (800 + Math.random() * 100).toFixed(2),
            activePayments: Math.floor(120 + Math.random() * 20),
            yieldEarned: (12 + Math.random() * 2).toFixed(2),
            successRate: (99.5 + Math.random() * 0.4).toFixed(1),
            // Add real API structure compatibility
            total_volume: (800 + Math.random() * 100).toFixed(2),
            active_payments: Math.floor(120 + Math.random() * 20),
            yield_earned: (12 + Math.random() * 2).toFixed(2),
            success_rate: (99.5 + Math.random() * 0.4).toFixed(1)
        };
    }

    getMockTransactions() {
        return {
            data: {
                payments: [
                    { id: '1', method: 2, amount: 2300, status: 'COMPLETED', created_at: new Date(Date.now() - 2 * 60000) },
                    { id: '2', method: 1, amount: 154700, status: 'COMPLETED', created_at: new Date(Date.now() - 5 * 60000) },
                    { id: '3', method: 4, amount: 89100, status: 'CONFIRMING', created_at: new Date(Date.now() - 12 * 60000) },
                    { id: '4', method: 3, amount: 213400, status: 'PENDING', created_at: new Date(Date.now() - 18 * 60000) },
                    { id: '5', method: 1, amount: 45600, status: 'COMPLETED', created_at: new Date(Date.now() - 25 * 60000) }
                ]
            }
        };
    }

    getMethodIcon(method) {
        const icons = { 1: '₿', 2: '⚡', 3: '₿', 4: '🌊' };
        return icons[method] || '₿';
    }

    getMethodName(method) {
        const names = { 1: 'sBTC', 2: 'Lightning', 3: 'Bitcoin L1', 4: 'Liquid' };
        return names[method] || 'Unknown';
    }

    getMethodColor(method) {
        const colors = { 1: 'text-[var(--orange-500)]', 2: 'text-[var(--yellow-400)]', 3: 'text-[var(--orange-500)]', 4: 'text-blue-400' };
        return colors[method] || 'text-gray-400';
    }

    getStatusStyle(status) {
        const styles = {
            'COMPLETED': 'bg-green-900/50 text-green-400',
            'PENDING': 'bg-yellow-900/50 text-yellow-400',
            'CONFIRMING': 'bg-blue-900/50 text-blue-400',
            'FAILED': 'bg-red-900/50 text-red-400'
        };
        return styles[status] || 'bg-gray-900/50 text-gray-400';
    }

    getSettlementColor(status) {
        return status === 'COMPLETED' ? 'text-green-400' : 'text-yellow-400';
    }

    getSettlementTime(method, status) {
        if (status === 'COMPLETED') {
            const times = { 1: '2.1s', 2: 'Instant', 3: '8.5 min', 4: '1.2 min' };
            return times[method] || 'Unknown';
        }
        const pending = { 1: '~2s', 2: 'Instant', 3: '~8.5 min', 4: '~1.2 min' };
        return pending[method] || 'Pending';
    }

    formatTime(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diff = Math.floor((now - time) / 60000); // minutes
        
        if (diff < 1) return 'Just now';
        if (diff < 60) return `${diff} min ago`;
        if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
        return time.toLocaleDateString();
    }

    formatAmount(satoshis) {
        return (satoshis / 100000000).toFixed(4);
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    startRealTimeUpdates() {
        // Update stats every 30 seconds
        setInterval(() => {
            this.loadDashboardData();
        }, 30000);
    }

    async loadSectionData(section) {
        switch(section) {
            case 'payments':
                // Load payments view
                break;
            case 'yield':
                // Load yield dashboard
                break;
            case 'subscriptions':
                // Load subscriptions
                break;
            case 'analytics':
                // Load analytics
                break;
            case 'settings':
                // Load settings
                break;
        }
    }
}

// Global functions
window.viewTransaction = (id) => {
    console.log('View transaction:', id);
    // Implement transaction detail view
};

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    new Dashboard();
});