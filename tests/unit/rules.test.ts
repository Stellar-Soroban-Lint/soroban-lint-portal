import { describe, expect, it } from "vitest";

import { parseRuleCatalog } from "@/lib/rules";

describe("parseRuleCatalog", () => {
  it("accepts a catalog document", () => {
    const catalog = parseRuleCatalog('{"version":"1","rules":[{"id":"SL001"}]}');
    expect(catalog.rules).toHaveLength(1);
    expect(catalog.rules[0]!.id).toBe("SL001");
  });

  it("rejects anything without a rules array", () => {
    expect(() => parseRuleCatalog("{}")).toThrow(/unexpected rule catalog/);
    expect(() => parseRuleCatalog("[]")).toThrow(/unexpected rule catalog/);
    expect(() => parseRuleCatalog("nope")).toThrow();
  });
});
