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
  randomPrivateKey,
  getAddressFromPrivateKey,
  privateKeyToPublic,
  serializeTransaction
} from '@stacks/transactions';
import { STACKS_DEVNET, STACKS_TESTNET, STACKS_MAINNET, STACKS_MOCKNET } from '@stacks/network';


export class StacksService {
  constructor() {
    this.network = STACKS_TESTNET
    
    // Debug environment variables
    console.log('Environment variables loaded:');
    console.log('CONTRACT_ADDRESS:', process.env.CONTRACT_ADDRESS);
    console.log('CONTRACT_NAME:', process.env.CONTRACT_NAME);
    
    this.contractAddress = "ST219X1CZBCMQC37QC4GBYH8E1XW1X11EXNQ3SFWZ";
    this.contractName = process.env.CONTRACT_NAME || 'sflow';
    this.senderKey = process.env.SENDER_PRIVATE_KEY || '753b7cc01a1a2e86221266a154af739463fce51219d87e4f856cd7200c3bd2a601';
    
    console.log('Using contract:', `${this.contractAddress}.${this.contractName}`);
    
    this.address = getAddressFromPrivateKey(this.senderKey, this.network);
    this.mockMode = false; // Keeping for backward compatibility with read functions
  }

  async createPaymentIntent({ paymentId, merchant, amount, currency, method, expiresInBlocks }) {
    try {
      console.log('Creating payment intent with:', { paymentId, merchant, amount, currency, method, expiresInBlocks });

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
      const txid = transaction.txid();
      console.log('Payment intent transaction created with TXID:', txid);
      console.log('Broadcasting transaction to network...');
      
      const broadcastResponse = await broadcastTransaction({ transaction, network: this.network });
      
      console.log('Broadcast response:', broadcastResponse);
      console.log('✅ Payment intent transaction broadcasted successfully!');
      console.log('🔍 Check transaction on explorer:', `https://explorer.stacks.co/txid/${broadcastResponse.txid || txid}?chain=testnet`);
      
      return { txid: broadcastResponse.txid || txid, transaction };
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw new Error(`Failed to create payment intent: ${error.message}`);
    }
  }

  async processPayment(paymentId) {
    try {
      console.log('Processing payment with ID:', paymentId);
      
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
      const txid = transaction.txid();
      console.log('Process payment transaction created with TXID:', txid);
      console.log('Broadcasting transaction to network...');
      
      const broadcastResponse = await broadcastTransaction({ transaction, network: this.network });
      
      console.log('Broadcast response:', broadcastResponse);
      console.log('✅ Process payment transaction broadcasted successfully!');
      console.log('🔍 Check transaction on explorer:', `https://explorer.stacks.co/txid/${broadcastResponse.txid || txid}?chain=testnet`);
      
      return {
        txid: broadcastResponse.txid || txid,
        transaction
      };

    } catch (error) {
      console.error('Error processing payment on contract:', error);
      throw new Error(`Failed to process payment: ${error.message}`);
    }
  }

  async completePayment(paymentId) {
    try {
      console.log('Completing payment with ID:', paymentId);
      
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
      const txid = transaction.txid();
      console.log('Complete payment transaction created with TXID:', txid);
      console.log('Broadcasting transaction to network...');
      
      const broadcastResponse = await broadcastTransaction({ transaction, network: this.network });
      
      console.log('Broadcast response:', broadcastResponse);
      console.log('✅ Complete payment transaction broadcasted successfully!');
      console.log('🔍 Check transaction on explorer:', `https://explorer.stacks.co/txid/${broadcastResponse.txid || txid}?chain=testnet`);
      
      return {
        txid: broadcastResponse.txid || txid,
        transaction
      };

    } catch (error) {
      console.error('Error completing payment on contract:', error);
      throw new Error(`Failed to complete payment: ${error.message}`);
    }
  }

  async cancelPayment(paymentId) {
    try {
      console.log('Cancelling payment with ID:', paymentId);
      
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
      const txid = transaction.txid();
      console.log('Cancel payment transaction created with TXID:', txid);
      console.log('Broadcasting transaction to network...');
      
      const broadcastResponse = await broadcastTransaction({ transaction, network: this.network });
      
      console.log('Broadcast response:', broadcastResponse);
      console.log('✅ Cancel payment transaction broadcasted successfully!');
      console.log('🔍 Check transaction on explorer:', `https://explorer.stacks.co/txid/${broadcastResponse.txid || txid}?chain=testnet`);
      
      return {
        txid: broadcastResponse.txid || txid,
        transaction
      };

    } catch (error) {
      console.error('Error cancelling payment on contract:', error);
      throw new Error(`Failed to cancel payment: ${error.message}`);
    }
  }

