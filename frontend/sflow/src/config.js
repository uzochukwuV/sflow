// Supabase configuration
export const supabaseConfig = {
    url: 'https://xahatngvruonxjcmeagi.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhaGF0bmd2cnVvbnhqY21lYWdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4Mjk2NTUsImV4cCI6MjA3MjQwNTY1NX0.f9OvEbQdAi0Fi5qylJCyWB_ynVGZwj0ltFjxyNbuntw'
};



// Bitcoin Payment Gateway Configuration
export const paymentConfig = {
    // Wave 2: Multi-Layer Bitcoin Support
    paymentMethods: {
        1: { name: 'sBTC', icon: '₿', color: 'orange' },
        2: { name: 'Lightning', icon: '⚡', color: 'yellow' },
        3: { name: 'Bitcoin L1', icon: '₿', color: 'orange' },
        4: { name: 'Liquid', icon: '🌊', color: 'blue' }
    },
    
    // Wave 1: Payment States
    paymentStates: {
        'PENDING': { color: 'yellow', label: 'Pending' },
        'CONFIRMED': { color: 'blue', label: 'Confirmed' },
        'COMPLETED': { color: 'green', label: 'Completed' },
        'FAILED': { color: 'red', label: 'Failed' },
        'EXPIRED': { color: 'gray', label: 'Expired' }
    },
    
    // Wave 3: Yield Generation
    yieldStrategies: {
        'STACKING': { name: 'STX Stacking', apy: '8-12%' },
        'DEFI': { name: 'DeFi Protocols', apy: '5-15%' },
        'LIQUIDITY': { name: 'Liquidity Mining', apy: '10-20%' }
    }
};