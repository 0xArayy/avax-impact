"use client";

import { useRef, useState } from "react";
import type { DryRunResult, Hex } from "@avax-impact/sdk";
import {
  createPreflightSample,
  describePreflight,
  parseBuilderCodes,
  validateAddress,
  validateCalldata,
} from "@/lib/presentation.mjs";
import {
  FUJI,
  preflightFujiCall,
  SAMPLE_PREFLIGHT_CALLDATA,
  SAMPLE_STRICT_CALLDATA,
} from "@/lib/workbench";
import { Field, HexField, ProvenanceLabel } from "./WorkbenchBits";

type PreflightState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; result: DryRunResult };

export function PreflightPanel() {
  const [to, setTo] = useState<string>(FUJI.registryAddress);
  const [calldata, setCalldata] = useState<string>(SAMPLE_PREFLIGHT_CALLDATA);
  const [codesInput, setCodesInput] = useState("avax-impact");
  const [from, setFrom] = useState("");
  const [value, setValue] = useState("0x0");
  const [state, setState] = useState<PreflightState>({ status: "idle" });
  const requestRef = useRef<AbortController | null>(null);

  const addressError = to.length > 0 ? validateAddress(to) : null;
  const calldataError = calldata.length > 0 ? validateCalldata(calldata) : null;
  const fromError = from.length > 0 ? validateAddress(from) : null;
  const codes = parseBuilderCodes(codesInput);

  function loadSample(sampleTo: string, sampleCalldata: string) {
    const sample = createPreflightSample({ to: sampleTo, calldata: sampleCalldata });
    setTo(sample.to);
    setCalldata(sample.calldata);
    setCodesInput(sample.codesInput);
    setFrom(sample.from);
    setValue(sample.value);
    setState({ status: "idle" });
  }

  async function runPreflight() {
    const inputAddressError = validateAddress(to);
    const inputCalldataError = validateCalldata(calldata);
    const parsedCodes = parseBuilderCodes(codesInput);
    if (inputAddressError || inputCalldataError || fromError || parsedCodes.error) {
      setState({ status: "error", message: inputAddressError ?? inputCalldataError ?? fromError ?? parsedCodes.error ?? "Check the call parameters." });
      return;
    }
    if (!/^0x(?:0|[1-9a-fA-F][0-9a-fA-F]*)$/.test(value)) {
      setState({ status: "error", message: "Value must be a canonical hexadecimal RPC quantity, such as 0x0." });
      return;
    }

    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setState({ status: "loading" });
    try {
      const result = await preflightFujiCall({
        to: to.trim() as Hex,
        calldata: calldata.trim() as Hex,
        codes: parsedCodes.codes ?? [],
        from: from.trim() ? from.trim() as Hex : undefined,
        value: value as Hex,
        signal: controller.signal,
      });
      if (!controller.signal.aborted) setState({ status: "ready", result });
    } catch (error) {
      if (!controller.signal.aborted) {
        setState({ status: "error", message: error instanceof Error ? error.message : "Preflight failed." });
      }
    }
  }

  const result = state.status === "ready" ? state.result : null;
  return (
    <section className="work-panel preflight-panel" aria-labelledby="preflight-title">
      <div className="panel-intro">
        <div>
          <p className="step-label">02 · PREFLIGHT</p>
          <h2 id="preflight-title">Simulate before any signature.</h2>
          <p>The SDK pins one Fuji block, simulates the original and attributed payloads with identical context, and compares their return data before selecting anything.</p>
        </div>
        <div className="provenance-stack" aria-label="Safety properties">
          <ProvenanceLabel tone="safe">read-only eth_call</ProvenanceLabel>
          <ProvenanceLabel>no wallet</ProvenanceLabel>
        </div>
      </div>

      <div className="preflight-grid">
        <div className="form-card">
          <Field id="preflight-to" label="Target contract" hint="Fuji address" error={addressError}>
            <input id="preflight-to" value={to} onChange={(event) => { setTo(event.target.value); setState({ status: "idle" }); }} spellCheck={false} aria-invalid={Boolean(addressError)} aria-describedby={addressError ? "preflight-to-error" : undefined} />
          </Field>
          <Field id="preflight-calldata" label="Original calldata" hint="untouched payload" error={calldataError}>
            <textarea id="preflight-calldata" rows={5} value={calldata} onChange={(event) => { setCalldata(event.target.value); setState({ status: "idle" }); }} spellCheck={false} aria-invalid={Boolean(calldataError)} aria-describedby={calldataError ? "preflight-calldata-error" : undefined} />
          </Field>
          <div className="form-columns">
            <Field id="preflight-codes" label="Builder codes" hint="comma-separated" error={codes.error ?? null}>
              <input id="preflight-codes" value={codesInput} onChange={(event) => { setCodesInput(event.target.value); setState({ status: "idle" }); }} spellCheck={false} aria-invalid={Boolean(codes.error)} aria-describedby={codes.error ? "preflight-codes-error" : undefined} />
            </Field>
            <Field id="preflight-value" label="Call value" hint="RPC quantity">
              <input id="preflight-value" value={value} onChange={(event) => { setValue(event.target.value); setState({ status: "idle" }); }} spellCheck={false} />
            </Field>
          </div>
          <Field id="preflight-from" label="From address" hint="optional simulation context" error={fromError}>
            <input id="preflight-from" value={from} onChange={(event) => { setFrom(event.target.value); setState({ status: "idle" }); }} placeholder="Leave empty unless msg.sender matters" spellCheck={false} aria-invalid={Boolean(fromError)} aria-describedby={fromError ? "preflight-from-error" : undefined} />
          </Field>
          <button className="primary-button primary-button--full" type="button" onClick={runPreflight} disabled={state.status === "loading"}>
            {state.status === "loading" ? "Comparing pinned calls…" : "Run Fuji preflight"}<span aria-hidden="true">→</span>
          </button>
          <div className="action-row sample-row" aria-label="Fuji preflight samples">
            <button className="secondary-button" type="button" onClick={() =>
              loadSample(FUJI.registryAddress, SAMPLE_PREFLIGHT_CALLDATA)
            }>Load compatible sample</button>
            <button className="secondary-button" type="button" onClick={() =>
              loadSample(FUJI.strictCalldataDemoAddress, SAMPLE_STRICT_CALLDATA)
            }>Load strict rejection</button>
          </div>
          <p className="button-note">Nothing is signed, submitted, or stored. Output is copied into your own transaction client.</p>
        </div>

        <div className="preflight-output" aria-live="polite" aria-busy={state.status === "loading"}>
          {state.status === "idle" ? <div className="output-placeholder"><span aria-hidden="true">02</span><strong>Awaiting compatibility comparison</strong><p>The SDK will pin a Fuji block and test both payloads against that same state.</p></div> : null}
          {state.status === "loading" ? <div className="loading-state"><span />Pinning a block and comparing read-only <code>eth_call</code> results…</div> : null}
          {state.status === "error" ? <div className="message-state message-state--error"><strong>Preflight stopped</strong><p>{state.message}</p></div> : null}
          {result ? <PreflightResult result={result} /> : null}
        </div>
      </div>
    </section>
  );
}

