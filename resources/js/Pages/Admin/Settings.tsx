import { Head, useForm } from '@inertiajs/react';
import { PageHeader, Panel } from '@/components/admin';
import { Button } from '@/components/glint/button';
import { Checkbox } from '@/components/glint/checkbox';
import { Input } from '@/components/glint/input';
import { Select } from '@/components/glint/select';
import { Label } from '@/components/glint/label';
import { Icon } from '@/icons/icon';
import { portalLayout } from '@/Layouts/PortalLayout';
import { money, RATES } from '@/lib/format';
import { useLocale, useT } from '@/lib/i18n';
import { downloadQr, QrCode, ShareButtons } from '@/components/QrShare';
import type { Country } from '@/types';

function CountryForm({ setting }: { setting: Country }) {
    const t = useT();
    const locale = useLocale();
    const form = useForm({
        min_amount: String(setting.min_amount),
        max_amount: String(setting.max_amount),
        starting_limit: String(setting.starting_limit ?? setting.max_amount),
        limit_increase_pct: String(setting.limit_increase_pct),
        min_term: String(setting.min_term),
        max_term: String(setting.max_term),
        is_active: setting.is_active,
    });
    // Terms are 1 to 12 months.
    const term = (key: 'min_term' | 'max_term', label: string) => (
        <div>
            <Label htmlFor={`${setting.code}-${key}`}>{label}</Label>
            <div className="mt-1.5">
                <Select
                    id={`${setting.code}-${key}`}
                    options={Array.from({ length: 12 }, (_, i) => i + 1).map((n) => ({ value: String(n), label: n === 1 ? t('1 month') : t(':n months', { n }) }))}
                    value={form.data[key]}
                    onValueChange={(v) => form.setData(key, v)}
                />
            </div>
            {form.errors[key] && <p className="mt-1.5 text-xs text-destructive">{form.errors[key]}</p>}
        </div>
    );
    const field = (key: 'min_amount' | 'max_amount' | 'starting_limit' | 'limit_increase_pct', label: string, hint?: string) => (
        <div>
            <Label htmlFor={`${setting.code}-${key}`} hint={hint}>{label}</Label>
            <Input
                id={`${setting.code}-${key}`}
                className="mt-1.5"
                type="number"
                step="1"
                min="0"
                required
                value={form.data[key]}
                onChange={(e) => form.setData(key, e.target.value)}
                error={form.errors[key]}
            />
        </div>
    );

    return (
        <Panel title={`${setting.name} · ${setting.currency}`}>
            <form
                className="grid gap-4"
                onSubmit={(e) => {
                    e.preventDefault();
                    form.put(`/admin/settings/${setting.id}`, { preserveScroll: true });
                }}
            >
                <div className="grid gap-4 sm:grid-cols-2">
                    {field('min_amount', t('Minimum amount'), money(Number(form.data.min_amount) || 0, setting.currency, locale))}
                    {field('max_amount', t('Maximum amount'), money(Number(form.data.max_amount) || 0, setting.currency, locale))}
                    {term('min_term', t('Minimum term (months)'))}
                    {term('max_term', t('Maximum term (months)'))}
                </div>
                <div className="grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
                    <p className="text-sm text-muted-foreground sm:col-span-2">
                        {t('Client limits: new clients can borrow up to the starting limit. Each time a good payer (score 75+, nothing overdue) pays off a loan, their limit rises to that loan plus the increase, up to the maximum amount.')}
                    </p>
                    {field('starting_limit', t('Starting limit for new clients'), money(Number(form.data.starting_limit) || 0, setting.currency, locale))}
                    {field('limit_increase_pct', t('Increase for good payers (%)'), `+${Number(form.data.limit_increase_pct) || 0}%`)}
                </div>
                <Checkbox
                    checked={form.data.is_active}
                    onChange={(e) => form.setData('is_active', e.target.checked)}
                    label={t('Accept applications from this country')}
                    description={t('When off, the country is hidden from the calculator and application form.')}
                />
                <div>
                    <Button type="submit" loading={form.processing} disabled={!form.isDirty}>
                        {t('Save changes')}
                    </Button>
                </div>
            </form>
        </Panel>
    );
}

/** QR code that opens the application form: for flyers, the office counter or social posts. */
function ApplyQr() {
    const t = useT();
    const url = `${window.location.origin}/apply`;
    return (
        <Panel title={t('QR code to apply')} className="mt-6">
            <div className="grid items-center gap-6 md:grid-cols-[auto_1fr]">
                <QrCode value={url} label={t('QR code to apply')} className="size-44 p-1 ring-1 ring-border" />
                <div>
                    <p className="text-sm text-muted-foreground">
                        {t('Scanning it opens the loan application. Print it on flyers or post it on social media. New visitors are asked to create an account first.')}
                    </p>
                    <p className="mt-3 break-all font-mono text-sm">{url}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                        <Button type="button" onClick={() => downloadQr(url, 'fondex-qr-apply.png')} startIcon={<Icon name="download" />}>
                            {t('Download QR (PNG)')}
                        </Button>
                        <ShareButtons url={url} text={t('Apply for a Fondex loan here:')} />
                    </div>
                </div>
            </div>
        </Panel>
    );
}

export default function Settings({ settings }: { settings: Country[] }) {
    const t = useT();
    return (
        <>
            <Head title={t('Settings')} />
            <PageHeader title={t('Settings')} subtitle={t('Loan limits and terms per country.')} />
            <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl bg-secondary p-4 text-sm text-navy">
                <Icon name="percent" size={20} />
                <span>{t('Interest is a flat rate chosen per loan when approving:')}</span>
                {RATES.map((r) => (
                    <span key={r} className="rounded-full bg-card px-3 py-1 font-semibold">{r}%</span>
                ))}
            </div>
            <div className="grid gap-6 xl:grid-cols-2">
                {settings.map((s) => (
                    <CountryForm key={s.id} setting={s} />
                ))}
            </div>
            <ApplyQr />
        </>
    );
}

Settings.layout = portalLayout;
