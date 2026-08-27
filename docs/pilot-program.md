# AVAX Impact design-partner pilot

This document defines who the pilot is for, what counts as an external result, and when
to stop. It is the program reference. Use the [technical flow](pilot-technical-flow.md)
for implementation and the [field guide](pilot-field-guide.md) for interviews, consent,
and evidence capture.

## Pilot question

Can an Avalanche C-Chain app, wallet, bot, or agent add a public declaration of its
transaction-building surface, preserve execution safety, and let another person recover
that declaration from a confirmed Fuji transaction without a proxy or target-contract
change?

Attribution is a **public declaration**, not identity, authorization, authorship, or a
right to payment. A builder code is visible and copyable. Every pilot result and export
must retain that trust boundary.

## Who fits

A participant qualifies when all of these are true:

- the team currently constructs Avalanche C-Chain transactions for users or automation;
- at least one relevant transaction calls a third-party contract directly;
- the participant owns or directly operates the transaction-building or analytics flow;
- the team can test with a dedicated Fuji account and public testnet transactions; and
- the team can describe its current origin/reporting workflow before seeing AVAX Impact.

Good initial participants include C-Chain apps, wallets, trading or operations bots,
account-abstraction clients, and agent backends that prepare calls to contracts they do
not control.

## Who does not fit

Do not count a participant as qualified when the team:

- only receives transactions at its own protocol and does not build them;
- is not building for Avalanche;
- needs cryptographic proof of builder identity, private attribution, automatic rewards,
  or an authorization mechanism;
- cannot expose any pilot transaction on Fuji; or
- is looking for a general analytics dashboard rather than an origin signal.

A useful negative interview can still be recorded. It does not count as a qualified
pilot or integration.

## Current and future evidence

| Surface | Available now | What it proves | What it does not prove |
| --- | --- | --- | --- |
| Historical Fuji transaction | Legacy schema 0 declaration and legacy AVAX Impact registry lookup | The recorded source, transaction, suffix, and registry record can be independently reproduced | ERC-8021 schema 1 interoperability or third-party adoption |
| Pinned-block preflight | Original and schema 0 attributed payloads are called with identical context at one pinned block; fallback is available only when the original succeeds and the attributed call reverts | Matching return data or a baseline-verified fallback at that block | Equal state effects, later inclusion, semantic equivalence under changed state, or universal compatibility |
| Local schema 1 implementation | Codec, vectors, CLI, and pinned `ICodeRegistry` reader are tested locally | Behavior against draft commit `457532f5c064a4619868ee5e4950f0cc32a7917e` | A schema 1 Fuji deployment, Avalanche endorsement, or a finalized ERC |
| Future schema 1 Fuji proof | Not delivered | Nothing may be claimed yet | It must not be inferred from the legacy address or transaction |

The existing Fuji registry at
`0x8f13a300f2773EB6fa071B9196f6e16129F2549F` is legacy. Do not use it as a schema 1
registry address. A schema 1 Fuji result counts only after a new conformant registry,
confirmed transaction, versioned manifest, and read-only verifier are public.

## Pilot stages

### 1. Discovery before demonstration

Run a 15 to 30 minute interview using the [field guide](pilot-field-guide.md). Ask about
a recent reporting task and the current workaround before naming AVAX Impact or showing
the workbench. Record negative evidence and priority honestly.

### 2. Independent read-only rehearsal

Give the participant the [technical flow](pilot-technical-flow.md) without pairing on
the first attempt. They should verify the historical proof, decode the sample, and run
both the compatible and strict preflight paths.

### 3. Participant-owned Fuji integration

The participant adds `prepareAttributedCall` to its own transaction-building path,
supplies the real `from`, `to`, `value`, and calldata, and hands only
non-null `selectedCalldata` to its existing trusted signer. A `blocked` result must stop
the handoff. AVAX Impact must never receive the key or seed phrase.

