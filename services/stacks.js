import { 
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  standardPrincipalCV,
  uintCV,
  bufferCV,
  boolCV
} from '@stacks/transactions';
import {StacksNetworks, STACKS_DEVNET, STACKS_TESTNET, STACKS_MAINNET} from '@stacks/network';


export class StacksService {
  constructor() {
    this.network = process.env.NODE_ENV === 'production' 
      ? STACKS_MAINNET 
      : STACKS_DEVNET;
    
    this.contractAddress = process.env.CONTRACT_ADDRESS || 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    this.contractName = process.env.CONTRACT_NAME || 'sflow';
    this.senderKey = process.env.SENDER_PRIVATE_KEY || 'your-private-key-here';
  }

  async createPaymentIntent({ paymentId, merchant, amount, currency, method, expiresInBlocks }) {
    try {
      const txOptions = {
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'create-payment-intent',
        functionArgs: [
          bufferCV(paymentId),
          standardPrincipalCV(merchant),
          uintCV(amount),
          standardPrincipalCV(currency),
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
      // This would make a read-only contract call
      // For now, return mock data
      return {
        id: paymentId.toString('hex'),
        merchant: 'ST1MERCHANT...',
        amount: 10000,
        currency: 'ST1CURRENCY...',
        method: 1,
        status: 'pending',
        created_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching payment intent:', error);
      return null;
    }
  }

  async getPaymentStatus(paymentId) {
    try {
      // This would make a read-only contract call
      // For now, return mock status
      return 'pending';
    } catch (error) {
      console.error('Error fetching payment status:', error);
      throw new Error(`Failed to fetch payment status: ${error.message}`);
    }
  }

  async isMerchantRegistered(merchant) {
    try {
      // This would make a read-only contract call
      // For now, return true for all merchants
      return true;
    } catch (error) {
      console.error('Error checking merchant registration:', error);
      return false;
    }
  }
}