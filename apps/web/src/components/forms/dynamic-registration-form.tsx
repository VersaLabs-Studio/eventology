'use client';

// ============================================================================
// DynamicRegistrationForm — renders organizer-defined fields (HO-I)
// ============================================================================
// Renders the event's custom registration questions (public form-fields
// endpoint) with client-side UX validation. Submission happens against the
// answers endpoint which RE-validates server-side — client checks here are
// convenience, never the security boundary.
//
// Render contract: an ordered list of typed inputs (no drag-drop designer
// per package constraints).
// ============================================================================

import * as React from "react";
import type { PublicFormField } from "@/hooks/use-event-form";
import { usePublicEventFormFields } from "@/hooks/use-event-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocale } from "@/lib/i18n";

interface Props {
  slug: string;
  /** Answers accumulated keyed by field_id (controlled by the parent form). */
  values: Record<string, unknown>;
  onChange: (fieldId: string, value: unknown) => void;
}

export function DynamicRegistrationForm({ slug, values, onChange }: Props) {
  const { t } = useLocale();
  const { data: fields, isLoading, isError } = usePublicEventFormFields(slug);

  if (isError) return null; // a broken custom form must never block registration
  if (isLoading || fields === undefined) {
    return <Skeleton className="h-24 w-full rounded-xl" />;
  }
  if (fields.length === 0) return null; // no custom form on this event

  const renderField = (field: PublicFormField) => {
    const value = values[field.id];
    switch (field.field_type) {
      case "text":
        return (
          <Input
            type="text"
            value={(value as string) ?? ""}
            onChange={(e) => onChange(field.id, e.target.value)}
            required={field.required}
            maxLength={2000}
          />
        );
      case "textarea":
        return (
          <textarea
            className="flex min-h-[80px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            value={(value as string) ?? ""}
            onChange={(e) => onChange(field.id, e.target.value)}
            required={field.required}
            maxLength={2000}
          />
        );
      case "number":
        return (
          <Input
            type="number"
            value={typeof value === "number" ? String(value) : ""}
            onChange={(e) =>
              onChange(field.id, e.target.value === "" ? undefined : Number(e.target.value))
            }
            required={field.required}
          />
        );
      case "checkbox":
        return (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={value === true}
              onChange={(e) => onChange(field.id, e.target.checked)}
              className="h-4 w-4"
            />
            <span>{field.label}</span>
          </label>
        );
      case "select":
        return (
          <select
            className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            value={(value as string) ?? ""}
            onChange={(e) => onChange(field.id, e.target.value || undefined)}
            required={field.required}
          >
            <option value="">{t("forms.selectOption")}</option>
            {(field.options ?? []).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );
      case "multiselect":
        return (
          <div className="space-y-1.5">
            {(field.options ?? []).map((opt) => {
              const arr = Array.isArray(value) ? (value as string[]) : [];
              const checked = arr.includes(opt);
              return (
                <label key={opt} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? [...arr, opt]
                        : arr.filter((x) => x !== opt);
                      onChange(field.id, next.length ? next : undefined);
                    }}
                    className="h-4 w-4"
                  />
                  <span>{opt}</span>
                </label>
              );
            })}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium">{t("forms.additionalInfo")}</p>
      {fields.map((field) => (
        <div key={field.id}>
          {field.field_type !== "checkbox" && (
            <Label className="mb-1 block">
              {field.label}
              {field.required && " *"}
            </Label>
          )}
          {renderField(field)}
        </div>
      ))}
    </div>
  );
}
