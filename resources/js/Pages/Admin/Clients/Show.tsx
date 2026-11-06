import { useState, type FormEvent, type ReactNode } from 'react';
import { DISBURSEMENT_LABEL } from '@/lib/labels';
import { Head, Link, useForm } from '@inertiajs/react';
import { COUNTRY_NAMES, CURRENCY_OF, GENDER_LABELS, MARITAL_LABELS, monthsLabel, DataTable, EMPLOYMENT_LABELS, Facts, FREQ_LABELS, ID_TYPE_LABELS, LOAN_TYPE_LABELS, METHOD_LABELS, PageHeader, Panel, waLink } from '@/components/admin';
import { Button, buttonVariants } from '@/components/glint/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/glint/dialog';
import { Input } from '@/components/glint/input';
import { Label } from '@/components/glint/label';
import { Select } from '@/components/glint/select';
import { Progress } from '@/components/glint/progress';
import { StatusBadge } from '@/components/StatusBadge';
import { WhatsApp } from '@/icons/boxicons';
import { Icon } from '@/icons/icon';
import { portalLayout } from '@/Layouts/PortalLayout';
import { date, FREQUENCIES, installment, installmentCount, money, totalPayable } from '@/lib/format';
import { useLocale, useT } from '@/lib/i18n';
import { CreditScore } from '@/components/Credit';
import type { Application, CreditSummary, Installment, Loan, Payment } from '@/types';

type Props = {
    client: { id: number; name: string; email: string; phone: string | null; country: string | null; is_active: boolean; created_at: string };
    profile: Application | null;
    applications: Application[];
    loans: (Loan & { overdue_count: number; installments: Installment[] })[];
    payments: (Payment & { loan: { id: number; reference: string; currency: string } })[];
    credit: CreditSummary;
    referrer: { id: number; name: string } | null;
    referrals: { id: number; name: string; created_at: string }[];
};

/**
 * A loan the client already had before using the site. The schedule is built from the start date like any loan,
 * and what they've already paid fills the oldest installments, so the client portal shows the real balance.
 */
