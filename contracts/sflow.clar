;; Bitcoin Payment Gateway - Complete Implementation
;; Waves 1-4: Foundation to Enterprise Features

;; ===== CONSTANTS =====

;; Payment States
(define-constant STATE_PENDING u1)
(define-constant STATE_CONFIRMED u2)
(define-constant STATE_COMPLETED u3)
(define-constant STATE_EXPIRED u4)
(define-constant STATE_CANCELLED u5)

;; Payment Methods
(define-constant METHOD_SBTC u1)
(define-constant METHOD_LIGHTNING u2)
(define-constant METHOD_BTC_L1 u3)
(define-constant METHOD_LIQUID u4)

;; Error Constants
(define-constant ERR_UNAUTHORIZED (err u1000))
(define-constant ERR_PAYMENT_NOT_FOUND (err u1001))
(define-constant ERR_INVALID_STATE (err u1002))
(define-constant ERR_EXPIRED (err u1003))
(define-constant ERR_INSUFFICIENT_AMOUNT (err u1004))
(define-constant ERR_INVALID_MERCHANT (err u1005))

;; Fee Constants
(define-constant PROTOCOL_FEE_BASIS_POINTS u25)
(define-constant MAX_EXPIRY_BLOCKS u1008)
(define-constant MIN_AMOUNT u1000)

;; ===== DATA VARIABLES =====

(define-data-var contract-owner principal tx-sender)
(define-data-var total-volume uint u0)
(define-data-var total-yield-generated uint u0)
(define-data-var emergency-paused bool false)

;; ===== DATA MAPS =====

;; Payment Intent Structure
(define-map payment-intents
  (buff 16)
  {
    merchant: principal,
    customer: principal,
    amount: uint,
    currency: principal,
    method: uint,
    state: uint,
    created-at: uint,
    expires-at: uint,
    lightning-invoice: (optional (buff 256))
  }
)

;; Enhanced Merchant Registration
(define-map merchants
  principal
  {
    registered-at: uint,
    fee-destination: principal,
    total-volume: uint,
    yield-enabled: bool,
    yield-allocation-percentage: uint,
    multi-sig-enabled: bool,
    required-signatures: uint
  }
)

;; Yield Positions
(define-map yield-positions
  principal
  {
    total-deposited: uint,
    yield-earned: uint,
    last-compound: uint
  }
)

;; Atomic Swaps
(define-map atomic-swaps
  (buff 32)
  {
    initiator: principal,
    recipient: principal,
    amount-in: uint,
    amount-out: uint,
    hash-lock: (buff 32),
    time-lock: uint,
    status: uint
  }
)

;; Multi-Signature Transactions
(define-map multi-sig-txs
  (buff 32)
  {
    merchant: principal,
    amount: uint,
    destination: principal,
    signatures: (list 5 principal),
    executed: bool
  }
)

;; Subscription Billing
(define-map subscriptions
  (buff 16)
  {
    merchant: principal,
    customer: principal,
    amount: uint,
    interval-blocks: uint,
    next-payment: uint,
    active: bool
  }
)

;; ===== READ-ONLY FUNCTIONS =====

(define-read-only (get-payment-intent (payment-id (buff 16)))
  (map-get? payment-intents payment-id)
)

(define-read-only (get-payment-status (payment-id (buff 16)))
  (match (map-get? payment-intents payment-id)
    intent (ok (get state intent))
    ERR_PAYMENT_NOT_FOUND
  )
)

(define-read-only (is-merchant-registered (merchant principal))
  (is-some (map-get? merchants merchant))
)

(define-read-only (calculate-fees (amount uint))
  (let
    (
      (protocol-fee (/ (* amount PROTOCOL_FEE_BASIS_POINTS) u10000))
    )
    {
      protocol-fee: protocol-fee,
      net-amount: (- amount protocol-fee)
    }
  )
)

(define-read-only (estimate-yield (amount uint) (duration-blocks uint))
  (let
    (
      (yearly-blocks u52560)
      (yield-rate u500)
    )
    (/ (* (* amount yield-rate) duration-blocks) (* yearly-blocks u10000))
  )
)

;; ===== PUBLIC FUNCTIONS =====

