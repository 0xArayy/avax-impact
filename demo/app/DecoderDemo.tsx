"use client";

import { useMemo, useState } from "react";
import { decodeAttribution, type AttributionResult } from "@/lib/attribution";

const FUJI_RPC_URL = "https://api.avax-test.network/ext/bc/C/rpc";
const DEMO_TRANSACTION =
  "0x33c0fb7ee4f48276dd237d67c4f8186b2416d2a033a90068d12efed63c8f0821";
const DEMO_CALLDATA =
  "0x773acdef0000000000000000000000000000000000000000000000000000000000000029617661782d696d706163740b0080218021802180218021802180218021";
const REGISTRY_ADDRESS = "0x8f13a300f2773EB6fa071B9196f6e16129F2549F";
const REPOSITORY_URL = "https://github.com/0xArayy/avax-impact";
const FUJI_EXPLORER_URL = "https://build.avax.network/explorer/fuji/c-chain";

type Mode = "transaction" | "calldata";
type DecodeState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; result: AttributionResult; transactionHash?: string }
  | { status: "error"; message: string };

interface RpcTransaction {
  readonly input?: string;
  readonly data?: string;
}

interface RpcResponse {
  readonly result?: RpcTransaction | null;
  readonly error?: { readonly message?: string };
}

async function getTransactionInput(hash: string): Promise<string> {
  if (!/^0x[0-9a-fA-F]{64}$/.test(hash)) {
    throw new Error("Enter a complete 32-byte transaction hash");
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 12_000);

  try {
    const response = await fetch(FUJI_RPC_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_getTransactionByHash",
        params: [hash],
      }),
      signal: controller.signal,
    });

    if (!response.ok) throw new Error(`Fuji RPC returned HTTP ${response.status}`);
    const payload = (await response.json()) as RpcResponse;
    if (payload.error) throw new Error(payload.error.message ?? "Fuji RPC request failed");
    if (!payload.result) throw new Error("Transaction not found on Avalanche Fuji");

    const calldata = payload.result.input ?? payload.result.data;
    if (!calldata) throw new Error("Transaction does not contain calldata");
    return calldata;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Fuji RPC timed out. Try again in a moment");
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

function shortenHex(value: string, front = 12, back = 10): string {
  if (value.length <= front + back + 1) return value;
  return `${value.slice(0, front)}…${value.slice(-back)}`;
}

