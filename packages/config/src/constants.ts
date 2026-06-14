// ============================================================================
// @eventology/config — Platform Constants
// ============================================================================

// ---------------------------------------------------------------------------
// Business
// ---------------------------------------------------------------------------

/** Platform commission rate on paid ticket sales (percentage) */
export const PLATFORM_COMMISSION_RATE = 5.0;

/** Default currency for the Ethiopian market */
export const DEFAULT_CURRENCY = 'ETB' as const;

/** Default timezone for Ethiopia */
export const DEFAULT_TIMEZONE = 'Africa/Addis_Ababa' as const;

// ---------------------------------------------------------------------------
// Communications
// ---------------------------------------------------------------------------

/** Default sender display name for outbound notifications */
export const COMMS_DEFAULT_SENDER_NAME = 'Eventology';

/** Resend provider name (matches EMAIL_PROVIDER env value) */
export const COMMS_EMAIL_PROVIDER_RESEND = 'resend' as const;
/** Africa's Talking provider name (matches SMS_PROVIDER env value) */
export const COMMS_SMS_PROVIDER_AFRICAS_TALKING = 'africas_talking' as const;
/** Expo Push provider name (matches PUSH_PROVIDER env value) */
export const COMMS_PUSH_PROVIDER_EXPO = 'expo_push' as const;

/** Stub provider name (default for all channels) */
export const COMMS_PROVIDER_STUB = 'stub' as const;

// ---------------------------------------------------------------------------
// Display limits
// ---------------------------------------------------------------------------

/** Maximum featured events shown on homepage */
export const MAX_FEATURED_EVENTS = 8;

/** Events per page in list views */
export const EVENTS_PER_PAGE = 12;

/** Registrations per page in admin/organizer views */
export const REGISTRATIONS_PER_PAGE = 20;

/** Reviews per page */
export const REVIEWS_PER_PAGE = 10;

/** Notifications per page */
export const NOTIFICATIONS_PER_PAGE = 15;

/** Messages per conversation load */
export const MESSAGES_PER_PAGE = 50;

/** Audit log entries per page */
export const AUDIT_LOG_PER_PAGE = 25;

// ---------------------------------------------------------------------------
// Upload limits
// ---------------------------------------------------------------------------

/** Maximum banner image size in bytes (5MB) */
export const MAX_BANNER_IMAGE_SIZE = 5 * 1024 * 1024;

/** Maximum gallery images per event */
export const MAX_GALLERY_IMAGES = 10;

/** Maximum gallery image size in bytes (3MB) */
export const MAX_GALLERY_IMAGE_SIZE = 3 * 1024 * 1024;

/** Allowed image MIME types */
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
] as const;

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/** Minimum event title length */
export const MIN_EVENT_TITLE_LENGTH = 3;

/** Maximum event title length */
export const MAX_EVENT_TITLE_LENGTH = 255;

/** Maximum event description length (rich text HTML) */
export const MAX_EVENT_DESCRIPTION_LENGTH = 50_000;

/** Maximum short description length */
export const MAX_SHORT_DESCRIPTION_LENGTH = 500;

/** Maximum number of tags per event */
export const MAX_TAGS_PER_EVENT = 10;

/** Maximum tag length */
export const MAX_TAG_LENGTH = 50;

// ---------------------------------------------------------------------------
// Ethiopian geography (Addis Ababa sub-cities)
// ---------------------------------------------------------------------------

export const ADDIS_SUB_CITIES = [
  'Arada',
  'Bole',
  'Gullele',
  'Kirkos',
  'Kolfe Keranio',
  'Lideta',
  'Nifas Silk-Lafto',
  'Yeka',
  'Akaki-Kality',
  'Ledeta',
] as const;

// ---------------------------------------------------------------------------
// Feature flags
// ---------------------------------------------------------------------------

/** Enable waitlist for sold-out events */
export const FEATURE_WAITLIST = true;

/** Enable event reviews after attendance */
export const FEATURE_REVIEWS = true;

/** Enable promo codes */
export const FEATURE_PROMO_CODES = true;

/** Enable real-time messaging */
export const FEATURE_MESSAGING = true;

/** Enable push notifications (V2) */
export const FEATURE_PUSH_NOTIFICATIONS = false;

/** Enable online events with video links */
export const FEATURE_ONLINE_EVENTS = true;

// ---------------------------------------------------------------------------
// Cache durations (seconds)
// ---------------------------------------------------------------------------

/** How long to cache public event list */
export const CACHE_EVENTS_LIST = 60;

/** How long to cache event detail */
export const CACHE_EVENT_DETAIL = 30;

/** How long to cache categories */
export const CACHE_CATEGORIES = 300;

/** How long to cache featured events */
export const CACHE_FEATURED_EVENTS = 120;

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

export const DEFAULT_PAGE_SIZE = 12;
export const MAX_PAGE_SIZE = 100;