  async registerMerchant({ feeDestination, yieldEnabled, yieldPercentage, multiSigEnabled, requiredSignatures }) {
    try {
      console.log('Registering merchant with:', { feeDestination, yieldEnabled, yieldPercentage, multiSigEnabled, requiredSignatures });
      console.log('Using sender address:', this.address);
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
      console.log('Registering merchant with options:', txOptions);
      console.log(this.network)
      const transaction = await makeContractCall(txOptions); 
      /*  contractAddress: string;
    contractName: string;
    functionName: string;
    functionArgs: ClarityValue[];
    fee?: IntegerType;
    nonce?: IntegerType;
    postConditionMode?: PostConditionModeName | PostConditionMode;
    postConditions?: (PostCondition | PostConditionWire | string)[];
    validateWithAbi?: boolean | ClarityAbi;
    sponsored?: boolean;
     senderKey: PublicKey;
    */
    
      const txid = transaction.txid();
      console.log('Transaction created with TXID:', txid);
      console.log('Broadcasting transaction to network...');
      
      const broadcastResponse = await broadcastTransaction({ transaction, network: this.network });
      
      console.log('Broadcast response:', broadcastResponse);
      console.log('✅ Transaction broadcasted successfully!');
      console.log('🔍 Check transaction on explorer:', `https://explorer.stacks.co/txid/${broadcastResponse.txid || txid}?chain=testnet`);
      
      return { txid: broadcastResponse.txid || txid, transaction };
    } catch (error) {
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
      const txid = transaction.txid();
      console.log('Transaction created with TXID:', txid);
      console.log('Broadcasting transaction to network...');
      
      const broadcastResponse = await broadcastTransaction({ transaction, network: this.network });
      
      console.log('Broadcast response:', broadcastResponse);
      console.log('✅ Transaction broadcasted successfully!');
      console.log('🔍 Check transaction on explorer:', `https://explorer.stacks.co/txid/${broadcastResponse.txid || txid}?chain=testnet`);
      
      return { txid: broadcastResponse.txid || txid, transaction };
    } catch (error) {
      throw new Error(`Failed to create subscription: ${error.message}`);
    }
  }

  // Lightning Network HTLC Functions
  async lockLightningPayment({ preimageHash, paymentId, amount, timelock, recipient }) {
    try {
      if (this.mockMode) {
        return { txid: `mock_tx_${Date.now()}_lightning_lock`, transaction: null };
      }

      const txOptions = {
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'lock-lightning-payment',
        functionArgs: [
          bufferCV(preimageHash),
          bufferCV(paymentId),
          uintCV(amount),
          uintCV(timelock),
          standardPrincipalCV(recipient)
        ],
        senderKey: this.senderKey,
        validateWithAbi: false,
        network: this.network,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow
      };

      const transaction = await makeContractCall(txOptions);
      const txid = transaction.txid();
      console.log('Transaction created with TXID:', txid);
      console.log('Broadcasting transaction to network...');
      
      const broadcastResponse = await broadcastTransaction({ transaction, network: this.network });
      
      console.log('Broadcast response:', broadcastResponse);
      console.log('✅ Transaction broadcasted successfully!');
      console.log('🔍 Check transaction on explorer:', `https://explorer.stacks.co/txid/${broadcastResponse.txid || txid}?chain=testnet`);
      
      return { txid: broadcastResponse.txid || txid, transaction };
    } catch (error) {
      throw new Error(`Failed to lock Lightning payment: ${error.message}`);
    }
  }

  async claimLightningPayment(preimage) {
    try {
      if (this.mockMode) {
        return { txid: `mock_tx_${Date.now()}_lightning_claim`, transaction: null };
      }

      const txOptions = {
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'claim-lightning-payment',
        functionArgs: [bufferCV(preimage)],
        senderKey: this.senderKey,
        validateWithAbi: false,
        network: this.network,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow
      };

      const transaction = await makeContractCall(txOptions);
      const txid = transaction.txid();
      console.log('Transaction created with TXID:', txid);
      console.log('Broadcasting transaction to network...');
      
      const broadcastResponse = await broadcastTransaction({ transaction, network: this.network });
      
      console.log('Broadcast response:', broadcastResponse);
      console.log('✅ Transaction broadcasted successfully!');
      console.log('🔍 Check transaction on explorer:', `https://explorer.stacks.co/txid/${broadcastResponse.txid || txid}?chain=testnet`);
      
      return { txid: broadcastResponse.txid || txid, transaction };
    } catch (error) {
      throw new Error(`Failed to claim Lightning payment: ${error.message}`);
    }
  }

