# How to run an AVAX Impact Fuji pilot

This guide takes an Avalanche design partner from a clean checkout to the verified
schema 1 Fuji proof, both preflight outcomes, and a participant-owned transaction
integration. Historical schema 0 reproduction is documented separately and is never
selected by the default SDK or CLI path.

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

## 2. Verify all Fuji evidence

```bash
npm run verify:fuji:all
```

Expected final line:

```text
Fuji schema 1 verification passed: source, bytecode, receipts, registry, attribution, and strict negative path agree.
```

This read-only command verifies both evidence generations. For the current path it
resolves immutable tag `fuji-schema1-v0.1.0`, rebuilds its source, compares all three
live runtime bytecodes, checks deployment and registration receipts, resolves the
standard registry record, decodes the confirmed schema 1 transaction, and exercises
the strict negative path. The historical schema 0 verifier remains a separate check.

If the public RPC is unavailable, set `FUJI_RPC_URL` to another Fuji C-Chain RPC and
repeat. An unavailable or mismatched RPC is a failed verification, not permission to
rely on the manifest alone.

## 3. Decode and resolve the current public sample

Build the SDK CLI:

```bash
npm run build --workspace @avax-impact/sdk
```

Decode the confirmed schema 1 transaction with a chain-ID check:

```bash
node packages/sdk/dist/src/cli.js decode-tx \
  --rpc https://api.avax-test.network/ext/bc/C/rpc \
  --hash 0x2e826a5bf4ff5c4058618d4a432ed925c86b79055cd03a0f4b7309f2faf03530 \
  --chain-id 43113
```

Verify that the JSON reports:

- `chainId: 43113`;
- `attribution.status: "declared"`;
- `declaration.schemaId: 1`;
- `declaration.registryAddress: "0x96951d7e43812474Bb4AF211dcCAd13080D44653"`;
- `declaration.registryChainId: 43113`;
- `declaration.codes: ["avax-impact"]`; and
- original calldata ending in `29`, the encoded argument to `ping(41)`.

Resolve the code through the standard registry reader:

```bash
node packages/sdk/dist/src/cli.js resolve \
  --rpc https://api.avax-test.network/ext/bc/C/rpc \
  --registry 0x96951d7e43812474Bb4AF211dcCAd13080D44653 \
  --code avax-impact
```

Expected status: `registered`. The record exposes owner-asserted public metadata and
does not authenticate the transaction producer.

