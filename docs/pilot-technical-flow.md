# How to run an AVAX Impact Fuji pilot

This guide takes an Avalanche design partner from a clean checkout to a verified legacy
Fuji proof, both preflight outcomes, and a participant-owned transaction integration.
The existing public proof uses schema 0. Schema 1 is local-only until a new conformant
Fuji deployment is published.

## Prerequisites

- Node.js 22.13 or newer, npm, Git, and Foundry 1.2.3 or newer
- outbound access to Avalanche Fuji C-Chain RPC
- a dedicated, low-value Fuji account for the optional write step
- an existing transaction-building path for the external integration

The SDK is not published to npm. Run this guide from a checkout of
<https://github.com/0xArayy/avax-impact>. Never send a private key, seed phrase,
authenticated RPC URL, or production user data to AVAX Impact.

## 1. Build and test the public checkout

```bash
git clone https://github.com/0xArayy/avax-impact.git
cd avax-impact
npm ci
npm --prefix demo ci
npm run check
```

`npm run check` is the repository-wide gate. It builds and tests the SDK and contracts,
builds and tests the workbench, lints the web code, checks Solidity formatting, and
validates the shell scripts.

## 2. Verify the historical Fuji proof

```bash
npm run verify:fuji
```

Expected final line:

```text
Fuji verification passed: source, bytecode, receipts, registry, attribution, and strict fallback agree.
```

This read-only command rebuilds source commit `0c0665124ed8f1edc5372ed48c77a92a941d08be`,
compares live runtime bytecode, checks recorded receipts, resolves the legacy registry
record, decodes the historical transaction, and exercises the strict negative path. It
does not verify schema 1.

If the public RPC is unavailable, set `FUJI_RPC_URL` to another Fuji C-Chain RPC and
repeat. An unavailable or mismatched RPC is a failed verification, not permission to
rely on the manifest alone.

## 3. Decode and resolve the public sample

Build the SDK CLI:

```bash
npm run build --workspace @avax-impact/sdk
```

Decode the confirmed schema 0 transaction with a chain-ID check:

```bash
node packages/sdk/dist/src/cli.js decode-tx \
  --rpc https://api.avax-test.network/ext/bc/C/rpc \
  --hash 0x33c0fb7ee4f48276dd237d67c4f8186b2416d2a033a90068d12efed63c8f0821 \
  --chain-id 43113
```

Verify that the JSON reports:

- `chainId: 43113`;
- `attribution.status: "declared"`;
- `declaration.schemaId: 0`;
- `declaration.codes: ["avax-impact"]`; and
- original calldata ending in `29`, the encoded argument to `ping(41)`.

Resolve the code through the explicitly legacy reader:

```bash
node packages/sdk/dist/src/cli.js resolve \
  --rpc https://api.avax-test.network/ext/bc/C/rpc \
  --registry 0x8f13a300f2773EB6fa071B9196f6e16129F2549F \
  --code avax-impact \
  --kind legacy
```

Expected status: `registered-active`. This lookup describes the old AVAX Impact
extension record. It is not a pinned `ICodeRegistry` schema 1 resolution and does not
authenticate the transaction producer.