  async refundLightningPayment(preimageHash) {
    try {
      if (this.mockMode) {
        return { txid: `mock_tx_${Date.now()}_lightning_refund`, transaction: null };
      }

      const txOptions = {
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'refund-lightning-payment',
        functionArgs: [bufferCV(preimageHash)],
        senderKey: this.senderKey,
        validateWithAbi: false,
        network: this.network,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow
      };

      const transaction = await makeContractCall(txOptions);
      const txid = transaction.txid();
      console.log('Transaction created with TXID:', txid);
      console.log('Broadcasting transaction to network...');
      
      const broadcastResponse = await broadcastTransaction({ transaction, network: this.network });
      
      console.log('Broadcast response:', broadcastResponse);
      console.log('✅ Transaction broadcasted successfully!');
      console.log('🔍 Check transaction on explorer:', `https://explorer.stacks.co/txid/${broadcastResponse.txid || txid}?chain=testnet`);
      
      return { txid: broadcastResponse.txid || txid, transaction };
    } catch (error) {
      throw new Error(`Failed to refund Lightning payment: ${error.message}`);
    }
  }

  // Atomic Swap Functions
  async initiateBtcSwap({ swapId, btcTxid, btcOutputIndex, amount, btcAddress, recipient }) {
    try {
      if (this.mockMode) {
        return { txid: `mock_tx_${Date.now()}_btc_swap`, transaction: null };
      }

      const txOptions = {
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'initiate-btc-swap',
        functionArgs: [
          bufferCV(swapId),
          bufferCV(btcTxid),
          uintCV(btcOutputIndex),
          uintCV(amount),
          bufferCV(btcAddress),
          standardPrincipalCV(recipient)
        ],
        senderKey: this.senderKey,
        validateWithAbi: false,
        network: this.network,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow
      };

      const transaction = await makeContractCall(txOptions);
      const txid = transaction.txid();
      console.log('Transaction created with TXID:', txid);
      console.log('Broadcasting transaction to network...');
      
      const broadcastResponse = await broadcastTransaction({ transaction, network: this.network });
      
      console.log('Broadcast response:', broadcastResponse);
      console.log('✅ Transaction broadcasted successfully!');
      console.log('🔍 Check transaction on explorer:', `https://explorer.stacks.co/txid/${broadcastResponse.txid || txid}?chain=testnet`);
      
      return { txid: broadcastResponse.txid || txid, transaction };
    } catch (error) {
      throw new Error(`Failed to initiate BTC swap: ${error.message}`);
    }
  }

  async claimBtcSwap({ swapId, block, prevBlocks, tx, proof }) {
    try {
      if (this.mockMode) {
        return { txid: `mock_tx_${Date.now()}_btc_claim`, transaction: null };
      }

      const txOptions = {
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'claim-btc-swap',
        functionArgs: [
          bufferCV(swapId),
          // Block and proof structures would need proper formatting
          // This is simplified for the example
        ],
        senderKey: this.senderKey,
        validateWithAbi: false,
        network: this.network,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow
      };

      const transaction = await makeContractCall(txOptions);
      const txid = transaction.txid();
      console.log('Transaction created with TXID:', txid);
      console.log('Broadcasting transaction to network...');
      
      const broadcastResponse = await broadcastTransaction({ transaction, network: this.network });
      
      console.log('Broadcast response:', broadcastResponse);
      console.log('✅ Transaction broadcasted successfully!');
      console.log('🔍 Check transaction on explorer:', `https://explorer.stacks.co/txid/${broadcastResponse.txid || txid}?chain=testnet`);
      
      return { txid: broadcastResponse.txid || txid, transaction };
    } catch (error) {
      throw new Error(`Failed to claim BTC swap: ${error.message}`);
    }
  }