function AddExistingLoan({ clientId, currency }: { clientId: number; currency: string }) {
    const t = useT();
    const locale = useLocale();
    const [open, setOpen] = useState(false);
    const today = new Date().toLocaleDateString('en-CA');
    const form = useForm({ reference: '', principal: '', interest_rate: '20', term_months: '1', repayment_frequency: 'weekly', disbursed_at: today, already_paid: '', paid_on: today });
    const d = form.data;
    const fmt = (v: number) => money(v, currency, locale);
    const [principal, rate, months] = [Number(d.principal), Number(d.interest_rate), Number(d.term_months)];
    const ready = principal > 0 && months > 0;
    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.post(`/admin/clients/${clientId}/loans`);
    };
    const field = (k: keyof typeof d, label: string, props: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>, required = true) => (
        <div>
            <Label htmlFor={`el-${k}`} required={required}>{label}</Label>
            <Input id={`el-${k}`} className="mt-1.5" required={required} value={d[k]} onChange={(e) => form.setData(k, e.target.value)} error={form.errors[k]} {...props} />
        </div>
    );

    return (
        <>
            <Button onClick={() => setOpen(true)} startIcon={<Icon name="plus" />}>
                {t('Add existing loan')}
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-xl">
                    <form onSubmit={submit} className="grid gap-4">
                        <DialogHeader>
                            <DialogTitle>{t('Add existing loan')}</DialogTitle>
                            <DialogDescription>{t('For a loan this client already has. We build the payment schedule from the start date, and what they already paid is applied to the oldest installments.')}</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {field('principal', t('Amount lent (:currency)', { currency }), { type: 'number', inputMode: 'decimal', min: '0.01', step: '0.01' })}
                            {field('interest_rate', t('Flat interest rate (%)'), { type: 'number', inputMode: 'decimal', min: '0', max: '100', step: '0.01' })}
                            {field('term_months', t('Term (months)'), { type: 'number', inputMode: 'numeric', min: '1', max: '24', step: '1' })}
                            <div>
                                <Label htmlFor="el-freq" required>{t('Payments')}</Label>
                                <div className="mt-1.5">
                                    <Select
                                        id="el-freq"
                                        className="max-w-none"
                                        value={d.repayment_frequency}
                                        onValueChange={(v) => form.setData('repayment_frequency', v)}
                                        options={FREQUENCIES.map((f) => ({ value: f, label: t(FREQ_LABELS[f]) }))}
                                    />
                                </div>
                            </div>
                            {field('disbursed_at', t('Start date (money given)'), { type: 'date', max: today })}
                            {field('reference', t('Your loan number (optional)'), { placeholder: t('Leave empty to create one'), maxLength: 30 }, false)}
                            {field('already_paid', t('Already paid so far (optional)'), { type: 'number', inputMode: 'decimal', min: '0', step: '0.01' }, false)}
                            {Number(d.already_paid) > 0 && field('paid_on', t('Date of their last payment'), { type: 'date', min: d.disbursed_at, max: today })}
                        </div>
                        {ready && (
                            <p className="rounded-xl bg-secondary px-4 py-3 text-sm text-navy">
                                {t(':n payments of :amount', { n: installmentCount(months, d.repayment_frequency as never), amount: fmt(installment(principal, rate, months, d.repayment_frequency as never)) })} ·{' '}
                                {t('Total to repay')}: <b>{fmt(totalPayable(principal, rate))}</b>
                                {Number(d.already_paid) > 0 && (
                                    <>
                                        {' '}
                                        · {t('Still owed')}: <b>{fmt(Math.max(0, totalPayable(principal, rate) - Number(d.already_paid)))}</b>
                                    </>
                                )}
                            </p>
                        )}
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                                {t('Cancel')}
                            </Button>
                            <Button type="submit" loading={form.processing}>
                                {t('Add loan')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

export default function ClientShow({ client, profile: p, applications, loans, payments, credit, referrer, referrals }: Props) {
    const t = useT();
    const locale = useLocale();
    const phone = client.phone ?? p?.phone ?? null;

    // Reminder text for WhatsApp: the first active loan's next installment, in Spanish and English.
    const active = loans.find((l) => l.status === 'active' && l.installments[0]);
    const next = active?.installments[0];
    const waText = next
        ? `Hola ${client.name}, te recordamos tu cuota de ${money(next.amount_due - next.amount_paid, active!.currency, 'es')} del préstamo ${active!.reference}, con vencimiento el ${date(next.due_date, 'es')}. / Hi ${client.name}, a reminder that your ${money(next.amount_due - next.amount_paid, active!.currency, 'en')} installment for loan ${active!.reference} is due on ${date(next.due_date, 'en')}. Fondex`
        : `Hola ${client.name}, te escribimos de Fondex. / Hi ${client.name}, this is Fondex.`;
    const fmtP = (v: number | null | undefined) => (p && v ? money(Number(v), p.currency, locale) : '—');
    const label = (map: Record<string, string>, v: string | null | undefined) => (v ? t(map[v] ?? v) : '—');

    return (
        <>
            <Head title={client.name} />
            <Link href="/admin/clients" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                <Icon name="arrow-left" size={16} /> {t('All clients')}
            </Link>
            <PageHeader
                title={
                    <span className="flex flex-wrap items-center gap-3">
                        {client.name}
                        <CreditScore credit={credit} className="text-sm" />
                        {loans.some((l) => l.overdue_count > 0) && <StatusBadge status="overdue" />}
                    </span>
                }
                subtitle={`${client.email}${phone ? ` · ${phone}` : ''} · ${COUNTRY_NAMES[client.country ?? ''] ?? '—'} · ${t('Joined :date', { date: date(client.created_at, locale) })}`}
                actions={
                    <>
                        {client.country && CURRENCY_OF[client.country] && <AddExistingLoan clientId={client.id} currency={CURRENCY_OF[client.country]} />}
                        <a href={`mailto:${client.email}`} className={buttonVariants({ variant: 'outline' })}>
                            <Icon name="mail" /> {t('Email')}
                        </a>
                        {phone && (
                            <>
                                <a href={`tel:${phone.replace(/\s/g, '')}`} className={buttonVariants({ variant: 'outline' })}>
                                    <Icon name="phone" /> {t('Call')}
                                </a>
                                <a href={waLink(phone, waText)} target="_blank" rel="noopener noreferrer" className={buttonVariants({ className: 'bg-[#25d366] text-white hover:bg-[#1fb957]' })}>
                                    <WhatsApp size={18} /> {next ? t('WhatsApp reminder') : 'WhatsApp'}
                                </a>
                            </>
                        )}
                    </>
                }
            />

            {credit.currency && credit.limit !== null && (
                <div className="mb-6 grid gap-4 sm:grid-cols-3">
                    {[
                        [t('Credit score'), credit.score === null ? t('No payments due yet') : `${credit.score} / 100`, 'target'],
                        [t('Borrowing limit now'), money(credit.limit, credit.currency, locale), 'banknote'],
                        [t('Next limit if paid on time'), money(credit.next_limit ?? credit.limit, credit.currency, locale), 'rocket'],
                    ].map(([k, v, icon]) => (
                        <div key={k} className="flex items-center gap-4 rounded-3xl bg-card p-5 shadow-sm">
                            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-secondary text-navy">
                                <Icon name={icon} size={20} />
                            </span>
                            <span>
                                <span className="block text-xs text-muted-foreground">{k}</span>
                                <b className="font-display text-lg text-navy">{v}</b>
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {(referrer || referrals.length > 0) && (
                <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-3xl bg-card p-5 text-sm shadow-sm">
                    <Icon name="gift" size={20} className="text-[#2563eb]" />
                    {referrer && (
                        <span>
                            {t('Invited by')}{' '}
                            <Link href={`/admin/clients/${referrer.id}`} className="font-semibold text-[#2563eb] hover:underline">
                                {referrer.name}
                            </Link>
                        </span>
                    )}
                    {referrals.length > 0 && (
                        <span>
                            {t('Invited :n friends:', { n: referrals.length })}{' '}
                            {referrals.map((r, i) => (
                                <span key={r.id}>
                                    {i > 0 && ', '}
                                    <Link href={`/admin/clients/${r.id}`} className="font-semibold text-[#2563eb] hover:underline">
                                        {r.name}
                                    </Link>
                                </span>
                            ))}
                        </span>
                    )}
                </div>
            )}

            <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
                <div className="grid content-start gap-6">
                    <Panel title={t('Loan history')}>
                        {loans.length === 0 ? (
                            <p className="text-sm text-muted-foreground">{t('No loans yet.')}</p>
                        ) : (
                            <ul className="grid gap-4">
                                {loans.map((l) => {
                                    const due = l.installments[0];
                                    return (
                                        <li key={l.id} className="rounded-xl p-4 ring-1 ring-border">
                                            <div className="flex flex-wrap items-center justify-between gap-3">
                                                <Link href={`/admin/loans/${l.id}`} className="font-display text-lg font-bold text-navy hover:underline">{l.reference}</Link>
                                                <span className="flex gap-2">
                                                    <StatusBadge status={l.status} />
                                                    {l.overdue_count > 0 && <StatusBadge status="overdue" />}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {money(l.principal, l.currency, locale)} · {l.interest_rate}% · {l.installment_count} × {money(l.installment_amount, l.currency, locale)}{' '}
                                                {t(FREQ_LABELS[l.repayment_frequency]).toLowerCase()} · {t('Disbursed :date', { date: date(l.disbursed_at, locale) })}
                                            </p>
                                            <Progress className="mt-3" value={l.amount_paid} max={l.total_payable} size="sm" />
                                            <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
                                                <span>
                                                    {money(l.amount_paid, l.currency, locale)} / {money(l.total_payable, l.currency, locale)}
                                                </span>
                                                {due && <span>{t('Next due :date', { date: date(due.due_date, locale) })}</span>}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </Panel>

                    <div>
                        <h2 className="mb-3 font-display text-lg font-bold text-navy">{t('Applications')}</h2>
                        <DataTable head={[t('Reference'), t('Loan type'), t('Amount'), t('Term'), t('Frequency'), t('Status'), t('Date')]} empty={applications.length === 0}>
                            {applications.map((a) => (
                                <tr key={a.id}>
                                    <td>
                                        <Link href={`/admin/applications/${a.id}`} className="font-medium text-navy hover:underline">{a.reference}</Link>
                                    </td>
                                    <td>{t(LOAN_TYPE_LABELS[a.loan_type] ?? a.loan_type)}</td>
                                    <td className="whitespace-nowrap tabular-nums">{money(a.amount, a.currency, locale)}</td>
                                    <td className="whitespace-nowrap">{monthsLabel(t, a.term_months)}</td>
                                    <td>{t(FREQ_LABELS[a.repayment_frequency])}</td>
                                    <td><StatusBadge status={a.status} /></td>
                                    <td className="whitespace-nowrap text-muted-foreground">{date(a.created_at, locale)}</td>
                                </tr>
                            ))}
                        </DataTable>
                    </div>

                    <div>
                        <h2 className="mb-3 font-display text-lg font-bold text-navy">{t('Payment history')}</h2>
                        <DataTable head={[t('Date'), t('Loan'), t('Amount'), t('Method'), t('Reference')]} empty={payments.length === 0}>
                            {payments.map((pay) => (
                                <tr key={pay.id}>
                                    <td className="whitespace-nowrap">{date(pay.paid_on, locale)}</td>
                                    <td>
                                        <Link href={`/admin/loans/${pay.loan.id}`} className="hover:underline">{pay.loan.reference}</Link>
                                    </td>
                                    <td className="whitespace-nowrap font-medium tabular-nums">{money(pay.amount, pay.loan.currency, locale)}</td>
                                    <td>{t(METHOD_LABELS[pay.method] ?? pay.method)}</td>
                                    <td className="text-muted-foreground">{pay.reference ?? '—'}</td>
                                </tr>
                            ))}
                        </DataTable>
                    </div>
                </div>

                <aside className="grid content-start gap-6">
                    {p ? (
                        <>
                            <Panel title={t('Personal information')}>
                                <Facts
                                    items={[
                                        [t('Full legal name'), p.full_name],
                                        [t('Date of birth'), date(p.date_of_birth, locale)],
                                        [t('Gender'), label(GENDER_LABELS, p.gender)],
                                        [t('Marital status'), label(MARITAL_LABELS, p.marital_status)],
                                        [t('Residential address'), [p.address, p.city].filter(Boolean).join(', ') || '—'],
                                        ...(p.notes ? ([[t('Notes'), p.notes]] as [string, ReactNode][]) : []),
                                    ]}
                                />
                            </Panel>
                            <Panel title={t('Employment')}>
                                <Facts
                                    items={[
                                        [t('Employment status'), label(EMPLOYMENT_LABELS, p.employment_status)],
                                        [t('Employer or business'), p.employer_name ?? '—'],
                                        [t('Occupation'), p.occupation ?? '—'],
                                        [t('Length of employment'), p.employment_length ?? '—'],
                                    ]}
                                />
                            </Panel>
                            <Panel title={t('Financial information')}>
                                <Facts
                                    items={[
                                        [t('Monthly income'), fmtP(p.monthly_income)],
                                        [t('Other income'), p.other_income ? `${fmtP(p.other_income)}${p.other_income_source ? ` · ${p.other_income_source}` : ''}` : '—'],
                                        [t('Monthly living expenses'), fmtP(p.monthly_expenses)],
                                        [t('Existing loans and debts'), p.existing_debts ? fmtP(p.existing_debts) : '—'],
                                        [t('Other commitments'), p.other_commitments ?? '—'],
                                    ]}
                                />
                            </Panel>
                            <Panel title={t('Identification')}>
                                <Facts
                                    items={[
                                        [t('Document type'), label(ID_TYPE_LABELS, p.id_type)],
                                        [t('Document number'), p.id_number ? <span className="break-all font-mono">{p.id_number}</span> : '—'],
                                        [t('Issuing country'), p.id_issuing_country ? (COUNTRY_NAMES[p.id_issuing_country] ?? p.id_issuing_country) : '—'],
                                        [t('Expiry date'), date(p.id_expiry, locale)],
                                    ]}
                                />
                            </Panel>
                            <Panel title={t('Disbursement')}>
                                <Facts
                                    items={[
                                        [t('Receive the money by'), label(DISBURSEMENT_LABEL, p.disbursement_method)],
                                        ...(p.disbursement_method === 'cash_pickup'
                                            ? []
                                            : ([
                                                  [t('Bank'), p.bank_name || '—'],
                                                  [t('Account holder'), p.account_holder || '—'],
                                                  [t('Account type'), p.account_type ? t(p.account_type === 'savings' ? 'Savings' : 'Checking') : '—'],
                                                  [p.country === 'AR' ? t('CBU / CVU or alias') : t('Account number'), p.account_number ? <span className="break-all font-mono">{p.account_number}</span> : '—'],
                                              ] as [string, ReactNode][])),
                                    ]}
                                />
                                <p className="mt-4 text-xs text-muted-foreground">
                                    {p.reference ? t('From the latest application, :ref.', { ref: p.reference }) : t('Entered by staff when the client was added.')}
                                </p>
                            </Panel>
                        </>
                    ) : (
                        <Panel>
                            <p className="text-sm text-muted-foreground">{t('This client has not applied yet.')}</p>
                        </Panel>
                    )}
                </aside>
            </div>
        </>
    );
}

ClientShow.layout = portalLayout;