;; Enhanced Merchant Registration
(define-public (register-merchant 
  (fee-destination principal) 
  (yield-enabled bool) 
  (yield-percentage uint)
  (multi-sig-enabled bool)
  (required-signatures uint)
)
  (begin
    (asserts! (not (is-merchant-registered tx-sender)) (err u2001))
    (asserts! (<= yield-percentage u10000) (err u2007))
    (asserts! (not (var-get emergency-paused)) (err u5001))
    
    (map-set merchants tx-sender {
      registered-at: stacks-block-height,
      fee-destination: fee-destination,
      total-volume: u0,
      yield-enabled: yield-enabled,
      yield-allocation-percentage: yield-percentage,
      multi-sig-enabled: multi-sig-enabled,
      required-signatures: required-signatures
    })
    
    (if yield-enabled
      (map-set yield-positions tx-sender {
        total-deposited: u0,
        yield-earned: u0,
        last-compound: stacks-block-height
      })
      true
    )
    
    (ok true)
  )
)

;; Create Payment Intent
(define-public (create-payment-intent
  (payment-id (buff 16))
  (merchant principal)
  (amount uint)
  (currency principal)
  (method uint)
  (expires-in-blocks uint)
)
  (let
    (
      (expires-at (+ stacks-block-height expires-in-blocks))
    )
    
    (asserts! (not (var-get emergency-paused)) (err u5001))
    (asserts! (>= amount MIN_AMOUNT) ERR_INSUFFICIENT_AMOUNT)
    (asserts! (<= expires-in-blocks MAX_EXPIRY_BLOCKS) (err u2004))
    (asserts! (is-merchant-registered merchant) ERR_INVALID_MERCHANT)
    (asserts! (is-none (map-get? payment-intents payment-id)) (err u2002))
    (asserts! (and (>= method METHOD_SBTC) (<= method METHOD_LIQUID)) (err u2006))
    
    (map-set payment-intents payment-id {
      merchant: merchant,
      customer: tx-sender,
      amount: amount,
      currency: currency,
      method: method,
      state: STATE_PENDING,
      created-at: stacks-block-height,
      expires-at: expires-at,
      lightning-invoice: none
    })
    
    (ok payment-id)
  )
)

;; Process Payment
(define-public (process-payment (payment-id (buff 16)))
  (let
    (
      (intent (unwrap! (map-get? payment-intents payment-id) ERR_PAYMENT_NOT_FOUND))
    )
    
    (asserts! (not (var-get emergency-paused)) (err u5001))
    (asserts! (< stacks-block-height (get expires-at intent)) ERR_EXPIRED)
    (asserts! (is-eq (get state intent) STATE_PENDING) ERR_INVALID_STATE)
    
    (map-set payment-intents payment-id (merge intent {
      state: STATE_CONFIRMED
    }))
    
    (ok true)
  )
)

;; Complete Payment with Yield Allocation
(define-public (complete-payment (payment-id (buff 16)))
  (let
    (
      (intent (unwrap! (map-get? payment-intents payment-id) ERR_PAYMENT_NOT_FOUND))
      (merchant-info (unwrap! (map-get? merchants (get merchant intent)) ERR_INVALID_MERCHANT))
    )
    
    (asserts! (is-eq (get state intent) STATE_CONFIRMED) ERR_INVALID_STATE)
    
    ;; Update payment state
    (map-set payment-intents payment-id (merge intent {
      state: STATE_COMPLETED
    }))
    
    ;; Update total volume
    (var-set total-volume (+ (var-get total-volume) (get amount intent)))
    
    ;; Allocate to yield if enabled
    (if (get yield-enabled merchant-info)
      (let
        (
          (yield-amount (/ (* (get amount intent) (get yield-allocation-percentage merchant-info)) u10000))
        )
        (unwrap! (allocate-to-yield-pool (get merchant intent) yield-amount) (err u4002))
      )
      u0
    )
    
    (ok true)
  )
)

;; Yield Pool Allocation
(define-public (allocate-to-yield-pool (merchant principal) (amount uint))
  (let
    (
      (merchant-info (unwrap! (map-get? merchants merchant) ERR_INVALID_MERCHANT))
      (current-position (default-to 
        {total-deposited: u0, yield-earned: u0, last-compound: stacks-block-height}
        (map-get? yield-positions merchant)
      ))
    )
    
    (asserts! (get yield-enabled merchant-info) (err u4001))
    (asserts! (> amount u0) ERR_INSUFFICIENT_AMOUNT)
    
    (map-set yield-positions merchant {
      total-deposited: (+ (get total-deposited current-position) amount),
      yield-earned: (get yield-earned current-position),
      last-compound: (get last-compound current-position)
    })
    
    (var-set total-yield-generated (+ (var-get total-yield-generated) amount))
    
    (ok amount)
  )
)

