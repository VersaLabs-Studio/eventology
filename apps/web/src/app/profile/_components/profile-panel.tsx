"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { User, Save, Loader2, Camera } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useLocale } from "@/lib/i18n";

interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  role: string;
  bio: string | null;
  website: string | null;
  created_at: string;
}

export function ProfilePanel() {
  const { t } = useLocale();
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [dirty, setDirty] = React.useState(false);
  const [form, setForm] = React.useState({
    full_name: "",
    phone: "",
    bio: "",
    website: "",
  });

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/protected/profile");
        if (!res.ok) throw new Error("Failed to load profile");
        const data = (await res.json()) as Profile;
        if (mounted) {
          setProfile(data);
          setForm({
            full_name: data.full_name ?? "",
            phone: data.phone ?? "",
            bio: data.bio ?? "",
            website: data.website ?? "",
          });
        }
      } catch (e) {
        if (mounted) {
          toast.error(t("profile.loadError"));
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

  const updateField = (key: keyof typeof form, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/protected/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: form.full_name,
          phone: form.phone || null,
          bio: form.bio || null,
          website: form.website || null,
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
        throw new Error(err.error?.message ?? t("profile.saveFailed"));
      }
      const data = (await res.json()) as Profile;
      setProfile(data);
      setDirty(false);
      toast.success(t("profile.saved"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("profile.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  if (loading || !profile) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

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
          title={t("profile.title")}
          description={t("profile.description")}
          action={
            <Button
              onClick={save}
              disabled={!dirty || saving}
              className="shadow-glow"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              {t("profile.saveChanges")}
            </Button>
          }
        />
      </motion.div>

      {/* Avatar + Basic Info */}
      <motion.div initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              {t("profile.basicInfo")}
            </CardTitle>
            <CardDescription>{t("profile.basicInfoDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Avatar placeholder */}
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-border/60">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-8 w-8 text-muted-foreground" />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                  <Camera className="h-5 w-5 text-white" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{profile.full_name}</p>
                <p className="text-xs text-muted-foreground">{profile.email}</p>
                <span className="inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-primary/10 text-primary mt-1">
                  {profile.role}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{t("profile.fullName")}</label>
                <Input
                  value={form.full_name}
                  onChange={(e) => updateField("full_name", e.target.value)}
                  placeholder={t("profile.fullNamePlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{t("profile.phone")}</label>
                <Input
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder={t("profile.phonePlaceholder")}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Bio & Website */}
      <motion.div initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}>
        <Card>
          <CardHeader>
            <CardTitle>{t("profile.about")}</CardTitle>
            <CardDescription>{t("profile.aboutDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t("profile.bio")}</label>
              <Textarea
                value={form.bio}
                onChange={(e) => updateField("bio", e.target.value)}
                placeholder={t("profile.bioPlaceholder")}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t("profile.website")}</label>
              <Input
                value={form.website}
                onChange={(e) => updateField("website", e.target.value)}
                placeholder={t("profile.websitePlaceholder")}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
