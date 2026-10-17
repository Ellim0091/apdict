import { describe, it, expect } from "vitest";

describe("smoke", () => {
  it("runs the test runner in a browser-like environment", () => {
    expect(typeof document).toBe("object");
  });
});
