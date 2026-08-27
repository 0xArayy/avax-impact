const HASH_PATTERN = /^0x[0-9a-fA-F]{64}$/;
const ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/;
const HEX_PATTERN = /^0x(?:[0-9a-fA-F]{2})*$/;
const CODE_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** ABI calldata for StrictCalldataDemo.strictPing(41) on Fuji. */
export const SAMPLE_STRICT_CALLDATA =
  "0x56a316bb0000000000000000000000000000000000000000000000000000000000000029";

/** Build a complete recoverable sample instead of preserving stale invalid form context. */
export function createPreflightSample({ to, calldata }) {
  return {
    to,
    calldata,
    codesInput: "avax-impact",
    from: "",
    value: "0x0",
  };
}

/** @param {string} value */
export function validateTransactionHash(value) {
  return HASH_PATTERN.test(value.trim())
    ? null
    : "Enter a complete 32-byte transaction hash starting with 0x.";
}

/** @param {string} value */
export function validateAddress(value) {
  return ADDRESS_PATTERN.test(value.trim())
    ? null
    : "Enter a 20-byte EVM address starting with 0x.";
}

/** @param {string} value */
export function validateCalldata(value) {
  return HEX_PATTERN.test(value.trim())
    ? null
    : "Calldata must start with 0x and contain complete hexadecimal bytes.";
}

/** @param {string} value */
export function parseBuilderCodes(value) {
  const codes = value
    .split(",")
    .map((code) => code.trim())
    .filter(Boolean);

  if (codes.length === 0 || codes.length > 4) {
    return { error: "Provide between one and four comma-separated builder codes." };
  }

  const invalid = codes.find((code) => code.length < 3 || code.length > 32 || !CODE_PATTERN.test(code));
  if (invalid) {
    return { error: `“${invalid}” is not a valid lowercase builder code.` };
  }

  return { codes };
}

/** @param {string} value @param {number} [front] @param {number} [back] */
export function shortenHex(value, front = 12, back = 10) {
  return value.length <= front + back + 1
    ? value
    : `${value.slice(0, front)}…${value.slice(-back)}`;
}

/** @param {{ success: boolean, status?: "attributed" | "fallback" | "blocked", selectedCalldata: string | null, originalCalldata: string, failureKind?: string, failedStage?: string }} result */
export function describePreflight(result) {
  if (result.success) {
    return {
      tone: "success",
      title: "Attributed call matched the baseline",
      detail: "Original and attributed calls returned identical data at one pinned block. This is point-in-time compatibility evidence, not proof that all state effects are equivalent.",
    };
  }

  if (result.status === "blocked" || result.selectedCalldata === null) {
    if (result.failureKind === "return-data-mismatch") {
      return {
        tone: "error",
        title: "Return data changed",
        detail: "Both calls succeeded but produced different return data at the same block. No calldata was selected.",
      };
    }
    return {
      tone: "error",
      title: "Transaction handoff blocked",
      detail: result.failedStage === "original-call"
        ? "The original call did not establish a successful baseline, so attribution compatibility cannot be evaluated."
        : "The comparison did not establish a sendable payload. Fix the reported failure before signing.",
    };
  }

  return {
    tone: "warning",
    title: "Original calldata selected",
    detail:
      result.selectedCalldata === result.originalCalldata
        ? "The original call succeeded and the attributed call reverted at the same block, so the configured policy selected the untouched original calldata."
        : "The simulation failed. Review the selected payload before using it.",
  };
}

/** @param {number | null} blockNumber */
export function formatBlockNumber(blockNumber) {
  return blockNumber === null ? "Pending" : new Intl.NumberFormat("en-US").format(blockNumber);
}

/** @param {{ source: "fuji-rpc" | "local-calldata", chainId?: number, schemaId?: number, registryChainId?: bigint }} value */
export function describeChainContext(value) {
  if (value.source === "fuji-rpc") return `Avalanche Fuji · ${value.chainId}`;
  if (value.schemaId === undefined) return "Not established";
  if (value.registryChainId === undefined) return "Not encoded by schema 0";
  return value.registryChainId === 43113n
    ? `Embedded Fuji registry · ${value.registryChainId}`
    : `Embedded registry chain · ${value.registryChainId}`;
}