  // Multi-Signature Functions
  async createMultiSigTx({ txId, amount, destination }) {
    try {
      if (this.mockMode) {
        return { txid: `mock_tx_${Date.now()}_multisig`, transaction: null };
      }

      const txOptions = {
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'create-multi-sig-tx',
        functionArgs: [
          bufferCV(txId),
          uintCV(amount),
          standardPrincipalCV(destination)
        ],
        senderKey: this.senderKey,
        validateWithAbi: false,
        network: this.network,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow
      };

      const transaction = await makeContractCall(txOptions);
      const txid = transaction.txid();
      console.log('Transaction created with TXID:', txid);
      console.log('Broadcasting transaction to network...');
      
      const broadcastResponse = await broadcastTransaction({ transaction, network: this.network });
      
      console.log('Broadcast response:', broadcastResponse);
      console.log('✅ Transaction broadcasted successfully!');
      console.log('🔍 Check transaction on explorer:', `https://explorer.stacks.co/txid/${broadcastResponse.txid || txid}?chain=testnet`);
      
      return { txid: broadcastResponse.txid || txid, transaction };
    } catch (error) {
      throw new Error(`Failed to create multi-sig transaction: ${error.message}`);
    }
  }

  async signMultiSigTx(txId) {
    try {
      if (this.mockMode) {
        return { txid: `mock_tx_${Date.now()}_multisig_sign`, transaction: null };
      }

      const txOptions = {
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'sign-multi-sig-tx',
        functionArgs: [bufferCV(txId)],
        senderKey: this.senderKey,
        validateWithAbi: false,
        network: this.network,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow
      };

      const transaction = await makeContractCall(txOptions);
      const txid = transaction.txid();
      console.log('Transaction created with TXID:', txid);
      console.log('Broadcasting transaction to network...');
      
      const broadcastResponse = await broadcastTransaction({ transaction, network: this.network });
      
      console.log('Broadcast response:', broadcastResponse);
      console.log('✅ Transaction broadcasted successfully!');
      console.log('🔍 Check transaction on explorer:', `https://explorer.stacks.co/txid/${broadcastResponse.txid || txid}?chain=testnet`);
      
      return { txid: broadcastResponse.txid || txid, transaction };
    } catch (error) {
      throw new Error(`Failed to sign multi-sig transaction: ${error.message}`);
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
      if (this.mockMode) {
        return true;
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
      return false;
    }
  }

  // Read-only functions for Lightning and Atomic Swaps
  async getLightningHtlc(preimageHash) {
    try {
      if (this.mockMode) {
        return {
          amount: 100000,
          timelock: Date.now() + 3600000,
          initiator: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
          recipient: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG'
        };
      }

      const result = await callReadOnlyFunction({
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'get-lightning-htlc',
        functionArgs: [bufferCV(preimageHash)],
        network: this.network,
        senderAddress: this.contractAddress
      });
      
      return this.parseContractResponse(result);
    } catch (error) {
      return null;
    }
  }

  async getAtomicSwap(swapId) {
    try {
      if (this.mockMode) {
        return {
          initiator: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
          recipient: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG',
          amount: 100000,
          status: 1
        };
      }

      const result = await callReadOnlyFunction({
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'get-atomic-swap',
        functionArgs: [bufferCV(swapId)],
        network: this.network,
        senderAddress: this.contractAddress
      });
      
      return this.parseContractResponse(result);
    } catch (error) {
      return null;
    }
  }

  async calculateFees(amount) {
    try {
      if (this.mockMode) {
        const protocolFee = Math.floor(amount * 0.0025);
        return {
          protocol_fee: protocolFee,
          net_amount: amount - protocolFee
        };
      }

      const result = await callReadOnlyFunction({
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'calculate-fees',
        functionArgs: [uintCV(amount)],
        network: this.network,
        senderAddress: this.contractAddress
      });
      
      return this.parseContractResponse(result);
    } catch (error) {
      throw new Error(`Failed to calculate fees: ${error.message}`);
    }
  }

  async estimateYield(amount, durationBlocks) {
    try {
      if (this.mockMode) {
        return Math.floor(amount * 0.05 * (durationBlocks / 52560));
      }

      const result = await callReadOnlyFunction({
        contractAddress: this.contractAddress,
        contractName: this.contractName,
        functionName: 'estimate-yield',
        functionArgs: [uintCV(amount), uintCV(durationBlocks)],
        network: this.network,
        senderAddress: this.contractAddress
      });
      
      return parseInt(result.value || '0');
    } catch (error) {
      throw new Error(`Failed to estimate yield: ${error.message}`);
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