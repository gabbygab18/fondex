import { Head, Link, useForm } from '@inertiajs/react';
import { useState, type ReactNode } from 'react';
import { DISBURSEMENT_LABEL } from '@/lib/labels';
import { COUNTRY_NAMES, GENDER_LABELS, MARITAL_LABELS, monthsLabel, DateInput, DOC_LABELS, EMPLOYMENT_LABELS, Facts, FREQ_LABELS, ID_TYPE_LABELS, LOAN_TYPE_LABELS, PageHeader, Panel, Textarea } from '@/components/admin';
import { Button, buttonVariants } from '@/components/glint/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/glint/dialog';
import { Label } from '@/components/glint/label';
import { RadioGroup, RadioGroupItem } from '@/components/glint/radio-group';
import { useToast } from '@/components/glint/toast';
import { StatusBadge } from '@/components/StatusBadge';
import { Icon } from '@/icons/icon';
import { portalLayout } from '@/Layouts/PortalLayout';
import { date, installment, installmentCount, money, totalPayable } from '@/lib/format';
import { useLocale, useT } from '@/lib/i18n';
import { CreditScore } from '@/components/Credit';
import type { Application, CreditSummary, Frequency } from '@/types';

type Decision = 'under_review' | 'approved' | 'rejected';

/** A sensitive number shown in full with a one-click copy, for staff verifying identity or disbursing. */
function Copyable({ value }: { value?: string | null }) {
    const t = useT();
    const { toast } = useToast();
    if (!value) return <>—</>;
    return (
        <span className="inline-flex items-center gap-2">
            <span className="break-all font-mono tracking-wide">{value}</span>
            <button
                type="button"
                onClick={() => navigator.clipboard.writeText(value).then(() => toast({ title: t('Copied'), variant: 'success', duration: 1500 }))}
                className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label={t('Copy')}
            >
                <Icon name="copy" size={14} />
            </button>
        </span>
    );
}

function Check({ ok, children }: { ok: boolean; children: ReactNode }) {
    return (
        <li className="flex items-start gap-2 text-sm">
            <Icon name={ok ? 'check-circle' : 'x-circle'} size={18} className={ok ? 'shrink-0 text-emerald-600' : 'shrink-0 text-destructive'} />
            {children}
        </li>
    );
}

const PER_MONTH: Record<Frequency, number> = { daily: 30, weekly: 4, fortnightly: 2 };

