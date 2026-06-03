import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Compose tailwind classes con dedup automático.
 *   cn('p-4 text-sm', isActive && 'font-bold', extraClass)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
