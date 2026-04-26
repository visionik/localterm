import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SessionMetadata } from "./types";
import { useSessions } from "./use-sessions";

const makeSession = (id: string, overrides: Partial<SessionMetadata> = {}): SessionMetadata => ({
  id,
  title: id,
  cwd: "/tmp",
  shell: "/bin/sh",
  pid: 1,
  cols: 80,
  rows: 24,
  createdAt: 0,
  exited: false,
  exitCode: null,
  ...overrides,
});

const resetStore = () => {
  useSessions.setState({
    sessions: [],
    activeId: null,
    isLoading: false,
    hasLoaded: false,
    error: null,
  });
};

beforeEach(() => {
  resetStore();
});

afterEach(() => {
  vi.restoreAllMocks();
  resetStore();
});

describe("useSessions", () => {
  it("removeLocal drops the session and shifts active to the next", () => {
    useSessions.setState({
      sessions: [makeSession("a"), makeSession("b"), makeSession("c")],
      activeId: "b",
      hasLoaded: true,
    });
    useSessions.getState().removeLocal("b");
    const state = useSessions.getState();
    expect(state.sessions.map((s) => s.id)).toEqual(["a", "c"]);
    expect(state.activeId).toBe("a");
  });

  it("removeLocal keeps active when removing a non-active session", () => {
    useSessions.setState({
      sessions: [makeSession("a"), makeSession("b")],
      activeId: "a",
      hasLoaded: true,
    });
    useSessions.getState().removeLocal("b");
    expect(useSessions.getState().activeId).toBe("a");
  });

  it("removeLocal sets activeId to null when last session is removed", () => {
    useSessions.setState({
      sessions: [makeSession("solo")],
      activeId: "solo",
      hasLoaded: true,
    });
    useSessions.getState().removeLocal("solo");
    expect(useSessions.getState().activeId).toBeNull();
  });

  it("patchTitle updates only the matching session", () => {
    useSessions.setState({
      sessions: [makeSession("a"), makeSession("b")],
      activeId: "a",
      hasLoaded: true,
    });
    useSessions.getState().patchTitle("b", "renamed");
    const state = useSessions.getState();
    expect(state.sessions.find((s) => s.id === "a")?.title).toBe("a");
    expect(state.sessions.find((s) => s.id === "b")?.title).toBe("renamed");
  });

  it("markExited flips both exited and exitCode", () => {
    useSessions.setState({
      sessions: [makeSession("a")],
      activeId: "a",
      hasLoaded: true,
    });
    useSessions.getState().markExited("a", 137);
    const session = useSessions.getState().sessions[0];
    expect(session?.exited).toBe(true);
    expect(session?.exitCode).toBe(137);
  });

  it("setActive updates activeId only", () => {
    const before = [makeSession("a"), makeSession("b")];
    useSessions.setState({
      sessions: before,
      activeId: "a",
      hasLoaded: true,
    });
    useSessions.getState().setActive("b");
    expect(useSessions.getState().activeId).toBe("b");
    expect(useSessions.getState().sessions).toBe(before);
  });
});