export function DecoderDemo() {
  const [mode, setMode] = useState<Mode>("transaction");
  const [transactionHash, setTransactionHash] = useState(DEMO_TRANSACTION);
  const [calldata, setCalldata] = useState(DEMO_CALLDATA);
  const [state, setState] = useState<DecodeState>({ status: "idle" });
  const [copied, setCopied] = useState<string | null>(null);

  const activeValue = mode === "transaction" ? transactionHash : calldata;
  const buttonLabel = useMemo(() => {
    if (state.status === "loading") return "Reading Fuji…";
    return mode === "transaction" ? "Decode transaction" : "Decode calldata";
  }, [mode, state.status]);

  function changeMode(nextMode: Mode) {
    setMode(nextMode);
    setState({ status: "idle" });
  }

  async function decode() {
    setState({ status: "loading" });
    try {
      const input = mode === "transaction" ? await getTransactionInput(transactionHash.trim()) : calldata.trim();
      const result = decodeAttribution(input);
      setState({
        status: "success",
        result,
        transactionHash: mode === "transaction" ? transactionHash.trim() : undefined,
      });
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "Unable to decode attribution",
      });
    }
  }

  async function copy(value: string, key: string) {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    window.setTimeout(() => setCopied(null), 1_400);
  }

  return (
    <main>
      <div className="page-grid" aria-hidden="true" />
      <header className="site-header shell">
        <a className="brand" href="#top" aria-label="AVAX Impact home">
          <span className="brand-mark" aria-hidden="true">A</span>
          <span>AVAX Impact</span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#how-it-works">How it works</a>
          <a href="https://github.com/0xArayy/avax-impact/blob/main/docs/attribution-format.md">Docs</a>
          <a className="nav-cta" href={REPOSITORY_URL}>GitHub ↗</a>
        </nav>
      </header>

      <section className="hero shell" id="top">
        <div className="hero-copy">
          <div className="eyebrow"><span /> Live on Avalanche Fuji</div>
          <h1>See who built<br />the transaction.</h1>
          <p>
            Open, ERC-8021-compatible builder attribution for Avalanche C-Chain
            and EVM-based Avalanche L1s.
          </p>
          <div className="hero-facts" aria-label="MVP facts">
            <span><strong>3</strong> contracts</span>
            <span><strong>24</strong> automated tests</span>
            <span><strong>0</strong> custody</span>
          </div>
        </div>

        <section className="decoder-card" aria-labelledby="decoder-title">
          <div className="card-heading">
            <div>
              <span className="terminal-dot" aria-hidden="true" />
              <p className="card-kicker">PUBLIC DECODER</p>
            </div>
            <span className="network-pill">FUJI · 43113</span>
          </div>
          <h2 id="decoder-title">Decode attribution</h2>

          <div className="mode-switch" role="tablist" aria-label="Decoder input mode">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "transaction"}
              className={mode === "transaction" ? "active" : ""}
              onClick={() => changeMode("transaction")}
            >
              Transaction hash
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "calldata"}
              className={mode === "calldata" ? "active" : ""}
              onClick={() => changeMode("calldata")}
            >
              Raw calldata
            </button>
          </div>

          <label htmlFor="decoder-input">
            {mode === "transaction" ? "Avalanche Fuji transaction" : "ERC-8021 calldata"}
          </label>
          <textarea
            id="decoder-input"
            value={activeValue}
            onChange={(event) => {
              if (mode === "transaction") setTransactionHash(event.target.value);
              else setCalldata(event.target.value);
              setState({ status: "idle" });
            }}
            rows={mode === "transaction" ? 2 : 4}
            spellCheck={false}
          />

          <div className="decoder-actions">
            <button className="decode-button" type="button" onClick={decode} disabled={state.status === "loading"}>
              {buttonLabel}<span aria-hidden="true">→</span>
            </button>
            <button
              className="sample-button"
              type="button"
              onClick={() => {
                if (mode === "transaction") setTransactionHash(DEMO_TRANSACTION);
                else setCalldata(DEMO_CALLDATA);
                setState({ status: "idle" });
              }}
            >
              Use live sample
            </button>
          </div>

          <div className="result-region" aria-live="polite">
            {state.status === "idle" && (
              <div className="empty-result">
                <span className="scan-line" aria-hidden="true" />
                Ready to inspect {mode === "transaction" ? "a confirmed Fuji transaction" : "calldata locally"}.
              </div>
            )}
            {state.status === "loading" && <div className="loading-result">Querying Avalanche Fuji RPC…</div>}
            {state.status === "error" && <div className="error-result"><strong>Not decoded</strong><span>{state.message}</span></div>}
            {state.status === "success" && (
              <div className="decoded-result">
                <div className="result-success"><span aria-hidden="true">✓</span> Attribution found</div>
                <div className="result-row">
                  <span>Builder code</span>
                  <strong className="builder-code">{state.result.codes.join(", ")}</strong>
                </div>
                <div className="result-row">
                  <span>Schema</span>
                  <strong>{state.result.schemaId} · ERC-8021</strong>
                </div>
                <div className="result-row result-row-copy">
                  <span>Original calldata</span>
                  <button type="button" onClick={() => copy(state.result.originalCalldata, "calldata")}>
                    {shortenHex(state.result.originalCalldata)}
                    <small>{copied === "calldata" ? "Copied" : "Copy"}</small>
                  </button>
                </div>
                <div className="result-row">
                  <span>Suffix size</span>
                  <strong>{state.result.suffixLengthBytes} bytes</strong>
                </div>
                {state.transactionHash && (
                  <a
                    className="explorer-link"
                    href={`${FUJI_EXPLORER_URL}/tx/${state.transactionHash}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open in Avalanche Explorer <span aria-hidden="true">↗</span>
                  </a>
                )}
              </div>
            )}
          </div>
        </section>
      </section>

      <section className="protocol-strip">
        <div className="shell protocol-grid">
          <div><span>FORMAT</span><strong>ERC-8021</strong></div>
          <div>
            <span>REGISTRY</span>
            <a
              href={`${FUJI_EXPLORER_URL}/address/${REGISTRY_ADDRESS}`}
              target="_blank"
              rel="noreferrer"
              title={REGISTRY_ADDRESS}
            >
              {shortenHex(REGISTRY_ADDRESS, 10, 8)} ↗
            </a>
          </div>
          <div><span>NETWORK</span><strong>Avalanche Fuji</strong></div>
          <div><span>TRUST MODEL</span><strong>Declared attribution</strong></div>
        </div>
      </section>

      <section className="how shell" id="how-it-works">
        <div className="section-intro">
          <p className="section-number">01 / HOW IT WORKS</p>
          <h2>Attribution without changing the target contract.</h2>
        </div>
        <div className="steps">
          <article>
            <span>01</span>
            <h3>Append</h3>
            <p>The SDK adds a compact builder code and ERC-8021 marker to normal function calldata.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Simulate</h3>
            <p>An exact <code>eth_call</code> checks compatibility and falls back to original calldata if needed.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Decode</h3>
            <p>Anyone can recover the builder code from the confirmed transaction and resolve its public record.</p>
          </article>
        </div>
      </section>

      <section className="trust shell">
        <div>
          <p className="section-number">02 / TRUST BOUNDARY</p>
          <h2>Metadata, not authorization.</h2>
        </div>
        <p>
          Builder codes are public and copyable. AVAX Impact reports declared attribution;
          it must not be used for permissions, payments, or security decisions.
        </p>
      </section>

      <footer className="shell">
        <span>AVAX Impact · Open source infrastructure for Avalanche</span>
        <a href={REPOSITORY_URL}>View source on GitHub ↗</a>
      </footer>
    </main>
  );
}
