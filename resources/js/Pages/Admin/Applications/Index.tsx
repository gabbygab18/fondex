import { Head, Link } from '@inertiajs/react';
import { buttonVariants } from '@/components/glint/button';
import { COUNTRY_OPTIONS, DataTable, Filters, PageHeader, Pager } from '@/components/admin';
import { StatusBadge } from '@/components/StatusBadge';
import { Icon } from '@/icons/icon';
import { portalLayout } from '@/Layouts/PortalLayout';
import { date, money } from '@/lib/format';
import { useLocale, useT } from '@/lib/i18n';
import type { Application, Paginated } from '@/types';

export default function ApplicationsIndex({ applications, filters }: { applications: Paginated<Application>; filters: Record<string, string> }) {
    const t = useT();
    const locale = useLocale();
    const exportUrl = `/admin/reports/export?${new URLSearchParams({ type: 'applications', ...filters })}`;

    return (
        <>
            <Head title={t('Applications')} />
            <PageHeader
                title={t('Applications')}
                subtitle={t('Review, approve or reject loan applications.')}
                actions={
                    <a href={exportUrl} className={buttonVariants({ variant: 'outline' })}>
                        <Icon name="download" /> {t('Export CSV')}
                    </a>
                }
            />
            <Filters
                url="/admin/applications"
                filters={filters}
                fields={[
                    { key: 'search', type: 'search', label: t('Search name, email, ID or reference') },
                    { key: 'country', type: 'select', label: t('All countries'), options: COUNTRY_OPTIONS },
                    {
                        key: 'status',
                        type: 'select',
                        label: t('All statuses'),
                        options: [
                            { value: 'pending', label: t('Pending') },
                            { value: 'under_review', label: t('Under review') },
                            { value: 'approved', label: t('Approved') },
                            { value: 'rejected', label: t('Rejected') },
                        ],
                    },
                    { key: 'from', type: 'date', label: t('From') },
                    { key: 'to', type: 'date', label: t('To') },
                ]}
            />
            <DataTable
                head={[t('Reference'), t('Applicant'), t('Country'), t('Amount'), t('Term'), t('Submitted'), t('Status'), '']}
                empty={applications.data.length === 0}
            >
                {applications.data.map((a) => (
                    <tr key={a.id}>
                        <td className="font-medium text-navy">{a.reference}</td>
                        <td>
                            <span className="block font-medium">{a.user?.name}</span>
                            <span className="text-xs text-muted-foreground">{a.user?.email}</span>
                        </td>
                        <td>{a.country}</td>
                        <td className="whitespace-nowrap tabular-nums">{money(a.amount, a.currency, locale)}</td>
                        <td className="whitespace-nowrap">{t(':n months', { n: a.term_months })}</td>
                        <td className="whitespace-nowrap">{date(a.created_at, locale)}</td>
                        <td><StatusBadge status={a.status} /></td>
                        <td className="text-right">
                            <Link href={`/admin/applications/${a.id}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                                {t('Open')}
                            </Link>
                        </td>
                    </tr>
                ))}
            </DataTable>
            <Pager page={applications} url="/admin/applications" filters={filters} />
        </>
    );
}

ApplicationsIndex.layout = portalLayout;
