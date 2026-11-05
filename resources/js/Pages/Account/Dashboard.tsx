import { Head, Link, usePage } from '@inertiajs/react';
import { Progress } from '@/components/glint/progress';
import { PageHeader } from '@/components/admin';
import { PillLink } from '@/components/site';
import { StatusBadge } from '@/components/StatusBadge';
import { Icon } from '@/icons/icon';
import { portalLayout } from '@/Layouts/PortalLayout';
import { date, FREQ_LABEL, money } from '@/lib/format';
import { LOAN_TYPE_LABEL } from '@/lib/labels';
import { useT } from '@/lib/i18n';
import { CreditOffer } from '@/components/Credit';
import type { Application, CreditSummary, Installment, Loan, SharedProps } from '@/types';

interface Props extends SharedProps {
    applications: Application[];
    loans: (Loan & { installments: Installment[] })[];
    credit: CreditSummary;
}

export default function Dashboard() {
    const { applications, loans, auth, locale, credit } = usePage<Props>().props;
    const t = useT();

    return (
        <>
            <Head title={t('My account')} />
            <PageHeader title={t('Hello, :name', { name: auth.user!.name.split(' ')[0] })} subtitle={t('Track your applications, see your repayment schedule and what is due next.')} />

            <div className="grid gap-8">
                <CreditOffer credit={credit} />
                    <div>
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <h2 className="text-2xl font-bold text-navy">{t('My loans')}</h2>
                        </div>
                        {loans.length === 0 ? (
                            <p className="mt-4 rounded-3xl bg-card p-6 text-sm text-muted-foreground shadow-sm">{t('You have no active loans yet.')}</p>
                        ) : (
                            <div className="mt-6 grid gap-5 md:grid-cols-2">
                                {loans.map((l) => {
                                    const next = l.installments[0];
                                    return (
                                        <Link key={l.id} href={`/account/loans/${l.id}`} className="group rounded-3xl bg-gradient-to-br from-[#2563eb] to-navy p-7 shadow-sm text-white transition-transform hover:-translate-y-0.5">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-white/60">{l.reference}</span>
                                                <StatusBadge status={next?.status === 'overdue' ? 'overdue' : l.status} />
                                            </div>
                                            <p className="mt-4 font-display text-3xl font-bold">{money(l.principal, l.currency, locale)}</p>
                                            <p className="mt-1 text-xs text-white/60">
                                                {t(FREQ_LABEL[l.repayment_frequency])} · {t(':n payments', { n: l.installment_count })} · {t(':rate% flat', { rate: l.interest_rate })}
                                            </p>
                                            <Progress className="mt-5 [--foreground:#fff] [--muted-foreground:rgb(255_255_255/0.7)] [--muted:rgb(255_255_255/0.15)] [--primary:#7cc4ff]" value={(l.amount_paid / l.total_payable) * 100} label={t('Repaid')} showValue />
                                            {next && (
                                                <p className="mt-5 flex items-center justify-between rounded-xl bg-white/10 px-4 py-3 text-sm">
                                                    <span className="text-white/70">{t('Next payment :date', { date: date(next.due_date, locale) })}</span>
                                                    <b className="text-azure">{money(next.amount_due - next.amount_paid, l.currency, locale)}</b>
                                                </p>
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div>
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <h2 className="text-2xl font-bold text-navy">{t('My applications')}</h2>
                            {auth.can_apply ? (
                                <PillLink href="/apply" dark>{t('New application')}</PillLink>
                            ) : (
                                <p className="text-sm text-muted-foreground">{t('You can apply again once your current loan is fully paid.')}</p>
                            )}
                        </div>
                        {applications.length === 0 ? (
                            <div className="mt-6 rounded-3xl bg-card p-10 text-center shadow-sm">
                                <Icon name="file-plus" size={40} className="mx-auto text-navy" />
                                <p className="mt-4 font-medium">{t('You have not applied yet.')}</p>
                                <p className="mt-1 text-sm text-muted-foreground">{t('It takes about five minutes.')}</p>
                            </div>
                        ) : (
                            <ul className="mt-6 divide-y divide-border overflow-hidden rounded-3xl bg-card shadow-sm">
                                {applications.map((a) => (
                                    <li key={a.id}>
                                        <Link href={`/account/applications/${a.id}`} className="flex flex-wrap items-center gap-4 p-5 hover:bg-muted/50">
                                            <span className="grid size-11 place-items-center rounded-xl bg-secondary text-navy">
                                                <Icon name="file-text" size={20} />
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className="block font-medium">{t(LOAN_TYPE_LABEL[a.loan_type] ?? a.loan_type)} · {money(a.amount, a.currency, locale)} · {a.term_months === 1 ? t('1 month') : t(':n months', { n: a.term_months })}</span>
                                                <span className="text-xs text-muted-foreground">{a.reference} · {date(a.created_at, locale)}</span>
                                            </span>
                                            <StatusBadge status={a.status} />
                                            <Icon name="chevron-right" size={18} className="text-muted-foreground" />
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
            </div>
        </>
    );
}

Dashboard.layout = portalLayout;
