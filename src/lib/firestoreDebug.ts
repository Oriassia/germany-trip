/** Dev-only Firestore tracing (enable with npm run dev). */
const enabled = import.meta.env.DEV;

export function fsLog(step: string, detail?: Record<string, unknown>): void {
  if (!enabled) return;
  console.log(`[firestore] ${step}`, detail ?? '');
}

export function fsLogError(step: string, err: unknown): void {
  if (!enabled) return;
  const e = err as { code?: string; message?: string };
  console.error(`[firestore] ${step} FAILED`, {
    code: e?.code ?? '(none)',
    message: e?.message ?? String(err),
    err,
  });
}

export class FirestoreStepError extends Error {
  readonly code: string | undefined;

  constructor(
    readonly step: string,
    cause: unknown,
  ) {
    const c = cause as { code?: string; message?: string };
    super(c.message ?? String(cause));
    this.name = 'FirestoreStepError';
    this.code = c.code;
  }
}

export async function fsStep<T>(
  step: string,
  detail: Record<string, unknown> | undefined,
  fn: () => Promise<T>,
): Promise<T> {
  fsLog(`${step} → start`, detail);
  try {
    const result = await fn();
    fsLog(`${step} → ok`, {
      ...detail,
      resultSummary:
        result && typeof result === 'object' && 'status' in result
          ? (result as { status: string }).status
          : Array.isArray(result)
            ? `array(${result.length})`
            : typeof result,
    });
    return result;
  } catch (err) {
    fsLogError(step, err);
    throw new FirestoreStepError(step, err);
  }
}
