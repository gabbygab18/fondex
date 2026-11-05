import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { DataTable, DateInput, FREQ_LABELS, METHOD_LABELS, PageHeader, Panel, Stat, waLink } from '@/components/admin';
import { Button } from '@/components/glint/button';
import { Input } from '@/components/glint/input';
import { Label } from '@/components/glint/label';
import { Progress } from '@/components/glint/progress';
import { Select } from '@/components/glint/select';
import { StatusBadge } from '@/components/StatusBadge';
import { WhatsApp } from '@/icons/boxicons';
import { Icon } from '@/icons/icon';
import { portalLayout } from '@/Layouts/PortalLayout';
import { date, money } from '@/lib/format';
import { useLocale, useT } from '@/lib/i18n';
import type { Loan } from '@/types';

export default function LoanShow({ loan, methods }: { loan: Loan; methods: string[] }) {
    const t = useT();
    const locale = useLocale();
    const fmt = (v: number) => money(v, loan.currency, locale);
    const outstanding = Math.round((loan.total_payable - loan.amount_paid) * 100) / 100;
    const next = loan.installments?.find((i) => i.amount_paid < i.amount_due);
    const overdue = loan.installments?.filter((i) => i.status === 'overdue') ?? [];

    const today = new Date().toLocaleDateString('en-CA');
    const [reminding, setReminding] = useState(false);
    const nextAmount = next ? fmt(next.amount_due - next.amount_paid) : '';
    const nextDate = next ? date(next.due_date, 'es') : '';
    // Bilingual so staff don't have to pick the borrower's language.
    const waText = next
        ? `Hola ${loan.user?.name ?? ''}, te recordamos tu cuota de ${nextAmount} del préstamo ${loan.reference}, con vencimiento el ${nextDate}. / Hi ${loan.user?.name ?? ''}, a reminder that your ${nextAmount} installment for loan ${loan.reference} is due on ${date(next.due_date, 'en')}. Fondex`
        : '';
    const form = useForm({ amount: next ? String(Math.round((next.amount_due - next.amount_paid) * 100) / 100) : '', paid_on: today, method: methods[0] ?? 'cash', reference: '' });
    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(`/admin/loans/${loan.id}/payments`, { preserveScroll: true, onSuccess: () => form.reset('reference') });
    };

    return (
        <>
            <Head title={loan.reference} />
            <Link href="/admin/loans" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                <Icon name="arrow-left" size={16} /> {t('All loans')}
            </Link>
            <PageHeader
                title={
                    <span className="flex flex-wrap items-center gap-3">
                        {loan.reference} <StatusBadge status={loan.status} />
                        {overdue.length > 0 && <StatusBadge status="overdue" />}
                    </span>
                }
                subtitle={
                    <>
                        <Link href={`/admin/clients/${loan.user?.id}`} className="font-medium text-[#2563eb] hover:underline">
                            {loan.user?.name}
                        </Link>{' '}
                        · {loan.user?.email} · {loan.user?.phone}
                        {loan.application && (
                            <>
                                {' · '}
                                <Link href={`/admin/applications/${loan.application.id}`} className="text-[#2563eb] hover:underline">
                                    {loan.application.reference}
                                </Link>
                                {loan.application.disbursement_method === 'cash_pickup' && (
                                    <span className="ms-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                                        <Icon name="banknote" size={13} /> {t('Cash pick-up')}
                                    </span>
                                )}
                            </>
                        )}
                    </>
                }
            />

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Stat icon="banknote" label={t('Principal')} value={fmt(loan.principal)} hint={t(':rate% flat · :n months', { rate: loan.interest_rate, n: loan.term_months })} tone="dark" />
                <Stat
                    icon="calendar"
                    label={t('Installment')}
                    value={fmt(loan.installment_amount)}
                    hint={`${loan.installment_count} × ${t(FREQ_LABELS[loan.repayment_frequency]).toLowerCase()} · ${t('Disbursed :date', { date: date(loan.disbursed_at, locale) })}`}
                />
                <Stat icon="wallet" label={t('Paid so far')} value={fmt(loan.amount_paid)} hint={t('of :total', { total: fmt(loan.total_payable) })} tone="azure" />
                <Stat icon="hourglass" label={t('Outstanding')} value={fmt(outstanding)} hint={next ? t('Next due :date', { date: date(next.due_date, locale) }) : t('Fully repaid')} />
            </div>

            <div className="mt-4 rounded-3xl bg-card p-5 shadow-sm">
                <Progress value={loan.amount_paid} max={loan.total_payable} label={t('Repayment progress')} />
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
                <div className="grid content-start gap-6">
                    <div>
                        <h2 className="mb-3 font-display text-lg font-bold text-navy">{t('Repayment schedule')}</h2>
                        <DataTable head={['#', t('Due date'), t('Principal'), t('Interest'), t('Installment'), t('Paid'), t('Status')]}>
                            {loan.installments?.map((i) => (
                                <tr key={i.id}>
                                    <td className="text-muted-foreground">{i.number}</td>
                                    <td className="whitespace-nowrap">{date(i.due_date, locale)}</td>
                                    <td className="whitespace-nowrap tabular-nums">{fmt(i.principal)}</td>
                                    <td className="whitespace-nowrap tabular-nums">{fmt(i.interest)}</td>
                                    <td className="whitespace-nowrap font-medium tabular-nums">{fmt(i.amount_due)}</td>
                                    <td className="whitespace-nowrap tabular-nums">{fmt(i.amount_paid)}</td>
                                    <td><StatusBadge status={i.status} /></td>
                                </tr>
                            ))}
                        </DataTable>
                    </div>
                    <div>
                        <h2 className="mb-3 font-display text-lg font-bold text-navy">{t('Payment history')}</h2>
                        <DataTable head={[t('Date'), t('Amount'), t('Method'), t('Reference'), t('Recorded by')]} empty={!loan.payments?.length}>
                            {loan.payments?.map((p) => (
                                <tr key={p.id}>
                                    <td className="whitespace-nowrap">{date(p.paid_on, locale)}</td>
                                    <td className="whitespace-nowrap font-medium tabular-nums">{fmt(p.amount)}</td>
                                    <td>{t(METHOD_LABELS[p.method] ?? p.method)}</td>
                                    <td className="text-muted-foreground">{p.reference ?? '—'}</td>
                                    <td className="text-muted-foreground">{p.recorder?.name ?? '—'}</td>
                                </tr>
                            ))}
                        </DataTable>
                    </div>
                </div>

                <aside className="grid content-start gap-6">
                    {next && (
                        <Panel title={t('Reminders')}>
                            <p className="text-sm text-muted-foreground">
                                {t('Next installment: :amount due :date', { amount: nextAmount, date: date(next.due_date, locale) })}
                            </p>
                            {next.reminded_on && <p className="mt-1 text-xs text-muted-foreground">{t('Last reminder sent :date', { date: date(next.reminded_on, locale) })}</p>}
                            <div className="mt-4 grid gap-2">
                                <Button
                                    loading={reminding}
                                    startIcon={<Icon name="mail" />}
                                    onClick={() => router.post(`/admin/loans/${loan.id}/remind`, {}, { preserveScroll: true, onStart: () => setReminding(true), onFinish: () => setReminding(false) })}
                                >
                                    {t('Send email + SMS reminder')}
                                </Button>
                                {loan.user?.phone && (
                                    <a href={waLink(loan.user.phone, waText)} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#25d366] px-4 text-sm font-medium text-white hover:bg-[#1fb957]">
                                        <WhatsApp size={18} /> {t('WhatsApp reminder')}
                                    </a>
                                )}
                            </div>
                            <p className="mt-3 text-xs text-muted-foreground">{t('Automatic reminders also go out every morning before and after due dates.')}</p>
                        </Panel>
                    )}
                    <Panel title={t('Record payment')}>
                        {loan.status === 'paid' ? (
                            <p className="text-sm text-muted-foreground">{t('This loan is fully repaid.')}</p>
                        ) : (
                            <form onSubmit={submit} className="grid gap-4">
                                <div>
                                    <Label htmlFor="amount" required hint={t('Max :amount', { amount: fmt(outstanding) })}>
                                        {t('Amount')} ({loan.currency})
                                    </Label>
                                    <Input
                                        id="amount"
                                        className="mt-1.5"
                                        type="number"
                                        inputMode="decimal"
                                        step="0.01"
                                        min="0.01"
                                        max={outstanding}
                                        required
                                        value={form.data.amount}
                                        onChange={(e) => form.setData('amount', e.target.value)}
                                        error={form.errors.amount}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="paid_on" required>{t('Payment date')}</Label>
                                    <DateInput
                                        id="paid_on"
                                        className="mt-1.5"
                                        max={today}
                                        required
                                        value={form.data.paid_on}
                                        onChange={(e) => form.setData('paid_on', e.target.value)}
                                        error={form.errors.paid_on}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="method" required>{t('Method')}</Label>
                                    <div className="mt-1.5">
                                        <Select
                                            id="method"
                                            options={methods.map((m) => ({ value: m, label: t(METHOD_LABELS[m] ?? m) }))}
                                            value={form.data.method}
                                            onValueChange={(v) => form.setData('method', v)}
                                        />
                                    </div>
                                    {form.errors.method && <p className="mt-1.5 text-xs text-destructive">{form.errors.method}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="reference" optional>{t('Reference / receipt no.')}</Label>
                                    <Input
                                        id="reference"
                                        className="mt-1.5"
                                        value={form.data.reference}
                                        onChange={(e) => form.setData('reference', e.target.value)}
                                        error={form.errors.reference}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">{t('Payments are applied to the oldest unpaid installments first.')}</p>
                                <Button type="submit" loading={form.processing} startIcon={<Icon name="plus-circle" />}>
                                    {t('Record payment')}
                                </Button>
                            </form>
                        )}
                    </Panel>
                </aside>
            </div>
        </>
    );
}

LoanShow.layout = portalLayout;
