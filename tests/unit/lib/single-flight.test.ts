import { describe, expect, it, vi } from "vitest";
import { singleFlight } from "@/lib/single-flight";

describe("lib/single-flight", () => {
  it("compartilha a mesma execução entre chamadas simultâneas", async () => {
    const task = vi.fn(async () => "ok");
    const run = singleFlight(task);
    const results = await Promise.all([run(), run(), run()]);
    expect(results).toEqual(["ok", "ok", "ok"]);
    expect(task).toHaveBeenCalledTimes(1);
  });

  it("permite nova execução depois que a anterior termina, mesmo com erro", async () => {
    const task = vi.fn().mockRejectedValueOnce(new Error("falhou")).mockResolvedValueOnce("ok");
    const run = singleFlight(task);
    await expect(run()).rejects.toThrow("falhou");
    await expect(run()).resolves.toBe("ok");
    expect(task).toHaveBeenCalledTimes(2);
  });
});
