import { describe, expect, it } from "vite-plus/test";
import {
  TERMINAL_MSG_TYPE,
  decodeExit,
  decodeInput,
  decodeOutput,
  decodeResize,
  decodeSessionInfo,
  decodeTitle,
  encodeExit,
  encodeInput,
  encodeOutput,
  encodeResize,
  encodeSessionInfo,
  encodeTitle,
} from "../src/protocol.js";
import type { SessionInfo } from "../src/protocol.js";

describe("TERMINAL_MSG_TYPE constants", () => {
  it("has the correct values", () => {
    expect(TERMINAL_MSG_TYPE.INPUT).toBe(0x01);
    expect(TERMINAL_MSG_TYPE.OUTPUT).toBe(0x02);
    expect(TERMINAL_MSG_TYPE.RESIZE).toBe(0x03);
    expect(TERMINAL_MSG_TYPE.EXIT).toBe(0x04);
    expect(TERMINAL_MSG_TYPE.TITLE).toBe(0x05);
    expect(TERMINAL_MSG_TYPE.SESSION_INFO).toBe(0x06);
  });
});

describe("input codec", () => {
  it("round-trips ASCII text", () => {
    const original = "ls -la\r";
    expect(decodeInput(encodeInput(original))).toBe(original);
  });

  it("round-trips UTF-8 multibyte characters", () => {
    const original = "echo 你好世界 🌍";
    expect(decodeInput(encodeInput(original))).toBe(original);
  });

  it("round-trips empty string", () => {
    expect(decodeInput(encodeInput(""))).toBe("");
  });
});

describe("output codec", () => {
  it("round-trips terminal output with ANSI escapes", () => {
    const original = "\x1b[32mOK\x1b[0m\r\n";
    expect(decodeOutput(encodeOutput(original))).toBe(original);
  });

  it("round-trips empty string", () => {
    expect(decodeOutput(encodeOutput(""))).toBe("");
  });
});

describe("resize codec", () => {
  it("round-trips typical terminal dimensions", () => {
    const result = decodeResize(encodeResize(120, 40));
    expect(result).toEqual({ cols: 120, rows: 40 });
  });

  it("round-trips minimum dimensions (1x1)", () => {
    const result = decodeResize(encodeResize(1, 1));
    expect(result).toEqual({ cols: 1, rows: 1 });
  });

  it("round-trips uint16 maximum boundary (65535)", () => {
    const result = decodeResize(encodeResize(65535, 65535));
    expect(result).toEqual({ cols: 65535, rows: 65535 });
  });

  it("encodes as exactly 4 bytes", () => {
    expect(encodeResize(80, 24).length).toBe(4);
  });

  it("returns null on payload shorter than 4 bytes", () => {
    expect(decodeResize(new Uint8Array(3))).toBeNull();
    expect(decodeResize(new Uint8Array(0))).toBeNull();
  });
});

describe("exit codec", () => {
  it("round-trips exit code 0", () => {
    expect(decodeExit(encodeExit(0))).toBe(0);
  });

  it("round-trips positive exit code", () => {
    expect(decodeExit(encodeExit(137))).toBe(137);
  });

  it("round-trips null exit code as INT32_MIN sentinel", () => {
    const encoded = encodeExit(null);
    const view = new DataView(encoded.buffer);
    expect(view.getInt32(0, false)).toBe(-2147483648);
    expect(decodeExit(encoded)).toBeNull();
  });

  it("does not treat -1 as null (real exit code preserved)", () => {
    expect(decodeExit(encodeExit(-1))).toBe(-1);
  });

  it("encodes as exactly 4 bytes", () => {
    expect(encodeExit(0).length).toBe(4);
  });

  it("throws on payload shorter than 4 bytes", () => {
    expect(() => decodeExit(new Uint8Array(2))).toThrow("exit payload must be 4 bytes");
  });

  it("round-trips negative exit codes (non-sentinel)", () => {
    expect(decodeExit(encodeExit(-2))).toBe(-2);
    expect(decodeExit(encodeExit(-128))).toBe(-128);
  });
});

describe("title codec", () => {
  it("round-trips a path-style title", () => {
    const original = "~/Projects/localterm";
    expect(decodeTitle(encodeTitle(original))).toBe(original);
  });

  it("round-trips unicode titles", () => {
    const original = "📁 documents";
    expect(decodeTitle(encodeTitle(original))).toBe(original);
  });

  it("round-trips empty string", () => {
    expect(decodeTitle(encodeTitle(""))).toBe("");
  });
});

describe("session-info codec", () => {
  it("round-trips session info", () => {
    const info: SessionInfo = {
      shell: "/bin/zsh",
      shellName: "zsh",
      pid: 12345,
      cwd: "/Users/tester",
    };
    expect(decodeSessionInfo(encodeSessionInfo(info))).toEqual(info);
  });

  it("preserves all fields including special characters in paths", () => {
    const info: SessionInfo = {
      shell: "/usr/local/bin/fish",
      shellName: "fish",
      pid: 1,
      cwd: "/home/user/My Documents/项目",
    };
    expect(decodeSessionInfo(encodeSessionInfo(info))).toEqual(info);
  });
});
