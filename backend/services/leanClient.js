const FORBIDDEN = /\b(sorry|admit|axiom|unsafe|native_decide)\b/;

// The worker must explicitly report every one of these as true; responses
// from older workers that don't run the checks are rejected (fail closed).
export const REQUIRED_POLICY_CHECKS = ['noUnsolvedGoals', 'noSorry', 'noAdmit', 'noWarnings', 'theoremChecked', 'allowedAxioms'];
// Bump when the verification policy gets stricter so older cached puzzles stop being served.
export const LEAN_POLICY_VERSION = 2;

const isMathlibModule = name => name === 'Mathlib' || name.startsWith('Mathlib.');

export class LeanClient {
  constructor({ endpoint = process.env.LEAN_VERIFY_URL || 'http://localhost:3001/verify', timeoutMs = Number(process.env.LEAN_TIMEOUT_MS || 30000), fetchImpl = fetch } = {}) {
    this.endpoint = endpoint; this.timeoutMs = timeoutMs; this.fetchImpl = fetchImpl;
  }

  async verify(lean) {
    if (!lean?.source || FORBIDDEN.test(lean.source)) return { status: 'rejected', valid: false, diagnostics: [{ severity: 'error', message: 'Forbidden Lean placeholder or declaration' }], policyChecks: { noSorry: false } };
    if (!Array.isArray(lean.imports) || !lean.imports.every(isMathlibModule)) return { status: 'rejected', valid: false, diagnostics: [{ severity: 'error', message: 'Only Mathlib imports are allowed' }], policyChecks: { allowedImports: false } };
    if (!lean.theoremName) return { status: 'rejected', valid: false, diagnostics: [{ severity: 'error', message: 'theoremName is required' }], policyChecks: { theoremChecked: false } };
    const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), this.timeoutMs); const started = Date.now();
    try {
      const response = await this.fetchImpl(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({ source: lean.source, theoremName: lean.theoremName, imports: lean.imports, timeoutMs: this.timeoutMs }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) return { status: response.status >= 500 ? 'infrastructure_error' : 'rejected', valid: false, diagnostics: body.diagnostics || [], durationMs: Date.now()-started };
      const valid = body.status === 'verified' && body.valid === true
        && REQUIRED_POLICY_CHECKS.every(check => body.policyChecks?.[check] === true);
      return { ...body, status: valid ? 'verified' : 'rejected', valid, durationMs: body.durationMs ?? Date.now()-started };
    } catch (error) {
      if (error.name === 'AbortError') return { status: 'timeout', valid: false, diagnostics: [], durationMs: Date.now()-started };
      return { status: 'infrastructure_error', valid: false, diagnostics: [], reason: error.message, durationMs: Date.now()-started };
    } finally { clearTimeout(timeout); }
  }
}

export default new LeanClient();
