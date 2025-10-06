import { cn } from "@/lib/utils";
import { describe, expect, it } from "vitest";

describe("cn", () => {
  it("should merge classes correctly", () => {
    expect(cn("bg-red-500", "text-white")).toBe("bg-red-500 text-white");
  });

  it("should handle conditional classes", () => {
    expect(cn("base", { conditional: true })).toBe("base conditional");
    expect(cn("base", { conditional: false })).toBe("base");
  });

  it("should override conflicting classes", () => {
    expect(cn("p-4", "p-2")).toBe("p-2");
    expect(cn("bg-red-500", "bg-blue-500")).toBe("bg-blue-500");
  });

  it("should handle a mix of string, object, and array inputs", () => {
    expect(
      cn(
        "base-class",
        { "conditional-class": true },
        ["array-class-1", "array-class-2"],
      ),
    ).toBe("base-class conditional-class array-class-1 array-class-2");
  });

  it("should return an empty string for no inputs", () => {
    expect(cn()).toBe("");
  });
});