import { type ClassValue } from 'clsx';
/**
 * Merge class names with Tailwind CSS conflict resolution.
 * Combines clsx (conditional classes) with tailwind-merge (deduplication).
 *
 * @example
 * cn('px-4 py-2', isActive && 'bg-primary', 'px-6')
 * // → 'py-2 bg-primary px-6' (px-4 is overridden by px-6)
 */
export declare function cn(...inputs: ClassValue[]): string;
//# sourceMappingURL=cn.d.ts.map