### 4. Confirmation and independent recovery

After a successful Fuji receipt, decode the transaction from a chain-checked RPC. A
different person should recover the declared code and original calldata using the CLI
or public workbench. Confirmation requires a non-null block and successful receipt;
use `decode-tx --confirmed`; plain `decode-tx` is inspection-only.

### 5. Feedback and evidence decision

Measure elapsed engineering time, changes required, fallback events, abandoned attempts,
and whether the signal solves the original job. Publish a team name, quote, repository,
or transaction-to-team link only under the participant's explicit consent choices.

## Acceptance criteria

### Individual integration

An external pilot passes only when all of these are true:

1. A qualified participant completed discovery before the product demonstration.
2. The participant completed the first public-doc attempt without maintainer pairing;
   any later help and its duration are recorded.
3. The compatible sample produced equal original/attributed return data and selected
   attributed calldata; the strict sample first passed its original baseline and then
   selected byte-identical original calldata after the attributed call reverted.
4. The participant integrated into a transaction path it operates without modifying the
   target contract, deploying a routing proxy, or forking a wallet.
5. The integration supplied the real simulation context for every field relevant to
   execution, including `from` and nonzero `value` when applicable.
6. At least one participant-generated Fuji transaction has a successful receipt, a
   non-null block, decodable declared attribution, and original calldata identical to
   the pre-attribution input.
7. A second person independently decoded the confirmed transaction from its public hash.
8. Total engineering time was no more than one working day. A longer attempt remains
   useful evidence but is recorded as a failed adoption threshold.

Self-generated AVAX Impact transactions, a positive interview, an encoded payload that
was never confirmed, or a maintainer-run integration do not satisfy this gate.

### Program thresholds

These are targets, not current achievements:

- 10 qualified discovery interviews;
- at least 5 teams describe the origin gap unprompted or show a manual workaround;
- at least 3 teams agree to a technical pilot;
- 2 independent teams pass the individual integration gate;
- at least 50 confirmed attributed Fuji transactions across those two pilots;
- zero cases where attributed calldata is selected after baseline failure, attributed
  call failure, or a return-data mismatch; and
- one independent analyst reproduces the published pilot count from public chain data.

## Fallback and stop criteria

| Observation | Required action | Result classification |
| --- | --- | --- |
| Original `eth_call` succeeds and attributed `eth_call` returns a recognized execution revert at the same block | Use the byte-identical tested original under `revert-only`, or do not send | Baseline-verified fallback; record target and error class |
| Original call fails or successful calls return different data | Select nothing and investigate | Compatibility blocked |
| RPC is unavailable, times out, or is malformed | Keep the default `blocked` result; do not sign or infer compatibility | Infrastructure block |
| Successful simulation changes expected semantics | Stop attribution for that target and investigate | Incompatible until explained |
| Signer or wallet changes `selectedCalldata` | Stop and record the integration as blocked | Wallet-path incompatibility |
| Integration requires target changes, proxy routing, custody, or a wallet fork | Stop the pilot path | Adoption threshold failed |
| Any request for a key, seed phrase, production customer data, or authenticated RPC URL | Stop immediately | Security/privacy violation |
| No working integration within one engineering day | End the timebox and record the blocker | Individual threshold failed |
| Fewer than 3 of 10 teams rank the job among their top three reporting problems, or no team tests | Do not expand scope | Demand hypothesis materially weakened |
| Public-code spoofability makes the signal unusable for the stated job | Do not relabel it as identity | Investigate a separately versioned signature design or stop |

Do not move a failing target from fallback to attributed calldata to improve pilot
numbers. Safe execution is more important than attribution volume.

## Related evidence

- [Market validation hypotheses and falsification thresholds](market-validation.md)
- [Attribution formats and trust model](attribution-format.md)
- [Historical Fuji manifest](../deployments/fuji.json)
- [Current acceptance matrix](acceptance-matrix.md)
