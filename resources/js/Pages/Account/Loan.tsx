import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { METHOD_LABELS } from '@/components/admin';
import { Button } from '@/components/glint/button';
import { Progress } from '@/components/glint/progress';
import { useToast } from '@/components/glint/toast';
import { PageHeader } from '@/components/admin';
import { StatusBadge } from '@/components/StatusBadge';
import { WhatsApp } from '@/icons/boxicons';
import { Icon } from '@/icons/icon';
import { portalLayout } from '@/Layouts/PortalLayout';
import { date, FREQ_LABEL, money, PAYMENT_LABEL } from '@/lib/format';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { CreditOffer } from '@/components/Credit';
import type { CreditSummary, Loan as L, SharedProps } from '@/types';

export default function Loan() {
    const { loan, locale, app, credit } = usePage<SharedProps & { loan: L; credit: CreditSummary }>().props;
    const t = useT();
    const fmt = (v: number) => money(v, loan.currency, locale);
    const installments = loan.installments ?? [];
    const next = installments.find((i) => i.status !== 'paid');
    const outstanding = loan.total_payable - loan.amount_paid;
    const nextDue = next ? next.amount_due - next.amount_paid : 0;
    const { toast } = useToast();
    const [paying, setPaying] = useState<'next' | 'full' | null>(null);

    // Back from the payment page: Stripe/sandbox send ?payment=success|cancelled.
    useEffect(() => {
        const result = new URLSearchParams(window.location.search).get('payment');
        if (result === 'success') toast({ title: t('Payment received. It can take a minute to show here.'), variant: 'success' });
        if (result === 'cancelled') toast({ title: t('Payment cancelled. Nothing was charged.'), variant: 'warning' });
    }, []);

    const pay = (what: 'next' | 'full') => {
        setPaying(what);
        router.post(`/account/loans/${loan.id}/pay`, { pay: what }, { onFinish: () => setPaying(null) });
    };

    return (
        <>
            <Head title={loan.reference} />
            <PageHeader title={fmt(loan.principal)} subtitle={<>{loan.reference} · {loan.term_months === 1 ? t('1 month') : t(':n months', { n: loan.term_months })} · {t(FREQ_LABEL[loan.repayment_frequency])} · {t(':rate% flat', { rate: loan.interest_rate })} ·{' '}
                {t('Disbursed :date', { date: date(loan.disbursed_at, locale) })}</>} />
            <div className="grid gap-6">
                    <div className="grid gap-5 md:grid-cols-4">
                        {[
                            [t(PAYMENT_LABEL[loan.repayment_frequency]), fmt(loan.installment_amount), 'calendar'],
                            [t('Paid so far'), fmt(loan.amount_paid), 'check-circle'],
                            [t('Outstanding'), fmt(outstanding), 'wallet'],
                            [t('Next payment'), next ? date(next.due_date, locale) : '—', 'clock'],
                        ].map(([k, v, icon]) => (
                            <div key={k} className="rounded-3xl bg-card p-6 shadow-sm">
                                <Icon name={icon} size={22} className="text-[#2563eb]" />
                                <p className="mt-4 text-sm text-muted-foreground">{k}</p>
                                <p className="mt-1 font-display text-2xl font-bold text-navy">{v}</p>
                            </div>
                        ))}
                    </div>
                    <CreditOffer credit={credit} />

                    {loan.status === 'active' && outstanding > 0 && (
                        <div className="relative overflow-hidden rounded-[24px] bg-navy p-7 text-white">
                            <span aria-hidden className="absolute -right-16 -top-16 size-56 rounded-full bg-azure/20 blur-3xl" />
                            <div className="relative flex flex-wrap items-center justify-between gap-6">
                                <div>
                                    <h2 className="text-xl font-bold">{t('Pay now')}</h2>
                                    <p className="mt-1 text-sm text-white/70">
                                        {next && t('Next payment of :amount due :date', { amount: fmt(nextDue), date: date(next.due_date, locale) })}
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    <Button size="lg" onClick={() => pay('next')} loading={paying === 'next'} disabled={paying !== null} className="rounded-full bg-azure text-navy hover:bg-azure/90">
                                        {t('Pay :amount', { amount: fmt(nextDue) })}
                                    </Button>
                                    <Button size="lg" variant="outline" onClick={() => pay('full')} loading={paying === 'full'} disabled={paying !== null} className="rounded-full border-white/30 bg-transparent text-white hover:bg-white/10">
                                        {t('Pay off :amount', { amount: fmt(outstanding) })}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="rounded-3xl bg-card p-7 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <h2 className="text-xl font-bold text-navy">{t('Repayment schedule')}</h2>
                            <StatusBadge status={loan.status} />
                        </div>
                        <Progress className="mt-5" value={(loan.amount_paid / loan.total_payable) * 100} label={t('Repaid')} showValue />
                        <div className="mt-6 overflow-x-auto">
                            <table className="w-full min-w-[40rem] text-sm">
                                <thead>
                                    <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                                        <th className="py-3 pe-4 font-medium">#</th>
                                        <th className="py-3 pe-4 font-medium">{t('Due date')}</th>
                                        <th className="py-3 pe-4 text-right font-medium">{t('Principal')}</th>
                                        <th className="py-3 pe-4 text-right font-medium">{t('Interest')}</th>
                                        <th className="py-3 pe-4 text-right font-medium">{t('Installment')}</th>
                                        <th className="py-3 pe-4 text-right font-medium">{t('Paid')}</th>
                                        <th className="py-3 font-medium">{t('Status')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {installments.map((i) => (
                                        <tr key={i.id} className={cn('border-b border-border last:border-0', i.id === next?.id && 'bg-secondary/60')}>
                                            <td className="py-3 pe-4 text-muted-foreground">{i.number}</td>
                                            <td className="py-3 pe-4">{date(i.due_date, locale)}</td>
                                            <td className="py-3 pe-4 text-right tabular-nums">{fmt(i.principal)}</td>
                                            <td className="py-3 pe-4 text-right tabular-nums">{fmt(i.interest)}</td>
                                            <td className="py-3 pe-4 text-right font-semibold tabular-nums">{fmt(i.amount_due)}</td>
                                            <td className="py-3 pe-4 text-right tabular-nums">{fmt(i.amount_paid)}</td>
                                            <td className="py-3"><StatusBadge status={i.status} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-[1fr_1fr]">
                        <div className="rounded-3xl bg-card p-7 shadow-sm">
                            <h2 className="text-xl font-bold text-navy">{t('Payment history')}</h2>
                            {loan.payments?.length ? (
                                <ul className="mt-4 divide-y divide-border">
                                    {loan.payments.map((p) => (
                                        <li key={p.id} className="flex items-center justify-between py-3 text-sm">
                                            <span>
                                                <span className="block font-medium">{date(p.paid_on, locale)}</span>
                                                <span className="text-xs text-muted-foreground">{t(METHOD_LABELS[p.method] ?? p.method)}{p.reference && ` · ${p.reference}`}</span>
                                            </span>
                                            <b className="tabular-nums">{fmt(p.amount)}</b>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="mt-4 text-sm text-muted-foreground">{t('No payments recorded yet.')}</p>
                            )}
                        </div>
                        <div className="rounded-[24px] bg-navy p-7 text-white">
                            <h2 className="text-xl font-bold">{t('Paid another way?')}</h2>
                            <p className="mt-3 text-sm text-white/70">
                                {t('Pay by bank transfer or at any authorized payment point, then send us your receipt on WhatsApp with your loan reference :ref.', { ref: loan.reference })}
                            </p>
                            {app.whatsapp && (
                                <a
                                    href={`https://wa.me/${app.whatsapp}?text=${encodeURIComponent(loan.reference)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-6 inline-flex items-center gap-2 rounded-full bg-azure px-5 py-3 text-sm font-semibold text-navy"
                                >
                                    <WhatsApp size={18} /> {t('Send receipt on WhatsApp')}
                                </a>
                            )}
                            <Link href="/account" className="mt-6 flex items-center gap-2 text-sm text-azure hover:underline">
                                <Icon name="arrow-left" size={16} /> {t('Back to my account')}
                            </Link>
                        </div>
                    </div>
            </div>
        </>
    );
}

Loan.layout = portalLayout;
