import express from 'express';
import crypto from 'crypto';
import { authenticate } from '../middleware/auth.js';
import { validateMerchantRegistration } from '../middleware/validation.js';
import { StacksService } from '../services/stacks.js';

const router = express.Router();
const stacksService = new StacksService();

// Register Merchant
router.post('/register', authenticate, validateMerchantRegistration, async (req, res) => {
  try {
    const {
      fee_destination,
      yield_enabled = false,
      yield_percentage = 0,
      multi_sig_enabled = false,
      required_signatures = 1
    } = req.body;

    const result = await stacksService.registerMerchant({
      feeDestination: fee_destination,
      yieldEnabled: yield_enabled,
      yieldPercentage: yield_percentage,
      multiSigEnabled: multi_sig_enabled,
      requiredSignatures: required_signatures
    });

    res.status(201).json({
      success: true,
      data: {
        merchant: req.apiKey.key, // Use API key as merchant identifier
        fee_destination,
        yield_enabled,
        yield_percentage,
        multi_sig_enabled,
        required_signatures,
        tx_id: result.txid,
        registered_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error registering merchant:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to register merchant',
        details: error.message
      }
    });
  }
});

// Get Merchant Info
router.get('/me', authenticate, async (req, res) => {
  try {
    const merchantAddress = req.apiKey.key; // Simplified - use API key as identifier
    const isRegistered = await stacksService.isMerchantRegistered(merchantAddress);

    if (!isRegistered) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Merchant not registered'
        }
      });
    }

    // In a real implementation, fetch from contract
    res.json({
      success: true,
      data: {
        merchant: merchantAddress,
        name: req.apiKey.name,
        registered: true,
        permissions: req.apiKey.permissions,
        created_at: req.apiKey.created_at
      }
    });

  } catch (error) {
    console.error('Error fetching merchant info:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch merchant info',
        details: error.message
      }
    });
  }
});

// Create Subscription
router.post('/subscriptions', authenticate, async (req, res) => {
  try {
    const {
      customer,
      amount,
      interval_blocks = 144 // Daily
    } = req.body;

    if (!customer || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'customer and positive amount are required'
        }
      });
    }

    const subscriptionId = Buffer.from(crypto.randomUUID().replace(/-/g, ''), 'hex').slice(0, 16);
    
    const result = await stacksService.createSubscription({
      subscriptionId,
      merchant: req.apiKey.key,
      customer,
      amount: parseInt(amount),
      intervalBlocks: interval_blocks
    });

    res.status(201).json({
      success: true,
      data: {
        subscription_id: subscriptionId.toString('hex'),
        merchant: req.apiKey.key,
        customer,
        amount: parseInt(amount),
        interval_blocks,
        next_payment: new Date(Date.now() + (interval_blocks * 10 * 60 * 1000)).toISOString(),
        active: true,
        tx_id: result.txid,
        created_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to create subscription',
        details: error.message
      }
    });
  }
});

// Get Yield Position
router.get('/yield', authenticate, async (req, res) => {
  try {
    const merchantAddress = req.apiKey.key;
    
    // Mock yield position data
    res.json({
      success: true,
      data: {
        merchant: merchantAddress,
        total_deposited: 0,
        yield_earned: 0,
        last_compound: new Date().toISOString(),
        estimated_apy: '5.0%'
      }
    });

  } catch (error) {
    console.error('Error fetching yield position:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch yield position',
        details: error.message
      }
    });
  }
});

export default router;