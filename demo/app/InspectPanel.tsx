"use client";

import { useRef, useState } from "react";
import type { Hex } from "@avax-impact/sdk";
import { describeChainContext, formatBlockNumber, validateCalldata, validateTransactionHash } from "@/lib/presentation.mjs";
import {
  inspectFujiTransaction,
  inspectRawCalldata,
  resolveHistoricalCodes,
  SAMPLE_CALLDATA,
  SAMPLE_TRANSACTION,
  type InspectResult,
  type LegacyResolutionResult,
} from "@/lib/workbench";
import { LegacyResolution } from "./LegacyResolution";
import { HexField, ProvenanceLabel } from "./WorkbenchBits";

type InputMode = "transaction" | "calldata";
type InspectState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; result: InspectResult };

export function InspectPanel() {
  const [mode, setMode] = useState<InputMode>("transaction");
  const [transactionHash, setTransactionHash] = useState<string>(SAMPLE_TRANSACTION);
  const [calldata, setCalldata] = useState<string>(SAMPLE_CALLDATA);
  const [state, setState] = useState<InspectState>({ status: "idle" });
  const [legacyResults, setLegacyResults] = useState<readonly LegacyResolutionResult[]>([]);
  const [legacyLoading, setLegacyLoading] = useState(false);
  const requestRef = useRef<AbortController | null>(null);

  function switchMode(nextMode: InputMode) {
    requestRef.current?.abort();
    setMode(nextMode);
    setState({ status: "idle" });
    setLegacyResults([]);
  }

  async function inspect() {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    const value = (mode === "transaction" ? transactionHash : calldata).trim();
    const validationError = mode === "transaction" ? validateTransactionHash(value) : validateCalldata(value);
    if (validationError) {
      setState({ status: "error", message: validationError });
      return;
    }

    setState({ status: "loading" });
    setLegacyResults([]);
    setLegacyLoading(false);
    try {
      const result = mode === "transaction"
        ? await inspectFujiTransaction(value as Hex, controller.signal)
        : inspectRawCalldata(value as Hex);
      if (controller.signal.aborted) return;
      setState({ status: "ready", result });

      if (result.analysis.status === "declared" && result.analysis.declaration.schemaId === 0) {
        setLegacyLoading(true);
        const resolutions = await resolveHistoricalCodes(result.analysis.declaration, controller.signal);
        if (!controller.signal.aborted) setLegacyResults(resolutions);
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        setState({ status: "error", message: error instanceof Error ? error.message : "Inspection failed." });
      }
    } finally {
      if (!controller.signal.aborted) setLegacyLoading(false);
    }
  }

  const result = state.status === "ready" ? state.result : null;
  return (
    <section className="work-panel" aria-labelledby="inspect-title">
      <div className="panel-intro">
        <div>
          <p className="step-label">01 · INSPECT</p>
          <h2 id="inspect-title">Read the attribution trail.</h2>
          <p>Analyze a Fuji transaction through the SDK, or decode raw calldata locally in this browser.</p>
        </div>
        <div className="provenance-stack" aria-label="Data provenance">
          <ProvenanceLabel tone="safe">Fuji · 43113</ProvenanceLabel>
          <ProvenanceLabel>{mode === "transaction" ? "public RPC read" : "local decode"}</ProvenanceLabel>
        </div>
      </div>

      <div className="input-tabs" role="group" aria-label="Inspection source">
        <button type="button" aria-pressed={mode === "transaction"} onClick={() => switchMode("transaction")}>Transaction hash</button>
        <button type="button" aria-pressed={mode === "calldata"} onClick={() => switchMode("calldata")}>Raw calldata</button>
      </div>

      <div className="input-block" id="inspect-input">
        <label htmlFor="inspect-value">{mode === "transaction" ? "Fuji transaction hash" : "Attributed calldata"}</label>
        <textarea
          id="inspect-value"
          rows={mode === "transaction" ? 2 : 5}
          value={mode === "transaction" ? transactionHash : calldata}
          onChange={(event) => {
            if (mode === "transaction") setTransactionHash(event.target.value);
            else setCalldata(event.target.value);
            setState({ status: "idle" });
          }}
          spellCheck={false}
          aria-describedby="inspect-hint"
        />
        <p id="inspect-hint">{mode === "transaction" ? "Fetched from Avalanche’s public Fuji RPC and chain-ID checked." : "No network request is needed to decode the suffix."}</p>
        <div className="action-row">
          <button className="primary-button" type="button" onClick={inspect} disabled={state.status === "loading"}>
            {state.status === "loading" ? "Inspecting…" : "Inspect attribution"}<span aria-hidden="true">→</span>
          </button>
          <button className="secondary-button" type="button" onClick={() => {
            if (mode === "transaction") setTransactionHash(SAMPLE_TRANSACTION);
            else setCalldata(SAMPLE_CALLDATA);
            setState({ status: "idle" });
          }}>Restore sample</button>
        </div>
      </div>

      <div className="result-shell" aria-live="polite" aria-busy={state.status === "loading"}>
        {state.status === "idle" ? <EmptyState mode={mode} /> : null}
        {state.status === "loading" ? <div className="loading-state"><span />Calling <code>analyzeTransaction</code> on Fuji…</div> : null}
        {state.status === "error" ? <div className="message-state message-state--error"><strong>Inspection stopped</strong><p>{state.message}</p></div> : null}
        {result ? <InspectionResult result={result} /> : null}
      </div>

      {result?.analysis.status === "declared" && result.analysis.declaration.schemaId === 0 ? (
        <LegacyResolution loading={legacyLoading} results={legacyResults} />
      ) : null}
    </section>
  );
}

