"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Bell, Mail, Smartphone, MessageSquare, Globe, Save, Loader2, BellOff } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useLocale } from "@/lib/i18n";

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
  const { t } = useLocale();
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
          toast.error(t("notifications.loadError"));
          console.error(e);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [t]);

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
        throw new Error(err.error?.message ?? t("notifications.saveFailed"));
      }
      const data = (await res.json()) as NotificationPreferences;
      setPrefs(data);
      setDirty(false);
      toast.success(t("notifications.saved"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("notifications.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  // Loading state — premium skeleton
  if (loading || !prefs) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  // Empty state — fresh user with no preferences
  const isFresh = !prefs.email_enabled && !prefs.sms_enabled && !prefs.push_enabled;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ staggerChildren: 0.07 }}
      className="space-y-6 p-6"
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <PageHeader
          title={t("notifications.pageTitle")}
          description={t("notifications.pageDescription")}
          action={
            <Button
              onClick={save}
              disabled={!dirty || saving}
              className="shadow-glow"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              {t("notifications.saveChanges")}
            </Button>
          }
        />
      </motion.div>

      {/* Channels */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              {t("notifications.deliveryChannels")}
            </CardTitle>
            <CardDescription>
              {t("notifications.deliveryChannelsDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ChannelRow
              icon={<Mail className="h-4 w-4" />}
              label={t("notifications.email")}
              description={t("notifications.emailDesc")}
              value={prefs.email_enabled}
              onChange={(v) => updatePref("email_enabled", v)}
            />
            <ChannelRow
              icon={<MessageSquare className="h-4 w-4" />}
              label={t("notifications.sms")}
              description={t("notifications.smsDesc")}
              value={prefs.sms_enabled}
              onChange={(v) => updatePref("sms_enabled", v)}
            />
            <ChannelRow
              icon={<Smartphone className="h-4 w-4" />}
              label={t("notifications.push")}
              description={t("notifications.pushDesc")}
              value={prefs.push_enabled}
              onChange={(v) => updatePref("push_enabled", v)}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Marketing */}
      <motion.div initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}>
        <Card>
          <CardHeader>
            <CardTitle>{t("notifications.marketing")}</CardTitle>
            <CardDescription>
              {t("notifications.marketingDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChannelRow
              icon={<Mail className="h-4 w-4" />}
              label={t("notifications.marketingEmails")}
              description={t("notifications.marketingEmailsDesc")}
              value={prefs.marketing_opt_in}
              onChange={(v) => updatePref("marketing_opt_in", v)}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Locale */}
      <motion.div initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              {t("notifications.language")}
            </CardTitle>
            <CardDescription>
              {t("notifications.languageDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">{t("notifications.notificationLanguage")}</span>
              <Select
                value={prefs.locale}
                onValueChange={(v) => updatePref("locale", v as 'en' | 'am')}
              >
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">{t("language.en")}</SelectItem>
                  <SelectItem value="am">{t("language.am")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Empty state hint */}
      {isFresh && (
        <motion.div initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}>
          <Card className="border-dashed border-border/60">
            <CardContent className="p-8 text-center">
              <BellOff className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground font-medium">
                {t("notifications.emptyHint")}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}
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
