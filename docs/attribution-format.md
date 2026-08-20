# Attribution format v0

AVAX Impact v0 uses ERC-8021 schema 0 and its fixed 16-byte marker.

## Wire layout

```text
<original calldata>
<UTF-8 builder codes joined by comma>
<one-byte builder-code payload length>
<one-byte schema ID: 0x00>
<16-byte marker: 0x80218021802180218021802180218021>
```

Decoders work backwards from the marker, so the original function calldata does not need
to be ABI-decoded to find the attribution.

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

## Builder-code rules

- 3–32 UTF-8 bytes per code;
- lowercase letters, digits, and single internal hyphens only;
- no leading, trailing, or consecutive hyphens;
- up to four distinct codes;
- comma-joined payload no longer than 255 bytes.

The onchain registry applies the same per-code normalization rules. Multiple-code order is
preserved and can represent a chain of contributing applications, but v0 assigns no
economic weight to position.

## Decoder rules

A conforming decoder must:

1. validate even-length hexadecimal input;
2. require the exact trailing marker;
3. reject unknown schema IDs;
4. read the declared payload length without crossing the calldata start;
5. require valid UTF-8 and valid builder codes;
6. return the untouched original calldata and the complete suffix.

Malformed input is not attribution. It does not invalidate the underlying chain
transaction.

## Compatibility

Many Solidity functions ignore trailing calldata after ABI decoding. This is not a
universal EVM guarantee for application behavior: a target can explicitly validate
`msg.data.length`, parse calldata in assembly, or route custom fallback logic. Integration
must therefore be explicit and the exact call should be simulated before signing.

The SDK helper `prepareAttributedCall` performs `eth_call` with the attributed data. On an
RPC error, revert, malformed response, or transport failure it returns the original
calldata as `selectedCalldata`.

## Trust model

The suffix is a public declaration, not a signature. Registry ownership makes code
metadata and lifecycle auditable but does not prove that a particular sender was
authorized by the builder. Indexers and dashboards must label v0 data as declared
attribution and must not use it as an access-control or payment oracle.