/** Helps staff pick the rate from the profile: what each rate costs per month against disposable income. The choice stays with them. */
function Affordability({ a, rates, selected, onSelect }: { a: Application; rates: number[]; selected: number; onSelect: (rate: number) => void }) {
    const t = useT();
    const locale = useLocale();
    const fmt = (v: number) => money(v, a.currency, locale);
    const freq = a.repayment_frequency as Frequency;
    const income = a.monthly_income + a.other_income;
    const disposable = income - a.monthly_expenses;

    const band = (pct: number) =>
        pct <= 30 ? { label: t('Comfortable'), cls: 'bg-emerald-100 text-emerald-700' } : pct <= 50 ? { label: t('Tight'), cls: 'bg-amber-100 text-amber-700' } : { label: t('Risky'), cls: 'bg-red-100 text-red-700' };

    return (
        <Panel title={t('Affordability')}>
            <dl className="grid gap-1.5 text-sm">
                {[
                    [t('Income (monthly + other)'), fmt(income)],
                    [t('Living expenses'), `− ${fmt(a.monthly_expenses)}`],
                    [t('Existing loans and debts'), a.existing_debts ? fmt(a.existing_debts) : '—'],
                ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-3">
                        <dt className="text-muted-foreground">{k}</dt>
                        <dd className="tabular-nums">{v}</dd>
                    </div>
                ))}
                <div className="mt-1 flex justify-between gap-3 border-t border-border pt-2 font-semibold">
                    <dt>{t('Disposable income')}</dt>
                    <dd className={disposable > 0 ? 'tabular-nums text-navy' : 'tabular-nums text-destructive'}>{fmt(disposable)}</dd>
                </div>
            </dl>
            <table className="mt-4 w-full text-xs">
                <thead>
                    <tr className="text-left text-muted-foreground">
                        <th className="pb-2 font-medium">{t('Rate')}</th>
                        <th className="pb-2 font-medium">{t(FREQ_LABELS[freq])}</th>
                        <th className="pb-2 font-medium">{t('Per month')}</th>
                        <th className="pb-2 text-right font-medium">{t('Of disposable')}</th>
                    </tr>
                </thead>
                <tbody>
                    {rates.map((r) => {
                        const inst = installment(a.amount, r, a.term_months, freq);
                        const monthly = inst * PER_MONTH[freq];
                        const pct = disposable > 0 ? (monthly / disposable) * 100 : Infinity;
                        const b = band(pct);
                        return (
                            <tr
                                key={r}
                                onClick={() => onSelect(r)}
                                aria-selected={selected === r}
                                className={selected === r ? 'cursor-pointer bg-secondary' : 'cursor-pointer hover:bg-muted/60'}
                            >
                                <td className="rounded-l-lg py-2 pl-2 font-semibold">{r}%</td>
                                <td className="py-2 tabular-nums">{fmt(inst)}</td>
                                <td className="py-2 tabular-nums">{fmt(monthly)}</td>
                                <td className="rounded-r-lg py-2 pr-2 text-right">
                                    <span className={`inline-block rounded-full px-2 py-0.5 font-medium ${b.cls}`} title={b.label}>
                                        {Number.isFinite(pct) ? `${Math.round(pct)}%` : '—'} · {b.label}
                                    </span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            <p className="mt-3 text-xs text-muted-foreground">{t('Click a row to use that rate. Up to 30% of disposable income is comfortable; over 50% is risky.')}</p>
        </Panel>
    );
}

export default function ApplicationShow({
    application: a,
    otherApplications,
    rates,
    credit,
}: {
    application: Application;
    otherApplications: Application[];
    rates: number[];
    credit: CreditSummary;
}) {
    const t = useT();
    const locale = useLocale();
    const [confirming, setConfirming] = useState(false);
    const form = useForm({ status: '' as Decision | '', admin_notes: a.admin_notes ?? '', disbursed_at: '', interest_rate: '' });
    const fmt = (v: number) => money(v, a.currency, locale);
    const open = a.status === 'pending' || a.status === 'under_review';
    const freq = a.repayment_frequency as Frequency;
    const count = installmentCount(a.term_months, freq);
    const rate = Number(form.data.interest_rate);

    const decide = (status: Decision) => {
        form.setData('status', status);
        setConfirming(true);
    };
    const submit = () => form.patch(`/admin/applications/${a.id}`, { preserveScroll: true, onSuccess: () => setConfirming(false) });

    const confirmText: Record<Decision, string> = {
        under_review: t('The applicant will be emailed that their application is under review.'),
        approved: t('A loan and its repayment schedule will be created, and the applicant will be emailed.'),
        rejected: t('The applicant will be emailed that the application was not approved. This cannot be undone.'),
    };

    return (
        <>
            <Head title={a.reference} />
            <Link href="/admin/applications" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                <Icon name="arrow-left" size={16} /> {t('All applications')}
            </Link>
            <PageHeader
                title={
                    <span className="flex flex-wrap items-center gap-3">
                        {a.reference} <StatusBadge status={a.status} />
                    </span>
                }
                subtitle={t('Submitted :date', { date: date(a.created_at, locale) })}
                actions={
                    <Link href={`/admin/clients/${a.user_id}`} className={buttonVariants({ variant: 'outline' })}>
                        <Icon name="user-circle" /> {t('Client profile')}
                    </Link>
                }
            />

            <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
                <div className="grid content-start gap-6">
                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="rounded-2xl bg-navy p-5 text-white">
                            <p className="text-sm text-white/70">{t('Requested amount')}</p>
                            <p className="mt-2 font-display text-2xl font-bold text-azure">{fmt(a.amount)}</p>
                            <p className="text-xs text-white/60">{t(LOAN_TYPE_LABELS[a.loan_type] ?? a.loan_type)}</p>
                        </div>
                        <div className="rounded-3xl bg-card p-5 shadow-sm">
                            <p className="text-sm text-muted-foreground">{t('Term')}</p>
                            <p className="mt-2 font-display text-2xl font-bold text-navy">{monthsLabel(t, a.term_months)}</p>
                            <p className="text-xs text-muted-foreground">
                                {t(FREQ_LABELS[freq])} · {t(':n installments', { n: count })}
                            </p>
                        </div>
                        <div className="rounded-2xl bg-azure p-5 text-navy">
                            <p className="text-sm text-navy/75">{t('Monthly income')}</p>
                            <p className="mt-2 font-display text-2xl font-bold">{fmt(a.monthly_income + a.other_income)}</p>
                            <p className="text-xs text-navy/70">{t('Expenses :amount', { amount: fmt(a.monthly_expenses) })}</p>
                        </div>
                    </div>

                    <Panel title={t('Loan details')}>
                        <Facts
                            items={[
                                [t('Loan type'), t(LOAN_TYPE_LABELS[a.loan_type] ?? a.loan_type)],
                                [t('Requested amount'), fmt(a.amount)],
                                [t('Term'), monthsLabel(t, a.term_months)],
                                [t('Repayment frequency'), t(FREQ_LABELS[freq])],
                                [t('Purpose'), a.purpose],
                                [t('Country'), COUNTRY_NAMES[a.country] ?? a.country],
                            ]}
                        />
                        {a.notes && (
                            <div className="mt-5 rounded-xl bg-muted/60 p-4 text-sm">
                                <p className="mb-1 text-xs text-muted-foreground">{t('Applicant notes')}</p>
                                {a.notes}
                            </div>
                        )}
                    </Panel>

                    <Panel title={t('Personal information')}>
                        <Facts
                            items={[
                                [t('Full legal name'), a.full_name],
                                [t('Date of birth'), date(a.date_of_birth, locale)],
                                [t('Gender'), a.gender ? t(GENDER_LABELS[a.gender] ?? a.gender) : '—'],
                                [t('Marital status'), a.marital_status ? t(MARITAL_LABELS[a.marital_status] ?? a.marital_status) : '—'],
                                [t('Email'), <a href={`mailto:${a.email}`} className="text-[#2563eb] hover:underline">{a.email}</a>],
                                [t('Mobile number'), <a href={`tel:${a.phone}`} className="hover:underline">{a.phone}</a>],
                                [t('Residential address'), `${a.address}, ${a.city}`],
                            ]}
                        />
                    </Panel>

                    <Panel title={t('Employment')}>
                        <Facts
                            items={[
                                [t('Employment status'), t(EMPLOYMENT_LABELS[a.employment_status] ?? a.employment_status)],
                                [t('Employer or business'), a.employer_name ?? '—'],
                                [t('Occupation'), a.occupation ?? '—'],
                                [t('Length of employment'), a.employment_length ?? '—'],
                            ]}
                        />
                    </Panel>

                    <Panel title={t('Financial information')}>
                        <Facts
                            items={[
                                [t('Monthly income'), fmt(a.monthly_income)],
                                [t('Other income'), a.other_income ? `${fmt(a.other_income)}${a.other_income_source ? ` · ${a.other_income_source}` : ''}` : '—'],
                                [t('Monthly living expenses'), fmt(a.monthly_expenses)],
                                [t('Existing loans and debts'), a.existing_debts ? fmt(a.existing_debts) : '—'],
                                [t('Other commitments'), a.other_commitments ?? '—'],
                            ]}
                        />
                    </Panel>

                    <div className="grid gap-6 lg:grid-cols-2">
                        <Panel title={t('Identification')}>
                            <Facts
                                items={[
                                    [t('Document type'), t(ID_TYPE_LABELS[a.id_type] ?? a.id_type)],
                                    [t('Document number'), <Copyable value={a.id_number} />],
                                    [t('Issuing country'), COUNTRY_NAMES[a.id_issuing_country] ?? a.id_issuing_country],
                                    [t('Expiry date'), date(a.id_expiry, locale)],
                                ]}
                            />
                        </Panel>
                        <Panel title={t('Disbursement')}>
                            <Facts
                                items={[
                                    [t('Receive the money by'), t(DISBURSEMENT_LABEL[a.disbursement_method])],
                                    ...(a.disbursement_method === 'cash_pickup'
                                        ? []
                                        : ([
                                              [t('Bank'), a.bank_name],
                                              [t('Account holder'), a.account_holder],
                                              [t('Account type'), a.account_type ? t(a.account_type === 'savings' ? 'Savings' : 'Checking') : '—'],
                                              [a.country === 'AR' ? t('CBU / CVU or alias') : t('Account number'), <Copyable value={a.account_number} />],
                                          ] as [string, ReactNode][])),
                                ]}
                            />
                        </Panel>
                    </div>

                    <Panel title={t('Consents and declarations')}>
                        <ul className="grid gap-2.5 sm:grid-cols-2">
                            <Check ok={a.consent_privacy}>{t('Accepted the Privacy Policy')}</Check>
                            <Check ok={a.consent_data_use}>{t('Consented to the collection and use of personal information')}</Check>
                            <Check ok={a.consent_credit_check}>{t('Authorised identity and credit checks')}</Check>
                            <Check ok={a.declaration_accurate}>{t('Declared that all information is accurate')}</Check>
                        </ul>
                        {a.consented_at && <p className="mt-4 text-xs text-muted-foreground">{t('Signed :date', { date: new Date(a.consented_at).toLocaleString(locale === 'en' ? 'en-US' : 'es-CO') })}</p>}
                    </Panel>

                    <Panel title={t('Documents')}>
                        {a.documents?.length ? (
                            <ul className="grid gap-3 sm:grid-cols-2">
                                {a.documents.map((d) => (
                                    <li key={d.id}>
                                        <a
                                            href={`/documents/${d.id}`}
                                            target="_blank"
                                            rel="noopener"
                                            className="flex items-center gap-3 rounded-xl p-3 ring-1 ring-border transition-colors hover:bg-muted/60"
                                        >
                                            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary text-navy">
                                                <Icon name={d.mime === 'application/pdf' ? 'file-text' : 'file-image'} size={20} />
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className="block text-sm font-medium">{t(DOC_LABELS[d.type] ?? d.type)}</span>
                                                <span className="block truncate text-xs text-muted-foreground">
                                                    {d.original_name} · {Math.max(1, Math.round(d.size / 1024))} KB
                                                </span>
                                            </span>
                                            <Icon name="external-link" size={16} className="text-muted-foreground" />
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-muted-foreground">{t('No documents uploaded.')}</p>
                        )}
                    </Panel>

                    {otherApplications.length > 0 && (
                        <Panel title={t('Other applications from this person')}>
                            <ul className="divide-y divide-border text-sm">
                                {otherApplications.map((o) => (
                                    <li key={o.id} className="flex items-center justify-between gap-3 py-2.5">
                                        <Link href={`/admin/applications/${o.id}`} className="font-medium text-navy hover:underline">{o.reference}</Link>
                                        <span className="tabular-nums">{money(o.amount, o.currency, locale)}</span>
                                        <span className="text-muted-foreground">{date(o.created_at, locale)}</span>
                                        <StatusBadge status={o.status} />
                                    </li>
                                ))}
                            </ul>
                        </Panel>
                    )}
                </div>

                <aside className="grid content-start gap-6">
                    <Panel title={t('Payment record')}>
                        <dl className="grid gap-2 text-sm">
                            <div className="flex items-center justify-between gap-3">
                                <dt className="text-muted-foreground">{t('Credit score')}</dt>
                                <dd>
                                    <CreditScore credit={credit} />
                                </dd>
                            </div>
                            {credit.limit !== null && credit.currency && (
                                <div className="flex justify-between gap-3">
                                    <dt className="text-muted-foreground">{t('Borrowing limit now')}</dt>
                                    <dd className="font-medium tabular-nums">{money(credit.limit, credit.currency, locale)}</dd>
                                </div>
                            )}
                        </dl>
                        {open && credit.limit !== null && a.amount > credit.limit && (
                            <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">{t('The amount requested is above this client’s current limit.')}</p>
                        )}
                    </Panel>
                    {open && <Affordability a={a} rates={rates} selected={rate} onSelect={(r) => form.setData('interest_rate', String(r))} />}
                    <Panel title={t('Decision')}>
                        {open ? (
                            <div className="grid gap-4">
                                <div>
                                    <Label required>{t('Flat interest rate')}</Label>
                                    <p className="mb-2 text-xs text-muted-foreground">{t('Charged once on the principal. Required to approve.')}</p>
                                    <RadioGroup
                                        value={form.data.interest_rate}
                                        onValueChange={(v) => form.setData('interest_rate', v)}
                                        variant="card"
                                        className="grid-cols-2"
                                        aria-label={t('Flat interest rate')}
                                    >
                                        {rates.map((r) => (
                                            <RadioGroupItem key={r} value={String(r)} label={`${r}%`} />
                                        ))}
                                    </RadioGroup>
                                    {form.errors.interest_rate && <p className="mt-1.5 text-xs text-destructive">{form.errors.interest_rate}</p>}
                                </div>
                                {rate > 0 && (
                                    <dl className="grid gap-2 rounded-xl bg-navy p-4 text-sm text-white">
                                        <div className="flex justify-between">
                                            <dt className="text-white/65">{t('Total to repay')}</dt>
                                            <dd className="font-semibold">{fmt(totalPayable(a.amount, rate))}</dd>
                                        </div>
                                        <div className="flex justify-between">
                                            <dt className="text-white/65">{t('Interest')}</dt>
                                            <dd className="font-semibold">{fmt(totalPayable(a.amount, rate) - a.amount)}</dd>
                                        </div>
                                        <div className="flex justify-between border-t border-white/10 pt-2">
                                            <dt className="text-white/65">
                                                {count} × {t(FREQ_LABELS[freq]).toLowerCase()}
                                            </dt>
                                            <dd className="font-display text-lg font-bold text-azure">{fmt(installment(a.amount, rate, a.term_months, freq))}</dd>
                                        </div>
                                    </dl>
                                )}
                                <div>
                                    <Label htmlFor="admin_notes" optional hint={t('Included in the email to the applicant')}>
                                        {t('Notes')}
                                    </Label>
                                    <Textarea id="admin_notes" className="mt-1.5" value={form.data.admin_notes} onChange={(e) => form.setData('admin_notes', e.target.value)} error={form.errors.admin_notes} />
                                </div>
                                <div>
                                    <Label htmlFor="disbursed_at" optional hint={t('Defaults to today')}>
                                        {t('Disbursement date')}
                                    </Label>
                                    <DateInput id="disbursed_at" className="mt-1.5" value={form.data.disbursed_at} onChange={(e) => form.setData('disbursed_at', e.target.value)} error={form.errors.disbursed_at} />
                                </div>
                                <div className="grid gap-2">
                                    <Button onClick={() => decide('approved')} disabled={!rate} startIcon={<Icon name="check-circle" />}>
                                        {rate ? t('Approve at :rate%', { rate }) : t('Choose a rate to approve')}
                                    </Button>
                                    {a.status === 'pending' && (
                                        <Button variant="outline" onClick={() => decide('under_review')} startIcon={<Icon name="eye" />}>
                                            {t('Mark under review')}
                                        </Button>
                                    )}
                                    <Button variant="outline" className="text-destructive" onClick={() => decide('rejected')} startIcon={<Icon name="x-circle" />}>
                                        {t('Reject')}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="grid gap-3 text-sm">
                                <StatusBadge status={a.status} />
                                <p className="text-muted-foreground">{t('Decided by :name on :date', { name: a.reviewer?.name ?? '—', date: date(a.reviewed_at, locale) })}</p>
                                {a.interest_rate !== null && <p>{t('Flat rate: :rate%', { rate: a.interest_rate })}</p>}
                                {a.admin_notes && <p className="rounded-xl bg-muted/60 p-3">{a.admin_notes}</p>}
                                {a.loan && (
                                    <Link href={`/admin/loans/${a.loan.id}`} className={buttonVariants({ className: 'mt-2' })}>
                                        <Icon name="banknote" /> {t('Open loan :ref', { ref: a.loan.reference ?? '' })}
                                    </Link>
                                )}
                            </div>
                        )}
                    </Panel>
                </aside>
            </div>

            <Dialog open={confirming} onOpenChange={setConfirming}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {form.data.status === 'approved' ? t('Approve this application?') : form.data.status === 'rejected' ? t('Reject this application?') : t('Mark as under review?')}
                        </DialogTitle>
                        <DialogDescription>
                            {form.data.status && confirmText[form.data.status]}
                            {form.data.status === 'approved' && rate > 0 && (
                                <>
                                    {' '}
                                    {t(':n installments of :amount at :rate% flat.', { n: count, amount: fmt(installment(a.amount, rate, a.term_months, freq)), rate })}
                                </>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirming(false)}>
                            {t('Cancel')}
                        </Button>
                        <Button variant={form.data.status === 'rejected' ? 'destructive' : 'default'} loading={form.processing} onClick={submit}>
                            {t('Confirm')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

ApplicationShow.layout = portalLayout;
