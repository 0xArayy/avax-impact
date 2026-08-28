# Compatibility corpus

The machine-readable corpus is
[`fixtures/compatibility-corpus.json`](../fixtures/compatibility-corpus.json).

```bash
npm run verify:compatibility
```

Every case uses schema 1 and `prepareAttributedCall`. It pins one block per call,
requires the untouched baseline, then compares return data or records the typed failure
stage. Live drift exits nonzero.

## Current coverage

| Surface | Network | Call | Expected result |
| --- | --- | --- | --- |
| AVAX Impact registry | Fuji | builder record read | return-data match |
| AVAX Impact demo | Fuji | `ping(41)` | return-data match |
| AVAX Impact strict demo | Fuji | `strictPing(41)` | attributed-only revert, tested-original fallback |
| Aave V3 Pool | C-Chain | reserve enumeration | return-data match |
| LFJ Liquidity Book V2.2 | C-Chain | factory pair count | return-data match |
| Circle USDC | C-Chain | token decimals | return-data match |
| BENQI sAVAX | C-Chain | total supply | return-data match |
| Chainlink AVAX/USD | C-Chain | latest round data | return-data match |
| Aave V3 Pool | C-Chain | borrow without collateral | original baseline blocked; no selected calldata |

Addresses are linked to official protocol documentation or maintained address books in
the fixture. The Aave blocked case is a safety control, not a trailing-calldata
incompatibility claim: the untouched call fails first, so the SDK correctly refuses to
evaluate or expose an attributed transaction.

## Evidence boundary

These are public read-only engineering checks. They do not prove:

- that any protocol team reviewed, endorsed, or adopted AVAX Impact;
- that all functions on the tested contracts accept suffixes;
- that matching return data implies matching writes, logs, gas, or future execution;
- that a passing call remains valid after contract upgrades or state changes.

Failed and ambiguous cases remain in the corpus. Scheduled CI repeats the checks so a
protocol upgrade or RPC behavior change becomes visible rather than silently improving a
marketing pass rate.
