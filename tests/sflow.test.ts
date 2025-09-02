import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;
const wallet3 = accounts.get("wallet_3")!;

describe("Bitcoin Payment Gateway", () => {
  it("ensures simnet is well initialised", () => {
    expect(simnet.blockHeight).toBeDefined();
  });

  describe("Phase 1: Foundation Layer", () => {
    it("allows merchant registration with yield settings", () => {
      const registerResult = simnet.callPublicFn(
        "bitcoin-payment-gateway",
        "register-merchant",
        [
          Cl.principal(wallet2),
          Cl.bool(true),
          Cl.uint(500),
          Cl.bool(false),
          Cl.uint(0)
        ],
        wallet1
      );

      expect(registerResult.result).toBeOk(Cl.bool(true));
    });

    it("prevents duplicate merchant registration", () => {
      simnet.callPublicFn(
        "bitcoin-payment-gateway",
        "register-merchant",
        [
          Cl.principal(wallet2),
          Cl.bool(true),
          Cl.uint(500),
          Cl.bool(false),
          Cl.uint(0)
        ],
        wallet1
      );

      const duplicateResult = simnet.callPublicFn(
        "bitcoin-payment-gateway",
        "register-merchant",
        [
          Cl.principal(wallet2),
          Cl.bool(true),
          Cl.uint(500),
          Cl.bool(false),
          Cl.uint(0)
        ],
        wallet1
      );

      expect(duplicateResult.result).toBeErr(Cl.uint(2001));
    });

    it("creates payment intent successfully", () => {
      simnet.callPublicFn(
        "bitcoin-payment-gateway",
        "register-merchant",
        [
          Cl.principal(wallet2),
          Cl.bool(true),
          Cl.uint(500),
          Cl.bool(false),
          Cl.uint(0)
        ],
        wallet1
      );

      const paymentId = Cl.bufferFromHex("1234567890123456");
      const createResult = simnet.callPublicFn(
        "bitcoin-payment-gateway",
        "create-payment-intent",
        [
          paymentId,
          Cl.principal(wallet1),
          Cl.uint(10000),
          Cl.principal("SP000000000000000000002Q6VF78.sbtc-token"),
          Cl.uint(1),
          Cl.uint(144)
        ],
        wallet2
      );

      expect(createResult.result).toBeOk(paymentId);
    });

    it("processes complete payment workflow", () => {
      simnet.callPublicFn(
        "bitcoin-payment-gateway",
        "register-merchant",
        [
          Cl.principal(wallet2),
          Cl.bool(true),
          Cl.uint(500),
          Cl.bool(false),
          Cl.uint(0)
        ],
        wallet1
      );

      const paymentId = Cl.bufferFromHex("1234567890123456");
      simnet.callPublicFn(
        "bitcoin-payment-gateway",
        "create-payment-intent",
        [
          paymentId,
          Cl.principal(wallet1),
          Cl.uint(10000),
          Cl.principal("SP000000000000000000002Q6VF78.sbtc-token"),
          Cl.uint(1),
          Cl.uint(144)
        ],
        wallet2
      );

      const processResult = simnet.callPublicFn(
        "bitcoin-payment-gateway",
        "process-payment",
        [paymentId],
        wallet2
      );

      expect(processResult.result).toBeOk(Cl.bool(true));

      const completeResult = simnet.callPublicFn(
        "bitcoin-payment-gateway",
        "complete-payment",
        [paymentId],
        wallet2
      );

      expect(completeResult.result).toBeOk(Cl.bool(true));
    });
  });

  describe("Phase 2: Multi-Layer Bitcoin Support", () => {
    it("validates all payment methods", () => {
      simnet.callPublicFn(
        "bitcoin-payment-gateway",
        "register-merchant",
        [
          Cl.principal(wallet2),
          Cl.bool(true),
          Cl.uint(500),
          Cl.bool(false),
          Cl.uint(0)
        ],
        wallet1
      );

      const methods = [1, 2, 3, 4];
      methods.forEach((method, index) => {
        const result = simnet.callPublicFn(
          "bitcoin-payment-gateway",
          "create-payment-intent",
          [
            Cl.bufferFromHex(`123456789012345${index}`),
            Cl.principal(wallet1),
            Cl.uint(10000),
            Cl.principal("SP000000000000000000002Q6VF78.sbtc-token"),
            Cl.uint(method),
            Cl.uint(144)
          ],
          wallet2
        );

        expect(result.result).toBeOk(Cl.bufferFromHex(`123456789012345${index}`));
      });
    });
  });

  describe("Phase 3: DeFi Features", () => {
    it("allocates yield for enabled merchants", () => {
      simnet.callPublicFn(
        "bitcoin-payment-gateway",
        "register-merchant",
        [
          Cl.principal(wallet2),
          Cl.bool(true),
          Cl.uint(1000),
          Cl.bool(false),
          Cl.uint(0)
        ],
        wallet1
      );

      const yieldResult = simnet.callPublicFn(
        "bitcoin-payment-gateway",
        "allocate-to-yield-pool",
        [
          Cl.principal(wallet1),
          Cl.uint(5000)
        ],
        wallet1
      );

      expect(yieldResult.result).toBeOk(Cl.uint(5000));
    });
  });

  describe("Phase 4: Enterprise Features", () => {
    it("creates subscriptions successfully", () => {
      simnet.callPublicFn(
        "bitcoin-payment-gateway",
        "register-merchant",
        [
          Cl.principal(wallet2),
          Cl.bool(true),
          Cl.uint(500),
          Cl.bool(false),
          Cl.uint(0)
        ],
        wallet1
      );

      const subscriptionId = Cl.bufferFromHex("abcdef1234567890");
      const subscriptionResult = simnet.callPublicFn(
        "bitcoin-payment-gateway",
        "create-subscription",
        [
          subscriptionId,
          Cl.principal(wallet1),
          Cl.uint(1000),
          Cl.uint(4320)
        ],
        wallet2
      );

      expect(subscriptionResult.result).toBeOk(subscriptionId);
    });

    it("enforces emergency pause authorization", () => {
      const unauthorizedResult = simnet.callPublicFn(
        "bitcoin-payment-gateway",
        "emergency-pause",
        [],
        wallet1
      );

      expect(unauthorizedResult.result).toBeErr(Cl.uint(1000));

      const authorizedResult = simnet.callPublicFn(
        "bitcoin-payment-gateway",
        "emergency-pause",
        [],
        deployer
      );

      expect(authorizedResult.result).toBeOk(Cl.bool(true));
    });
  });

  describe("Read-Only Functions", () => {
    it("calculates fees correctly", () => {
      const feeResult = simnet.callReadOnlyFn(
        "bitcoin-payment-gateway",
        "calculate-fees",
        [Cl.uint(10000)],
        wallet1
      );

      expect(feeResult.result).toBeTuple({
        "protocol-fee": Cl.uint(25),
        "net-amount": Cl.uint(9975)
      });
    });

    it("checks merchant registration status", () => {
      const unregisteredResult = simnet.callReadOnlyFn(
        "bitcoin-payment-gateway",
        "is-merchant-registered",
        [Cl.principal(wallet1)],
        wallet1
      );

      expect(unregisteredResult.result).toBeBool(false);

      simnet.callPublicFn(
        "bitcoin-payment-gateway",
        "register-merchant",
        [
          Cl.principal(wallet2),
          Cl.bool(true),
          Cl.uint(500),
          Cl.bool(false),
          Cl.uint(0)
        ],
        wallet1
      );

      const registeredResult = simnet.callReadOnlyFn(
        "bitcoin-payment-gateway",
        "is-merchant-registered",
        [Cl.principal(wallet1)],
        wallet1
      );

      expect(registeredResult.result).toBeBool(true);
    });
  });
});