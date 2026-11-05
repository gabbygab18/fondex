import { Head, Link, useForm } from '@inertiajs/react';
import { useState, type FormEvent, type ReactNode } from 'react';
import { COUNTRY_NAMES, COUNTRY_OPTIONS, CURRENCY_OF, DataTable, EMPLOYMENT_LABELS, Filters, GENDER_LABELS, ID_TYPE_LABELS, MARITAL_LABELS, PageHeader, Pager, Textarea } from '@/components/admin';
import { DISBURSEMENT_LABEL } from '@/lib/labels';
import { Button } from '@/components/glint/button';
import { Checkbox } from '@/components/glint/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/glint/dialog';
import { Input } from '@/components/glint/input';
import { Label } from '@/components/glint/label';
import { Select } from '@/components/glint/select';
import { CreditScore } from '@/components/Credit';
import { StatusBadge } from '@/components/StatusBadge';
import { Icon } from '@/icons/icon';
import { portalLayout } from '@/Layouts/PortalLayout';
import { date, money } from '@/lib/format';
import { useLocale, useT } from '@/lib/i18n';
import type { CreditSummary, Paginated, User } from '@/types';

type Client = User & {
    phone: string | null;
    created_at: string;
    applications_count: number;
    loans_count: number;
    active_loans_count: number;
    is_overdue: boolean;
    outstanding: number | string;
    credit: CreditSummary;
};

const EMPTY = {
    name: '', email: '', phone: '', country: 'AR', address: '', city: '', invite: true,
    date_of_birth: '', gender: '', marital_status: '',
    employment_status: '', employer_name: '', occupation: '', employment_length: '',
    monthly_income: '', other_income: '', monthly_expenses: '', existing_debts: '',
    id_type: '', id_number: '', id_issuing_country: '', id_expiry: '',
    disbursement_method: '', bank_name: '', account_holder: '', account_type: '', account_number: '',
    notes: '',
};
type ClientForm = typeof EMPTY;
type TextKey = Exclude<keyof ClientForm, 'invite'>;

/**
 * Add an existing client without them registering; optionally email them a link to set their password.
 * Name, email, phone, country and address are required; everything an application asks for can be added too.
 */
