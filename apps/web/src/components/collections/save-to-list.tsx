'use client';

// ============================================================================
// SaveToList — "＋ Add to list" popover (HO-C)
// ============================================================================
// Dropdown of the caller's lists + inline "New list" composer. Mounted on the
// event detail actions row. Anonymous users get a sign-in link instead.
// Server-side add is idempotent (already → friendly toast).
// ============================================================================

import * as React from "react";
import Link from "next/link";
import { Check, ListPlus, Loader2, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useLocale } from "@/lib/i18n";
import {
  useMyCollections,
  useCreateCollection,
  useAddToList,
} from "@/hooks/use-collections";

export function SaveToList({ eventId }: { eventId: string }) {
  const { t } = useLocale();
  const { isAuthenticated } = useAuth();
  const { data, isLoading } = useMyCollections();
  const { mutate: create, isPending: creating } = useCreateCollection();
  const { mutate: add, isPending: adding } = useAddToList();

  const [newTitle, setNewTitle] = React.useState("");
  const [justAdded, setJustAdded] = React.useState<string | null>(null);

  if (!isAuthenticated) {
    return (
      <Link href="/auth/login">
        <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg" aria-label={t("collections.saveToList")} title={t("collections.saveToList")}>
          <ListPlus className="h-4 w-4" />
        </Button>
      </Link>
    );
  }

  const collections = data?.data ?? [];

  const addTo = (collectionId: string, name: string) => {
    add(
      { collectionId, eventId },
      {
        onSuccess: (res) => {
          setJustAdded(collectionId);
          setTimeout(() => setJustAdded(null), 1500);
          toast.success(
            res.already ? t("collections.alreadyInList", { name }) : t("collections.addedToList", { name })
          );
        },
        onError: (e) => toast.error(e.message),
      }
    );
  };

  const createAndAdd = () => {
    const title = newTitle.trim();
    if (title.length === 0) return;
    create(
      { title, visibility: "private" },
      {
        onSuccess: (created) => {
          setNewTitle("");
          add({ collectionId: created.id, eventId });
          toast.success(t("collections.addedToList", { name: created.title }));
        },
        onError: (e) => toast.error(e.message),
      }
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-lg"
          aria-label={t("collections.saveToList")}
          title={t("collections.saveToList")}
        >
          <ListPlus className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <p className="px-2 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
          {t("collections.saveToList")}
        </p>

        {isLoading ? (
          <div className="flex items-center justify-center py-3">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : collections.length === 0 ? (
          <p className="px-2 py-2 text-xs text-muted-foreground">{t("collections.emptyShort")}</p>
        ) : (
          collections.map((c) => (
            <DropdownMenuItem
              key={c.id}
              className="cursor-pointer gap-2 text-xs font-bold"
              disabled={adding}
              onClick={() => addTo(c.id, c.title)}
            >
              {justAdded === c.id ? (
                <Check className="h-3.5 w-3.5 text-success" />
              ) : (
                <ListPlus className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              <span className="truncate">{c.title}</span>
            </DropdownMenuItem>
          ))
        )}

        <DropdownMenuSeparator />
        <div className="flex items-center gap-1.5 p-1.5">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                createAndAdd();
              }
            }}
            placeholder={t("collections.newListPlaceholder")}
            className="h-8 text-xs rounded-lg"
            maxLength={120}
            aria-label={t("collections.newListPlaceholder")}
          />
          <Button
            size="icon"
            className="h-8 w-8 shrink-0 rounded-lg"
            onClick={createAndAdd}
            disabled={creating || newTitle.trim().length === 0}
            aria-label={t("collections.create")}
          >
            {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
