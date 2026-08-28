import type { AttributionResult } from "@avax-impact/sdk";
import { FUJI, type FujiRegistryResolutionResult } from "@/lib/workbench";
import { shortenHex } from "@/lib/presentation.mjs";
import { CopyButton, ProvenanceLabel } from "./WorkbenchBits";

export function CurrentRegistryResolution({
  declaration,
  loading,
  results,
}: {
  declaration: AttributionResult;
  loading: boolean;
  results: readonly FujiRegistryResolutionResult[];
}) {
  if (declaration.schemaId !== 1 || declaration.registryAddress === undefined) return null;

  const registryChainId = declaration.registryChainId;
  const isFujiRegistry = registryChainId === BigInt(FUJI.chainId);
  const isCurrentProjectRegistry = isFujiRegistry
    && declaration.registryAddress.toLowerCase() === FUJI.registryAddress.toLowerCase();
  return (
    <section className="current-proof" aria-labelledby="current-registry-title">
      <div className="result-section-heading">
        <div>
          <p className="micro-label">EMBEDDED REGISTRY CONTEXT</p>
          <h4 id="current-registry-title">{isCurrentProjectRegistry ? "Current schema 1 registry" : "Declared schema 1 registry"}</h4>
        </div>
        <ProvenanceLabel tone={isCurrentProjectRegistry ? "safe" : "neutral"}>{isCurrentProjectRegistry ? "verified project deployment" : "declared registry"}</ProvenanceLabel>
      </div>
      <div className="registry-address-row">
        <div>
          <span>Registry · chain {registryChainId?.toString() ?? "unknown"}</span>
          <code title={declaration.registryAddress}>{shortenHex(declaration.registryAddress)}</code>
        </div>
        <CopyButton value={declaration.registryAddress} label="Copy registry" />
      </div>
      {!isFujiRegistry ? (
        <p className="legacy-note">This workbench resolves records only for registry chain 43113. The embedded address is still shown exactly as declared.</p>
      ) : null}
      {loading ? <p className="inline-status" role="status">Resolving the standard registry record on Fuji…</p> : null}
      {!loading && results.map((item) => (
        <article className="registry-record" key={item.code}>
          <div className="registry-record__top">
            <strong>{item.code}</strong>
            {item.resolution?.status === "registered" ? <ProvenanceLabel tone="safe">registered</ProvenanceLabel> : null}
            {item.resolution?.status === "unregistered" ? <ProvenanceLabel tone="warning">unregistered</ProvenanceLabel> : null}
            {item.error ? <ProvenanceLabel tone="warning">lookup unavailable</ProvenanceLabel> : null}
          </div>
          {item.resolution?.status === "registered" ? (
            <dl className="record-grid">
              <div><dt>Payout</dt><dd title={item.resolution.record.payoutAddress}>{shortenHex(item.resolution.record.payoutAddress)}</dd></div>
              <div><dt>Code URI</dt><dd title={item.resolution.record.codeURI}>{item.resolution.record.codeURI || "Not set"}</dd></div>
              <div><dt>Registry policy</dt><dd>{item.resolution.record.valid ? "Valid code" : "Invalid code"}</dd></div>
            </dl>
          ) : null}
          {item.error ? <p className="record-error">Registry proof could not be retrieved: {item.error}</p> : null}
        </article>
      ))}
      {isFujiRegistry ? (
        <a className="text-link" href={`${FUJI.explorerUrl}/address/${declaration.registryAddress}`} target="_blank" rel="noreferrer">
          {isCurrentProjectRegistry ? "Verify current registry on Fuji" : "Inspect declared registry on Fuji"} <span aria-hidden="true">↗</span>
        </a>
      ) : null}
    </section>
  );
}
