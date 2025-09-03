import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticate } from '../middleware/auth.js';
import { validatePaymentIntent } from '../middleware/validation.js';
import { StacksService } from '../services/stacks.js';

const router = express.Router();
const stacksService = new StacksService();

// Create Payment Intent
router.post('/intents', authenticate, validatePaymentIntent, async (req, res) => {
  try {
    const {
      merchant,
      amount,
      currency,
      method,
      expires_in_blocks = 144, // ~24 hours
      metadata = {}
    } = req.body;

    const paymentId = Buffer.from(uuidv4().replace(/-/g, ''), 'hex').slice(0, 16);
    
    // Call smart contract to create payment intent
    const result = await stacksService.createPaymentIntent({
      paymentId,
      merchant,
      amount: parseInt(amount),
      currency,
      method: parseInt(method),
      expiresInBlocks: expires_in_blocks
    });

    const response = {
      id: paymentId.toString('hex'),
      merchant,
      amount: parseInt(amount),
      currency,
      method,
      status: 'pending',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + (expires_in_blocks * 10 * 60 * 1000)).toISOString(), // ~10 min per block
      metadata,
      tx_id: result.txid
    };

    res.status(201).json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to create payment intent',
        details: error.message
      }
    });
  }
});

// Get Payment Intent
router.get('/intents/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const paymentId = Buffer.from(id, 'hex');

    const intent = await stacksService.getPaymentIntent(paymentId);

    if (!intent) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Payment intent not found'
        }
      });
    }

    res.json({
      success: true,
      data: intent
    });

  } catch (error) {
    console.error('Error fetching payment intent:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch payment intent',
        details: error.message
      }
    });
  }
});

// Process Payment
router.post('/intents/:id/process', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const paymentId = Buffer.from(id, 'hex');

    const result = await stacksService.processPayment(paymentId);

    res.json({
      success: true,
      data: {
        payment_id: id,
        status: 'confirmed',
        tx_id: result.txid,
        processed_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to process payment',
        details: error.message
      }
    });
  }
});

// Complete Payment
router.post('/intents/:id/complete', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const paymentId = Buffer.from(id, 'hex');

    const result = await stacksService.completePayment(paymentId);

    res.json({
      success: true,
      data: {
        payment_id: id,
        status: 'completed',
        tx_id: result.txid,
        completed_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error completing payment:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to complete payment',
        details: error.message
      }
    });
  }
});

// Cancel Payment
router.post('/intents/:id/cancel', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const paymentId = Buffer.from(id, 'hex');

    const result = await stacksService.cancelPayment(paymentId);

    res.json({
      success: true,
      data: {
        payment_id: id,
        status: 'cancelled',
        tx_id: result.txid,
        cancelled_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error cancelling payment:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to cancel payment',
        details: error.message
      }
    });
  }
});

// Get Payment Status
router.get('/intents/:id/status', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const paymentId = Buffer.from(id, 'hex');

    const status = await stacksService.getPaymentStatus(paymentId);

    res.json({
      success: true,
      data: {
        payment_id: id,
        status: status,
        checked_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error checking payment status:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to check payment status',
        details: error.message
      }
    });
  }
});

// Lightning Network Payment Routes
router.post('/lightning/lock', authenticate, async (req, res) => {
  try {
    const { payment_id, amount, preimage_hash, timelock, recipient } = req.body;

    if (!payment_id || !amount || !preimage_hash || !recipient) {
      return res.status(400).json({
        success: false,
        error: { message: 'payment_id, amount, preimage_hash, and recipient are required' }
      });
    }

    const result = await stacksService.lockLightningPayment({
      preimageHash: Buffer.from(preimage_hash, 'hex'),
      paymentId: Buffer.from(payment_id, 'hex'),
      amount: parseInt(amount),
      timelock: timelock || (Date.now() + 3600000), // 1 hour default
      recipient
    });

    res.json({
      success: true,
      data: {
        payment_id,
        preimage_hash,
        amount: parseInt(amount),
        timelock,
        recipient,
        tx_id: result.txid,
        locked_at: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to lock Lightning payment', details: error.message }
    });
  }
});

router.post('/lightning/claim', authenticate, async (req, res) => {
  try {
    const { preimage } = req.body;

    if (!preimage) {
      return res.status(400).json({
        success: false,
        error: { message: 'preimage is required' }
      });
    }

    const result = await stacksService.claimLightningPayment(Buffer.from(preimage, 'hex'));

    res.json({
      success: true,
      data: {
        preimage,
        tx_id: result.txid,
        claimed_at: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to claim Lightning payment', details: error.message }
    });
  }
});

router.post('/lightning/refund', authenticate, async (req, res) => {
  try {
    const { preimage_hash } = req.body;

    if (!preimage_hash) {
      return res.status(400).json({
        success: false,
        error: { message: 'preimage_hash is required' }
      });
    }

    const result = await stacksService.refundLightningPayment(Buffer.from(preimage_hash, 'hex'));

    res.json({
      success: true,
      data: {
        preimage_hash,
        tx_id: result.txid,
        refunded_at: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to refund Lightning payment', details: error.message }
    });
  }
});

// Atomic Swap Routes
router.post('/swaps/btc/initiate', authenticate, async (req, res) => {
  try {
    const { btc_txid, btc_output_index, amount, btc_address, recipient } = req.body;

    if (!btc_txid || !amount || !btc_address || !recipient) {
      return res.status(400).json({
        success: false,
        error: { message: 'btc_txid, amount, btc_address, and recipient are required' }
      });
    }

    const swapId = Buffer.from(uuidv4().replace(/-/g, ''), 'hex').slice(0, 32);

    const result = await stacksService.initiateBtcSwap({
      swapId,
      btcTxid: Buffer.from(btc_txid, 'hex'),
      btcOutputIndex: btc_output_index || 0,
      amount: parseInt(amount),
      btcAddress: Buffer.from(btc_address, 'hex'),
      recipient
    });

    res.json({
      success: true,
      data: {
        swap_id: swapId.toString('hex'),
        btc_txid,
        amount: parseInt(amount),
        btc_address,
        recipient,
        tx_id: result.txid,
        initiated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to initiate BTC swap', details: error.message }
    });
  }
});

router.get('/swaps/:id', authenticate, async (req, res) => {
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
      data: swap
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch atomic swap', details: error.message }
    });
  }
});

// Fee Calculation
router.get('/fees/:amount', authenticate, async (req, res) => {
  try {
    const { amount } = req.params;
    const fees = await stacksService.calculateFees(parseInt(amount));

    res.json({
      success: true,
      data: {
        amount: parseInt(amount),
        ...fees
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to calculate fees', details: error.message }
    });
  }
});

// List Payments (with pagination)
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, merchant } = req.query;

    const payments = [];

    res.json({
      success: true,
      data: {
        payments,
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
      error: { message: 'Failed to list payments', details: error.message }
    });
  }
});

export default router;