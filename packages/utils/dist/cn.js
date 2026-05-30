// ============================================================================
// @eventology/utils — Class Name Utility (clsx + tailwind-merge)
// ============================================================================
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
/**
 * Merge class names with Tailwind CSS conflict resolution.
 * Combines clsx (conditional classes) with tailwind-merge (deduplication).
 *
 * @example
 * cn('px-4 py-2', isActive && 'bg-primary', 'px-6')
 * // → 'py-2 bg-primary px-6' (px-4 is overridden by px-6)
 */
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}
//# sourceMappingURL=cn.js.map