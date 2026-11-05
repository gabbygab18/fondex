import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState, type FormEvent } from 'react';
import { DataTable, METHOD_LABELS, PageHeader, Panel, Stat } from '@/components/admin';
import { Button, buttonVariants } from '@/components/glint/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/glint/dialog';
import { Input } from '@/components/glint/input';
import { Label } from '@/components/glint/label';
import { Select } from '@/components/glint/select';
import { Icon } from '@/icons/icon';
import { portalLayout } from '@/Layouts/PortalLayout';
import { money } from '@/lib/format';
import { useLocale, useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';

type Period = 'daily' | 'weekly' | 'monthly' | 'yearly';
type Sums = { lent: number; loans: number; interest_booked: number; collected: number; payments: number; principal: number; interest: number; cash_in: number; cash_out: number; net: number };
type Entry = {
    key: string;
    id: number;
    loan_id?: number;
    user_id?: number;
    type: 'disbursement' | 'collection' | 'cash_in' | 'cash_out';
    category?: string;
    date: string;
    loan: string | null;
    borrower: string;
    amount: number;
    principal: number | null;
    interest: number | null;
    method: string | null;
};

interface Props {
    filters: { period: Period; currency: string; from: string; to: string };
    currencies: string[];
    totals: Sums;
    outstanding: { balance: number; interest: number; loans: number };
    capital: { in: number; out: number };
    rows: (Sums & { period: string })[];
    ledger: Entry[];
    categories: Record<'in' | 'out', string[]>;
    activeLoans: ActiveLoan[];
    methods: string[];
}

type ActiveLoan = { id: number; reference: string; currency: string; borrower: string; outstanding: number };

const CATEGORY_LABELS: Record<string, string> = {
    loan_payment: 'Loan payment (borrower)',
    capital: 'Capital put in',
    other_income: 'Other income',
    expense: 'Expense',
    salary: 'Salaries',
    rent: 'Rent',
    tax: 'Taxes',
    withdrawal: 'Owner withdrawal',
    other_expense: 'Other expense',
};
const ENTRY_LABELS: Record<Entry['type'], string> = { disbursement: 'Disbursement', collection: 'Collection', cash_in: 'Cash in', cash_out: 'Cash out' };

/**
 * Cash entry. "Loan payment" is saved as a real payment on the chosen loan (same as recording it on the loan page),
 * so the loan balance, its installments and the client's portal update. Everything else goes to the cash book.
 */
function AddEntry({
    loanMode,
    currency,
    currencies,
    categories,
    loans,
    methods,
}: {
    loanMode: boolean;
    currency: string;
    currencies: string[];
    categories: Props['categories'];
    loans: ActiveLoan[];
    methods: string[];
}) {
    const t = useT();
    const locale = useLocale();
    const [open, setOpen] = useState(false);
    const today = new Date().toLocaleDateString('en-CA');
    const cats = { in: ['loan_payment', ...categories.in], out: categories.out };
    const start = loanMode ? { direction: 'in', category: 'loan_payment' } : { direction: 'out', category: categories.out[0] };
    const form = useForm({ date: today, currency, ...start, description: '', amount: '', loan_id: '', method: 'cash' });
    const [search, setSearch] = useState('');
    const loanLabel = (l: ActiveLoan) => `${l.reference} · ${l.borrower}`;
    const p = loanMode ? 'lp' : 'ce'; // two copies of this form on the page: keep element ids unique
    const loanPayment = form.data.category === 'loan_payment';
    const loan = loanPayment ? loans.find((l) => String(l.id) === form.data.loan_id) : undefined;

    const submit = (e: FormEvent) => {
        e.preventDefault();
        const done = {
            preserveScroll: true,
            onSuccess: () => {
                form.reset('description', 'amount', 'loan_id');
                setSearch('');
                setOpen(false);
            },
        };
        if (!loanPayment) return form.post('/admin/accounting/entries', done);
        if (!loan) return form.setError('loan_id', t('Choose the loan.'));
        form.transform((d) => ({ amount: d.amount, paid_on: d.date, method: d.method, reference: d.description || null }));
        form.post(`/admin/loans/${loan.id}/payments`, { ...done, onFinish: () => form.transform((d) => d) });
    };
    const options = (dir: 'in' | 'out') => cats[dir].map((c) => ({ value: c, label: t(CATEGORY_LABELS[c] ?? c) }));

    return (
        <>
            <Button
                variant={loanMode ? 'default' : 'outline'}
                onClick={() => (form.setData({ ...form.data, currency, ...start }), setOpen(true))}
                startIcon={<Icon name={loanMode ? 'banknote' : 'plus'} />}
            >
                {loanMode ? t('Record loan payment') : t('Add cash entry')}
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <form onSubmit={submit} className="grid gap-4">
                        <DialogHeader>
                            <DialogTitle>{loanPayment ? t('Record loan payment') : t('Add cash entry')}</DialogTitle>
                            <DialogDescription>
                                {loanPayment
                                    ? t("A borrower's payment. It is saved on their loan, so the balance and their client portal update.")
                                    : t('For money in or out that is not a loan payment: expenses, capital, withdrawals or other income.')}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1" role="group" aria-label={t('Type')}>
                            {(['in', 'out'] as const).map((d) => (
                                <button
                                    key={d}
                                    type="button"
                                    aria-pressed={form.data.direction === d}
                                    onClick={() => form.setData({ ...form.data, direction: d, category: cats[d][0] })}
                                    className={cn(
                                        'flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition-colors',
                                        form.data.direction === d ? (d === 'in' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white') : 'text-muted-foreground',
                                    )}
                                >
                                    <Icon name={d === 'in' ? 'arrow-down-left' : 'arrow-up-right'} /> {d === 'in' ? t('Money in') : t('Money out')}
                                </button>
                            ))}
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <Label htmlFor={`${p}-category`} required>{t('Category')}</Label>
                                <div className="mt-1.5">
                                    <Select id={`${p}-category`} value={form.data.category} onValueChange={(v) => form.setData('category', v)} options={options(form.data.direction as 'in' | 'out')} />
                                </div>
                            </div>
                            <div>
                                <Label htmlFor={`${p}-date`} required>{t('Date')}</Label>
                                <Input
                                    id={`${p}-date`}
                                    className="mt-1.5"
                                    type="date"
                                    max={today}
                                    required
                                    value={form.data.date}
                                    onChange={(e) => form.setData('date', e.target.value)}
                                    error={form.errors.date ?? (form.errors as Record<string, string>).paid_on}
                                />
                            </div>
                            {loanPayment && (
                                <div className="sm:col-span-2">
                                    <Label htmlFor={`${p}-loan`} required>{t('Loan and borrower')}</Label>
                                    <Input
                                        id={`${p}-loan`}
                                        className="mt-1.5"
                                        list={`${p}-loans`}
                                        autoComplete="off"
                                        placeholder={loans.length ? t('Type a loan number or client name') : t('No active loans')}
                                        value={search}
                                        onChange={(e) => {
                                            setSearch(e.target.value);
                                            form.setData('loan_id', String(loans.find((l) => loanLabel(l) === e.target.value)?.id ?? ''));
                                        }}
                                        startIcon={<Icon name="search" />}
                                        error={form.errors.loan_id}
                                    />
                                    <datalist id={`${p}-loans`}>
                                        {loans.map((l) => (
                                            <option key={l.id} value={loanLabel(l)} />
                                        ))}
                                    </datalist>
                                    {loan && (
                                        <p className="mt-1.5 text-xs text-muted-foreground">
                                            {t(':amount due', { amount: money(loan.outstanding, loan.currency, locale) })} ·{' '}
                                            <Link href={`/admin/loans/${loan.id}`} className="font-medium text-[#2563eb] hover:underline">
                                                {t('Open loan')}
                                            </Link>
                                        </p>
                                    )}
                                </div>
                            )}
                            <div>
                                <Label htmlFor={`${p}-amount`} required>
                                    {t('Amount')}
                                    {loan && ` (${loan.currency})`}
                                </Label>
                                <Input
                                    id={`${p}-amount`}
                                    className="mt-1.5"
                                    type="number"
                                    inputMode="decimal"
                                    min="0.01"
                                    max={loan?.outstanding}
                                    step="0.01"
                                    required
                                    value={form.data.amount}
                                    onChange={(e) => form.setData('amount', e.target.value)}
                                    error={form.errors.amount}
                                />
                            </div>
                            {loanPayment ? (
                                <div>
                                    <Label htmlFor={`${p}-method`} required>{t('Payment method')}</Label>
                                    <div className="mt-1.5">
                                        <Select id={`${p}-method`} value={form.data.method} onValueChange={(v) => form.setData('method', v)} options={methods.map((m) => ({ value: m, label: t(METHOD_LABELS[m] ?? m) }))} />
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <Label htmlFor={`${p}-currency`} required>{t('Currency')}</Label>
                                    <div className="mt-1.5">
                                        <Select id={`${p}-currency`} value={form.data.currency} onValueChange={(v) => form.setData('currency', v)} options={currencies.map((c) => ({ value: c, label: c }))} />
                                    </div>
                                </div>
                            )}
                        </div>
                        <div>
                            <Label htmlFor={`${p}-desc`} required={!loanPayment}>
                                {loanPayment ? t('Receipt or reference (optional)') : t('Description')}
                            </Label>
                            <Input
                                id={`${p}-desc`}
                                className="mt-1.5"
                                required={!loanPayment}
                                maxLength={loanPayment ? 120 : 255}
                                placeholder={loanPayment ? t('e.g. Receipt 0045') : t('e.g. Office rent for November')}
                                value={form.data.description}
                                onChange={(e) => form.setData('description', e.target.value)}
                                error={form.errors.description ?? (form.errors as Record<string, string>).reference}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                                {t('Cancel')}
                            </Button>
                            <Button type="submit" loading={form.processing}>
                                {t('Save entry')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

const PERIODS: [Period, string][] = [
    ['daily', 'Daily'],
    ['weekly', 'Weekly'],
    ['monthly', 'Monthly'],
    ['yearly', 'Yearly'],
];

export default function Accounting({ filters, currencies, totals, outstanding, capital, rows, ledger, categories, activeLoans, methods }: Props) {
    const t = useT();
    const locale = useLocale();
    const tag = locale === 'en' ? 'en-US' : 'es-CO';
    const fmt = (v: number) => money(v, filters.currency, locale);
    const go = (next: Partial<Props['filters']>) => router.get('/admin/accounting', { ...filters, ...next }, { preserveScroll: true, preserveState: true, replace: true });
    const exportHref = `/admin/accounting/export?${new URLSearchParams(filters)}`;

    const day = (d: string, o: Intl.DateTimeFormatOptions) => new Date(`${d}T00:00:00`).toLocaleDateString(tag, o);
    const label = (d: string) =>
        filters.period === 'daily'
            ? day(d, { weekday: 'short', day: 'numeric', month: 'short' })
            : filters.period === 'weekly'
              ? t('Week of :date', { date: day(d, { day: 'numeric', month: 'short', year: 'numeric' }) })
              : filters.period === 'monthly'
                ? day(d, { month: 'long', year: 'numeric' })
                : d.slice(0, 4);
    const peak = Math.max(1, ...rows.map((r) => r.interest));
    const cashCell = (r: Sums) =>
        r.cash_in || r.cash_out ? (
            <>
                {r.cash_in > 0 && <span className="text-emerald-700">+{fmt(r.cash_in)}</span>}
                {r.cash_in > 0 && r.cash_out > 0 && ' / '}
                {r.cash_out > 0 && <span className="text-rose-600">−{fmt(r.cash_out)}</span>}
            </>
        ) : (
            '—'
        );
    const remove = (e: Entry) => confirm(t('Delete this entry?')) && router.delete(`/admin/accounting/entries/${e.id}`, { preserveScroll: true });
    const pill = (on: boolean) => cn('rounded-full px-4 py-1.5 text-sm font-medium transition-colors', on ? 'bg-navy text-white' : 'text-muted-foreground hover:text-navy');

    return (
        <>
            <Head title={t('Accounting')} />
            <PageHeader
                title={t('Accounting')}
                subtitle={t('Money lent, money collected and interest earned, by period.')}
                actions={
                    <>
                        <AddEntry loanMode currency={filters.currency} currencies={currencies} categories={categories} loans={activeLoans} methods={methods} />
                        <AddEntry loanMode={false} currency={filters.currency} currencies={currencies} categories={categories} loans={activeLoans} methods={methods} />
                        <a href={exportHref} className={buttonVariants()}>
                            <Icon name="download" /> {t('Download ledger (CSV)')}
                        </a>
                    </>
                }
            />

            <div className="mb-6 flex flex-wrap items-end gap-3">
                {currencies.length > 1 && (
                    <div className="flex rounded-full bg-card p-1 shadow-sm" role="group" aria-label={t('Currency')}>
                        {currencies.map((c) => (
                            <button key={c} type="button" aria-pressed={c === filters.currency} onClick={() => go({ currency: c })} className={pill(c === filters.currency)}>
                                {c}
                            </button>
                        ))}
                    </div>
                )}
                <div className="flex rounded-full bg-card p-1 shadow-sm" role="group" aria-label={t('Group by')}>
                    {PERIODS.map(([p, l]) => (
                        // A new period resets the dates to that period's default range.
                        <button key={p} type="button" aria-pressed={p === filters.period} onClick={() => go({ period: p, from: '', to: '' })} className={pill(p === filters.period)}>
                            {t(l)}
                        </button>
                    ))}
                </div>
                {(['from', 'to'] as const).map((k) => (
                    <label key={k} className="grid gap-1 text-xs text-muted-foreground">
                        {k === 'from' ? t('From') : t('To')}
                        <input
                            type="date"
                            value={filters[k]}
                            onChange={(e) => e.target.value && go({ [k]: e.target.value })}
                            className="h-10 rounded-lg border border-input bg-card px-3 text-sm text-foreground"
                        />
                    </label>
                ))}
            </div>

            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
                <Stat icon="arrow-up-right" label={t('Money lent')} value={fmt(totals.lent)} hint={t(':n loans disbursed', { n: totals.loans })} />
                <Stat icon="arrow-down-left" label={t('Money collected')} value={fmt(totals.collected)} hint={t(':n payments · :amount principal back', { n: totals.payments, amount: fmt(totals.principal) })} />
                <Stat tone="dark" icon="trending-up" label={t('Interest earned')} value={fmt(totals.interest)} hint={t('Collected in this period')} />
                <Stat
                    tone="azure"
                    icon="wallet"
                    label={t('Outstanding today')}
                    value={fmt(outstanding.balance)}
                    hint={t(':amount of it is interest · :n active loans', { amount: fmt(outstanding.interest), n: outstanding.loans })}
                />
                <Stat
                    icon="piggy-bank"
                    label={t('Total capital put in')}
                    value={fmt(capital.in)}
                    hint={capital.out ? t('All time · :amount withdrawn', { amount: fmt(capital.out) }) : t('All time')}
                />
            </div>

            <h2 className="mb-3 font-display text-lg font-bold text-navy">{t('Summary')}</h2>
            <DataTable head={[t('Period'), t('Lent'), t('Collected'), t('Principal recovered'), t('Interest earned'), t('Other cash in / out'), t('Net cash flow')]} empty={rows.length === 0}>
                {rows.map((r) => (
                    <tr key={r.period} className={cn(!r.lent && !r.collected && !r.cash_in && !r.cash_out && 'text-muted-foreground')}>
                        <td className="font-medium first-letter:uppercase">{label(r.period)}</td>
                        <td className="tabular-nums">{r.lent ? fmt(r.lent) : '—'}</td>
                        <td className="tabular-nums">{r.collected ? fmt(r.collected) : '—'}</td>
                        <td className="tabular-nums">{r.principal ? fmt(r.principal) : '—'}</td>
                        <td className="min-w-48">
                            {r.interest ? (
                                <span className="grid grid-cols-[1fr_5rem] items-center gap-3">
                                    <b className="tabular-nums text-emerald-700">{fmt(r.interest)}</b>
                                    <span className="h-2 overflow-hidden rounded-full bg-muted">
                                        <span className="block h-full rounded-full bg-emerald-500" style={{ width: `${(r.interest / peak) * 100}%` }} />
                                    </span>
                                </span>
                            ) : (
                                '—'
                            )}
                        </td>
                        <td className="whitespace-nowrap tabular-nums">{cashCell(r)}</td>
                        <td className={cn('tabular-nums', r.net < 0 && 'text-rose-600')}>{r.net ? fmt(r.net) : '—'}</td>
                    </tr>
                ))}
                <tr className="bg-muted/50 font-semibold text-navy">
                    <td>{t('Total')}</td>
                    <td className="tabular-nums">{fmt(totals.lent)}</td>
                    <td className="tabular-nums">{fmt(totals.collected)}</td>
                    <td className="tabular-nums">{fmt(totals.principal)}</td>
                    <td className="tabular-nums text-emerald-700">{fmt(totals.interest)}</td>
                    <td className="whitespace-nowrap tabular-nums">{cashCell(totals)}</td>
                    <td className={cn('tabular-nums', totals.net < 0 && 'text-rose-600')}>{fmt(totals.net)}</td>
                </tr>
            </DataTable>
            <p className="mt-2 text-xs text-muted-foreground">
                {t('Interest is counted when it is collected. Each payment is split between principal and interest in the same proportion as its loan (a loan of 100,000 at 20% repays 120,000, so 1/6 of each payment is interest). Net cash flow is everything that came in (collections and other cash in) minus everything that went out (loans and other cash out).')}
            </p>

            <Panel title={t('Ledger')} className="mt-8" actions={<span className="text-xs text-muted-foreground">{t('Newest first')}</span>}>
                <div className="-mx-5 overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground [&>th]:whitespace-nowrap [&>th]:px-5 [&>th]:py-3 [&>th]:font-medium">
                                <th>{t('Date')}</th>
                                <th>{t('Entry')}</th>
                                <th>{t('Loan / category')}</th>
                                <th>{t('Borrower / description')}</th>
                                <th className="text-right">{t('Amount')}</th>
                                <th className="text-right">{t('Principal')}</th>
                                <th className="text-right">{t('Interest')}</th>
                                <th>{t('Method')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border [&_td]:whitespace-nowrap [&_td]:px-5 [&_td]:py-3">
                            {ledger.map((e) => {
                                const out = e.type === 'disbursement' || e.type === 'cash_out';
                                const manual = e.type === 'cash_in' || e.type === 'cash_out';
                                return (
                                    <tr key={e.key}>
                                        <td>{day(e.date, { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                        <td>
                                            <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', out ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700')}>
                                                {t(ENTRY_LABELS[e.type])}
                                            </span>
                                        </td>
                                        <td className="font-medium">
                                            {manual ? (
                                                <span className="text-muted-foreground">{t(CATEGORY_LABELS[e.category!] ?? '')}</span>
                                            ) : (
                                                <Link href={`/admin/loans/${e.loan_id}`} className="text-[#2563eb] hover:underline">
                                                    {e.loan}
                                                </Link>
                                            )}
                                        </td>
                                        <td className="max-w-64 truncate" title={e.borrower}>
                                            {e.user_id ? (
                                                <Link href={`/admin/clients/${e.user_id}`} className="hover:text-[#2563eb] hover:underline">
                                                    {e.borrower}
                                                </Link>
                                            ) : (
                                                e.borrower
                                            )}
                                        </td>
                                        <td className={cn('text-right font-semibold tabular-nums', out ? 'text-rose-700' : 'text-emerald-700')}>
                                            {out ? '−' : '+'}
                                            {fmt(e.amount)}
                                        </td>
                                        <td className="text-right tabular-nums">{e.principal != null ? fmt(e.principal) : '—'}</td>
                                        <td className="text-right tabular-nums">{e.interest ? fmt(e.interest) : '—'}</td>
                                        <td className="text-muted-foreground">
                                            {manual ? (
                                                <button type="button" onClick={() => remove(e)} className="rounded-lg p-1.5 hover:bg-rose-50 hover:text-rose-600" aria-label={t('Delete entry')}>
                                                    <Icon name="trash" size={16} />
                                                </button>
                                            ) : e.method ? (
                                                t(METHOD_LABELS[e.method] ?? e.method)
                                            ) : (
                                                '—'
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {ledger.length === 0 && <p className="p-10 text-center text-sm text-muted-foreground">{t('No entries in this period.')}</p>}
                </div>
                {ledger.length === 200 && <p className="mt-3 text-xs text-muted-foreground">{t('Showing the newest 200 entries. Download the CSV for all of them.')}</p>}
            </Panel>
        </>
    );
}

Accounting.layout = portalLayout;
