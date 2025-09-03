import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticate } from '../middleware/auth.js';
import { validateAtomicSwap } from '../middleware/validation.js';
import { StacksService } from '../services/stacks.js';
import { BitcoinService } from '../services/bitcoin.js';

const router = express.Router();
const stacksService = new StacksService();
const bitcoinService = new BitcoinService();

// Initiate atomic swap
router.post('/atomic', authenticate, validateAtomicSwap, async (req, res) => {
  try {
    const { btc_txid, btc_output_index = 0, amount, btc_address, recipient } = req.body;

    // Validate Bitcoin transaction exists
    const btcTx = await bitcoinService.getTransaction(btc_txid);
    if (!btcTx) {
      return res.status(400).json({
        success: false,
        error: { message: 'Bitcoin transaction not found' }
      });
    }

    const swapId = Buffer.from(uuidv4().replace(/-/g, ''), 'hex').slice(0, 32);

    const result = await stacksService.initiateBtcSwap({
      swapId,
      btcTxid: Buffer.from(btc_txid, 'hex'),
      btcOutputIndex: btc_output_index,
      amount: parseInt(amount),
      btcAddress: Buffer.from(btc_address, 'hex'),
      recipient
    });

    res.status(201).json({
      success: true,
      data: {
        swap_id: swapId.toString('hex'),
        btc_txid,
        btc_output_index,
        amount: parseInt(amount),
        btc_address,
        recipient,
        status: 'initiated',
        expires_at: new Date(Date.now() + 144 * 10 * 60 * 1000).toISOString(), // 24 hours
        contract_tx_id: result.txid,
        created_at: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to initiate atomic swap', details: error.message }
    });
  }
});

// Claim atomic swap with Bitcoin proof
router.post('/atomic/:id/claim', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { block_hash, tx_proof } = req.body;

    if (!block_hash || !tx_proof) {
      return res.status(400).json({
        success: false,
        error: { message: 'block_hash and tx_proof are required' }
      });
    }

    const swapId = Buffer.from(id, 'hex');

    // Verify the Bitcoin transaction proof
    const verification = await bitcoinService.verifyTransactionInclusion(
      tx_proof.txid,
      block_hash
    );

    if (!verification.included) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid Bitcoin transaction proof' }
      });
    }

    const result = await stacksService.claimBtcSwap({
      swapId,
      block: { hash: block_hash, height: verification.block_height },
      tx: tx_proof.tx_hex,
      proof: tx_proof.merkle_proof
    });

    res.json({
      success: true,
      data: {
        swap_id: id,
        status: 'claimed',
        contract_tx_id: result.txid,
        claimed_at: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to claim atomic swap', details: error.message }
    });
  }
});

// Get atomic swap details
router.get('/atomic/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const swapId = Buffer.from(id, 'hex');

    const swap = await stacksService.getAtomicSwap(swapId);

    if (!swap) {
      return res.status(404).json({
        success: false,
        error: { message: 'Atomic swap not found' }
      });
    }

    res.json({
      success: true,
      data: {
        swap_id: id,
        ...swap,
        status: swap.status === 1 ? 'active' : swap.status === 2 ? 'claimed' : 'expired'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get atomic swap', details: error.message }
    });
  }
});

// Create cross-chain swap quote
router.post('/quote', authenticate, async (req, res) => {
  try {
    const { from_currency, to_currency, amount, swap_type = 'atomic' } = req.body;

    if (!from_currency || !to_currency || !amount) {
      return res.status(400).json({
        success: false,
        error: { message: 'from_currency, to_currency, and amount are required' }
      });
    }

    // Mock exchange rate calculation
    const exchangeRates = {
      'BTC/STX': 0.000025, // 1 STX = 0.000025 BTC
      'STX/BTC': 40000,    // 1 BTC = 40,000 STX
      'BTC/SBTC': 1,       // 1:1 peg
      'SBTC/BTC': 1
    };

    const rate = exchangeRates[`${from_currency}/${to_currency}`];
    if (!rate) {
      return res.status(400).json({
        success: false,
        error: { message: 'Unsupported currency pair' }
      });
    }

    const outputAmount = Math.floor(amount * rate);
    const fee = Math.floor(outputAmount * 0.005); // 0.5% fee
    const netAmount = outputAmount - fee;

    res.json({
      success: true,
      data: {
        from_currency,
        to_currency,
        input_amount: amount,
        output_amount: outputAmount,
        net_amount: netAmount,
        fee,
        exchange_rate: rate,
        swap_type,
        expires_at: new Date(Date.now() + 300000).toISOString(), // 5 minutes
        created_at: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create swap quote', details: error.message }
    });
  }
});

// Execute cross-chain swap
router.post('/execute', authenticate, async (req, res) => {
  try {
    const { 
      from_currency, 
      to_currency, 
      amount, 
      recipient_address,
      swap_type = 'atomic',
      quote_id 
    } = req.body;

    if (!from_currency || !to_currency || !amount || !recipient_address) {
      return res.status(400).json({
        success: false,
        error: { message: 'Missing required swap parameters' }
      });
    }

    const swapId = uuidv4();

    // Mock swap execution
    res.status(201).json({
      success: true,
      data: {
        swap_id: swapId,
        from_currency,
        to_currency,
        input_amount: amount,
        recipient_address,
        swap_type,
        status: 'pending',
        estimated_completion: new Date(Date.now() + 600000).toISOString(), // 10 minutes
        created_at: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to execute swap', details: error.message }
    });
  }
});

// Get swap status
router.get('/:id/status', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Mock swap status
    res.json({
      success: true,
      data: {
        swap_id: id,
        status: 'completed',
        progress: 100,
        confirmations: 6,
        completed_at: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get swap status', details: error.message }
    });
  }
});

// List user swaps
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, currency } = req.query;

    // Mock swap list
    const swaps = [];

    res.json({
      success: true,
      data: {
        swaps,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          pages: 0
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to list swaps', details: error.message }
    });
  }
});

export default router;