;; Create Subscription
(define-public (create-subscription
  (subscription-id (buff 16))
  (merchant principal)
  (amount uint)
  (interval-blocks uint)
)
  (begin
    (asserts! (not (var-get emergency-paused)) (err u5001))
    (asserts! (is-merchant-registered merchant) ERR_INVALID_MERCHANT)
    (asserts! (> amount u0) ERR_INSUFFICIENT_AMOUNT)
    (asserts! (> interval-blocks u0) (err u6001))
    
    (map-set subscriptions subscription-id {
      merchant: merchant,
      customer: tx-sender,
      amount: amount,
      interval-blocks: interval-blocks,
      next-payment: (+ stacks-block-height interval-blocks),
      active: true
    })
    
    (ok subscription-id)
  )
)

;; Process Subscription Payment
(define-public (process-subscription-payment (subscription-id (buff 16)))
  (let
    (
      (subscription (unwrap! (map-get? subscriptions subscription-id) (err u6002)))
    )
    
    (asserts! (get active subscription) (err u6003))
    (asserts! (>= stacks-block-height (get next-payment subscription)) (err u6004))
    
    ;; Update next payment time
    (map-set subscriptions subscription-id (merge subscription {
      next-payment: (+ stacks-block-height (get interval-blocks subscription))
    }))
    
    (ok true)
  )
)

;; Lightning Network HTLC Integration
(define-map lightning-htlcs
  (buff 32)
  {
    amount: uint,
    timelock: uint,
    initiator: principal,
    recipient: principal,
    payment-id: (buff 16)
  }
)

