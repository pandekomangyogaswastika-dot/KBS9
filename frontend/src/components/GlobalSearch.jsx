/**
 * GlobalSearch — Phase 14
 * A reusable command-palette dialog that searches the platform.
 *
 * Props:
 *   - scope: "public" | "portal" — determines which endpoint is used
 *   - trigger: ReactNode | null — optional custom trigger; if omitted, render
 *              the default button. The component also auto-binds Cmd/Ctrl+K.
 *
 * UX:
 *   - Cmd/Ctrl+K opens the dialog from anywhere on the page.
 *   - Type ≥2 chars to trigger a debounced search (250 ms).
 *   - Results are grouped by type with icons.
 *   - Clicking a result navigates and closes the dialog.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Search, Briefcase, FileText, FolderKanban, BadgeCheck,
  Inbox, Newspaper, GraduationCap, Lightbulb, Loader2,
} from "lucide-react";

import { api } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";

/**
 * Get icon component for search result type
 * Uses explicit conditionals to avoid dynamic JSX issues (TD-007)
 */
function getTypeIcon(type) {
  if (type === "services") return Lightbulb;
  if (type === "cases") return Briefcase;
  if (type === "blog") return Newspaper;
  if (type === "careers") return GraduationCap;
  if (type === "projects") return FolderKanban;
  if (type === "approvals") return BadgeCheck;
  if (type === "documents") return FileText;
  if (type === "leads") return Inbox;
  return Search; // default fallback
}

const DEBOUNCE_MS = 250;

export function GlobalSearch({ scope = "public", trigger = null, className = "" }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({ groups: [], total: 0, took_ms: 0 });
  const [loading, setLoading] = useState(false);
  const abortRef = useRef(null);

  // Cmd/Ctrl+K shortcut.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Reset state when dialog closes.
  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults({ groups: [], total: 0, took_ms: 0 });
    }
  }, [open]);

  const endpoint = scope === "portal" ? "/portal/search" : "/search";
  const locale = i18n.language?.startsWith("en") ? "en" : "id";

  // Debounced search effect.
  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 2) {
      setResults({ groups: [], total: 0, took_ms: 0 });
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    const handle = setTimeout(async () => {
      try {
        if (abortRef.current) abortRef.current.abort?.();
      } catch (_e) { /* noop */ }
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const r = await api.get(`${endpoint}?q=${encodeURIComponent(q)}&limit=6&locale=${locale}`, {
          signal: controller.signal,
        });
        const data = r.data?.data || {};
        setResults({
          groups: data.groups || [],
          total: data.total || 0,
          took_ms: data.took_ms || 0,
        });
      } catch (e) {
        if (e.name !== "AbortError" && e.name !== "CanceledError") {
          setResults({ groups: [], total: 0, took_ms: 0 });
        }
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [query, open, endpoint, locale]);

  const onSelect = useCallback((url) => {
    if (!url || url === "#") {
      setOpen(false);
      return;
    }
    setOpen(false);
    // If url is absolute (http) open new tab, otherwise navigate internally.
    if (/^https?:/.test(url)) {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      navigate(url);
    }
  }, [navigate]);

  const placeholder = useMemo(() => {
    return scope === "portal" ? t("search.placeholderPortal") : t("search.placeholderPublic");
  }, [scope, t]);

  const defaultTrigger = (
    <Button
      variant="outline"
      size="sm"
      className={`gap-2 border-white/12 bg-white/[0.03] text-[color:var(--kti-text-dim)] hover:bg-white/[0.06] hover:text-white ${className}`}
      onClick={() => setOpen(true)}
      data-testid={`global-search-trigger-${scope}`}
    >
      <Search className="size-4" />
      <span className="hidden sm:inline">{t("search.trigger")}</span>
      <kbd className="ml-1 hidden rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-mono text-[color:var(--kti-text-dim)] md:inline">⌘K</kbd>
    </Button>
  );

  return (
    <>
      {trigger ? (
        <span onClick={() => setOpen(true)} role="button" tabIndex={0}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setOpen(true)}
          data-testid={`global-search-trigger-${scope}`}
        >
          {trigger}
        </span>
      ) : defaultTrigger}

      <CommandDialog open={open} onOpenChange={setOpen} data-testid={`global-search-dialog-${scope}`}>
        <CommandInput
          placeholder={placeholder}
          value={query}
          onValueChange={setQuery}
          data-testid="global-search-input"
        />
        <CommandList className="max-h-[420px]">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-[color:var(--kti-text-dim)]">
              <Loader2 className="size-4 animate-spin" />{t("search.searching")}
            </div>
          )}
          {!loading && query.trim().length >= 2 && results.groups.length === 0 && (
            <CommandEmpty>{t("search.noResults", { query })}</CommandEmpty>
          )}
          {!loading && query.trim().length < 2 && (
            <div className="py-8 text-center text-xs text-[color:var(--kti-text-dim)]">
              {t("search.startTyping")}
            </div>
          )}
          {!loading && results.groups.map((group, idx) => {
            const Icon = getTypeIcon(group.type);
            return (
              <div key={group.type}>
                {idx > 0 && <CommandSeparator />}
                <CommandGroup heading={group.label}>
                  {group.items.map((item) => (
                    <CommandItem
                      key={`${group.type}:${item.id}`}
                      value={`${group.type}-${item.id}-${item.title}`}
                      onSelect={() => onSelect(item.url)}
                      data-testid={`global-search-result-${group.type}`}
                      className="flex items-start gap-3 px-3 py-2.5"
                    >
                      <Icon className="mt-0.5 size-4 shrink-0 text-[color:var(--kti-accent)]" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white">{item.title}</p>
                        {item.snippet ? (
                          <p className="mt-0.5 line-clamp-1 text-[11px] text-[color:var(--kti-text-dim)]">
                            {item.snippet}
                          </p>
                        ) : null}
                        {item.meta?.status ? (
                          <span className="mt-1 inline-block rounded border border-white/8 bg-white/[0.03] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[color:var(--kti-text-dim)]">
                            {item.meta.status}
                          </span>
                        ) : null}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </div>
            );
          })}
          {!loading && results.total > 0 ? (
            <div className="border-t border-white/8 px-3 py-2 text-[10px] text-[color:var(--kti-text-dim)]">
              {t("search.foundIn", { total: results.total, ms: results.took_ms })}
            </div>
          ) : null}
        </CommandList>
      </CommandDialog>
    </>
  );
}

export default GlobalSearch;
