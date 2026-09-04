"use client";

// ============================================================================
// /lists — "My Lists" management (HO-C, signed-in)
// ============================================================================
// Create lists, toggle visibility (public/unlisted/private), open shareable
// public views, delete. Events are added via the "Save to list" control on
// event pages, not here. Golden template: (public)/my-events/page.tsx.
// ============================================================================

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  CalendarDays,
  ExternalLink,
  Globe,
  Link2,
  ListPlus,
  Loader2,
  MoreVertical,
  Plus,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLocale } from "@/lib/i18n";
import {
  useMyCollections,
  useCreateCollection,
  useDeleteCollection,
  useUpdateCollection,
  type MyCollection,
} from "@/hooks/use-collections";

const visibilityBadge = {
  public: "success",
  unlisted: "secondary",
  private: "outline",
} as const;

export default function ListsPage() {
  const { t } = useLocale();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data, isLoading } = useMyCollections();
  const { mutate: create, isPending: creating } = useCreateCollection();
  const { mutate: deleteList } = useDeleteCollection();
  const { mutate: updateList } = useUpdateCollection();

  const [title, setTitle] = React.useState("");
  const [visibility, setVisibility] = React.useState<"public" | "unlisted" | "private">("private");

  const collections = data?.data ?? [];

  const createList = () => {
    const trimmed = title.trim();
    if (trimmed.length === 0) return;
    create(
      { title: trimmed, visibility },
      {
        onSuccess: () => {
          setTitle("");
          toast.success(t("collections.created"));
        },
        onError: (e) => toast.error(e.message),
      }
    );
  };

  if (authLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-4">
        <Skeleton className="h-10 w-48" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <PageHeader title={t("collections.myLists")} description={t("collections.myListsDesc")} />
          <EmptyState
            icon={Link2}
            title={t("collections.signInTitle")}
            description={t("collections.signInBody")}
            action={{ label: t("nav.login"), onClick: () => (window.location.href = "/auth/login") }}
          />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <PageHeader title={t("collections.myLists")} description={t("collections.myListsDesc")} />

        {/* Create form */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") createList();
                }}
                placeholder={t("collections.newListPlaceholder")}
                maxLength={120}
                className="min-h-[44px] rounded-xl"
                aria-label={t("collections.newListPlaceholder")}
              />
              <Select value={visibility} onValueChange={(v) => setVisibility(v as typeof visibility)}>
                <SelectTrigger className="min-h-[44px] rounded-xl sm:w-[150px]" aria-label={t("collections.visibility")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">{t("collections.visibilityPrivate")}</SelectItem>
                  <SelectItem value="unlisted">{t("collections.visibilityUnlisted")}</SelectItem>
                  <SelectItem value="public">{t("collections.visibilityPublic")}</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={createList}
                disabled={creating || title.trim().length === 0}
                className="min-h-[44px] rounded-xl font-bold"
              >
                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                {t("collections.create")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : collections.length === 0 ? (
          <EmptyState
            icon={ListPlus}
            title={t("collections.emptyTitle")}
            description={t("collections.emptyBody")}
          />
        ) : (
          <div className="space-y-3">
            {collections.map((c) => (
              <CollectionRow
                key={c.id}
                collection={c}
                onDelete={() =>
                  deleteList(c.id, {
                    onSuccess: () => toast.success(t("collections.deleted")),
                    onError: (e) => toast.error(e.message),
                  })
                }
                onVisibilityChange={(v) =>
                  updateList(
                    { id: c.id, data: { visibility: v } },
                    { onError: (e) => toast.error(e.message) }
                  )
                }
              />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

function CollectionRow({
  collection,
  onDelete,
  onVisibilityChange,
}: {
  collection: MyCollection;
  onDelete: () => void;
  onVisibilityChange: (v: "public" | "unlisted" | "private") => void;
}) {
  const { t } = useLocale();
  const shareable = collection.visibility !== "private";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Card hoverable>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-bold text-sm text-foreground truncate">{collection.title}</p>
                <Badge variant={visibilityBadge[collection.visibility]} className="text-[9px] uppercase">
                  {collection.visibility === "public"
                    ? t("collections.visibilityPublic")
                    : collection.visibility === "unlisted"
                      ? t("collections.visibilityUnlisted")
                      : t("collections.visibilityPrivate")}
                </Badge>
                {collection.is_editorial && (
                  <Badge variant="accent" className="text-[9px] uppercase">{t("collections.editorial")}</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                <CalendarDays className="h-3 w-3" />
                {t("collections.eventCount", { count: collection.event_count })}
              </p>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <Select
                value={collection.visibility}
                onValueChange={(v) => onVisibilityChange(v as "public" | "unlisted" | "private")}
              >
                <SelectTrigger
                  className="min-h-[36px] h-9 rounded-lg text-xs w-[110px]"
                  aria-label={t("collections.visibility")}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">{t("collections.visibilityPrivate")}</SelectItem>
                  <SelectItem value="unlisted">{t("collections.visibilityUnlisted")}</SelectItem>
                  <SelectItem value="public">{t("collections.visibilityPublic")}</SelectItem>
                </SelectContent>
              </Select>

              {shareable && (
                <Link href={`/collections/${collection.slug}`}>
                  <Button variant="outline" size="sm" className="rounded-lg font-bold">
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline ml-1.5">{t("collections.open")}</span>
                  </Button>
                </Link>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" aria-label={t("qa.delete")}>
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  {shareable && (
                    <DropdownMenuItem
                      className="cursor-pointer text-xs font-bold gap-2"
                      onClick={() => {
                        void navigator.clipboard?.writeText(
                          `${window.location.origin}/collections/${collection.slug}`
                        );
                        toast.success(t("collections.linkCopied"));
                      }}
                    >
                      <Globe className="h-3.5 w-3.5" />
                      {t("collections.copyLink")}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    className="cursor-pointer text-xs font-bold gap-2 text-destructive focus:text-destructive"
                    onClick={onDelete}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {t("qa.delete")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
