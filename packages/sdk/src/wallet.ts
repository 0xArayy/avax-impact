import { encodeAttribution, encodeAttributionV1 } from "./codec.js";
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
  if ((request.registryAddress === undefined) !== (request.registryChainId === undefined)) {
    throw new Error("registryAddress and registryChainId must be provided together");
  }
  const value = request.registryAddress === undefined || request.registryChainId === undefined
    ? encodeAttribution(request.codes)
    : encodeAttributionV1({
        registryAddress: request.registryAddress,
        registryChainId: request.registryChainId,
        codes: request.codes,
      });
  return { dataSuffix: { value, optional: request.optional ?? false } };
}
