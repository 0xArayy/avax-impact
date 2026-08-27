import { encodeAttribution } from "./codec.js";
import type {
  DataSuffixCapability,
  DataSuffixCapabilityRequest,
} from "./types.js";

/**
 * Builds the ERC-5792 `dataSuffix` capability for `wallet_sendCalls`.
 * The wallet, rather than the application, appends the suffix to each supported call.
 */
export function createDataSuffixCapability(
  request: DataSuffixCapabilityRequest,
): DataSuffixCapability {
  const value = encodeAttribution({
    registryAddress: request.registryAddress,
    registryChainId: request.registryChainId,
    codes: request.codes,
  });
  return { dataSuffix: { value, optional: request.optional ?? false } };
}
