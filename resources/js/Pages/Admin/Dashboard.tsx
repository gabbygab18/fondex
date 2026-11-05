import { Head, Link } from '@inertiajs/react';
import { DataTable, PageHeader, Panel, Stat } from '@/components/admin';
import { StatusBadge } from '@/components/StatusBadge';
import { portalLayout } from '@/Layouts/PortalLayout';
import { date, money } from '@/lib/format';
import { useLocale, useT } from '@/lib/i18n';
import type { Application, Installment } from '@/types';

interface Props {
    byStatus: Record<string, number>;
    portfolio: { currency: string; loans: number; disbursed: string; collected: string; outstanding: string }[];
    overdue: (Installment & { loan: { id: number; reference: string; currency: string; user_id: number; user: { name: string } } })[];
    trend: { month: string; total: number }[];
    recent: Application[];
}

export default function Dashboard({ byStatus, portfolio, overdue, trend, recent }: Props) {
    const t = useT();
    const locale = useLocale();
    const total = Object.values(byStatus).reduce((a, b) => a + Number(b), 0);
    const peak = Math.max(1, ...trend.map((m) => m.total));

    return (
        <>
            <Head title={t('Dashboard')} />
            <PageHeader title={t('Dashboard')} subtitle={t('Overview of applications and the loan portfolio.')} />

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Stat icon="inbox" label={t('Pending review')} value={Number(byStatus.pending ?? 0) + Number(byStatus.under_review ?? 0)} hint={t(':n applications in total', { n: total })} tone="dark" />
                <Stat icon="badge-check" label={t('Approved')} value={byStatus.approved ?? 0} tone="azure" />
                <Stat icon="x-circle" label={t('Rejected')} value={byStatus.rejected ?? 0} />
                <Stat icon="alert-circle" label={t('Overdue installments')} value={overdue.length >= 8 ? '8+' : overdue.length} />
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
                <Panel title={t('Portfolio by currency')}>
                    {portfolio.length === 0 ? (
                        <p className="text-sm text-muted-foreground">{t('No loans yet.')}</p>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {portfolio.map((p) => {
                                const paid = Number(p.collected);
                                const owed = Number(p.outstanding);
                                const pct = paid + owed ? Math.round((paid / (paid + owed)) * 100) : 0;
                                return (
                                    <div key={p.currency} className="rounded-xl bg-muted/60 p-4">
                                        <div className="flex items-center justify-between">
                                            <span className="font-display text-lg font-bold text-navy">{p.currency}</span>
                                            <span className="text-xs text-muted-foreground">{t(':n loans', { n: p.loans })}</span>
                                        </div>
                                        <dl className="mt-3 grid gap-1.5 text-sm">
                                            <div className="flex justify-between"><dt className="text-muted-foreground">{t('Disbursed')}</dt><dd className="font-medium tabular-nums">{money(Number(p.disbursed), p.currency, locale)}</dd></div>
                                            <div className="flex justify-between"><dt className="text-muted-foreground">{t('Collected')}</dt><dd className="font-medium tabular-nums">{money(paid, p.currency, locale)}</dd></div>
                                            <div className="flex justify-between"><dt className="text-muted-foreground">{t('Outstanding')}</dt><dd className="font-medium tabular-nums">{money(owed, p.currency, locale)}</dd></div>
                                        </dl>
                                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-border" role="img" aria-label={t(':n% collected', { n: pct })}>
                                            <div className="h-full rounded-full bg-[#2563eb]" style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Panel>

                <Panel title={t('Applications, last 6 months')}>
                    <div className="flex h-44 items-end gap-3">
                        {trend.map((m) => (
                            <div key={m.month} className="flex flex-1 flex-col items-center gap-2">
                                <span className="text-xs font-semibold tabular-nums">{m.total}</span>
                                <div className="w-full rounded-t-lg bg-navy" style={{ height: `${(m.total / peak) * 120 + 4}px` }} />
                                <span className="text-[11px] text-muted-foreground">
                                    {new Date(`${m.month}-01T00:00:00`).toLocaleDateString(locale === 'en' ? 'en-US' : 'es-CO', { month: 'short' })}
                                </span>
                            </div>
                        ))}
                    </div>
                </Panel>
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-2">
                <div>
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="font-display text-lg font-bold text-navy">{t('Latest applications')}</h2>
                        <Link href="/admin/applications" className="text-sm font-medium text-[#2563eb] hover:underline">{t('View all')}</Link>
                    </div>
                    <DataTable head={[t('Reference'), t('Applicant'), t('Amount'), t('Status')]} empty={recent.length === 0}>
                        {recent.map((a) => (
                            <tr key={a.id}>
                                <td><Link href={`/admin/applications/${a.id}`} className="font-medium text-navy hover:underline">{a.reference}</Link></td>
                                <td>{a.user?.name}</td>
                                <td className="whitespace-nowrap tabular-nums">{money(a.amount, a.currency, locale)}</td>
                                <td><StatusBadge status={a.status} /></td>
                            </tr>
                        ))}
                    </DataTable>
                </div>
                <div>
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="font-display text-lg font-bold text-navy">{t('Overdue installments')}</h2>
                        <Link href="/admin/loans?status=overdue" className="text-sm font-medium text-[#2563eb] hover:underline">{t('View all')}</Link>
                    </div>
                    <DataTable head={[t('Loan'), t('Borrower'), t('Due'), t('Owed')]} empty={overdue.length === 0}>
                        {overdue.map((i) => (
                            <tr key={i.id}>
                                <td><Link href={`/admin/loans/${i.loan.id}`} className="font-medium text-navy hover:underline">{i.loan.reference}</Link> <span className="text-xs text-muted-foreground">#{i.number}</span></td>
                                <td>
                                    <Link href={`/admin/clients/${i.loan.user_id}`} className="hover:underline">{i.loan.user?.name}</Link>
                                </td>
                                <td className="whitespace-nowrap text-destructive">{date(i.due_date, locale)}</td>
                                <td className="whitespace-nowrap tabular-nums">{money(i.amount_due - i.amount_paid, i.loan.currency, locale)}</td>
                            </tr>
                        ))}
                    </DataTable>
                </div>
            </div>
        </>
    );
}

Dashboard.layout = portalLayout;
