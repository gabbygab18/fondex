import { Head, Link } from '@inertiajs/react';
import { COUNTRY_OPTIONS, DataTable, Filters, PageHeader, Pager, FREQ_LABELS } from '@/components/admin';
import { buttonVariants } from '@/components/glint/button';
import { StatusBadge } from '@/components/StatusBadge';
import { Icon } from '@/icons/icon';
import { portalLayout } from '@/Layouts/PortalLayout';
import { date, money } from '@/lib/format';
import { useLocale, useT } from '@/lib/i18n';
import type { Loan, Paginated } from '@/types';

export default function LoansIndex({ loans, filters }: { loans: Paginated<Loan>; filters: Record<string, string> }) {
    const t = useT();
    const locale = useLocale();
    const exportUrl = `/admin/reports/export?${new URLSearchParams({ type: 'loans', ...filters })}`;

    return (
        <>
            <Head title={t('Loans')} />
            <PageHeader
                title={t('Loans')}
                subtitle={t('Active and closed loans with their repayment progress.')}
                actions={
                    <a href={exportUrl} className={buttonVariants({ variant: 'outline' })}>
                        <Icon name="download" /> {t('Export CSV')}
                    </a>
                }
            />
            <Filters
                url="/admin/loans"
                filters={filters}
                fields={[
                    { key: 'search', type: 'search', label: t('Search borrower or reference') },
                    { key: 'country', type: 'select', label: t('All countries'), options: COUNTRY_OPTIONS },
                    {
                        key: 'status',
                        type: 'select',
                        label: t('All statuses'),
                        options: [
                            { value: 'active', label: t('Active') },
                            { value: 'overdue', label: t('Overdue') },
                            { value: 'paid', label: t('Paid') },
                            { value: 'defaulted', label: t('Defaulted') },
                        ],
                    },
                    { key: 'from', type: 'date', label: t('Disbursed from') },
                    { key: 'to', type: 'date', label: t('Disbursed to') },
                ]}
            />
            <DataTable
                head={[t('Reference'), t('Borrower'), t('Principal'), t('Installment'), t('Repaid'), t('Disbursed'), t('Status'), '']}
                empty={loans.data.length === 0}
            >
                {loans.data.map((l) => {
                    const pct = Math.round((l.amount_paid / l.total_payable) * 100);
                    return (
                        <tr key={l.id}>
                            <td className="font-medium text-navy">{l.reference}</td>
                            <td>
                                <Link href={`/admin/clients/${l.user?.id}`} className="block font-medium hover:underline">{l.user?.name}</Link>
                                <span className="text-xs text-muted-foreground">{l.country}</span>
                            </td>
                            <td className="whitespace-nowrap tabular-nums">{money(l.principal, l.currency, locale)}</td>
                            <td className="whitespace-nowrap tabular-nums">
                                {money(l.installment_amount, l.currency, locale)}
                                <span className="block text-xs text-muted-foreground">
                                    {l.installment_count} × {t(FREQ_LABELS[l.repayment_frequency]).toLowerCase()} · {l.interest_rate}%
                                </span>
                            </td>
                            <td className="min-w-32">
                                <div className="flex items-center gap-2">
                                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
                                        <div className="h-full rounded-full bg-[#2563eb]" style={{ width: `${pct}%` }} />
                                    </div>
                                    <span className="text-xs tabular-nums text-muted-foreground">{pct}%</span>
                                </div>
                            </td>
                            <td className="whitespace-nowrap">{date(l.disbursed_at, locale)}</td>
                            <td><StatusBadge status={l.status} /></td>
                            <td className="text-right">
                                <Link href={`/admin/loans/${l.id}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                                    {t('Open')}
                                </Link>
                            </td>
                        </tr>
                    );
                })}
            </DataTable>
            <Pager page={loans} url="/admin/loans" filters={filters} />
        </>
    );
}

LoansIndex.layout = portalLayout;
