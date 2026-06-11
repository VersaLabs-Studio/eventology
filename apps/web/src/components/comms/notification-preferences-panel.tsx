"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Bell, Mail, Smartphone, MessageSquare, Globe, Save, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface NotificationPreferences {
  profile_id: string;
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  marketing_opt_in: boolean;
  locale: 'en' | 'am';
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  created_at: string;
  updated_at: string;
}

export function NotificationPreferencesPanel() {
  const [prefs, setPrefs] = React.useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [dirty, setDirty] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/protected/notification-preferences");
        if (!res.ok) throw new Error("Failed to load preferences");
        const data = (await res.json()) as NotificationPreferences;
        if (mounted) setPrefs(data);
      } catch (e) {
        if (mounted) {
          toast.error("Failed to load notification preferences");
          console.error(e);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const updatePref = <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => {
    setPrefs((p) => (p ? { ...p, [key]: value } : p));
    setDirty(true);
  };

  const save = async () => {
    if (!prefs) return;
    setSaving(true);
    try {
      const res = await fetch("/api/protected/notification-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email_enabled: prefs.email_enabled,
          sms_enabled: prefs.sms_enabled,
          push_enabled: prefs.push_enabled,
          marketing_opt_in: prefs.marketing_opt_in,
          locale: prefs.locale,
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
        throw new Error(err.error?.message ?? "Save failed");
      }
      const data = (await res.json()) as NotificationPreferences;
      setPrefs(data);
      setDirty(false);
      toast.success("Notification preferences saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !prefs) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <PageHeader
        title="Notification preferences"
        description="Choose how and where you want to hear from us."
        action={
          <Button
            onClick={save}
            disabled={!dirty || saving}
            className="shadow-glow"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save changes
          </Button>
        }
      />

      {/* Channels */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Delivery channels
          </CardTitle>
          <CardDescription>
            We&apos;ll always send important transactional updates (registrations, payments) — but you can opt out of marketing messages.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ChannelRow
            icon={<Mail className="h-4 w-4" />}
            label="Email"
            description="Tickets, payment receipts, and event reminders."
            value={prefs.email_enabled}
            onChange={(v) => updatePref("email_enabled", v)}
          />
          <ChannelRow
            icon={<MessageSquare className="h-4 w-4" />}
            label="SMS"
            description="Last-minute event changes and check-in codes."
            value={prefs.sms_enabled}
            onChange={(v) => updatePref("sms_enabled", v)}
          />
          <ChannelRow
            icon={<Smartphone className="h-4 w-4" />}
            label="Push"
            description="Real-time alerts on your devices."
            value={prefs.push_enabled}
            onChange={(v) => updatePref("push_enabled", v)}
          />
        </CardContent>
      </Card>

      {/* Marketing */}
      <Card>
        <CardHeader>
          <CardTitle>Marketing</CardTitle>
          <CardDescription>
            We&apos;ll never share your data. Marketing emails include event recommendations and platform news.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChannelRow
            icon={<Mail className="h-4 w-4" />}
            label="Marketing emails"
            description="Recommendations, featured events, and platform news."
            value={prefs.marketing_opt_in}
            onChange={(v) => updatePref("marketing_opt_in", v)}
          />
        </CardContent>
      </Card>

      {/* Locale */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Language
          </CardTitle>
          <CardDescription>
            The language used for notification messages.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Notification language:</span>
            <Select
              value={prefs.locale}
              onValueChange={(v) => updatePref("locale", v as 'en' | 'am')}
            >
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="am">አማርኛ (Amharic)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface ChannelRowProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

function ChannelRow({ icon, label, description, value, onChange }: ChannelRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );
}