The same flow is available without installation in the
[public workbench](https://avax-impact.0xarayy.workers.dev).

## 4. Reproduce both pinned-block comparison decisions

Choose a temporary public code for the rehearsal and validate its registry-policy form:

```bash
node packages/sdk/dist/src/cli.js validate --code partner-1
```

The code must be 3 to 32 bytes and contain lowercase letters, digits, and single
internal hyphens. The rehearsal code is a public declaration only; it is not registered
ownership.

### Compatible target

The calldata below calls the current positive demo target, whose ABI decoder accepts
trailing bytes.

```bash
node packages/sdk/dist/src/cli.js preflight \
  --rpc https://api.avax-test.network/ext/bc/C/rpc \
  --to 0xbDe66e5Ae9651C24173CC3DEFc5a4d5D7a186639 \
  --calldata 0x773acdef0000000000000000000000000000000000000000000000000000000000000029 \
  --code partner-1 \
  --registry 0x96951d7e43812474Bb4AF211dcCAd13080D44653 \
  --registry-chain-id 43113 \
  --value 0x0
```

Acceptance:

- `success` is `true`; and
- `compatibilityEvidence` is `return-data-match`;
- `originalReturnData` equals `attributedReturnData`; and
- `selectedCalldata` equals `attributedCalldata`.

### Strict target

The deployed `StrictCalldataDemo` requires exactly 36 calldata bytes and rejects the
suffix.

```bash
node packages/sdk/dist/src/cli.js preflight \
  --rpc https://api.avax-test.network/ext/bc/C/rpc \
  --to 0x752495F1423edE0606329fCC7bFC0B18FE3DD005 \
  --calldata 0x56a316bb0000000000000000000000000000000000000000000000000000000000000029 \
  --code partner-1 \
  --registry 0x96951d7e43812474Bb4AF211dcCAd13080D44653 \
  --registry-chain-id 43113 \
  --value 0x0
```

Acceptance:

- `success` is `false`;
- `status` is `fallback` because the original baseline passed and the attributed call
  reverted at the same pinned block;
- `selectedCalldata` is byte-identical to `originalCalldata`; and
- the original ends in `29`, the encoded argument to `strictPing(41)`.

RPC, HTTP, timeout, transport, and malformed-result errors return `status: "blocked"`
and `selectedCalldata: null` under the default policy. Do not sign; record them as
inconclusive infrastructure failures, not evidence that the target is incompatible.

## 5. Add preflight to the participant's transaction path

The SDK is not published to npm. For the pilot, download the immutable `v0.1.1` GitHub
release asset and keep it at a stable relative path inside the participant project. Run
this block from the participant project root:

```bash
mkdir -p vendor/avax-impact
curl --fail --location \
  https://github.com/0xArayy/avax-impact/releases/download/v0.1.1/avax-impact-sdk-0.1.1.tgz \
  --output vendor/avax-impact/avax-impact-sdk-0.1.1.tgz
printf '%s  %s\n' \
  194be1b0469271060ca6ee02dae2495ab516161d3736c07c4718972a864d8af8 \
  vendor/avax-impact/avax-impact-sdk-0.1.1.tgz | shasum -a 256 --check
npm install ./vendor/avax-impact/avax-impact-sdk-0.1.1.tgz
node --input-type=module --eval \
  'import("@avax-impact/sdk").then(({ prepareAttributedCall }) => console.log(typeof prepareAttributedCall))'
```

The checksum command must report `OK`, and the final command must print `function`. To
record the tarball checksum again, run:

```bash
shasum -a 256 vendor/avax-impact/avax-impact-sdk-0.1.1.tgz
```

`npm install` records
`file:vendor/avax-impact/avax-impact-sdk-0.1.1.tgz` in the participant project's
manifest and lockfile. The dependency therefore does not point at a disposable temp
directory. This is an immutable GitHub release snapshot until an npm release is linked
from [`packages/sdk/README.md`](../packages/sdk/README.md).

The generated tarball does not need to be committed unless the participant explicitly
chooses to vendor it. If it is not committed, the participant must preserve the pinned
release URL and checksum download step; a lockfile that references an absent tarball
cannot install on another machine or in CI. Do not republish the tarball.

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
  registryAddress: "0x96951d7e43812474Bb4AF211dcCAd13080D44653",
  registryChainId: 43113n,
});

if (prepared.status === "blocked") {
  throw new Error(`preflight inconclusive: ${prepared.failureKind}`);
}

recordPilotPreflight({
  target: targetAddress,
  success: prepared.success,
  originalCalldata: prepared.originalCalldata,
  attributedCalldata: prepared.attributedCalldata,
  selectedCalldata: prepared.selectedCalldata,
  error: prepared.success ? undefined : prepared.error,
});

await existingTrustedSigner.sendTransaction({
  to: targetAddress,
  value: transactionValue,
  data: prepared.selectedCalldata,
});
```

The default path requires both registry fields and always produces schema 1. Omitting
either field is a type error and a CLI validation error; it never falls back to schema
0. The address above is recorded with source, receipts, and bytecode in
[`deployments/fuji-schema1.json`](../deployments/fuji-schema1.json).

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

Confirm that `status` is `fallback` and `selectedCalldata` equals `originalCalldata`.
Use the original or do not send. Never send the rejected attributed payload. For RPC,
HTTP, timeout, transport, or malformed-result errors, confirm `status` is `blocked` and
do not sign any payload.

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