function PreflightResult({ result }: { result: DryRunResult }) {
  const description = describePreflight(result);
  const blocked = result.status === "blocked";
  return (
    <div className="preflight-result">
      <div className={`simulation-banner simulation-banner--${description.tone}`}>
        <ProvenanceLabel tone={result.success ? "safe" : "warning"}>{result.success ? "return data matched" : blocked ? "handoff blocked" : "attributed call reverted"}</ProvenanceLabel>
        <h3>{description.title}</h3>
        <p>{description.detail}</p>
      </div>
      <HexField label="Attributed calldata" hint="schema 0 · legacy prototype" value={result.attributedCalldata} emphasize={result.success} />
      {result.selectedCalldata === null
        ? <div className="rpc-error"><strong>No calldata selected</strong><code>Resolve the {result.failureKind} failure before signing.</code></div>
        : <HexField label="Selected calldata" hint={result.success ? "attribution retained" : "explicit fallback policy applied"} value={result.selectedCalldata} emphasize={!result.success} />}
      {result.originalReturnData && result.attributedReturnData && result.originalReturnData !== result.attributedReturnData
        ? <><HexField label="Original return data" hint="comparison baseline" value={result.originalReturnData} /><HexField label="Attributed return data" hint="mismatch; handoff blocked" value={result.attributedReturnData} /></>
        : result.returnData ? <HexField label="Matched return data" hint={`original = attributed at block ${result.blockTag}`} value={result.returnData} /> : null}
      {result.error ? <div className="rpc-error"><strong>RPC / revert detail</strong><code>{result.error}</code></div> : null}
      <div className="handoff-note"><span aria-hidden="true">↗</span><p><strong>{blocked ? "Do not sign yet." : "External handoff only."}</strong> {blocked ? "No payload was selected because the RPC result was inconclusive." : "Copy the selected calldata into a trusted signer. This workbench never requests keys or opens a wallet."}</p></div>
    </div>
  );
}
