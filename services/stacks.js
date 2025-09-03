import { 
  makeContractCall,
  broadcastTransaction,
  fetchCallReadOnlyFunction as callReadOnlyFunction,
  AnchorMode,
  PostConditionMode,
  standardPrincipalCV,
  uintCV,
  bufferCV,
  boolCV,
  stringAsciiCV,
  randomPrivateKey
} from '@stacks/transactions';
import { STACKS_DEVNET, STACKS_TESTNET, STACKS_MAINNET, STACKS_MOCKNET } from '@stacks/network';


export class StacksService {
  constructor() {
    // Enable mock mode for testing when no valid private key is provided
   
    
    this.network = process.env.STACKS_NETWORK === 'mainnet' 
      ? STACKS_MAINNET
      : process.env.STACKS_NETWORK === 'testnet'
      ? STACKS_TESTNET
      : STACKS_DEVNET;
    
    this.contractAddress = process.env.CONTRACT_ADDRESS || 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    this.contractName = process.env.CONTRACT_NAME || 'bitcoin-payment-gateway';
    this.senderKey = process.env.SENDER_PRIVATE_KEY || '753b7cc01a1a2e86221266a154af739463fce51219d97e4f856cd7200c3bd2a601';
     // Force mock mode for testing - disable actual blockchain calls
     console.log(this.network.client.baseUrl)
    this.mockMode = false; // Change to false when you have a running Stacks node
  }

  async createPaymentIntent({ paymentId, merchant, amount, currency, method, expiresInBlocks }) {
    try {
      // Return mock response when in mock mode
      if (this.mockMode) {
        console.log('Mock mode: Simulating payment intent creation');
        return {
          txid: `mock_tx_${Date.now()}_payment`,
          transaction: null
        };
      }
      console.log(this.network.client.baseUrl)

      const txOptions = {
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'create-payment-intent',
        functionArgs: [
          bufferCV(paymentId),
          standardPrincipalCV(merchant),
          uintCV(amount),
          stringAsciiCV(currency),  // Currency should be string, not principal
          uintCV(method),
          uintCV(expiresInBlocks)
        ],
        senderKey: this.senderKey,
        validateWithAbi: false,
        network: this.network,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow
      };

      const transaction = await makeContractCall(txOptions);
      const broadcastResponse = await broadcastTransaction(transaction, this.network);
      
      return {
        txid: broadcastResponse.txid,
        transaction
      };

    } catch (error) {
      console.error('Error creating payment intent on contract:', error);
      throw new Error(`Failed to create payment intent: ${error.message}`);
    }
  }

  async processPayment(paymentId) {
    try {
      const txOptions = {
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'process-payment',
        functionArgs: [
          bufferCV(paymentId)
        ],
        senderKey: this.senderKey,
        validateWithAbi: false,
        network: this.network,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow
      };

      const transaction = await makeContractCall(txOptions);
      const broadcastResponse = await broadcastTransaction(transaction, this.network);
      
      return {
        txid: broadcastResponse.txid,
        transaction
      };

    } catch (error) {
      console.error('Error processing payment on contract:', error);
      throw new Error(`Failed to process payment: ${error.message}`);
    }
  }

  async completePayment(paymentId) {
    try {
      const txOptions = {
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'complete-payment',
        functionArgs: [
          bufferCV(paymentId)
        ],
        senderKey: this.senderKey,
        validateWithAbi: false,
        network: this.network,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow
      };

      const transaction = await makeContractCall(txOptions);
      const broadcastResponse = await broadcastTransaction(transaction, this.network);
      
      return {
        txid: broadcastResponse.txid,
        transaction
      };

    } catch (error) {
      console.error('Error completing payment on contract:', error);
      throw new Error(`Failed to complete payment: ${error.message}`);
    }
  }

  async cancelPayment(paymentId) {
    try {
      const txOptions = {
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'cancel-payment',
        functionArgs: [
          bufferCV(paymentId)
        ],
        senderKey: this.senderKey,
        validateWithAbi: false,
        network: this.network,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow
      };

      const transaction = await makeContractCall(txOptions);
      const broadcastResponse = await broadcastTransaction(transaction, this.network);
      
      return {
        txid: broadcastResponse.txid,
        transaction
      };

    } catch (error) {
      console.error('Error cancelling payment on contract:', error);
      throw new Error(`Failed to cancel payment: ${error.message}`);
    }
  }

