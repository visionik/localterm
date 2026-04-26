import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TAB_META_MAX_WIDTH_PX } from "@/lib/constants";
import { useSessions } from "@/lib/use-sessions";
import { lastPathSegment } from "@/lib/utils/last-path-segment";
import { cn } from "@/lib/utils";

interface TabSidebarProps {
  onNew: () => void;
}

const TAB_ROW_CLASSES = cn(
  "term-tab group/row relative flex h-auto min-h-[30px] w-full cursor-pointer flex-none items-center justify-start gap-2 rounded-md border-0 bg-transparent px-2 py-1.5 text-left text-[13px] font-normal whitespace-nowrap shadow-none transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
);

export const TabSidebar = ({ onNew }: TabSidebarProps) => {
  const sessions = useSessions((state) => state.sessions);
  const activeId = useSessions((state) => state.activeId);
  const setActive = useSessions((state) => state.setActive);
  const remove = useSessions((state) => state.remove);

  const canClose = sessions.length > 1;

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col bg-term-rail text-term-rail-foreground">
      <div className="flex shrink-0 flex-col gap-0.5 px-2 pt-2 pb-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onNew}
              aria-label="new tab"
              className="h-auto min-h-[30px] justify-start gap-2 rounded-md px-2 py-1.5 text-[13px] font-normal text-term-rail-foreground hover:bg-term-rail-hover hover:text-term-rail-foreground-strong"
            >
              <Plus data-icon="inline-start" aria-hidden="true" />
              <span className="flex-1">new terminal</span>
              <span className="text-[11px] text-term-rail-muted">⌥⌘T</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs">
            spawn shell in same cwd as the active tab
          </TooltipContent>
        </Tooltip>
      </div>

      <div
        role="tablist"
        aria-label="terminal sessions"
        aria-orientation="vertical"
        className="relative flex-1 min-h-0 overflow-y-auto px-1.5 pt-1 pb-3"
      >
        <div className="flex flex-col gap-px">
          {sessions.map((session) => {
            const isActive = session.id === activeId;
            const label = session.title || "shell";
            const meta = lastPathSegment(session.cwd);
            const showMeta = meta && meta !== label;
            return (
              <ContextMenu key={session.id}>
                <ContextMenuTrigger className="block">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        role="tab"
                        tabIndex={isActive ? 0 : -1}
                        aria-selected={isActive}
                        aria-controls={`terminal-panel-${session.id}`}
                        data-state={isActive ? "active" : "inactive"}
                        onClick={() => setActive(session.id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setActive(session.id);
                          }
                        }}
                        onAuxClick={(event) => {
                          if (event.button === 1 && canClose) {
                            event.preventDefault();
                            void remove(session.id);
                          }
                        }}
                        className={cn(TAB_ROW_CLASSES, session.exited ? "italic opacity-60" : null)}
                      >
                        <span className="min-w-0 flex-1 truncate">{label}</span>
                        {showMeta ? (
                          <span
                            className={cn(
                              "shrink-0 truncate text-[11px] text-term-rail-muted transition-opacity",
                              canClose ? "group-hover/row:opacity-0" : null,
                            )}
                            style={{ maxWidth: TAB_META_MAX_WIDTH_PX }}
                          >
                            {meta}
                          </span>
                        ) : null}
                        {canClose ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon-xs"
                                variant="ghost"
                                aria-label={`close ${label}`}
                                onPointerDown={(event) => event.stopPropagation()}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void remove(session.id);
                                }}
                                className="absolute right-1.5 size-4 rounded text-term-rail-muted opacity-0 transition-opacity hover:bg-white/10 hover:text-term-rail-foreground-strong focus-visible:opacity-100 group-hover/row:opacity-100"
                              >
                                <X aria-hidden="true" className="size-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="text-xs">
                              close tab — ⌥⌘W
                            </TooltipContent>
                          </Tooltip>
                        ) : null}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="font-mono text-xs">
                      <div>{session.cwd}</div>
                      <div className="text-muted-foreground">{session.shell}</div>
                    </TooltipContent>
                  </Tooltip>
                </ContextMenuTrigger>
                <ContextMenuContent className="font-mono text-xs">
                  <ContextMenuItem disabled={!canClose} onSelect={() => void remove(session.id)}>
                    close tab
                    <ContextMenuShortcut>⌥⌘W</ContextMenuShortcut>
                  </ContextMenuItem>
                  <ContextMenuItem onSelect={onNew}>
                    new tab
                    <ContextMenuShortcut>⌥⌘T</ContextMenuShortcut>
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem disabled className="text-muted-foreground">
                    <span className="truncate">{session.cwd}</span>
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
