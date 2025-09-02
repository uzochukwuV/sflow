export const validatePaymentIntent = (req, res, next) => {
  const { merchant, amount, currency, method } = req.body;
  const errors = [];

  // Validate required fields
  if (!merchant) {
    errors.push('merchant is required');
  }
  
  if (!amount || amount <= 0) {
    errors.push('amount must be a positive number');
  }
  
  if (!currency) {
    errors.push('currency is required');
  }
  
  if (!method || ![1, 2, 3, 4].includes(parseInt(method))) {
    errors.push('method must be 1 (sBTC), 2 (Lightning), 3 (BTC L1), or 4 (Liquid)');
  }

  // Validate amount ranges
  if (amount && amount < 1000) { // MIN_AMOUNT from contract
    errors.push('amount must be at least 1000 units');
  }
  
  if (amount && amount > 1000000000) { // Reasonable upper limit
    errors.push('amount exceeds maximum limit');
  }

  // Validate expires_in_blocks
  const expiresInBlocks = req.body.expires_in_blocks;
  if (expiresInBlocks && (expiresInBlocks < 1 || expiresInBlocks > 1008)) {
    errors.push('expires_in_blocks must be between 1 and 1008');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        details: errors
      }
    });
  }

  next();
};

export const validateMerchantRegistration = (req, res, next) => {
  const { 
    fee_destination, 
    yield_enabled, 
    yield_percentage,
    multi_sig_enabled,
    required_signatures 
  } = req.body;
  const errors = [];

  if (!fee_destination) {
    errors.push('fee_destination is required');
  }

  if (typeof yield_enabled !== 'boolean') {
    errors.push('yield_enabled must be a boolean');
  }

  if (yield_enabled && (!yield_percentage || yield_percentage < 0 || yield_percentage > 10000)) {
    errors.push('yield_percentage must be between 0 and 10000 (100%)');
  }

  if (typeof multi_sig_enabled !== 'boolean') {
    errors.push('multi_sig_enabled must be a boolean');
  }

  if (multi_sig_enabled && (!required_signatures || required_signatures < 1 || required_signatures > 5)) {
    errors.push('required_signatures must be between 1 and 5');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        details: errors
      }
    });
  }

  next();
};