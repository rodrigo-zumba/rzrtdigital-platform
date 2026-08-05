import { describe, expect, it } from "vitest";

import { cn } from "@/lib/utils";

describe("cn", () => {
  it("junta classes truthy e ignora falsy", () => {
    expect(cn("a", false, undefined, "b")).toBe("a b");
  });

  it("retorna string vazia sem argumentos", () => {
    expect(cn()).toBe("");
  });
});
