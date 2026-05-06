import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { Search } from "lucide-react";
import {
  type CSSProperties,
  type RefObject,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PANEL_ANIMATION_CLASSES, TRANSLUCENT_PANEL_CLASSES } from "@/lib/animation-classes";
import { LOCAL_FONT_ROW_INTRINSIC_HEIGHT_PX, TOOLTIP_SIDE_OFFSET_PX } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { escapeCssFontFamily } from "@/utils/escape-css-font-family";
import {
  type LocalFontPermissionState,
  loadLocalFontPermissionState,
} from "@/utils/load-local-font-permission-state";
import { isLocalFontAccessSupported, queryLocalFonts } from "@/utils/query-local-fonts";

interface LocalFontPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anchorRef: RefObject<HTMLDivElement | null>;
  currentFamily: string | null;
  onApply: (family: string) => void;
}

type PickerState =
  | { kind: "loading" }
  | { kind: "unsupported" }
  | { kind: "denied" }
  | { kind: "prompt" }
  | { kind: "ready"; families: readonly string[] };

const POPUP_CLASSES =
  "z-50 flex w-72 origin-(--transform-origin) flex-col gap-2 overflow-hidden rounded-md p-2 outline-hidden";

const ROW_BASE_CLASSES =
  "flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-left text-xs text-foreground/90 outline-none transition-colors hover:bg-foreground/10 focus-visible:bg-foreground/10";

const ROW_STYLE: CSSProperties = {
  contentVisibility: "auto",
  containIntrinsicSize: `auto ${LOCAL_FONT_ROW_INTRINSIC_HEIGHT_PX}px`,
};

const HELP_TEXT_CLASSES = "text-xs leading-snug text-muted-foreground/80";

const filterFamilies = (families: readonly string[], query: string): readonly string[] => {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return families;
  return families.filter((family) => family.toLowerCase().includes(trimmed));
};

interface ManualFamilyInputProps {
  initialValue: string;
  onApply: (family: string) => void;
}

const ManualFamilyInput = ({ initialValue, onApply }: ManualFamilyInputProps) => {
  const [draft, setDraft] = useState(initialValue);
  const trimmed = draft.trim();
  const handleSubmit = () => {
    if (!trimmed) return;
    onApply(trimmed);
  };
  return (
    <div className="flex flex-col gap-1.5">
      <Input
        autoFocus
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            handleSubmit();
          }
        }}
        placeholder="Family name (e.g. Iosevka)"
        className="h-8 text-xs"
      />
      <Button
        type="button"
        size="sm"
        variant="secondary"
        disabled={!trimmed}
        onClick={handleSubmit}
        className="h-7 text-xs"
      >
        Apply
      </Button>
    </div>
  );
};

export const LocalFontPicker = ({
  open,
  onOpenChange,
  anchorRef,
  currentFamily,
  onApply,
}: LocalFontPickerProps) => {
  const [state, setState] = useState<PickerState>({ kind: "loading" });
  const [searchQuery, setSearchQuery] = useState("");
  const deferredQuery = useDeferredValue(searchQuery);

  useEffect(() => {
    if (!open) return;
    setSearchQuery("");
    let cancelled = false;
    setState({ kind: "loading" });
    void (async () => {
      if (!isLocalFontAccessSupported()) {
        if (!cancelled) setState({ kind: "unsupported" });
        return;
      }
      const permission: LocalFontPermissionState = await loadLocalFontPermissionState();
      if (cancelled) return;
      if (permission === "granted") {
        const families = await queryLocalFonts();
        if (!cancelled) setState({ kind: "ready", families });
      } else if (permission === "denied") {
        setState({ kind: "denied" });
      } else if (permission === "unsupported") {
        // Permissions API doesn't know about local-fonts even though
        // queryLocalFonts exists — ask directly, the API will prompt.
        setState({ kind: "prompt" });
      } else {
        setState({ kind: "prompt" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const requestPermissionAndLoad = async () => {
    setState({ kind: "loading" });
    const families = await queryLocalFonts();
    if (families.length === 0) {
      setState({ kind: "denied" });
      return;
    }
    setState({ kind: "ready", families });
  };

  const handleApply = (family: string) => {
    onApply(family);
    onOpenChange(false);
  };

  const filteredFamilies = useMemo(() => {
    if (state.kind !== "ready") return [];
    return filterFamilies(state.families, deferredQuery);
  }, [state, deferredQuery]);

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner
          anchor={anchorRef}
          side="left"
          align="start"
          sideOffset={TOOLTIP_SIDE_OFFSET_PX}
          className="isolate z-50"
        >
          <PopoverPrimitive.Popup
            className={cn(POPUP_CLASSES, TRANSLUCENT_PANEL_CLASSES, PANEL_ANIMATION_CLASSES)}
          >
            {state.kind === "loading" ? (
              <p className={HELP_TEXT_CLASSES}>Loading…</p>
            ) : state.kind === "unsupported" ? (
              <>
                <p className={HELP_TEXT_CLASSES}>
                  This browser doesn't expose installed fonts. Type a family name to use any
                  installed font.
                </p>
                <ManualFamilyInput initialValue={currentFamily ?? ""} onApply={handleApply} />
              </>
            ) : state.kind === "denied" ? (
              <>
                <p className={HELP_TEXT_CLASSES}>
                  Permission denied. Re-allow in browser site settings, or type a family name.
                </p>
                <ManualFamilyInput initialValue={currentFamily ?? ""} onApply={handleApply} />
              </>
            ) : state.kind === "prompt" ? (
              <>
                <p className={HELP_TEXT_CLASSES}>
                  Allow localterm to read your installed fonts to preview them.
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={requestPermissionAndLoad}
                  className="h-7 text-xs"
                >
                  Allow access
                </Button>
                <div className="my-1 border-t border-border/40" />
                <p className={HELP_TEXT_CLASSES}>Or type a family name:</p>
                <ManualFamilyInput initialValue={currentFamily ?? ""} onApply={handleApply} />
              </>
            ) : (
              <>
                <div className="relative">
                  <Search className="pointer-events-none absolute top-1/2 left-2 size-3 -translate-y-1/2 text-muted-foreground/70" />
                  <Input
                    autoFocus
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search installed fonts"
                    className="h-8 pl-7 text-xs"
                  />
                </div>
                <div className="-mx-1 max-h-72 overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {filteredFamilies.length === 0 ? (
                    <p className={cn(HELP_TEXT_CLASSES, "px-2 py-2")}>
                      No fonts match "{searchQuery}".
                    </p>
                  ) : (
                    filteredFamilies.map((family) => (
                      <button
                        key={family}
                        type="button"
                        onClick={() => handleApply(family)}
                        className={cn(
                          ROW_BASE_CLASSES,
                          family === currentFamily && "bg-foreground/5",
                        )}
                        style={{
                          ...ROW_STYLE,
                          fontFamily: `"${escapeCssFontFamily(family)}", ui-monospace, monospace`,
                        }}
                      >
                        <span className="truncate">{family}</span>
                      </button>
                    ))
                  )}
                </div>
                <p className={cn(HELP_TEXT_CLASSES, "px-1 tabular-nums")}>
                  {deferredQuery
                    ? `${filteredFamilies.length} of ${state.families.length}`
                    : `${state.families.length} fonts`}
                </p>
              </>
            )}
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
};