The same flow is available without installation in the
[public workbench](https://avax-impact.0xarayy.workers.dev).

## 4. Reproduce both exact-call decisions

Choose a temporary public code for the rehearsal and validate its registry-policy form:

```bash
node packages/sdk/dist/src/cli.js validate --code partner-1
```

The code must be 3 to 32 bytes and contain lowercase letters, digits, and single
internal hyphens. The rehearsal code is a public declaration only; it is not registered
ownership.

### Compatible target

The calldata below reads `avax-impact` from the historical registry. Its standard ABI
decoder accepts trailing bytes.

```bash
node packages/sdk/dist/src/cli.js preflight \
  --rpc https://api.avax-test.network/ext/bc/C/rpc \
  --to 0x8f13a300f2773EB6fa071B9196f6e16129F2549F \
  --calldata 0x461a44780000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000b617661782d696d70616374000000000000000000000000000000000000000000 \
  --code partner-1 \
  --value 0x0
```

Acceptance:

- `success` is `true`; and
- `selectedCalldata` equals `attributedCalldata`.

### Strict target

The deployed `StrictCalldataDemo` requires exactly 36 calldata bytes and rejects the
suffix.

```bash
node packages/sdk/dist/src/cli.js preflight \
  --rpc https://api.avax-test.network/ext/bc/C/rpc \
  --to 0x854595b7260f1325f643dd732F926c6B5da3bf8E \
  --calldata 0x56a316bb0000000000000000000000000000000000000000000000000000000000000029 \
  --code partner-1 \
  --value 0x0
```

Acceptance:

- `success` is `false`;
- `selectedCalldata` is byte-identical to `originalCalldata`; and
- the original ends in `29`, the encoded argument to `strictPing(41)`.

RPC and transport errors also select the original calldata. Record them as failed
preflights, not evidence that the target is incompatible.

## 5. Add preflight to the participant's transaction path

The SDK is not published to npm. For the pilot, build a package tarball and keep it at a
stable relative path inside the participant project. Run this block from the participant
project root:

```bash
mkdir -p vendor/avax-impact
AVAX_IMPACT_SOURCE="$(mktemp -d)"
git clone --depth 1 https://github.com/0xArayy/avax-impact.git "$AVAX_IMPACT_SOURCE"
git -C "$AVAX_IMPACT_SOURCE" rev-parse HEAD
npm --prefix "$AVAX_IMPACT_SOURCE" ci
npm --prefix "$AVAX_IMPACT_SOURCE" run build --workspace @avax-impact/sdk
npm pack "$AVAX_IMPACT_SOURCE/packages/sdk" --pack-destination ./vendor/avax-impact
npm install ./vendor/avax-impact/avax-impact-sdk-0.1.0.tgz
node --input-type=module --eval \
  'import("@avax-impact/sdk").then(({ prepareAttributedCall }) => console.log(typeof prepareAttributedCall))'
```

The final command must print `function`. Record the full source commit printed by
`git rev-parse` and the tarball checksum with:

```bash
shasum -a 256 vendor/avax-impact/avax-impact-sdk-0.1.0.tgz
```

`npm install` records
`file:vendor/avax-impact/avax-impact-sdk-0.1.0.tgz` in the participant project's
manifest and lockfile. The dependency therefore does not point at a disposable temp
directory. This is a pilot-only snapshot until an immutable npm release is linked from
[`packages/sdk/README.md`](../packages/sdk/README.md).

The generated tarball does not need to be committed unless the participant explicitly
chooses to vendor it. If it is not committed, the participant must preserve a repeatable
build step using the recorded source commit; a lockfile that references an absent
tarball cannot install on another machine or in CI. Do not publish the tarball as an
official AVAX Impact release.

After installation, insert the check immediately after preparing original calldata and
immediately before the existing signer call:

```ts
import { prepareAttributedCall } from "@avax-impact/sdk";

const originalCalldata = encodeTheExistingTargetCall();
const prepared = await prepareAttributedCall({
  rpcUrl: fujiRpcUrl,
  to: targetAddress,
  from: fujiSenderAddress,
  value: transactionValue,
  calldata: originalCalldata,
  codes: [pilotBuilderCode],
});

recordPilotPreflight({
  target: targetAddress,
  success: prepared.success,
  originalCalldata: prepared.originalCalldata,
  attributedCalldata: prepared.attributedCalldata,
  selectedCalldata: prepared.selectedCalldata,
  error: prepared.error,
});

await existingTrustedSigner.sendTransaction({
  to: targetAddress,
  value: transactionValue,
  data: prepared.selectedCalldata,
});
```

For this current Fuji pilot, omitting registry fields intentionally produces legacy
schema 0. Do not add the historical registry as schema 1 context. When a new conformant
Fuji registry is publicly verified, schema 1 will require its published address as
`registryAddress` and `43113n` as `registryChainId`. Supplying only one registry field is
rejected. Until the new address and manifest exist,
schema 1 is a local conformance exercise and cannot count as a Fuji pilot transaction.

## 6. Confirm and independently decode a participant transaction

The signer, wallet, or backend returns a Fuji transaction hash. First require a
successful receipt with a non-null block using the participant's normal client or an
Avalanche explorer. Then have a second person run:

```bash
./node_modules/.bin/avax-impact decode-tx \
  --rpc https://api.avax-test.network/ext/bc/C/rpc \
  --hash "$PARTICIPANT_FUJI_TX_HASH" \
  --chain-id 43113
```

Set `PARTICIPANT_FUJI_TX_HASH` to the complete 32-byte public hash returned by the
participant's signer before running the command. Never substitute a private key or
signed raw transaction. The
decoded `originalCalldata` must equal the recorded pre-attribution input and the code
must equal the participant's intended public declaration.

Only publish the hash as linked pilot evidence if the participant selected that consent
option in the [field guide](pilot-field-guide.md). An onchain transaction is public, but
linking it to an interviewed team adds new context.

## 7. Complete the acceptance record

Record:

- clean-checkout start and first successful build time;
- first-attempt result before maintainer help;
- target, original payload hash, selected payload hash, and preflight result;
- any fallback error class and whether the transaction was sent;
- confirmed hash, receipt status, and block for consented evidence;
- total engineering time and every required code or architecture change; and
- independent decoder identity as an anonymous role, not personal contact data.

Apply the exact gates in [the pilot program](pilot-program.md). Failed and abandoned
attempts remain part of the result.

## Troubleshooting

### `fetch failed` or timeout

The RPC could not complete the read. Retry with another Fuji endpoint. Preflight must
remain failed until an exact call returns a valid hex result.

### `unexpected chain ID`

Stop. The CLI compared the RPC to Fuji chain ID `43113` and found another network. Do
not remove the check to make the command pass.

### `execution reverted`

Confirm that `selectedCalldata` equals `originalCalldata`. Use the original or do not
send. Never send the rejected attributed payload.

### Signer sends different calldata

Stop the pilot path and record a wallet-path incompatibility. The confirmed transaction
must contain the exact selected bytes.

### The target call uses value or sender-dependent logic

Use the TypeScript API and provide the real `from` and canonical JSON-RPC `value`, such
as `0x0` or `0x2a`. A rehearsal without the relevant context is not acceptance evidence.

## Related

- [Pilot acceptance and stop rules](pilot-program.md)
- [Discovery, consent, evidence, and feedback](pilot-field-guide.md)
- [SDK API and CLI reference](../packages/sdk/README.md)
- [Fuji verification runbook](fuji-runbook.md)
