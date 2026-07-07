// Signal tests cover daemon plugin behavior.
import { EventEmitter } from "node:events";
import os from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { testApi } from "./daemon.js";

describe("signal daemon args", () => {
  it("expands home-relative configPath before passing it to signal-cli", () => {
    expect(
      testApi.buildDaemonArgs({
        cliPath: "signal-cli",
        configPath: "~/.openclaw/signal-cli",
        httpHost: "127.0.0.1",
        httpPort: 8080,
      }),
    ).toEqual([
      "--config",
      path.join(os.homedir(), ".openclaw/signal-cli"),
      "daemon",
      "--http",
      "127.0.0.1:8080",
      "--no-receive-stdout",
    ]);
  });
});

describe("signal daemon log classification", () => {
  it("keeps routine signal-cli warnings out of error state", () => {
    expect(
      testApi.classifySignalCliLogLine(
        "WARN  ManagerImpl - No profile name set. When sending a message it's recommended to set a profile name.",
      ),
    ).toBe("log");
  });

  it("keeps recoverable prekey decrypt receive failures out of error state", () => {
    expect(
      testApi.classifySignalCliLogLine(
        "receive exception: org.signal.libsignal.protocol.InvalidMessageException: invalid PreKey message: decryption failed",
      ),
    ).toBe("log");
  });

  it("still surfaces signal-cli failures as errors", () => {
    expect(testApi.classifySignalCliLogLine("ERROR DaemonCommand - startup failed")).toBe("error");
    expect(testApi.classifySignalCliLogLine("SEVERE Manager - database exception")).toBe("error");
  });
});

describe("bindSignalCliOutput", () => {
  it("registers an error listener on the stream to prevent crash on broken pipe", () => {
    const stream = new EventEmitter() as NodeJS.ReadableStream;
    const onSpy = vi.spyOn(stream, "on");

    testApi.bindSignalCliOutput({
      stream,
      log: vi.fn(),
      error: vi.fn(),
    });

    expect(onSpy).toHaveBeenCalledWith("error", expect.any(Function));
  });

  it("does not throw when the stream emits an error", () => {
    const stream = new EventEmitter() as NodeJS.ReadableStream;
    const log = vi.fn();
    const err = vi.fn();

    testApi.bindSignalCliOutput({ stream, log, error: err });

    expect(() => stream.emit("error", new Error("pipe broken"))).not.toThrow();
  });
});
