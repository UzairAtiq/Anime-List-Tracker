/** @fileoverview Provides CSS class name merging utilities combining clsx and tailwind-merge. */

import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges conditional CSS classes and resolves Tailwind CSS class conflicts.
 *
 * Steps:
 * 1. Process variadic inputs through clsx to evaluate conditional truthiness.
 * 2. Pass resulting class string to twMerge to resolve any conflicting Tailwind classes.
 * 3. Return the optimized final class string.
 *
 * @param {...any} inputs - Class names, conditional objects, or class arrays.
 * @returns {string} Merged and conflict-resolved CSS class string.
 * @throws {never}
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
