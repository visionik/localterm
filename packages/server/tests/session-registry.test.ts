import { describe, expect, it, vi } from "vite-plus/test";
import { SessionRegistry } from "../src/session-registry.js";
import type { Session } from "../src/session.js";

const createMockSession = (): Session =>
  ({ dispose: vi.fn() }) as unknown as Session;

describe("SessionRegistry", () => {
  it("registers and reports size", () => {
    const registry = new SessionRegistry();
    const session = createMockSession();
    registry.register(1, session);
    expect(registry.size()).toBe(1);
  });

  it("unregisters by channel ID", () => {
    const registry = new SessionRegistry();
    const session = createMockSession();
    registry.register(42, session);
    expect(registry.size()).toBe(1);
    registry.unregister(42);
    expect(registry.size()).toBe(0);
  });

  it("getByChannelId returns registered session", () => {
    const registry = new SessionRegistry();
    const session = createMockSession();
    registry.register(7, session);
    expect(registry.getByChannelId(7)).toBe(session);
  });

  it("getByChannelId returns undefined for unknown channel", () => {
    const registry = new SessionRegistry();
    expect(registry.getByChannelId(999)).toBeUndefined();
  });

  it("disposeAll calls dispose on every session and clears the registry", () => {
    const registry = new SessionRegistry();
    const sessionA = createMockSession();
    const sessionB = createMockSession();
    registry.register(1, sessionA);
    registry.register(2, sessionB);
    registry.disposeAll();
    expect(sessionA.dispose).toHaveBeenCalledOnce();
    expect(sessionB.dispose).toHaveBeenCalledOnce();
    expect(registry.size()).toBe(0);
  });

  it("registerAuto assigns negative IDs", () => {
    const registry = new SessionRegistry();
    const session = createMockSession();
    const autoId = registry.registerAuto(session);
    expect(autoId).toBeLessThan(0);
    expect(registry.getByChannelId(autoId)).toBe(session);
  });

  it("multiple registerAuto calls yield unique IDs", () => {
    const registry = new SessionRegistry();
    const idA = registry.registerAuto(createMockSession());
    const idB = registry.registerAuto(createMockSession());
    expect(idA).not.toBe(idB);
    expect(registry.size()).toBe(2);
  });

  it("handles mixed auto and explicit registrations without collision", () => {
    const registry = new SessionRegistry();
    const autoSession = createMockSession();
    const channelSession = createMockSession();
    const autoId = registry.registerAuto(autoSession);
    registry.register(1, channelSession);
    expect(registry.size()).toBe(2);
    expect(registry.getByChannelId(autoId)).toBe(autoSession);
    expect(registry.getByChannelId(1)).toBe(channelSession);
  });
});
