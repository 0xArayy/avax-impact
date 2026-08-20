import {
  MAX_CODE_LENGTH,
  MAX_CODES,
  MAX_JOINED_CODES_LENGTH,
  MIN_CODE_LENGTH,
} from "./constants.js";
import type { ValidationResult } from "./types.js";

const BUILDER_CODE_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const textEncoder = new TextEncoder();

export function validateBuilderCode(code: string): ValidationResult {
  const length = textEncoder.encode(code).length;
  if (length < MIN_CODE_LENGTH || length > MAX_CODE_LENGTH) {
    return {
      valid: false,
      error: `builder code must be between ${MIN_CODE_LENGTH} and ${MAX_CODE_LENGTH} bytes`,
    };
  }
  if (!BUILDER_CODE_PATTERN.test(code)) {
    return {
      valid: false,
      error: "builder code must contain lowercase letters, digits, and single internal hyphens only",
    };
  }
  return { valid: true };
}

export function assertValidBuilderCode(code: string): void {
  const result = validateBuilderCode(code);
  if (!result.valid) {
    throw new Error(`invalid builder code \"${code}\": ${result.error}`);
  }
}

export function assertValidBuilderCodes(codes: readonly string[]): void {
  if (codes.length === 0) {
    throw new Error("at least one builder code is required");
  }
  if (codes.length > MAX_CODES) {
    throw new Error(`at most ${MAX_CODES} builder codes are supported`);
  }

  const uniqueCodes = new Set(codes);
  if (uniqueCodes.size !== codes.length) {
    throw new Error("builder codes must not contain duplicates");
  }

  for (const code of codes) {
    assertValidBuilderCode(code);
  }

  const joinedLength = textEncoder.encode(codes.join(",")).length;
  if (joinedLength > MAX_JOINED_CODES_LENGTH) {
    throw new Error(
      `encoded builder codes must not exceed ${MAX_JOINED_CODES_LENGTH} bytes`,
    );
  }
}
