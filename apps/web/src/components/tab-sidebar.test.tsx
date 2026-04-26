import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Tabs } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { SessionMetadata } from "@/lib/types";
import { useSessions } from "@/lib/use-sessions";
import { TabSidebar } from "./tab-sidebar";

const makeSession = (id: string, overrides: Partial<SessionMetadata> = {}): SessionMetadata => ({
  id,
  title: id,
  cwd: `/Users/me/${id}`,
  shell: "/bin/sh",
  pid: 1,
  cols: 80,
  rows: 24,
  createdAt: 0,
  exited: false,
  exitCode: null,
  ...overrides,
});

const seed = (sessions: SessionMetadata[], activeId: string | null = sessions[0]?.id ?? null) => {
  useSessions.setState({ sessions, activeId, isLoading: false, hasLoaded: true, error: null });
};

const renderSidebar = (onNew = vi.fn()) =>
  render(
    <TooltipProvider delayDuration={0}>
      <Tabs
        value={useSessions.getState().activeId ?? ""}
        onValueChange={(value) => useSessions.getState().setActive(value)}
        orientation="vertical"
      >
        <TabSidebar onNew={onNew} />
      </Tabs>
    </TooltipProvider>,
  );

beforeEach(() => {
  useSessions.setState({
    sessions: [],
    activeId: null,
    isLoading: false,
    hasLoaded: false,
    error: null,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("TabSidebar", () => {
  it("renders a row per session with title and last cwd segment", () => {
    seed([
      makeSession("alpha", { title: "alpha", cwd: "/Users/me/work" }),
      makeSession("beta", { title: "beta", cwd: "/tmp" }),
    ]);
    renderSidebar();
    expect(screen.getByRole("tab", { name: /alpha/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /beta/ })).toBeInTheDocument();
    expect(screen.getByText("work")).toBeInTheDocument();
    expect(screen.getByText("tmp")).toBeInTheDocument();
  });

  it("does not nest a real <button> inside another <button> (close X is a sibling)", () => {
    seed([makeSession("a"), makeSession("b")]);
    renderSidebar();
    const closeButtons = screen.getAllByRole("button", { name: /^close /i });
    for (const closeButton of closeButtons) {
      const parentButton = closeButton.parentElement?.closest("button");
      expect(parentButton).toBeNull();
    }
  });

  it("clicking a tab activates it via onValueChange", () => {
    const setActiveSpy = vi.spyOn(useSessions.getState(), "setActive");
    seed([makeSession("a"), makeSession("b")], "a");
    renderSidebar();
    fireEvent.click(screen.getByRole("tab", { name: /^b/ }));
    expect(setActiveSpy).toHaveBeenCalledWith("b");
  });

  it("hides the close X when there is only one session", () => {
    seed([makeSession("solo")]);
    renderSidebar();
    expect(screen.queryByRole("button", { name: /^close /i })).toBeNull();
  });

  it("shows the close X for every tab when there are 2+ sessions", () => {
    seed([makeSession("a"), makeSession("b"), makeSession("c")]);
    renderSidebar();
    expect(screen.getAllByRole("button", { name: /^close /i })).toHaveLength(3);
  });

  it("close button calls remove for the targeted session", () => {
    const removeMock = vi.fn().mockResolvedValue(undefined);
    useSessions.setState({ remove: removeMock });
    seed([makeSession("a"), makeSession("b")], "a");
    renderSidebar();

    const targetTab = screen.getByRole("tab", { name: /^b/ });
    const closeButton = within(targetTab).getByRole("button", { name: /^close b$/i });
    fireEvent.click(closeButton);
    expect(removeMock).toHaveBeenCalledWith("b");
  });

  it("middle-click on a tab removes that session", () => {
    const removeMock = vi.fn().mockResolvedValue(undefined);
    useSessions.setState({ remove: removeMock });
    seed([makeSession("a"), makeSession("b")], "a");
    renderSidebar();
    const target = screen.getByRole("tab", { name: /^b/ });
    target.dispatchEvent(new MouseEvent("auxclick", { bubbles: true, button: 1 }));
    expect(removeMock).toHaveBeenCalledWith("b");
  });

  it("middle-click is a no-op when there is only one tab", () => {
    const removeMock = vi.fn().mockResolvedValue(undefined);
    useSessions.setState({ remove: removeMock });
    seed([makeSession("solo")]);
    renderSidebar();
    const target = screen.getByRole("tab", { name: /^solo/ });
    target.dispatchEvent(new MouseEvent("auxclick", { bubbles: true, button: 1 }));
    expect(removeMock).not.toHaveBeenCalled();
  });

  it("active row carries data-state=active for styling", () => {
    seed([makeSession("a"), makeSession("b")], "b");
    renderSidebar();
    const tabA = screen.getByRole("tab", { name: /^a/ });
    const tabB = screen.getByRole("tab", { name: /^b/ });
    expect(tabA.getAttribute("data-state")).toBe("inactive");
    expect(tabB.getAttribute("data-state")).toBe("active");
  });

  it("the new-tab button is wired to onNew", () => {
    const onNew = vi.fn();
    seed([makeSession("a")]);
    renderSidebar(onNew);
    fireEvent.click(screen.getByRole("button", { name: /^new tab$/i }));
    expect(onNew).toHaveBeenCalled();
  });
});
