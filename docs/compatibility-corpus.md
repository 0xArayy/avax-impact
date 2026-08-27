# Compatibility corpus

The machine-readable corpus is
[`fixtures/compatibility-corpus.json`](../fixtures/compatibility-corpus.json). Run it
against Avalanche Fuji with:

```bash
npm run verify:compatibility
```

Each case uses `prepareAttributedCall`, pins a block, requires the original baseline,
then either compares return data or records an attributed-only revert. The command exits
nonzero when the live result differs from the manifest.

## Evidence boundary

Version 1 contains three AVAX Impact-owned fixtures: two standard-ABI success paths and
one deliberately strict rejection path. It is useful as an engineering regression gate.
It is **not** evidence that third-party protocols are compatible, that state effects are
equal, or that any external team adopted AVAX Impact.

The market-validation H3 gate remains open until the corpus includes reproducible calls
for at least five commonly integrated C-Chain protocol contracts, including a
different-return or other blocked case. Every external entry must record:

- protocol and contract identity, source URL, chain, target, original calldata, and call
  context;
- why the call is representative rather than selected for a favorable result;
- the pinned block and both raw return values, or the attributed failure class;
- the date, SDK version/commit, RPC chain ID, and consent if a partner supplied the call;
- any known state-effect limitation that `eth_call` return comparison cannot observe.

Failed and ambiguous cases stay in the published corpus. They are not deleted to improve
the pass rate.
