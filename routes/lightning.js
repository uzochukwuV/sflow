import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticate } from '../middleware/auth.js';
import { validateLightningLock } from '../middleware/validation.js';
import { StacksService } from '../services/stacks.js';
import { LightningService } from '../services/lightning.js';

const router = express.Router();
const stacksService = new StacksService();
const lightningService = new LightningService();

// Create Lightning invoice
router.post('/invoices', authenticate, async (req, res) => {
  try {
    const { amount_sats, description, expiry = 3600 } = req.body;

    if (!amount_sats || amount_sats <= 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'amount_sats must be a positive number' }
      });
    }

    const invoice = await lightningService.createInvoice({
      amount_msat: amount_sats * 1000,
      description: description || 'SFlow Payment',
      expiry
    });

    res.status(201).json({
      success: true,
      data: {
        payment_request: invoice.payment_request,
        payment_hash: invoice.payment_hash,
        amount_sats,
        description,
        expires_at: new Date(Date.now() + expiry * 1000).toISOString(),
        created_at: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create Lightning invoice', details: error.message }
    });
  }
});

// Decode Lightning invoice
router.post('/invoices/decode', authenticate, async (req, res) => {
  try {
    const { payment_request } = req.body;

    if (!payment_request || !lightningService.validateInvoice(payment_request)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid Lightning invoice' }
      });
    }

    const decoded = await lightningService.decodeInvoice(payment_request);

    res.json({
      success: true,
      data: {
        payment_hash: decoded.payment_hash,
        amount_msat: decoded.amount_msat,
        amount_sats: Math.floor(decoded.amount_msat / 1000),
        description: decoded.description,
        expiry: decoded.expiry,
        created_at: new Date(decoded.created_at * 1000).toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to decode Lightning invoice', details: error.message }
    });
  }
});

// Pay Lightning invoice
router.post('/payments', authenticate, async (req, res) => {
  try {
    const { payment_request, amount_sats } = req.body;

    if (!payment_request) {
      return res.status(400).json({
        success: false,
        error: { message: 'payment_request is required' }
      });
    }

    const payment = await lightningService.payInvoice(payment_request);

    res.json({
      success: true,
      data: {
        payment_hash: payment.payment_hash,
        payment_preimage: payment.payment_preimage,
        amount_sats: Math.floor(payment.amount_msat / 1000),
        fee_sats: Math.floor(payment.fee_msat / 1000),
        status: payment.status,
        paid_at: payment.created_at
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to pay Lightning invoice', details: error.message }
    });
  }
});

// Get Lightning payment status
router.get('/payments/:payment_hash', authenticate, async (req, res) => {
  try {
    const { payment_hash } = req.params;

    if (!lightningService.validatePaymentHash(payment_hash)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid payment hash format' }
      });
    }

    const status = await lightningService.getPaymentStatus(payment_hash);

    res.json({
      success: true,
      data: {
        payment_hash,
        status: status.status,
        amount_sats: Math.floor(status.amount_msat / 1000),
        fee_sats: Math.floor(status.fee_msat / 1000),
        created_at: status.created_at,
        settled_at: status.settled_at
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get payment status', details: error.message }
    });
  }
});

// Estimate Lightning routing fee
router.get('/fees/estimate/:amount_sats', authenticate, async (req, res) => {
  try {
    const { amount_sats } = req.params;
    const { destination } = req.query;

    const amount_msat = parseInt(amount_sats) * 1000;
    const estimatedFee = lightningService.estimateRoutingFee(amount_msat, destination);

    res.json({
      success: true,
      data: {
        amount_sats: parseInt(amount_sats),
        estimated_fee_sats: Math.floor(estimatedFee / 1000),
        estimated_fee_msat: estimatedFee,
        fee_rate_percent: ((estimatedFee / amount_msat) * 100).toFixed(4)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to estimate routing fee', details: error.message }
    });
  }
});

// Create submarine swap invoice
router.post('/submarine-swaps', authenticate, async (req, res) => {
  try {
    const { amount_sats, swap_hash, expiry_blocks = 144 } = req.body;

    if (!amount_sats || !swap_hash) {
      return res.status(400).json({
        success: false,
        error: { message: 'amount_sats and swap_hash are required' }
      });
    }

    const swapInvoice = await lightningService.createSubmarineSwapInvoice({
      amount_sats,
      swap_hash,
      expiry_blocks
    });

    res.status(201).json({
      success: true,
      data: {
        payment_request: swapInvoice.payment_request,
        payment_hash: swapInvoice.payment_hash,
        amount_sats,
        expiry_blocks,
        expires_at: new Date(Date.now() + expiry_blocks * 10 * 60 * 1000).toISOString(),
        created_at: swapInvoice.created_at
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create submarine swap', details: error.message }
    });
  }
});

// Generate preimage for HTLC
router.post('/preimages', authenticate, async (req, res) => {
  try {
    const { preimage, hash } = lightningService.generatePreimage();

    res.json({
      success: true,
      data: {
        preimage,
        hash,
        generated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to generate preimage', details: error.message }
    });
  }
});

export default router;