// sBTC Payment Integration
import { StacksMainnet, StacksTestnet } from '@stacks/network';
import { 
    makeContractCall,
    broadcastTransaction,
    AnchorMode,
    PostConditionMode,
    createAssetInfo,
    makeStandardSTXPostCondition,
    FungibleConditionCode
} from '@stacks/transactions';
import { openContractCall } from '@stacks/connect';

export class SBTCPayment {
    constructor(network = 'testnet') {
        this.network = network === 'mainnet' ? new StacksMainnet() : new StacksTestnet();
        this.contractAddress = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'; // Replace with actual sBTC contract
        this.contractName = 'sbtc-token';
    }

    // Create sBTC payment intent
    async createPaymentIntent(amount, recipientAddress, memo = '') {
        try {
            const txOptions = {
                contractAddress: this.contractAddress,
                contractName: this.contractName,
                functionName: 'transfer',
                functionArgs: [
                    uintCV(amount), // Amount in satoshis
                    standardPrincipalCV(recipientAddress),
                    someCV(bufferCV(Buffer.from(memo, 'utf8')))
                ],
                senderKey: '', // Will be provided by wallet
                network: this.network,
                anchorMode: AnchorMode.Any,
                postConditionMode: PostConditionMode.Allow,
            };

            return {
                success: true,
                txOptions,
                estimatedFee: 1000, // sats
                confirmationTime: '~2 seconds'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Execute sBTC payment using Stacks Connect
    async executePayment(paymentIntent, onFinish, onCancel) {
        try {
            await openContractCall({
                ...paymentIntent.txOptions,
                onFinish: (data) => {
                    console.log('sBTC payment completed:', data);
                    onFinish({
                        success: true,
                        txId: data.txId,
                        method: 'sbtc'
                    });
                },
                onCancel: () => {
                    console.log('sBTC payment cancelled');
                    onCancel();
                }
            });
        } catch (error) {
            console.error('sBTC payment error:', error);
            onFinish({
                success: false,
                error: error.message
            });
        }
    }

    // Check sBTC balance
    async getBalance(address) {
        try {
            // Call contract to get balance
            const response = await fetch(`${this.network.coreApiUrl}/v2/contracts/call-read/${this.contractAddress}/${this.contractName}/get-balance`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sender: address,
                    arguments: [`"${address}"`]
                })
            });

            const data = await response.json();
            return {
                success: true,
                balance: parseInt(data.result.replace('u', '')) // Remove 'u' prefix and convert to number
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                balance: 0
            };
        }
    }

    // Generate sBTC payment QR code data
    generatePaymentQR(amount, address, memo = '') {
        const paymentData = {
            method: 'sbtc',
            amount: amount,
            address: address,
            memo: memo,
            network: this.network.version === 1 ? 'mainnet' : 'testnet'
        };

        return {
            data: JSON.stringify(paymentData),
            displayText: `sBTC Payment: ${amount} sats to ${address.substring(0, 8)}...`
        };
    }

    // Validate sBTC address
    isValidAddress(address) {
        // Basic Stacks address validation
        return /^S[0-9A-Z]{39}$/.test(address) || /^ST[0-9A-Z]{38}$/.test(address);
    }

    // Convert satoshis to sBTC display format
    formatAmount(satoshis) {
        return (satoshis / 100000000).toFixed(8) + ' sBTC';
    }
}

// Helper functions for Clarity values
function uintCV(value) {
    return { type: 'uint', value: BigInt(value) };
}

function standardPrincipalCV(address) {
    return { type: 'principal', value: address };
}

function someCV(value) {
    return { type: 'optional', value: value };
}

function bufferCV(buffer) {
    return { type: 'buffer', value: buffer };
}