  async registerMerchant({ feeDestination, yieldEnabled, yieldPercentage, multiSigEnabled, requiredSignatures }) {
    try {
      // Return mock response when in mock mode
      if (this.mockMode) {
        console.log('Mock mode: Simulating merchant registration');
        return {
          txid: `mock_tx_${Date.now()}_register`,
          transaction: null
        };
      }
      console.log(this.network.client.baseUrl)

      const txOptions = {
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'register-merchant',
        functionArgs: [
          standardPrincipalCV(feeDestination),
          boolCV(yieldEnabled),
          uintCV(yieldPercentage),
          boolCV(multiSigEnabled),
          uintCV(requiredSignatures)
        ],
        senderKey: this.senderKey,
        validateWithAbi: false,
        network: this.network,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow
      };

      const transaction = await makeContractCall(txOptions);
      const broadcastResponse = await broadcastTransaction(transaction, this.network);
      
      return {
        txid: broadcastResponse.txid,
        transaction
      };

    } catch (error) {
      console.error('Error registering merchant on contract:', error);
      throw new Error(`Failed to register merchant: ${error.message}`);
    }
  }

  async createSubscription({ subscriptionId, merchant, customer, amount, intervalBlocks }) {
    try {
      // Return mock response when in mock mode
      if (this.mockMode) {
        console.log('Mock mode: Simulating subscription creation');
        return {
          txid: `mock_tx_${Date.now()}_subscription`,
          transaction: null
        };
      }

      const txOptions = {
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'create-subscription',
        functionArgs: [
          bufferCV(subscriptionId),
          standardPrincipalCV(merchant),
          uintCV(amount),
          uintCV(intervalBlocks)
        ],
        senderKey: this.senderKey,
        validateWithAbi: false,
        network: this.network,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow
      };

      const transaction = await makeContractCall(txOptions);
      const broadcastResponse = await broadcastTransaction(transaction, this.network);
      
      return {
        txid: broadcastResponse.txid,
        transaction
      };

    } catch (error) {
      console.error('Error creating subscription on contract:', error);
      throw new Error(`Failed to create subscription: ${error.message}`);
    }
  }

  // Read-only functions
  async getPaymentIntent(paymentId) {
    try {
      // Return mock response when in mock mode
      if (this.mockMode) {
        console.log('Mock mode: Simulating payment intent retrieval');
        return {
          id: paymentId.toString('hex'),
          merchant: 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5',
          amount: 100000,
          currency: 'BTC',
          method: 1,
          status: 'pending',
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 24*60*60*1000).toISOString()
        };
      }

      const result = await callReadOnlyFunction({
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'get-payment-intent',
        functionArgs: [bufferCV(paymentId)],
        network: this.network,
        senderAddress: this.contractAddress
      });
      
      return this.parseContractResponse(result);
    } catch (error) {
      console.error('Error fetching payment intent:', error);
      return null;
    }
  }

  async getPaymentStatus(paymentId) {
    try {
      const result = await callReadOnlyFunction({
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'get-payment-status',
        functionArgs: [bufferCV(paymentId)],
        network: this.network,
        senderAddress: this.contractAddress
      });
      
      return this.parseStatusResponse(result);
    } catch (error) {
      console.error('Error fetching payment status:', error);
      throw new Error(`Failed to fetch payment status: ${error.message}`);
    }
  }

  async isMerchantRegistered(merchant) {
    try {
      // Return mock response when in mock mode
      if (this.mockMode) {
        console.log('Mock mode: Simulating merchant registration check');
        return true; // Always return true in mock mode
      }

      const result = await callReadOnlyFunction({
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'is-merchant-registered',
        functionArgs: [standardPrincipalCV(merchant)],
        network: this.network,
        senderAddress: this.contractAddress
      });
      
      return result.type === 'bool' && result.value === true;
    } catch (error) {
      console.error('Error checking merchant registration:', error);
      return false;
    }
  }

  parseContractResponse(result) {
    if (result.type === 'response' && result.value.type === 'ok') {
      const data = result.value.value;
      return {
        id: data.id?.value || '',
        merchant: data.merchant?.value || '',
        amount: parseInt(data.amount?.value || '0'),
        currency: data.currency?.value || '',
        method: parseInt(data.method?.value || '1'),
        status: this.parseStatusValue(data.status?.value),
        created_at: new Date().toISOString()
      };
    }
    return null;
  }

  parseStatusResponse(result) {
    if (result.type === 'response' && result.value.type === 'ok') {
      return this.parseStatusValue(result.value.value);
    }
    return 'unknown';
  }

  parseStatusValue(statusValue) {
    const statusMap = {
      '0': 'pending',
      '1': 'confirmed', 
      '2': 'completed',
      '3': 'failed',
      '4': 'expired'
    };
    return statusMap[statusValue?.toString()] || 'unknown';
  }
}