import express from 'express';
import { verifyWebhookSignature } from '../middleware/auth.js';

const router = express.Router();

// Webhook endpoint for external services to notify payment updates
router.post('/payment-update', verifyWebhookSignature, async (req, res) => {
  try {
    const { 
      payment_id, 
      status, 
      transaction_hash,
      amount,
      timestamp 
    } = req.body;

    console.log('Received payment update webhook:', {
      payment_id,
      status,
      transaction_hash,
      amount,
      timestamp
    });

    // Here you would typically:
    // 1. Update payment status in database
    // 2. Notify merchant via their webhook
    // 3. Update smart contract state if needed

    // Mock processing
    const processedUpdate = {
      payment_id,
      status,
      transaction_hash,
      processed_at: new Date().toISOString()
    };

    // Send acknowledgment
    res.status(200).json({
      success: true,
      message: 'Webhook processed successfully',
      data: processedUpdate
    });

  } catch (error) {
    console.error('Error processing payment webhook:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to process webhook',
        details: error.message
      }
    });
  }
});

// Webhook endpoint for Lightning Network updates
router.post('/lightning-update', verifyWebhookSignature, async (req, res) => {
  try {
    const { 
      payment_id, 
      lightning_invoice,
      status,
      amount_sat,
      timestamp 
    } = req.body;

    console.log('Received Lightning update webhook:', {
      payment_id,
      lightning_invoice,
      status,
      amount_sat,
      timestamp
    });

    // Process Lightning-specific update
    res.status(200).json({
      success: true,
      message: 'Lightning webhook processed successfully'
    });

  } catch (error) {
    console.error('Error processing Lightning webhook:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to process Lightning webhook',
        details: error.message
      }
    });
  }
});

// Test webhook endpoint
router.post('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Webhook test successful',
    received_data: req.body,
    timestamp: new Date().toISOString()
  });
});

export default router;