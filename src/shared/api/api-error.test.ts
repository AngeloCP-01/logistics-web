import { describe, it, expect } from "vitest";
import { ApiError, parseProblem } from "./api-error";

describe("ApiError", () => {
  it("parses an RFC 7807 problem with field errors", async () => {
    const res = new Response(
      JSON.stringify({
        type: "urn:logistics:auth:validation",
        title: "Validation failed",
        status: 422,
        detail: "bad input",
        errors: [{ field: "email", message: "invalid" }],
      }),
      { status: 422, headers: { "content-type": "application/problem+json" } },
    );
    const err = await parseProblem(res);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(422);
    expect(err.title).toBe("Validation failed");
    expect(err.fieldErrors).toEqual({ email: "invalid" });
  });

  it("falls back to a generic message when the body is not JSON", async () => {
    const res = new Response("gateway boom", { status: 502 });
    const err = await parseProblem(res);
    expect(err.status).toBe(502);
    expect(err.title).toBe("Request failed");
    expect(err.fieldErrors).toEqual({});
  });
});
