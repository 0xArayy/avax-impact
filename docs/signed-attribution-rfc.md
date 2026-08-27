# RFC: separately versioned signed attribution

Status: **design only; not implemented and not part of the pinned ERC-8021 schema 1
claim**.

Public builder codes are copyable declarations. A registry record can describe who
controls a code, but the current suffix cannot prove that owner authorized a particular
transaction. This RFC defines the boundary for evaluating an optional signed mode
without silently changing the existing wire format.

## Security goal

A verifier should be able to establish that a registry owner or explicitly delegated
signer authorized a declaration for one call context. The signature does not prove that
the signer built the transaction, that the user saw it, or that execution produced the
expected state effects. It must never become transaction authorization or an automatic
payment entitlement.

## Candidate signed message

Use EIP-712 with a versioned domain and a message containing at least:

```text
AttributionAuthorization(
  uint256 chainId,
  address registry,
  bytes32 builderCodeHash,
  address from,
  address to,
  uint256 value,
  bytes32 originalCalldataHash,
  uint256 nonce,
  uint64 validAfter,
  uint64 validUntil
)
```

The domain must include a distinct name and version. Chain, registry, target, sender,
value, and original calldata are bound explicitly to prevent cross-chain, cross-registry,
cross-target, and call-substitution replay. Nonce and a short validity window limit
reuse. A design that allows wildcard fields requires a separate threat review and must
be visibly distinguishable to verifiers.

## Verification requirements

1. Decode a new, unambiguous schema identifier; never reinterpret schema 0 or the pinned
   schema 1 payload.
2. Reconstruct the original calldata and EIP-712 digest with exact chain/call context.
3. Recover an EOA signer or validate an ERC-1271 signature without unbounded external
   calls.
4. Resolve registry ownership/delegation at an explicit reference block and report that
   block. Current ownership alone cannot authenticate historical declarations.
5. Check validity and nonce/revocation rules. A verifier that cannot complete every check
   returns `unverified`, not `declared-signed`.
6. Preserve the raw signature, registry, schema revision, and reason for any verification
   failure in exports.

## Open decisions and stop conditions

- A full signature materially increases suffix size and may worsen strict-calldata
  compatibility. Content-addressed offchain signatures add availability and substitution
  risks.
- Registry delegation, key rotation, historical state, contract-wallet validation, and
  nonce storage all add security and operational surface.
- The design proceeds only if discovery shows that declared attribution is useful but
  spoofability blocks a real pilot. It stops if users actually require transaction
  authorization, private attribution, or payment enforcement.

Before implementation, publish test vectors, independent threat-model review, gas and
calldata-size measurements, compatibility results, and migration rules. Until then the
product must continue to say **declared attribution**, not verified builder identity.
