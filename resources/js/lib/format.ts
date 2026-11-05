import type { Frequency } from '@/types';

const intl = (locale: string) => (locale === 'en' ? 'en-US' : 'es-CO');

export function money(value: number, currency: string, locale = 'es') {
    return new Intl.NumberFormat(intl(locale), { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
}

export function date(value: string | null | undefined, locale = 'es') {
    if (!value) return '—';
    // Plain Y-m-d dates are calendar days: parse them as local, not UTC midnight.
    const d = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00`) : new Date(value);
    return d.toLocaleDateString(intl(locale), { day: 'numeric', month: 'short', year: 'numeric' });
}

// Mirrors App\Support\LoanMath: a flat rate charged once on the principal, split into equal installments.
export const FREQUENCIES: Frequency[] = ['daily', 'weekly', 'fortnightly'];
/** Rates staff choose from at approval (config/loan.php). */
export const RATES = [20, 25, 30, 35];
const PER_MONTH: Record<Frequency, number> = { daily: 30, weekly: 4, fortnightly: 2 };

export const installmentCount = (months: number, freq: Frequency) => months * PER_MONTH[freq];
export const totalPayable = (principal: number, ratePct: number) => Math.round(principal * (1 + ratePct / 100) * 100) / 100;
export const installment = (principal: number, ratePct: number, months: number, freq: Frequency) =>
    Math.round((totalPayable(principal, ratePct) / installmentCount(months, freq)) * 100) / 100;

/** English keys for t(): pass through t() at the call site. */
export const FREQ_LABEL: Record<Frequency, string> = { daily: 'Daily', weekly: 'Weekly', fortnightly: 'Fortnightly' };
export const PER_LABEL: Record<Frequency, string> = { daily: 'per day', weekly: 'per week', fortnightly: 'per fortnight' };
export const PAYMENT_LABEL: Record<Frequency, string> = { daily: 'Daily payment', weekly: 'Weekly payment', fortnightly: 'Fortnightly payment' };
