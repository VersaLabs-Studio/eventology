"use client";

// ============================================================================
// Form Builder — organizer-defined registration questions (HO-I)
// ============================================================================
// Ordered-list designer (no drag-drop per package constraints): add a
// field (type, label, options, required), edit in place, delete, and move
// up/down (position reindexing via the PUT reorder endpoint). Everything
// talks to the host-gated form-fields routes.
// ============================================================================

import * as React from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  useEventFormFields,
  useCreateFormField,
  useUpdateFormField,
  useDeleteFormField,
  useReorderFormFields,
} from "@/hooks/use-event-form";
import { FORM_FIELD_TYPES } from "@eventology/schemas";
import { ListPlus, ChevronUp, ChevronDown, Trash2, ListChecks } from "lucide-react";
import { toast } from "sonner";
import { useLocale } from "@/lib/i18n";

type FieldType = (typeof FORM_FIELD_TYPES)[number];

export default function EventFormBuilderPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const { t } = useLocale();

  const fieldsQ = useEventFormFields(eventId);
  const createField = useCreateFormField(eventId);
  const updateField = useUpdateFormField(eventId);
  const deleteField = useDeleteFormField(eventId);
  const reorderFields = useReorderFormFields(eventId);

  // New-field draft state.
  const [label, setLabel] = React.useState("");
  const [fieldType, setFieldType] = React.useState<FieldType>("text");
  const [optionsText, setOptionsText] = React.useState("");
  const [required, setRequired] = React.useState(false);

  const needsOptions = fieldType === "select" || fieldType === "multiselect";
  const fields = fieldsQ.data ?? [];

  const addField = async () => {
    if (!label.trim()) {
      toast.error(t("forms.labelRequired"));
      return;
    }
    const options = needsOptions
      ? optionsText.split("\n").map((s) => s.trim()).filter(Boolean)
      : undefined;
    if (needsOptions && (!options || options.length === 0)) {
      toast.error(t("forms.optionsRequired"));
      return;
    }
    try {
      await createField.mutateAsync({
        label: label.trim(),
        field_type: fieldType,
        options,
        required,
      });
      setLabel("");
      setOptionsText("");
      setRequired(false);
      setFieldType("text");
      toast.success(t("forms.fieldAdded"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("forms.fieldAddFailed"));
    }
  };

  const move = async (index: number, dir: -1 | 1) => {
    const next = [...fields];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    try {
      await reorderFields.mutateAsync(next.map((f) => f.id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("forms.reorderFailed"));
    }
  };

  const toggleRequired = async (fieldId: string, current: boolean) => {
    try {
      await updateField.mutateAsync({ fieldId, input: { required: !current } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("forms.updateFailed"));
    }
  };

  const removeField = async (fieldId: string) => {
    try {
      await deleteField.mutateAsync(fieldId);
      toast.success(t("forms.fieldDeleted"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("forms.deleteFailed"));
    }
  };

  if (fieldsQ.isLoading) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <PageHeader title={t("forms.builderTitle")} />
        <div className="space-y-3 max-w-2xl">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </motion.div>
    );
  }

  if (fieldsQ.isError) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <PageHeader title={t("forms.builderTitle")} />
        <EmptyState
          icon={ListChecks}
          title={t("forms.loadFailed")}
          description={t("forms.hostOnly")}
        />
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader
        title={t("forms.builderTitle")}
        description={t("forms.builderDescription")}
      />

      <div className="max-w-2xl space-y-6">
        {/* Existing fields — ordered list */}
        {fields.length === 0 ? (
          <EmptyState
            icon={ListChecks}
            title={t("forms.emptyTitle")}
            description={t("forms.emptyDescription")}
          />
        ) : (
          <div className="space-y-3">
            {fields.map((field, i) => (
              <div
                key={field.id}
                className="rounded-xl border border-border bg-card p-4 flex items-start justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">
                    {field.label}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize mt-0.5">
                    {field.field_type.replaceAll("_", " ")}
                    {field.options && field.options.length > 0 && (
                      <> · {field.options.join(", ")}</>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1.5 mr-1">
                    <span className="text-xs text-muted-foreground">{t("forms.required")}</span>
                    <Switch
                      checked={field.required}
                      onCheckedChange={() => toggleRequired(field.id, field.required)}
                      disabled={updateField.isPending}
                    />
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => move(i, -1)} disabled={i === 0 || reorderFields.isPending} aria-label={t("forms.moveUp")}>
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => move(i, 1)} disabled={i === fields.length - 1 || reorderFields.isPending} aria-label={t("forms.moveDown")}>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => removeField(field.id)} disabled={deleteField.isPending} aria-label={t("forms.delete")}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add-field composer */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <ListPlus className="h-4 w-4 text-primary" />
            <h3 className="font-display font-semibold">{t("forms.addField")}</h3>
          </div>

          <div>
            <Label>{t("forms.questionLabel")}</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={t("forms.labelPlaceholder")}
              maxLength={200}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>{t("forms.fieldType")}</Label>
              <Select value={fieldType} onValueChange={(v) => setFieldType(v as FieldType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FORM_FIELD_TYPES.map((ft) => (
                    <SelectItem key={ft} value={ft} className="capitalize">
                      {ft.replaceAll("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2 pb-1">
              <Switch id="new-required" checked={required} onCheckedChange={setRequired} />
              <Label htmlFor="new-required">{t("forms.required")}</Label>
            </div>
          </div>

          {needsOptions && (
            <div>
              <Label>{t("forms.optionsLabel")}</Label>
              <textarea
                className="flex min-h-[80px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={optionsText}
                onChange={(e) => setOptionsText(e.target.value)}
                placeholder={t("forms.optionsPlaceholder")}
              />
              <p className="text-xs text-muted-foreground mt-1">{t("forms.optionsHint")}</p>
            </div>
          )}

          <Button onClick={addField} disabled={createField.isPending} variant="accent" className="rounded-xl font-bold">
            <ListPlus className="h-4 w-4 mr-2" />
            {createField.isPending ? t("forms.adding") : t("forms.addFieldButton")}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
