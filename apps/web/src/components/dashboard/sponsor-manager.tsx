"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useSponsors, useCreateSponsor, useDeleteSponsor, useUpdateSponsor } from "@/hooks/use-sponsors";
import { SPONSOR_TIERS } from "@eventology/schemas";
import { Building2, Plus, Edit3, Trash2, ExternalLink } from "lucide-react";
import type { SponsorRow } from "@/app/api/protected/sponsors/route";

interface SponsorManagerProps {
  eventId: string;
}

const TIER_VARIANTS: Record<string, "default" | "secondary" | "accent" | "outline"> = {
  platinum: "default",
  gold: "secondary",
  silver: "outline",
  bronze: "accent",
};

export function SponsorManager({ eventId }: SponsorManagerProps) {
  const sponsorsQ = useSponsors(eventId);
  const create = useCreateSponsor();
  const update = useUpdateSponsor();
  const del = useDeleteSponsor();

  const [editor, setEditor] = React.useState<{ open: boolean; row: SponsorRow | null }>({ open: false, row: null });
  const [confirmDel, setConfirmDel] = React.useState<SponsorRow | null>(null);

  const sponsors = sponsorsQ.data?.data ?? [];

  const handleSave = async (form: {
    name: string;
    tier: SponsorRow['tier'];
    logo_url: string;
    website: string;
    description: string;
  }) => {
    try {
      if (editor.row) {
        await update.mutateAsync({
          id: editor.row.id,
          data: {
            name: form.name,
            tier: form.tier,
            logo_url: form.logo_url || null,
            website: form.website || null,
            description: form.description || null,
            sort_order: editor.row.sort_order,
            is_active: editor.row.is_active,
            event_id: editor.row.event_id,
          },
        });
        toast.success('Sponsor updated');
      } else {
        await create.mutateAsync({
          event_id: eventId,
          name: form.name,
          tier: form.tier,
          logo_url: form.logo_url || null,
          website: form.website || null,
          description: form.description || null,
          sort_order: 0,
          is_active: true,
          contact_name: null,
          contact_email: null,
          contact_phone: null,
          metadata: {},
        });
        toast.success('Sponsor added');
      }
      setEditor({ open: false, row: null });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  const handleDelete = async () => {
    if (!confirmDel) return;
    try {
      await del.mutateAsync(confirmDel.id);
      toast.success('Sponsor removed');
      setConfirmDel(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  if (sponsorsQ.isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (sponsorsQ.error) {
    return (
      <EmptyState
        icon={Building2}
        title="Failed to load sponsors"
        description="You may not have permission to manage this event's sponsors."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {sponsors.length} sponsor{sponsors.length === 1 ? '' : 's'} on this event
        </p>
        <Button
          size="sm"
          onClick={() => setEditor({ open: true, row: null })}
        >
          <Plus className="mr-1 h-4 w-4" /> Add sponsor
        </Button>
      </div>

      {sponsors.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No sponsors yet"
          description="Add a sponsor to display it on the event page."
        />
      ) : (
        <div className="space-y-2">
          {sponsors.map((s) => (
            <Card key={s.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4 flex items-center gap-4">
                {s.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={s.logo_url}
                    alt={s.name}
                    className="h-12 w-12 rounded-lg object-cover border border-border"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{s.name}</span>
                    <Badge variant={TIER_VARIANTS[s.tier]}>{s.tier}</Badge>
                    {!s.is_active && <Badge variant="outline">Hidden</Badge>}
                  </div>
                  {s.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{s.description}</p>
                  )}
                  {s.website && (
                    <a
                      href={s.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-0.5"
                    >
                      <ExternalLink className="h-3 w-3" /> {s.website}
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setEditor({ open: true, row: s })}
                    title="Edit"
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setConfirmDel(s)}
                    title="Delete"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <SponsorEditorDialog
        open={editor.open}
        onOpenChange={(o) => !o && setEditor({ open: false, row: null })}
        row={editor.row}
        onSave={handleSave}
        isPending={create.isPending || update.isPending}
      />

      <Dialog open={!!confirmDel} onOpenChange={(o) => !o && setConfirmDel(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove sponsor?</DialogTitle>
            <DialogDescription>
              &quot;{confirmDel?.name}&quot; will no longer appear on the event page. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmDel(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={del.isPending}
            >
              {del.isPending ? 'Removing…' : 'Remove sponsor'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface SponsorEditorDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  row: SponsorRow | null;
  isPending: boolean;
  onSave: (form: { name: string; tier: SponsorRow['tier']; logo_url: string; website: string; description: string }) => Promise<void>;
}

function SponsorEditorDialog({ open, onOpenChange, row, isPending, onSave }: SponsorEditorDialogProps) {
  const [name, setName] = React.useState('');
  const [tier, setTier] = React.useState<SponsorRow['tier']>('bronze');
  const [logoUrl, setLogoUrl] = React.useState('');
  const [website, setWebsite] = React.useState('');
  const [description, setDescription] = React.useState('');

  React.useEffect(() => {
    if (row) {
      setName(row.name);
      setTier(row.tier);
      setLogoUrl(row.logo_url ?? '');
      setWebsite(row.website ?? '');
      setDescription(row.description ?? '');
    } else if (open) {
      setName('');
      setTier('bronze');
      setLogoUrl('');
      setWebsite('');
      setDescription('');
    }
  }, [row, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{row ? 'Edit sponsor' : 'Add sponsor'}</DialogTitle>
          <DialogDescription>
            Sponsors display on the public event page. Use a logo URL for best results.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="sp-name">Name</Label>
            <Input id="sp-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Co." />
          </div>
          <div>
            <Label htmlFor="sp-tier">Tier</Label>
            <Select value={tier} onValueChange={(v) => setTier(v as SponsorRow['tier'])}>
              <SelectTrigger id="sp-tier"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SPONSOR_TIERS.map((t: string) => (
                  <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="sp-logo">Logo URL</Label>
            <Input id="sp-logo" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <Label htmlFor="sp-web">Website</Label>
            <Input id="sp-web" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <Label htmlFor="sp-desc">Description (optional)</Label>
            <Textarea id="sp-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button>
          <Button
            disabled={!name.trim() || isPending}
            onClick={() => onSave({ name: name.trim(), tier, logo_url: logoUrl, website, description })}
          >
            {isPending ? 'Saving…' : row ? 'Save changes' : 'Add sponsor'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
