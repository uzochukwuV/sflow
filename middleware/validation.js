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
      error: { message: 'Validation failed', details: errors }
    });
  }

  next();
};

export const validateLightningLock = (req, res, next) => {
  const { payment_id, amount, preimage_hash, recipient } = req.body;
  const errors = [];

  if (!payment_id || !/^[0-9a-fA-F]{32}$/.test(payment_id)) {
    errors.push('payment_id must be a 32-character hex string');
  }

  if (!amount || amount <= 0) {
    errors.push('amount must be a positive number');
  }

  if (!preimage_hash || !/^[0-9a-fA-F]{64}$/.test(preimage_hash)) {
    errors.push('preimage_hash must be a 64-character hex string');
  }

  if (!recipient) {
    errors.push('recipient is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: { message: 'Validation failed', details: errors }
    });
  }

  next();
};

export const validateAtomicSwap = (req, res, next) => {
  const { btc_txid, amount, btc_address, recipient } = req.body;
  const errors = [];

  if (!btc_txid || !/^[0-9a-fA-F]{64}$/.test(btc_txid)) {
    errors.push('btc_txid must be a 64-character hex string');
  }

  if (!amount || amount <= 0) {
    errors.push('amount must be a positive number');
  }

  if (!btc_address) {
    errors.push('btc_address is required');
  }

  if (!recipient) {
    errors.push('recipient is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: { message: 'Validation failed', details: errors }
    });
  }

  next();
};

export const validateMultiSigTx = (req, res, next) => {
  const { amount, destination } = req.body;
  const errors = [];

  if (!amount || amount <= 0) {
    errors.push('amount must be a positive number');
  }

  if (!destination) {
    errors.push('destination is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: { message: 'Validation failed', details: errors }
    });
  }

  next();
};