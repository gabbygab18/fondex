import { router } from '@inertiajs/react';
import { useState, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { Button } from '@/components/glint/button';
import { Input } from '@/components/glint/input';
import { Pagination } from '@/components/glint/pagination';
import { Select, type SelectOption } from '@/components/glint/select';
import { Icon } from '@/icons/icon';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { Paginated } from '@/types';

export function PageHeader({ title, subtitle, actions }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
    return (
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
                <h1 className="font-display text-2xl font-bold text-navy md:text-3xl">{title}</h1>
                {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
    );
}

export function Panel({ title, actions, className, children }: { title?: ReactNode; actions?: ReactNode; className?: string; children: ReactNode }) {
    return (
        <section className={cn('rounded-3xl bg-card p-5 shadow-sm md:p-6', className)}>
            {(title || actions) && (
                <div className="mb-4 flex items-center justify-between gap-3">
                    {title && <h2 className="font-display text-lg font-bold text-navy">{title}</h2>}
                    {actions}
                </div>
            )}
            {children}
        </section>
    );
}

export function Stat({ label, value, hint, icon, tone = 'light' }: { label: string; value: ReactNode; hint?: ReactNode; icon: string; tone?: 'light' | 'azure' | 'dark' }) {
    return (
        <div
            className={cn(
                'relative overflow-hidden rounded-3xl p-5 shadow-sm',
                tone === 'light' && 'bg-card',
                tone === 'azure' && 'bg-azure text-navy',
                tone === 'dark' && 'bg-gradient-to-br from-[#2563eb] to-navy text-white',
            )}
        >
            <div className="flex items-center justify-between">
                <span className={cn('text-sm', tone === 'dark' ? 'text-white/70' : tone === 'azure' ? 'text-navy/75' : 'text-muted-foreground')}>{label}</span>
                <span className={cn('grid size-9 place-items-center rounded-full', tone === 'light' ? 'bg-secondary text-navy' : 'bg-white/20')}>
                    <Icon name={icon} size={18} />
                </span>
            </div>
            <p className="mt-3 font-display text-2xl font-bold tabular-nums md:text-3xl">{value}</p>
            {hint && <p className={cn('mt-1 text-xs', tone === 'dark' ? 'text-white/60' : 'text-muted-foreground')}>{hint}</p>}
        </div>
    );
}

/** Plain table shell: server-paginated data doesn't need Glint Table's client sorting. */
export function DataTable({ head, children, empty }: { head: ReactNode[]; children: ReactNode; empty?: boolean }) {
    const t = useT();
    return (
        <div className="overflow-x-auto rounded-3xl bg-card shadow-sm">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                        {head.map((h, i) => (
                            <th key={i} className="whitespace-nowrap px-5 py-4 font-medium">
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-border [&_td]:px-5 [&_td]:py-3.5 [&_td:first-child]:whitespace-nowrap [&_tr:hover]:bg-muted/40">{children}</tbody>
            </table>
            {empty && <p className="p-10 text-center text-sm text-muted-foreground">{t('Nothing found.')}</p>}
        </div>
    );
}

export function Pager({ page, url, filters }: { page: Paginated<unknown>; url: string; filters: Record<string, unknown> }) {
    const t = useT();
    if (page.last_page <= 1) return page.total ? <p className="mt-4 text-xs text-muted-foreground">{t(':n results', { n: page.total })}</p> : null;
    return (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">{t('Showing :from–:to of :total', { from: page.from ?? 0, to: page.to ?? 0, total: page.total })}</p>
            <Pagination
                total={page.last_page}
                page={page.current_page}
                onPageChange={(p) => router.get(url, { ...filters, page: p }, { preserveState: true, preserveScroll: false })}
            />
        </div>
    );
}

type FilterField = { key: string; type: 'search' | 'select' | 'date'; label: string; options?: SelectOption[] };

/** Filter bar: search on Enter/submit, selects and dates apply immediately. */
export function Filters({ url, filters, fields }: { url: string; filters: Record<string, string | undefined>; fields: FilterField[] }) {
    const t = useT();
    const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(fields.map((f) => [f.key, filters[f.key] ?? ''])));

    const apply = (next: Record<string, string>) => {
        setValues(next);
        router.get(url, Object.fromEntries(Object.entries(next).filter(([, v]) => v)), { preserveState: true, replace: true });
    };
    const active = Object.values(values).some(Boolean);

    return (
        <form
            className="mb-4 flex flex-wrap items-end gap-3"
            onSubmit={(e) => {
                e.preventDefault();
                apply(values);
            }}
        >
            {fields.map((f) =>
                f.type === 'search' ? (
                    <Input
                        key={f.key}
                        className="w-full sm:w-72"
                        type="search"
                        placeholder={f.label}
                        aria-label={f.label}
                        value={values[f.key]}
                        onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                        startIcon={<Icon name="search" />}
                    />
                ) : f.type === 'select' ? (
                    <div key={f.key} className="w-44">
                        <Select
                            aria-label={f.label}
                            options={[{ value: '', label: f.label }, ...(f.options ?? [])]}
                            value={values[f.key]}
                            onValueChange={(v) => apply({ ...values, [f.key]: v })}
                        />
                    </div>
                ) : (
                    <label key={f.key} className="grid gap-1 text-xs text-muted-foreground">
                        {f.label}
                        <input
                            type="date"
                            value={values[f.key]}
                            onChange={(e) => apply({ ...values, [f.key]: e.target.value })}
                            className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground"
                        />
                    </label>
                ),
            )}
            {active && (
                <Button variant="ghost" onClick={() => apply(Object.fromEntries(fields.map((f) => [f.key, ''])))}>
                    {t('Clear')}
                </Button>
            )}
        </form>
    );
}

export function Textarea({ error, className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string }) {
    return (
        <div className={className}>
            <textarea
                {...props}
                aria-invalid={!!error || undefined}
                className="min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-[border-color,box-shadow] focus:border-ring focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--ring)_25%,transparent)] aria-invalid:border-destructive"
            />
            {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
        </div>
    );
}

export function DateInput({ error, className, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
    return (
        <div className={className}>
            <input
                type="date"
                {...props}
                aria-invalid={!!error || undefined}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring aria-invalid:border-destructive"
            />
            {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
        </div>
    );
}

export const COUNTRY_OPTIONS: SelectOption[] = [
    { value: 'AR', label: 'Argentina' },
    { value: 'CO', label: 'Colombia' },
];

/** Key/value list used on detail pages. */
export function Facts({ items }: { items: [string, ReactNode][] }) {
    return (
        <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
            {items.map(([k, v]) => (
                <div key={k}>
                    <dt className="text-xs text-muted-foreground">{k}</dt>
                    <dd className="mt-0.5 text-sm font-medium break-words">{v ?? '—'}</dd>
                </div>
            ))}
        </dl>
    );
}

export const METHOD_LABELS: Record<string, string> = {
    cash: 'Cash',
    bank_transfer: 'Bank transfer',
    mercado_pago: 'Mercado Pago',
    pse: 'PSE',
    wompi: 'Wompi',
    online: 'Online payment',
    other: 'Other',
};

// English labels (translated with t()) for values stored as codes.
export const FREQ_LABELS: Record<string, string> = { daily: 'Daily', weekly: 'Weekly', fortnightly: 'Fortnightly' };
export const LOAN_TYPE_LABELS: Record<string, string> = {
    personal: 'Personal',
    emergency: 'Emergency',
    debt_consolidation: 'Debt consolidation',
    education: 'Education',
    medical: 'Medical',
    home_improvement: 'Home improvement',
    vehicle: 'Vehicle',
};
export const EMPLOYMENT_LABELS: Record<string, string> = { employed: 'Employed', self_employed: 'Self-employed', casual: 'Casual', unemployed: 'Unemployed' };
export const ID_TYPE_LABELS: Record<string, string> = { national_id: 'National ID', drivers_licence: "Driver's licence", passport: 'Passport' };
export const DOC_LABELS: Record<string, string> = {
    id_front: 'ID (front)',
    id_back: 'ID (back)',
    address_proof: 'Proof of address',
    income_proof: 'Proof of income',
    other: 'Other document',
};
export const GENDER_LABELS: Record<string, string> = { female: 'Female', male: 'Male', non_binary: 'Non-binary', prefer_not: 'Prefer not to say' };
export const MARITAL_LABELS: Record<string, string> = { single: 'Single', married: 'Married', de_facto: 'De facto', divorced: 'Divorced', widowed: 'Widowed' };
/** ":n months" that reads right for one month too. */
export const monthsLabel = (t: (k: string, v?: Record<string, string | number>) => string, n: number) => (n === 1 ? t('1 month') : t(':n months', { n }));
export const COUNTRY_NAMES: Record<string, string> = { AR: 'Argentina', CO: 'Colombia' };
export const CURRENCY_OF: Record<string, string> = { AR: 'ARS', CO: 'COP' };


/** wa.me link with a prefilled message; the phone keeps digits only. */
export const waLink = (phone: string | null | undefined, text: string) => `https://wa.me/${(phone ?? '').replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
