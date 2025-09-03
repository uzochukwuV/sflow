// Clarinet Console Integration
export class ClarinetIntegration {
    constructor() {
        this.apiUrl = 'http://localhost:20443';
        this.contractAddress = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
        this.contractName = 'bitcoin-payment-gateway';
        
        // Clarinet console wallets
        this.wallets = {
            deployer: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
            wallet_1: 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5',
            wallet_2: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG',
            wallet_3: 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC'
        };
    }

    // Register merchant on Clarinet console
    async registerMerchant(merchantAddress, yieldEnabled = true, yieldPercentage = 500) {
        const functionCall = {
            contractAddress: this.contractAddress,
            contractName: this.contractName,
            functionName: 'register-merchant',
            functionArgs: [
                `'${merchantAddress}`, // fee-destination
                yieldEnabled.toString(), // yield-enabled
                `u${yieldPercentage}`, // yield-percentage (basis points)
                'false', // multi-sig-enabled
                'u1' // required-signatures
            ],
            sender: merchantAddress
        };

        return await this.callContractFunction(functionCall);
    }

    // Create payment intent on Clarinet console
    async createPaymentIntent(paymentId, merchant, amount, method = 1, expiresInBlocks = 144) {
        const paymentIdHex = this.stringToHex(paymentId);
        const sbtcToken = 'ST000000000000000000002AMW42H.sbtc-token'; // Mock sBTC token
        
        const functionCall = {
            contractAddress: this.contractAddress,
            contractName: this.contractName,
            functionName: 'create-payment-intent',
            functionArgs: [
                `0x${paymentIdHex}`, // payment-id
                `'${merchant}`, // merchant
                `u${amount}`, // amount
                `'${sbtcToken}`, // currency (sBTC token)
                `u${method}`, // method (1=sBTC)
                `u${expiresInBlocks}` // expires-in-blocks
            ],
            sender: merchant
        };

        return await this.callContractFunction(functionCall);
    }

    // Process payment on Clarinet console
    async processPayment(paymentId, sender) {
        const paymentIdHex = this.stringToHex(paymentId);
        
        const functionCall = {
            contractAddress: this.contractAddress,
            contractName: this.contractName,
            functionName: 'process-payment',
            functionArgs: [
                `0x${paymentIdHex}` // payment-id
            ],
            sender: sender
        };

        return await this.callContractFunction(functionCall);
    }

    // Get payment status from Clarinet console
    async getPaymentStatus(paymentId) {
        const paymentIdHex = this.stringToHex(paymentId);
        
        const functionCall = {
            contractAddress: this.contractAddress,
            contractName: this.contractName,
            functionName: 'get-payment-status',
            functionArgs: [
                `0x${paymentIdHex}` // payment-id
            ],
            readOnly: true
        };

        return await this.callContractFunction(functionCall);
    }

    // Call contract function via Clarinet API
    async callContractFunction(functionCall) {
        try {
            const endpoint = functionCall.readOnly ? 'call-read' : 'call';
            const url = `${this.apiUrl}/v2/contracts/${endpoint}/${functionCall.contractAddress}/${functionCall.contractName}/${functionCall.functionName}`;
            
            const body = {
                sender: functionCall.sender || this.wallets.deployer,
                arguments: functionCall.functionArgs
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body)
            });

            const result = await response.json();
            
            return {
                success: response.ok,
                result: result.result || result,
                error: result.error
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Helper: Convert string to hex
    stringToHex(str) {
        return Buffer.from(str.substring(0, 16).padEnd(16, '0')).toString('hex');
    }

    // Helper: Get random wallet for testing
    getRandomWallet() {
        const walletKeys = Object.keys(this.wallets);
        const randomKey = walletKeys[Math.floor(Math.random() * walletKeys.length)];
        return this.wallets[randomKey];
    }

    // Test connection to Clarinet console
    async testConnection() {
        try {
            const response = await fetch(`${this.apiUrl}/v2/info`);
            const info = await response.json();
            return {
                success: true,
                network: info.network_id,
                stacks_tip_height: info.stacks_tip_height
            };
        } catch (error) {
            return {
                success: false,
                error: 'Cannot connect to Clarinet console. Make sure it\'s running on port 20443'
            };
        }
    }
}

export const clarinet = new ClarinetIntegration();