function AddClient() {
    const t = useT();
    const [open, setOpen] = useState(false);
    const form = useForm<ClientForm>(EMPTY);
    const d = form.data;
    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.post('/admin/clients', { onSuccess: () => (form.reset(), setOpen(false)) });
    };
    const err = form.errors as Partial<Record<TextKey, string>>;

    const text = (k: TextKey, label: string, props: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> = {}, required = false) => (
        <div>
            <Label htmlFor={`c-${k}`} required={required}>{label}</Label>
            <Input id={`c-${k}`} className="mt-1.5" required={required} value={d[k]} onChange={(e) => form.setData(k, e.target.value)} error={err[k]} {...props} />
        </div>
    );
    const pick = (k: TextKey, label: string, labels: Record<string, string>, required = false) => (
        <div>
            <Label htmlFor={`c-${k}`} required={required}>{label}</Label>
            <div className="mt-1.5">
                <Select
                    id={`c-${k}`}
                    className="max-w-none"
                    value={d[k]}
                    onValueChange={(v) => form.setData(k, v)}
                    options={[...(required ? [] : [{ value: '', label: '—' }]), ...Object.entries(labels).map(([value, l]) => ({ value, label: t(l) }))]}
                />
            </div>
            {err[k] && <p className="mt-1 text-xs text-destructive">{err[k]}</p>}
        </div>
    );
    const num = { type: 'number', inputMode: 'decimal', min: '0', step: '0.01' } as const;
    // Optional groups fold away so the form stays short; one with an error opens by itself.
    const section = (title: string, keys: TextKey[], children: ReactNode) => (
        <details className="group rounded-xl ring-1 ring-border" open={keys.some((k) => err[k]) || undefined}>
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-navy [&::-webkit-details-marker]:hidden">
                {title}
                <Icon name="chevron-down" size={16} className="text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>
            <div className="grid gap-4 px-4 pb-4 sm:grid-cols-2">{children}</div>
        </details>
    );

    return (
        <>
            <Button onClick={() => setOpen(true)} startIcon={<Icon name="user-plus" />}>
                {t('Add client')}
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-2xl">
                    <form onSubmit={submit} className="grid gap-4">
                        <DialogHeader>
                            <DialogTitle>{t('Add client')}</DialogTitle>
                            <DialogDescription>{t('For clients you already have. They do not need to register: they can sign in once they set their password.')}</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="sm:col-span-2">{text('name', t('Full name'), {}, true)}</div>
                            {text('email', t('Email'), { type: 'email' }, true)}
                            {text('phone', t('Phone'), { type: 'tel' }, true)}
                            <div>
                                <Label htmlFor="c-country" required>{t('Country')}</Label>
                                <div className="mt-1.5">
                                    <Select id="c-country" className="max-w-none" value={d.country} onValueChange={(v) => form.setData('country', v)} options={COUNTRY_OPTIONS} />
                                </div>
                            </div>
                            {text('city', t('City'))}
                            <div className="sm:col-span-2">{text('address', t('Address'), { placeholder: t('Street and number') }, true)}</div>
                        </div>

                        <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('More details (optional)')}</p>
                        <div className="grid gap-2">
                            {section(t('Personal information'), ['date_of_birth', 'gender', 'marital_status'], <>
                                {text('date_of_birth', t('Date of birth'), { type: 'date' })}
                                {pick('gender', t('Gender'), GENDER_LABELS)}
                                {pick('marital_status', t('Marital status'), MARITAL_LABELS)}
                            </>)}
                            {section(t('Employment'), ['employment_status', 'employer_name', 'occupation', 'employment_length'], <>
                                {pick('employment_status', t('Employment status'), EMPLOYMENT_LABELS)}
                                {text('employer_name', t('Employer or business'))}
                                {text('occupation', t('Occupation'))}
                                {text('employment_length', t('Length of employment'))}
                            </>)}
                            {section(t('Financial information'), ['monthly_income', 'other_income', 'monthly_expenses', 'existing_debts'], <>
                                {text('monthly_income', t('Monthly income'), num)}
                                {text('other_income', t('Other income'), num)}
                                {text('monthly_expenses', t('Monthly living expenses'), num)}
                                {text('existing_debts', t('Existing loans and debts'), num)}
                            </>)}
                            {section(t('Identification'), ['id_type', 'id_number', 'id_issuing_country', 'id_expiry'], <>
                                {pick('id_type', t('Document type'), ID_TYPE_LABELS)}
                                {text('id_number', t('Document number'))}
                                {pick('id_issuing_country', t('Issuing country'), COUNTRY_NAMES)}
                                {text('id_expiry', t('Expiry date'), { type: 'date' })}
                            </>)}
                            {section(t('Disbursement'), ['disbursement_method', 'bank_name', 'account_holder', 'account_type', 'account_number'], <>
                                {pick('disbursement_method', t('Receive the money by'), DISBURSEMENT_LABEL)}
                                {d.disbursement_method !== 'cash_pickup' && <>
                                    {text('bank_name', t('Bank'))}
                                    {text('account_holder', t('Account holder'))}
                                    {pick('account_type', t('Account type'), { savings: 'Savings', checking: 'Checking' })}
                                    {text('account_number', d.country === 'AR' ? t('CBU / CVU or alias') : t('Account number'))}
                                </>}
                            </>)}
                            {section(t('Notes'), ['notes'], <div className="sm:col-span-2">
                                <Textarea aria-label={t('Notes')} rows={3} maxLength={2000} value={d.notes} onChange={(e) => form.setData('notes', e.target.value)} error={err.notes} />
                            </div>)}
                        </div>

                        <Checkbox checked={d.invite} onChange={(e) => form.setData('invite', e.target.checked)} label={t('Email them a link to set their password and see their loans')} />
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                                {t('Cancel')}
                            </Button>
                            <Button type="submit" loading={form.processing}>
                                {t('Add client')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

export default function ClientsIndex({ clients, filters }: { clients: Paginated<Client>; filters: Record<string, string> }) {
    const t = useT();
    const locale = useLocale();
    return (
        <>
            <Head title={t('Clients')} />
            <PageHeader title={t('Clients')} subtitle={t('Every borrower, their loans and how they are paying.')} actions={<AddClient />} />
            <Filters
                url="/admin/clients"
                filters={filters}
                fields={[
                    { key: 'search', type: 'search', label: t('Search name, email or phone') },
                    { key: 'country', type: 'select', label: t('All countries'), options: COUNTRY_OPTIONS },
                    { key: 'standing', type: 'select', label: t('Any standing'), options: [{ value: 'active', label: t('Active loan') }, { value: 'overdue', label: t('Overdue') }] },
                ]}
            />
            <DataTable
                head={[t('Client'), t('Phone'), t('Country'), t('Applications'), t('Loans'), t('Outstanding'), t('Standing'), t('Credit score'), t('Joined'), '']}
                empty={clients.data.length === 0}
            >
                {clients.data.map((c) => (
                    <tr key={c.id}>
                        <td>
                            <Link href={`/admin/clients/${c.id}`} className="block font-medium text-navy hover:underline">{c.name}</Link>
                            <span className="text-xs text-muted-foreground">{c.email}</span>
                        </td>
                        <td className="whitespace-nowrap">{c.phone ?? '—'}</td>
                        <td>{c.country ?? '—'}</td>
                        <td className="tabular-nums">{c.applications_count}</td>
                        <td className="whitespace-nowrap tabular-nums">
                            {c.active_loans_count} / {c.loans_count}
                        </td>
                        <td className="whitespace-nowrap font-medium tabular-nums">
                            {Number(c.outstanding) > 0 ? money(Number(c.outstanding), CURRENCY_OF[c.country ?? ''] ?? 'COP', locale) : '—'}
                        </td>
                        <td>{c.is_overdue ? <StatusBadge status="overdue" /> : c.active_loans_count > 0 ? <StatusBadge status="active" /> : <span className="text-muted-foreground">—</span>}</td>
                        <td>
                            <CreditScore credit={c.credit} />
                            {c.credit.limit !== null && c.credit.currency && (
                                <span className="mt-1 block whitespace-nowrap text-xs text-muted-foreground">{t('Limit :amount', { amount: money(c.credit.limit, c.credit.currency, locale) })}</span>
                            )}
                        </td>
                        <td className="whitespace-nowrap text-muted-foreground">{date(c.created_at, locale)}</td>
                        <td>
                            <Link href={`/admin/clients/${c.id}`} className="grid size-8 place-items-center rounded-full hover:bg-muted" aria-label={t('Open')}>
                                <Icon name="chevron-right" size={16} />
                            </Link>
                        </td>
                    </tr>
                ))}
            </DataTable>
            <Pager page={clients} url="/admin/clients" filters={filters} />
        </>
    );
}

ClientsIndex.layout = portalLayout;
