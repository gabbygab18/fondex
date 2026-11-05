import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { COUNTRY_OPTIONS, DataTable, PageHeader, Panel } from '@/components/admin';
import { buttonVariants } from '@/components/glint/button';
import { Label } from '@/components/glint/label';
import { Select } from '@/components/glint/select';
import { StatusBadge } from '@/components/StatusBadge';
import { Icon } from '@/icons/icon';
import { portalLayout } from '@/Layouts/PortalLayout';
import { money } from '@/lib/format';
import { useLocale, useT } from '@/lib/i18n';

interface Props {
    byCountry: { country: string; status: string; total: number; amount: string }[];
    collections: { currency: string; ym: string; total: string }[];
}

const CURRENCY: Record<string, string> = { AR: 'ARS', CO: 'COP' };

export default function Reports({ byCountry, collections }: Props) {
    const t = useT();
    const locale = useLocale();
    const [exp, setExp] = useState({ type: 'applications', country: '', from: '', to: '' });
    const href = `/admin/reports/export?${new URLSearchParams(Object.fromEntries(Object.entries(exp).filter(([, v]) => v)))}`;

    const currencies = [...new Set(collections.map((c) => c.currency))];
    const monthLabel = (ym: string) => new Date(`${ym}-01T00:00:00`).toLocaleDateString(locale === 'en' ? 'en-US' : 'es-CO', { month: 'short', year: '2-digit' });

    return (
        <>
            <Head title={t('Reports')} />
            <PageHeader title={t('Reports')} subtitle={t('Portfolio figures and spreadsheet exports.')} />

            <Panel title={t('Export data')} className="mb-6">
                <div className="flex flex-wrap items-end gap-4">
                    <div className="w-52">
                        <Label htmlFor="exp-type">{t('Data')}</Label>
                        <div className="mt-1.5">
                            <Select
                                id="exp-type"
                                value={exp.type}
                                onValueChange={(type) => setExp({ ...exp, type })}
                                options={[
                                    { value: 'applications', label: t('Applications') },
                                    { value: 'loans', label: t('Loans') },
                                    { value: 'payments', label: t('Payments') },
                                ]}
                            />
                        </div>
                    </div>
                    <div className="w-44">
                        <Label htmlFor="exp-country">{t('Country')}</Label>
                        <div className="mt-1.5">
                            <Select id="exp-country" value={exp.country} onValueChange={(country) => setExp({ ...exp, country })} options={[{ value: '', label: t('All countries') }, ...COUNTRY_OPTIONS]} />
                        </div>
                    </div>
                    {(['from', 'to'] as const).map((k) => (
                        <label key={k} className="grid gap-1.5 text-sm font-medium text-foreground/85">
                            {k === 'from' ? t('From') : t('To')}
                            <input
                                type="date"
                                value={exp[k]}
                                onChange={(e) => setExp({ ...exp, [k]: e.target.value })}
                                className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-normal"
                            />
                        </label>
                    ))}
                    <a href={href} className={buttonVariants()}>
                        <Icon name="download" /> {t('Download CSV')}
                    </a>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">{t('CSV files open directly in Excel and Google Sheets.')}</p>
            </Panel>

            <div className="grid gap-6 xl:grid-cols-2">
                <div>
                    <h2 className="mb-3 font-display text-lg font-bold text-navy">{t('Applications by country')}</h2>
                    <DataTable head={[t('Country'), t('Status'), t('Count'), t('Requested')]} empty={byCountry.length === 0}>
                        {byCountry.map((r) => (
                            <tr key={`${r.country}-${r.status}`}>
                                <td className="font-medium">{r.country === 'AR' ? 'Argentina' : 'Colombia'}</td>
                                <td><StatusBadge status={r.status} /></td>
                                <td className="tabular-nums">{r.total}</td>
                                <td className="whitespace-nowrap tabular-nums">{money(Number(r.amount), CURRENCY[r.country] ?? 'USD', locale)}</td>
                            </tr>
                        ))}
                    </DataTable>
                </div>

                <Panel title={t('Collections, last 6 months')}>
                    {currencies.length === 0 && <p className="text-sm text-muted-foreground">{t('No payments recorded yet.')}</p>}
                    <div className="grid gap-6">
                        {currencies.map((cur) => {
                            const rows = collections.filter((c) => c.currency === cur);
                            const peak = Math.max(1, ...rows.map((r) => Number(r.total)));
                            return (
                                <div key={cur}>
                                    <p className="mb-2 text-sm font-semibold text-navy">{cur}</p>
                                    <ul className="grid gap-2">
                                        {rows.map((r) => (
                                            <li key={r.ym} className="grid grid-cols-[4rem_1fr_auto] items-center gap-3 text-sm">
                                                <span className="text-muted-foreground">{monthLabel(r.ym)}</span>
                                                <span className="h-3 overflow-hidden rounded-full bg-muted">
                                                    <span className="block h-full rounded-full bg-[#2563eb]" style={{ width: `${(Number(r.total) / peak) * 100}%` }} />
                                                </span>
                                                <span className="tabular-nums">{money(Number(r.total), cur, locale)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            );
                        })}
                    </div>
                </Panel>
            </div>
        </>
    );
}

Reports.layout = portalLayout;
