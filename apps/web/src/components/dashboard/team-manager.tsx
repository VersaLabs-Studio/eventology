"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Users, UserPlus, Trash2, ShieldCheck, ShieldAlert } from "lucide-react";
import {
  useOrganizerTeam,
  useInviteTeamMember,
  useUpdateTeamMember,
  useRemoveTeamMember,
} from "@/hooks/use-organizer-team";
import { toast } from "sonner";
import { getInitials } from "@/lib/utils";

interface TeamManagerProps {
  organizerId: string;
}

export function TeamManager({ organizerId }: TeamManagerProps) {
  const teamQ = useOrganizerTeam(organizerId);
  const invite = useInviteTeamMember(organizerId);
  const update = useUpdateTeamMember(organizerId);
  const remove = useRemoveTeamMember(organizerId);

  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [confirmRemove, setConfirmRemove] = React.useState<{ id: string; name: string } | null>(null);

  const team = teamQ.data?.data ?? [];

  const handleRoleChange = async (memberId: string, role: 'admin' | 'member', name: string) => {
    try {
      await update.mutateAsync({ memberId, role });
      toast.success(`${name} is now a ${role}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update role');
    }
  };

  const handleRemove = async () => {
    if (!confirmRemove) return;
    try {
      await remove.mutateAsync(confirmRemove.id);
      toast.success(`${confirmRemove.name} removed from team`);
      setConfirmRemove(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove');
    }
  };

  if (teamQ.isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (teamQ.error) {
    return (
      <EmptyState
        icon={Users}
        title="Failed to load team"
        description="You may not be the owner of this organizer."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {team.length} member{team.length === 1 ? '' : 's'} on this team
        </p>
        <Button size="sm" onClick={() => setInviteOpen(true)}>
          <UserPlus className="mr-1 h-4 w-4" /> Invite member
        </Button>
      </div>

      {team.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No team members"
          description="Invite collaborators by email to help manage this organizer."
        />
      ) : (
        <div className="space-y-2">
          {team.map((m) => {
            const isOwner = m.role === 'owner';
            return (
              <Card key={m.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4 flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={m.avatar_url ?? undefined} />
                    <AvatarFallback>{getInitials(m.full_name ?? m.email ?? '?')}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{m.full_name ?? m.email ?? 'Member'}</span>
                      {isOwner ? (
                        <Badge variant="default">
                          <ShieldCheck className="mr-1 h-3 w-3" /> Owner
                        </Badge>
                      ) : m.role === 'admin' ? (
                        <Badge variant="secondary">
                          <ShieldAlert className="mr-1 h-3 w-3" /> Admin
                        </Badge>
                      ) : (
                        <Badge variant="outline">Member</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                  </div>
                  {!isOwner && (
                    <div className="flex items-center gap-2">
                      <Select
                        value={m.role}
                        onValueChange={(v) => handleRoleChange(m.id, v as 'admin' | 'member', m.full_name ?? m.email ?? 'Member')}
                      >
                        <SelectTrigger className="h-8 w-32 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="member">Member</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setConfirmRemove({ id: m.id, name: m.full_name ?? m.email ?? 'Member' })}
                        title="Remove from team"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <InviteDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        isPending={invite.isPending}
        onInvite={async ({ email, role }) => {
          try {
            await invite.mutateAsync({ email, role });
            toast.success('Member added');
            setInviteOpen(false);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to invite');
          }
        }}
      />

      <Dialog open={!!confirmRemove} onOpenChange={(o) => !o && setConfirmRemove(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove from team?</DialogTitle>
            <DialogDescription>
              {confirmRemove?.name} will lose access to manage this organizer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmRemove(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRemove} disabled={remove.isPending}>
              {remove.isPending ? 'Removing…' : 'Remove member'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface InviteDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  isPending: boolean;
  onInvite: (input: { email: string; role: 'admin' | 'member' }) => Promise<void>;
}

function InviteDialog({ open, onOpenChange, isPending, onInvite }: InviteDialogProps) {
  const [email, setEmail] = React.useState('');
  const [role, setRole] = React.useState<'admin' | 'member'>('member');

  React.useEffect(() => {
    if (open) {
      setEmail('');
      setRole('member');
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite team member</DialogTitle>
          <DialogDescription>
            The invitee must already have an Eventology account. They will be added immediately.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teammate@example.com"
            />
          </div>
          <div>
            <Label htmlFor="invite-role">Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as 'admin' | 'member')}>
              <SelectTrigger id="invite-role"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin — can manage events + members</SelectItem>
                <SelectItem value="member">Member — can view + edit assigned events</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button
            disabled={!email.trim() || isPending}
            onClick={() => onInvite({ email: email.trim().toLowerCase(), role })}
          >
            {isPending ? 'Inviting…' : 'Send invite'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
