// Landing page dynamic data
export class LandingPageData {
    constructor() {
        this.init();
    }

    init() {
        this.updateLiveStats();
        // Update stats every 30 seconds
        setInterval(() => this.updateLiveStats(), 30000);
    }

    updateLiveStats() {
        // Simulate live data updates
        const stats = this.generateMockStats();
        
        this.updateElement('total-volume', `₿ ${stats.totalVolume}`);
        this.updateElement('active-merchants', stats.activeMerchants.toLocaleString());
        this.updateElement('success-rate', `${stats.successRate}%`);
        this.updateElement('yield-generated', `₿ ${stats.yieldGenerated}`);
    }

    generateMockStats() {
        // Generate realistic fluctuating data
        const baseVolume = 1200;
        const baseMerchants = 2800;
        const baseYield = 125;
        
        return {
            totalVolume: (baseVolume + Math.random() * 100).toFixed(2),
            activeMerchants: baseMerchants + Math.floor(Math.random() * 100),
            successRate: (99.5 + Math.random() * 0.4).toFixed(1),
            yieldGenerated: (baseYield + Math.random() * 10).toFixed(2)
        };
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
            // Add subtle animation
            element.style.transform = 'scale(1.05)';
            setTimeout(() => {
                element.style.transform = 'scale(1)';
            }, 200);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LandingPageData();
});