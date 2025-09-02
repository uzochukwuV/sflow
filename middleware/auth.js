import crypto from 'crypto';

// Mock API keys - In production, store in database
const API_KEYS = {
  'sk_test_1234567890abcdef': {
    name: 'Test Merchant',
    permissions: ['read', 'write'],
    created_at: new Date().toISOString()
  }
};

export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Missing or invalid authorization header'
        }
      });
    }

    const apiKey = authHeader.substring(7); // Remove "Bearer "
    
    if (!API_KEYS[apiKey]) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid API key'
        }
      });
    }

    // Attach API key info to request
    req.apiKey = API_KEYS[apiKey];
    req.apiKey.key = apiKey;
    
    next();

  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Authentication failed'
      }
    });
  }
};

export const verifyWebhookSignature = (req, res, next) => {
  try {
    const signature = req.headers['x-sflow-signature'];
    const timestamp = req.headers['x-sflow-timestamp'];
    
    if (!signature || !timestamp) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Missing webhook signature or timestamp'
        }
      });
    }

    // Check timestamp to prevent replay attacks (5 minutes tolerance)
    const now = Math.floor(Date.now() / 1000);
    const webhookTimestamp = parseInt(timestamp);
    
    if (Math.abs(now - webhookTimestamp) > 300) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Webhook timestamp too old'
        }
      });
    }

    // Verify HMAC signature
    const webhookSecret = process.env.WEBHOOK_SECRET || 'default_webhook_secret';
    const payload = timestamp + '.' + JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');
    
    const receivedSignature = signature.replace('v1=', '');
    
    if (!crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(receivedSignature, 'hex')
    )) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid webhook signature'
        }
      });
    }

    next();

  } catch (error) {
    console.error('Webhook signature verification error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Webhook signature verification failed'
      }
    });
  }
};