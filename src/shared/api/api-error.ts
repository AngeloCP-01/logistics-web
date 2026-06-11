export interface Problem {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  errors?: { field: string; message: string }[];
}

export class ApiError extends Error {
  readonly status: number;
  readonly title: string;
  readonly detail: string | undefined;
  readonly fieldErrors: Record<string, string>;

  constructor(status: number, title: string, detail: string | undefined, fieldErrors: Record<string, string>) {
    super(detail ?? title);
    this.name = "ApiError";
    this.status = status;
    this.title = title;
    this.detail = detail;
    this.fieldErrors = fieldErrors;
  }
}

export async function parseProblem(res: Response): Promise<ApiError> {
  let body: Problem = {};
  try {
    body = (await res.clone().json()) as Problem;
  } catch {
    // non-JSON body (e.g. raw gateway/proxy error) — fall through to defaults
  }
  const fieldErrors: Record<string, string> = {};
  for (const e of body.errors ?? []) fieldErrors[e.field] = e.message;
  return new ApiError(res.status, body.title ?? "Request failed", body.detail, fieldErrors);
}