function EmptyState({ mode }: { mode: InputMode }) {
  return <div className="empty-state"><span className="radar" aria-hidden="true" /><div><strong>Ready for inspection</strong><p>{mode === "transaction" ? "The SDK will read one transaction from Fuji." : "The SDK will decode this value locally."}</p></div></div>;
}

function InspectionResult({ result }: { result: InspectResult }) {
  const { analysis, transaction } = result;
  if (analysis.status === "unattributed") {
    return <div className="message-state"><ProvenanceLabel>no suffix</ProvenanceLabel><strong>No attribution declared</strong><p>The SDK found no supported attribution marker. This is not an error and says nothing about who created the transaction.</p></div>;
  }
  if (analysis.status === "malformed") {
    return <div className="message-state message-state--error"><ProvenanceLabel tone="warning">malformed</ProvenanceLabel><strong>Marker found, payload rejected</strong><p>{analysis.error}</p></div>;
  }

  const declaration = analysis.declaration;
  const blockNumber = transaction?.blockNumber ? Number(BigInt(transaction.blockNumber)) : null;
  return (
    <div className="inspection-result">
      <div className="result-hero">
        <div><p className="micro-label">DECLARED BUILDER</p><h3>{declaration.codes.join(" + ")}</h3></div>
        <ProvenanceLabel tone="safe">suffix decoded</ProvenanceLabel>
      </div>
      <div className="fact-grid">
        <div><span>Schema</span><strong>{declaration.schemaId === 0 ? "0 · legacy prototype" : declaration.schemaId}</strong></div>
        <div><span>Source</span><strong>{result.source === "fuji-rpc" ? "Fuji RPC" : "Browser memory"}</strong></div>
        <div><span>Chain context</span><strong>{describeChainContext({
          source: result.source,
          chainId: result.chainId,
          schemaId: declaration.schemaId,
          registryChainId: declaration.registryChainId,
        })}</strong></div>
        {transaction ? <div><span>Block status</span><strong>{blockNumber === null ? "Pending · unconfirmed" : formatBlockNumber(blockNumber)}</strong></div> : null}
      </div>
      <HexField label="Original calldata" hint="suffix removed by SDK" value={declaration.originalCalldata} />
      <HexField label="Attribution suffix" hint={`${declaration.suffixLengthBytes} bytes`} value={declaration.suffix} />
      {transaction ? (
        <div className="transaction-path">
          <span title={transaction.from}>From {transaction.from}</span>
          <span aria-hidden="true">→</span>
          <span title={transaction.to ?? "Contract creation"}>To {transaction.to ?? "contract creation"}</span>
        </div>
      ) : null}
      <p className="trust-inline"><strong>Trust boundary:</strong> this proves a public declaration was encoded—not that the named builder created, signed, or authorized the transaction.</p>
    </div>
  );
}