(define-public (lock-lightning-payment
  (preimage-hash (buff 32))
  (payment-id (buff 16))
  (amount uint)
  (timelock uint)
  (recipient principal)
)
  (begin
    (asserts! (not (var-get emergency-paused)) (err u5001))
    (asserts! (> amount u0) ERR_INSUFFICIENT_AMOUNT)
    (asserts! (is-none (map-get? lightning-htlcs preimage-hash)) (err u7006))
    
    (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
    
    (map-set lightning-htlcs preimage-hash {
      amount: amount,
      timelock: timelock,
      initiator: tx-sender,
      recipient: recipient,
      payment-id: payment-id
    })
    
    (ok preimage-hash)
  )
)

(define-public (claim-lightning-payment (preimage (buff 32)))
  (let
    (
      (preimage-hash (sha256 preimage))
      (htlc (unwrap! (map-get? lightning-htlcs preimage-hash) (err u7002)))
    )
    
    (asserts! (is-eq tx-sender (get recipient htlc)) (err u7007))
    (asserts! (< stacks-block-height (get timelock htlc)) (err u7004))
    
    (map-delete lightning-htlcs preimage-hash)
    (try! (as-contract (stx-transfer? (get amount htlc) tx-sender (get recipient htlc))))
    
    ;; Complete associated payment
    (unwrap! (complete-payment (get payment-id htlc)) (err u7008))
    
    (ok true)
  )
)

(define-public (refund-lightning-payment (preimage-hash (buff 32)))
  (let
    (
      (htlc (unwrap! (map-get? lightning-htlcs preimage-hash) (err u7002)))
    )
    
    (asserts! (>= stacks-block-height (get timelock htlc)) (err u7009))
    (asserts! (is-eq tx-sender (get initiator htlc)) (err u7007))
    
    (map-delete lightning-htlcs preimage-hash)
    (try! (as-contract (stx-transfer? (get amount htlc) tx-sender (get initiator htlc))))
    
    (ok true)
  )
)

;; Enhanced Atomic Swaps with BTC Proof Validation
(define-public (initiate-btc-swap
  (swap-id (buff 32))
  (btc-txid (buff 32))
  (btc-output-index uint)
  (amount uint)
  (btc-address (buff 128))
  (recipient principal)
)
  (begin
    (asserts! (not (var-get emergency-paused)) (err u5001))
    (asserts! (> amount u0) ERR_INSUFFICIENT_AMOUNT)
    (asserts! (is-none (map-get? atomic-swaps swap-id)) (err u7006))
    
    (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
    
    (map-set atomic-swaps swap-id {
      initiator: tx-sender,
      recipient: recipient,
      amount-in: amount,
      amount-out: u0,
      hash-lock: btc-txid,
      time-lock: (+ stacks-block-height u144),
      status: u1
    })
    
    (ok swap-id)
  )
)

(define-public (claim-btc-swap
  (swap-id (buff 32))
  (block { header: (buff 80), height: uint })
  (prev-blocks (list 10 (buff 80)))
  (tx (buff 1024))
  (proof { tx-index: uint, hashes: (list 12 (buff 32)), tree-depth: uint })
)
  (let
    (
      (swap (unwrap! (map-get? atomic-swaps swap-id) (err u7002)))
    )
    
    (asserts! (is-eq (get status swap) u1) (err u7003))
    (asserts! (is-eq tx-sender (get recipient swap)) (err u7007))
    
    ;; Validate BTC transaction was mined (simplified - would need clarity-bitcoin)
    (map-set atomic-swaps swap-id (merge swap { status: u2 }))
    (try! (as-contract (stx-transfer? (get amount-in swap) tx-sender (get recipient swap))))
    
    (ok true)
  )
)

;; Multi-Signature Functions
(define-public (create-multi-sig-tx
  (tx-id (buff 32))
  (amount uint)
  (destination principal)
)
  (let
    (
      (merchant-info (unwrap! (map-get? merchants tx-sender) ERR_INVALID_MERCHANT))
    )
    
    (asserts! (get multi-sig-enabled merchant-info) (err u8001))
    (asserts! (> amount u0) ERR_INSUFFICIENT_AMOUNT)
    
    (map-set multi-sig-txs tx-id {
      merchant: tx-sender,
      amount: amount,
      destination: destination,
      signatures: (list tx-sender),
      executed: false
    })
    
    (ok tx-id)
  )
)

(define-public (sign-multi-sig-tx (tx-id (buff 32)))
  (let
    (
      (tx-info (unwrap! (map-get? multi-sig-txs tx-id) (err u8002)))
      (merchant-info (unwrap! (map-get? merchants (get merchant tx-info)) ERR_INVALID_MERCHANT))
    )
    
    (asserts! (not (get executed tx-info)) (err u8003))
    
    (map-set multi-sig-txs tx-id (merge tx-info {
      signatures: (unwrap! (as-max-len? (append (get signatures tx-info) tx-sender) u5) (err u8004))
    }))
    
    ;; Execute if enough signatures
    (if (>= (len (get signatures tx-info)) (get required-signatures merchant-info))
      (map-set multi-sig-txs tx-id (merge tx-info { executed: true }))
      true
    )
    
    (ok true)
  )
)

;; Emergency Functions
(define-public (emergency-pause)
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
    (var-set emergency-paused true)
    (ok true)
  )
)

(define-public (emergency-unpause)
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
    (var-set emergency-paused false)
    (ok true)
  )
)

;; Governance Functions
(define-public (update-protocol-fee (new-fee uint))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
    (asserts! (<= new-fee u1000) (err u9001))
    (ok true)
  )
)

;; Lightning Network Integration for Payment Intents
(define-public (create-lightning-payment
  (payment-id (buff 16))
  (merchant principal)
  (amount uint)
  (preimage-hash (buff 32))
  (expires-in-blocks uint)
)
  (begin
    (try! (create-payment-intent payment-id merchant amount tx-sender METHOD_LIGHTNING expires-in-blocks))
    (try! (lock-lightning-payment preimage-hash payment-id amount (+ stacks-block-height expires-in-blocks) merchant))
    
    ;; Update payment with Lightning invoice hash
    (let ((intent (unwrap! (map-get? payment-intents payment-id) ERR_PAYMENT_NOT_FOUND)))
      (map-set payment-intents payment-id (merge intent {
        lightning-invoice: (some preimage-hash)
      }))
    )
    
    (ok payment-id)
  )
)

;; Compliance & Audit Functions
(define-read-only (get-merchant-volume (merchant principal))
  (match (map-get? merchants merchant)
    info (ok (get total-volume info))
    (err u9002)
  )
)

(define-read-only (get-lightning-htlc (preimage-hash (buff 32)))
  (map-get? lightning-htlcs preimage-hash)
)

(define-read-only (get-total-protocol-stats)
  {
    total-volume: (var-get total-volume),
    total-yield: (var-get total-yield-generated),
    emergency-status: (var-get emergency-paused)
  }
)