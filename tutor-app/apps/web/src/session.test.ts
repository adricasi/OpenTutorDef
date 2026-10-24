import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSession } from "./session";

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn(async () => new Response(JSON.stringify({ id: "s1", mode: "math", problem: "" })));
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

const sentBody = () => JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string);

describe("createSession", () => {
  it("posts mode and problem without a student when none is given", async () => {
    await createSession("math", "2x+3=7");
    expect(fetchMock.mock.calls[0]![0]).toBe("/api/sessions");
    expect(sentBody()).toEqual({ mode: "math", problem: "2x+3=7" });
  });

  it("sends the student name when it is a non-empty string", async () => {
    await createSession("math", "", "Ana");
    expect(sentBody()).toEqual({ mode: "math", problem: "", student: "Ana" });
  });

  it("leaves out an empty or blank student name", async () => {
    await createSession("math", "", "");
    await createSession("math", "", "   ");
    for (const call of fetchMock.mock.calls) {
      expect(JSON.parse((call[1] as RequestInit).body as string)).not.toHaveProperty("student");
    }
  });

  it("throws on an HTTP error", async () => {
    fetchMock.mockResolvedValueOnce(new Response("no", { status: 500 }));
    await expect(createSession("math", "")).rejects.toThrow("HTTP 500");
  });
});
