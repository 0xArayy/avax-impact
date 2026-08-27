# Attribution formats and registry boundary

AVAX Impact implements two explicitly versioned formats:

| Format | Status | Registry context |
| --- | --- | --- |
| `erc-8021@457532f5c064a4619868ee5e4950f0cc32a7917e` | Locally implemented and tested schema 1 from the pinned upstream draft | Registry address and chain ID are encoded in the suffix |
| `avax-impact/schema-0@0.1.0` | Legacy AVAX Impact prototype used by the existing Fuji proof | No registry context in the suffix; consumers must supply the legacy registry separately |

The upstream document is pinned by immutable permalink:
[`ERCS/erc-8021.md`](https://github.com/ilikesymmetry/ERCs/blob/457532f5c064a4619868ee5e4950f0cc32a7917e/ERCS/erc-8021.md).
ERC-8021 remains a draft; this repository does not claim compliance with later commits
or finalization.

## Schema 1 layout

The SDK's schema 1 helpers implement this layout:

```text
<original calldata>
<20-byte registry address>
<big-endian registry chain ID>
<one-byte chain-ID length>
<ASCII builder codes joined by comma>
<one-byte builder-code payload length>
<one-byte schema ID: 0x01>
<16-byte marker: 0x80218021802180218021802180218021>
```

The decoder works backwards from the marker and returns the untouched original
calldata, codes, registry address, registry chain ID, complete suffix, and suffix length.
The local encoder uses a minimal big-endian chain-ID representation. The pinned draft
does not require minimality, so the decoder accepts any nonempty, nonzero representation
whose length fits the one-byte length field.

The published conformance vector from the pinned draft is exported through
`CONFORMANCE_VECTORS` and exercised by the SDK test suite. The format identifier is
exported as `ATTRIBUTION_FORMAT_VERSION`.

## Legacy schema 0 layout

The historical AVAX Impact Fuji transaction uses:

```text
<original calldata>
<UTF-8 builder codes joined by comma>
<one-byte builder-code payload length>
<one-byte schema ID: 0x00>
<16-byte marker: 0x80218021802180218021802180218021>
```

Example for original calldata `0x1234` and code `avax-impact`:

```text
original calldata  1234
code UTF-8          617661782d696d70616374
payload length      0b
schema              00
marker              80218021802180218021802180218021
```

Full calldata:

```text
0x1234617661782d696d706163740b0080218021802180218021802180218021
```

Schema 0 proves the wire-format prototype only. Because it carries no registry address
or chain ID, it must not be described as a canonical or interoperable registry binding.
Its format identifier is exported as `LEGACY_FORMAT_VERSION`.

## Wire codes versus registry policy

The pinned wire format accepts one or more comma-delimited codes when each code is:

- nonempty;
- 7-bit ASCII;
- free of commas;
- part of a joined payload no longer than 255 bytes.

Repeated codes and one-byte codes are valid wire data. The codec preserves their order
and does not apply a registry's naming policy.

The current AVAX Impact `BuilderRegistry` separately accepts one code per record using a
local 3–32 byte, lowercase-letter/digit/single-hyphen policy. That policy belongs to
`isValidCode` and registration, not to ERC-8021 decoding. `validateBuilderCode` and the
legacy resolver expose the AVAX Impact policy; `resolveCodeRegistry` can query other
registries using the broader draft wire-code bounds.

## Registry resolver ABI

The current local `BuilderRegistry` implements the read surface pinned by the draft:

```solidity
function payoutAddress(string calldata code) external view returns (address);
function codeURI(string calldata code) external view returns (string memory);
function isValidCode(string calldata code) external view returns (bool);
function isRegistered(string calldata code) external view returns (bool);
```

`codeURI` exposes the local record's `metadataURI`. `isValidCode` and `isRegistered` are
non-reverting. The payout and URI getters reject invalid, unknown, or inactive codes.
The project-specific `resolve` extension returns the full lifecycle record.

This is local ABI conformance, not a claim that Avalanche has selected this registry or
address. The existing Fuji registry at `0x8f13…549F` predates this interface. The SDK
therefore keeps two explicit readers:

- `resolveCodeRegistry` for the pinned `ICodeRegistry` ABI;
- `resolveLegacyBuilder` for the historical AVAX Impact Fuji extension.

No conformant schema 1 registry has yet been deployed on Fuji by this project.

## Decoder rules

A conforming AVAX Impact decoder must:

1. validate even-length hexadecimal input;
2. require the exact trailing marker;
3. distinguish supported schema IDs and reject unknown IDs;
4. read declared lengths without crossing the calldata start;
5. require nonempty, comma-free 7-bit ASCII codes and a payload of at most 255 bytes;
6. preserve registry-defined code spelling, order, and repetition;
7. for schema 1, reject a zero registry or empty/zero chain ID;
8. return the untouched original calldata and complete suffix.

Malformed attribution does not invalidate the underlying chain transaction. Consumers
should report it as malformed rather than silently treating it as a valid declaration.

## Compatibility

Many Solidity functions ignore trailing calldata after ABI decoding. This is not a
universal EVM guarantee for application behavior: a target can validate
`msg.data.length`, parse calldata in assembly, or route custom fallback logic.

`prepareAttributedCall` performs `eth_call` using attributed data and returns original
calldata on RPC error, revert, malformed response, or transport failure. Integrations
should provide the real `from` and `value`. Even then, simulation at `latest` cannot
guarantee later inclusion-state execution.

## Trust model

The suffix is a public declaration, not a signature. Registry control makes metadata
and lifecycle inspectable but does not prove that a transaction sender was authorized
by the builder. Codes are spoofable. Indexers and dashboards must label the data as
declared attribution and must not use it alone as an access-control, payment, reward, or
grant-allocation oracle.
