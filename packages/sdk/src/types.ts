export type Hex = `0x${string}`;

export interface ValidationResult {
  readonly valid: boolean;
  readonly error?: string;
}

export interface AttributionResult {
  readonly schemaId: number;
  readonly codes: readonly string[];
  readonly originalCalldata: Hex;
  readonly suffix: Hex;
  readonly suffixLengthBytes: number;
}

export interface DryRunRequest {
  readonly rpcUrl: string;
  readonly to: Hex;
  readonly calldata: Hex;
  readonly codes: readonly string[];
  readonly from?: Hex;
  readonly value?: Hex;
}

export interface DryRunResult {
  readonly success: boolean;
  readonly originalCalldata: Hex;
  readonly attributedCalldata: Hex;
  readonly selectedCalldata: Hex;
  readonly returnData?: Hex;
  readonly error?: string;
}
