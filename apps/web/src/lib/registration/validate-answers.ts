// ============================================================================
// Answer Validation — server-side, against the event's field defs (HO-I)
// ============================================================================
// The register form validates client-side for UX, but required-field
// omission is REJECTED HERE (package constraint: never trust client-side
// required validation). Shape rules per field_type mirror the DB design:
//
//   text / textarea → string (trimmed, 1..2000)
//   number          → JSON number (finite)
//   checkbox        → boolean
//   select          → string ∈ field.options
//   multiselect     → string[] ⊆ field.options (dedup)
// ============================================================================

interface FieldDef {
  id: string;
  label: string;
  field_type: string;
  options: unknown;
  required: boolean;
}

export type AnswerValidationResult =
  | { ok: true; values: Record<string, unknown> } // field_id → normalized value
  | { ok: false; error: string; field_id?: string };

function isStringArray(options: unknown): options is string[] {
  return (
    Array.isArray(options) &&
    options.every((o) => typeof o === 'string' && o.length > 0)
  );
}

/**
 * Validates submitted answers against the event's field definitions.
 * `submitted` is the transport-shaped array from submitAnswersSchema
 * (already checked: field_id is a uuid, value present).
 *
 * Unknown fields are rejected (not silently dropped) — the attendee
 * submitted something the organizer never asked for, which indicates a
 * stale form or tampering.
 */
export function validateAnswers(
  fields: FieldDef[],
  submitted: Array<{ field_id: string; value: unknown }>
): AnswerValidationResult {
  const byId = new Map(fields.map((f) => [f.id, f]));

  // Answering a field that isn't part of this event's form → reject.
  for (const answer of submitted) {
    if (!byId.has(answer.field_id)) {
      return {
        ok: false,
        error: `Unknown form field: ${answer.field_id}`,
        field_id: answer.field_id,
      };
    }
  }

  // Required fields must be present.
  for (const field of fields) {
    if (field.required && !submitted.some((a) => a.field_id === field.id)) {
      return {
        ok: false,
        error: `Missing required field: ${field.label}`,
        field_id: field.id,
      };
    }
  }

  const values: Record<string, unknown> = {};

  for (const answer of submitted) {
    const field = byId.get(answer.field_id)!;
    const v = answer.value;

    // Absent value on an optional field → skip entirely.
    if (v === null || v === undefined || v === '') {
      if (field.required) {
        return {
          ok: false,
          error: `Missing required field: ${field.label}`,
          field_id: field.id,
        };
      }
      continue;
    }

    switch (field.field_type) {
      case 'text':
      case 'textarea': {
        if (typeof v !== 'string' || v.trim().length === 0 || v.length > 2000) {
          return {
            ok: false,
            error: `Invalid value for "${field.label}"`,
            field_id: field.id,
          };
        }
        values[field.id] = v.trim();
        break;
      }
      case 'number': {
        if (typeof v !== 'number' || !Number.isFinite(v)) {
          return {
            ok: false,
            error: `Invalid value for "${field.label}"`,
            field_id: field.id,
          };
        }
        values[field.id] = v;
        break;
      }
      case 'checkbox': {
        if (typeof v !== 'boolean') {
          return {
            ok: false,
            error: `Invalid value for "${field.label}"`,
            field_id: field.id,
          };
        }
        values[field.id] = v;
        break;
      }
      case 'select': {
        const opts = field.options;
        if (!isStringArray(opts) || !opts.includes(v as string)) {
          return {
            ok: false,
            error: `Invalid option for "${field.label}"`,
            field_id: field.id,
          };
        }
        values[field.id] = v;
        break;
      }
      case 'multiselect': {
        const opts = field.options;
        if (
          !Array.isArray(v) ||
          v.length === 0 ||
          !v.every((x) => typeof x === 'string') ||
          !isStringArray(opts) ||
          !v.every((x) => opts.includes(x))
        ) {
          return {
            ok: false,
            error: `Invalid options for "${field.label}"`,
            field_id: field.id,
          };
        }
        // Dedup — a repeated option is a client bug, not an error.
        values[field.id] = Array.from(new Set(v as string[]));
        break;
      }
      default:
        return {
          ok: false,
          error: `Unsupported field type for "${field.label}"`,
          field_id: field.id,
        };
    }
  }

  return { ok: true, values };
}
