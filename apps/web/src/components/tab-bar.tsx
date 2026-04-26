import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TAB_MIN_WIDTH_PX } from "@/lib/constants";
import { useSessions } from "@/lib/use-sessions";
import { cn } from "@/lib/utils";

interface TabBarProps {
  onNew: () => void;
}

export const TabBar = ({ onNew }: TabBarProps) => {
  const sessions = useSessions((state) => state.sessions);
  const activeId = useSessions((state) => state.activeId);
  const setActive = useSessions((state) => state.setActive);
  const remove = useSessions((state) => state.remove);

  return (
    <div className="flex h-9 shrink-0 items-stretch bg-[#0a0a0a]">
      <div
        role="tablist"
        aria-label="terminal sessions"
        className="flex flex-1 items-stretch overflow-x-auto"
      >
        {sessions.map((session, index) => {
          const isActive = session.id === activeId;
          const isPrevActive = sessions[index - 1]?.id === activeId;
          const label = session.title || "shell";
          return (
            <div
              key={session.id}
              className={cn(
                "group relative flex min-w-0 flex-1 items-center transition-colors",
                isActive
                  ? "bg-[#101010] text-foreground"
                  : "border-b border-white/[0.06] text-muted-foreground hover:bg-white/[0.02] hover:text-foreground",
                session.exited && "italic opacity-60",
              )}
              style={{ minWidth: TAB_MIN_WIDTH_PX }}
              onAuxClick={(event) => {
                if (event.button === 1) {
                  event.preventDefault();
                  void remove(session.id);
                }
              }}
            >
              {!isActive && index > 0 && !isPrevActive ? (
                <span
                  aria-hidden="true"
                  className="absolute inset-y-2 left-0 w-px bg-white/[0.06]"
                />
              ) : null}
              <button
                type="button"
                role="tab"
                id={`tab-${session.id}`}
                aria-selected={isActive}
                aria-controls={`terminal-panel-${session.id}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setActive(session.id)}
                className="flex min-w-0 flex-1 items-center px-3 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <span className="truncate">{label}</span>
              </button>
              {sessions.length > 1 ? (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    void remove(session.id);
                  }}
                  aria-label={`close ${label}`}
                  className={cn(
                    "mr-1 inline-flex size-5 shrink-0 items-center justify-center rounded transition-opacity hover:bg-white/10 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring/50",
                    isActive ? "opacity-40 hover:opacity-100" : "opacity-0 group-hover:opacity-100",
                  )}
                >
                  <X aria-hidden="true" className="size-3" />
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
      <div
        className={cn(
          "flex shrink-0 items-center pr-1 pl-1",
          sessions.length === 0 ? null : "border-b border-white/[0.06]",
        )}
      >
        <Button
          size="icon-sm"
          variant="ghost"
          className="shrink-0"
          onClick={onNew}
          aria-label="new tab"
        >
          <Plus aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
};
