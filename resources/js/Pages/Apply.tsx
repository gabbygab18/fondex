import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useId, useState, type FormEvent, type ReactNode } from 'react';
import { FileDrop } from '@/components/FileDrop';
import { Button } from '@/components/glint/button';
import { Checkbox } from '@/components/glint/checkbox';
import { Label } from '@/components/glint/label';
import { RadioGroup, RadioGroupItem } from '@/components/glint/radio-group';
import { Select } from '@/components/glint/select';
import { Slider } from '@/components/glint/slider';
import { Field, TextArea } from '@/components/public/Field';
import { PageHero } from '@/components/site';
import { Icon } from '@/icons/icon';
import { siteLayout } from '@/Layouts/SiteLayout';
import { FREQ_LABEL, FREQUENCIES, installment, installmentCount, money, PER_LABEL, RATES, totalPayable } from '@/lib/format';
import { useT, visitorCountry } from '@/lib/i18n';
import { ACCOUNT_TYPE_LABEL, EMPLOYMENT_LABEL, GENDER_LABEL, ID_COUNTRIES, ID_TYPE_LABEL, LOAN_TYPE_LABEL, MARITAL_LABEL } from '@/lib/labels';
import { cn } from '@/lib/utils';
import type { Frequency, SharedProps } from '@/types';

interface Props extends SharedProps {
    prefill: { amount: number | null; term: number | null; frequency: string | null; country: string | null; loan_type: string | null };
    /** This client's credit limit per country (rises for good payers). */
    limits: Record<string, number>;
}

type Data = ReturnType<typeof initial>;
type Key = keyof Data;

function initial(p: Props, country: string, minAmount: number) {
    const freq = (FREQUENCIES as string[]).includes(p.prefill.frequency ?? '') ? (p.prefill.frequency as Frequency) : 'weekly';
    return {
        // 4. Loan
        country,
        loan_type: p.prefill.loan_type ?? 'personal',
        amount: p.prefill.amount ?? minAmount * 4,
        term_months: Math.min(Math.max(p.prefill.term ?? 1, 1), 3),
        repayment_frequency: freq as string,
        purpose: '',
        // 1. Personal
        full_name: p.auth.user?.name ?? '',
        date_of_birth: '',
        gender: '',
        marital_status: '',
        email: p.auth.user?.email ?? '',
        phone: '',
        address: '',
        city: '',
        // 2–3. Employment and finances
        employment_status: '',
        employer_name: '',
        occupation: '',
        employment_length: '',
        monthly_income: '',
        other_income: '',
        other_income_source: '',
        monthly_expenses: '',
        existing_debts: '',
        other_commitments: '',
        // 5. Identity
        id_type: '',
        id_number: '',
        id_issuing_country: country,
        id_expiry: '',
        id_front: null as File | null,
        id_back: null as File | null,
        address_proof: null as File | null,
        income_proof: null as File | null,
        other: null as File | null,
        // 6. Disbursement
        disbursement_method: 'bank',
        bank_name: '',
        account_holder: p.auth.user?.name ?? '',
        account_type: '',
        account_number: '',
        // 7. Consents
        consent_privacy: false,
        consent_data_use: false,
        consent_credit_check: false,
        declaration_accurate: false,
        notes: '',
    };
}

/** Required fields per step, for the client-side check before "Continue" and to send server errors back to the right step. */
const REQUIRED: Key[][] = [
    ['country', 'loan_type', 'amount', 'term_months', 'repayment_frequency', 'purpose'],
    ['full_name', 'date_of_birth', 'email', 'phone', 'address', 'city'],
    ['employment_status', 'employer_name', 'occupation', 'monthly_income', 'monthly_expenses'],
    ['id_type', 'id_number', 'id_issuing_country', 'id_front', 'address_proof'],
    ['disbursement_method', 'bank_name', 'account_holder', 'account_type', 'account_number'],
    ['consent_privacy', 'consent_data_use', 'consent_credit_check', 'declaration_accurate'],
];
const OPTIONAL: Key[][] = [
    [],
    ['gender', 'marital_status'],
    ['employment_length', 'other_income', 'other_income_source', 'existing_debts', 'other_commitments'],
    ['id_expiry', 'id_back', 'income_proof', 'other'],
    [],
    ['notes'],
];
const stepOf = (key: string) => [...REQUIRED, ...OPTIONAL].findIndex((keys) => keys.includes(key as Key)) % REQUIRED.length;

/** Optional money fields go to the server as 0 when left empty. */
const MONEY_OPTIONAL: Key[] = ['other_income', 'existing_debts'];

const options = (labels: Record<string, string>, t: (s: string) => string) => Object.entries(labels).map(([value, label]) => ({ value, label: t(label) }));

function SelectField({ label, value, onChange, options, error, required }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; error?: string; required?: boolean }) {
    const id = useId();
    return (
        <div className="grid min-w-0 gap-2">
            <Label htmlFor={id} required={required} optional={!required}>
                {label}
            </Label>
            <Select id={id} value={value} onValueChange={onChange} options={options} placeholder="—" className="max-w-none [&>button]:h-12 [&>button]:rounded-xl" />
            {error && (
                <p className="text-xs text-destructive" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}

function SubHeading({ children }: { children: ReactNode }) {
    return <h3 className="col-span-full mt-2 border-t border-border pt-6 text-sm font-semibold uppercase tracking-wider text-navy first:mt-0 first:border-0 first:pt-0">{children}</h3>;
}

export default function Apply() {
    const props = usePage<Props>().props;
    const { prefill, countries, auth, locale, limits } = props;
    const t = useT();
    const first = countries.find((c) => c.code === (prefill.country ?? auth.user?.country ?? visitorCountry())) ?? countries[0];
    const [step, setStep] = useState(0);
    const form = useForm(initial(props, first?.code ?? '', first?.min_amount ?? 0));
    const { data, setData, errors } = form;
    const c = countries.find((x) => x.code === data.country) ?? first;

    if (!c) {
        return <PageHero eyebrow={t('Apply')} title={t('Applications are closed right now')} />;
    }

    const freq = data.repayment_frequency as Frequency;
    const maxAmount = Math.min(c.max_amount, limits[c.code] ?? c.max_amount);
    const amount = Math.min(Math.max(Number(data.amount) || 0, c.min_amount), maxAmount);
    const term = Math.min(Math.max(data.term_months, c.min_term), c.max_term);
    const fmt = (v: number) => money(v, c.currency, locale);
    const unemployed = data.employment_status === 'unemployed';
    const ar = c.code === 'AR';
    const cash = data.disbursement_method === 'cash_pickup';

    const steps = [t('Your loan'), t('About you'), t('Work and money'), t('Identity'), t('Receive your money'), t('Review')];
    const last = steps.length - 1;

    // A field only counts as required when it applies (employer when working, account type in Colombia, bank details for a transfer).
    const BANK: Key[] = ['bank_name', 'account_holder', 'account_type', 'account_number'];
    const isRequired = (k: Key) =>
        REQUIRED.flat().includes(k) &&
        !((k === 'employer_name' || k === 'occupation') && unemployed) &&
        !(k === 'account_type' && ar) &&
        !(BANK.includes(k) && cash);

    const err = (k: Key) => errors[k as keyof typeof errors];
    const text = (k: Key, label: string, extra: Record<string, unknown> = {}) => (
        <Field
            label={label}
            value={data[k] as string}
            onChange={(e) => setData(k, e.target.value as never)}
            error={err(k)}
            required={isRequired(k)}
            {...extra}
        />
    );
    const moneyField = (k: Key, label: string) => text(k, t(':label (:currency)', { label, currency: c.currency }), { type: 'number', inputMode: 'numeric', min: 0 });
    const select = (k: Key, label: string, opts: { value: string; label: string }[]) => (
        <SelectField label={label} value={data[k] as string} onChange={(v) => setData(k, v as never)} options={opts} error={err(k)} required={isRequired(k)} />
    );
    const file = (k: Key, label: string, hint?: string) => (
        <FileDrop label={label} hint={hint} file={data[k] as File | null} onChange={(f) => setData(k, f as never)} error={err(k)} required={isRequired(k)} />
    );

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.clearErrors();
        const missing = REQUIRED[step].filter((k) => isRequired(k) && (data[k] === null || data[k] === false || String(data[k]).trim() === ''));
        if (missing.length) {
            missing.forEach((k) => form.setError(k as never, t('This field is required.')));
            return;
        }
        if (step < last) return setStep(step + 1);

        form.transform((d) => ({
            ...d,
            amount,
            term_months: term,
            account_type: ar ? '' : d.account_type,
            ...Object.fromEntries(MONEY_OPTIONAL.map((k) => [k, d[k] === '' ? 0 : d[k]])),
            ...Object.fromEntries((['consent_privacy', 'consent_data_use', 'consent_credit_check', 'declaration_accurate'] as const).map((k) => [k, d[k] ? '1' : ''])),
        }));
        form.post('/apply', {
            onError: (errs) => setStep(Math.min(...Object.keys(errs).map((k) => Math.max(stepOf(k), 0)))),
        });
    };

    const review: [string, string][] = [
        [t('Loan'), `${t(LOAN_TYPE_LABEL[data.loan_type])} · ${fmt(amount)}`],
        [t('Term'), `${term === 1 ? t('1 month') : t(':n months', { n: term })} · ${t(FREQ_LABEL[freq])}`],
        [t('Name'), data.full_name],
        [t('Email'), data.email],
        [t('Phone'), data.phone],
        [t('Address'), `${data.address}, ${data.city}`],
        [t('Employment status'), data.employment_status ? t(EMPLOYMENT_LABEL[data.employment_status]) : '—'],
        [t('Monthly income'), data.monthly_income ? fmt(Number(data.monthly_income)) : '—'],
        [t('ID document'), data.id_type ? t(ID_TYPE_LABEL[data.id_type]) : '—'],
        [t('Receive the money by'), cash ? t('Cash pick-up') : `${t('Bank transfer')} · ${data.bank_name} · ${data.account_holder}`],
    ];

    return (
        <>
            <Head title={t('Apply for a loan')} />
            <PageHero eyebrow={t('Online application')} title={t('Apply for your loan')}>
                {t('Six short steps, about ten minutes. Keep your ID, a proof of address and a recent proof of income at hand.')}
            </PageHero>

            <section className="py-14 md:py-20">
                <div className="container-page grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-start">
                    <form onSubmit={submit} className="min-w-0 rounded-[28px] bg-card p-6 ring-1 ring-border md:p-10" noValidate>
                        <ol className="mb-10 grid grid-cols-6 gap-2">
                            {steps.map((s, i) => (
                                <li key={s}>
                                    <button
                                        type="button"
                                        onClick={() => i < step && setStep(i)}
                                        disabled={i > step}
                                        aria-current={i === step ? 'step' : undefined}
                                        aria-label={s}
                                        className="w-full text-left disabled:cursor-default"
                                    >
                                        <span className={cn('block h-1.5 rounded-full transition-colors', i <= step ? 'bg-navy' : 'bg-muted')} />
                                        <span className={cn('mt-3 flex items-center gap-2 text-sm font-medium', i === step ? 'text-navy' : 'text-muted-foreground')}>
                                            <span className={cn('grid size-6 shrink-0 place-items-center rounded-full text-xs', i < step ? 'bg-azure text-navy' : i === step ? 'bg-navy text-white' : 'bg-muted')}>
                                                {i < step ? <Icon name="check" size={13} /> : i + 1}
                                            </span>
                                            <span className="hidden truncate xl:inline">{s}</span>
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ol>
                        <h2 className="mb-6 text-xl font-bold text-navy xl:hidden">{steps[step]}</h2>

                        {step === 0 && (
                            <div className="grid gap-8">
                                {countries.length > 1 && (
                                    <div className="grid gap-3">
                                        <Label>{t('Where do you live?')}</Label>
                                        <RadioGroup
                                            value={data.country}
                                            onValueChange={(v) => {
                                                setData((d) => ({ ...d, country: v, id_issuing_country: v }));
                                            }}
                                            variant="card"
                                            orientation="horizontal"
                                            aria-label={t('Country')}
                                        >
                                            {countries.map((x) => (
                                                <RadioGroupItem key={x.code} value={x.code} label={x.name} description={x.currency} />
                                            ))}
                                        </RadioGroup>
                                    </div>
                                )}
                                {select('loan_type', t('Type of loan'), options(LOAN_TYPE_LABEL, t))}
                                <div>
                                    <Field
                                        label={t('Loan amount (:currency)', { currency: c.currency })}
                                        type="number"
                                        inputMode="numeric"
                                        min={c.min_amount}
                                        max={maxAmount}
                                        value={data.amount}
                                        onChange={(e) => setData('amount', Number(e.target.value))}
                                        onBlur={() => setData('amount', amount)}
                                        error={errors.amount}
                                        hint={maxAmount < c.max_amount ? t('Your limit: :min – :max', { min: fmt(c.min_amount), max: fmt(maxAmount) }) : `${fmt(c.min_amount)} – ${fmt(maxAmount)}`}
                                        required
                                    />
                                    <Slider className="mt-5" value={[amount]} onValueChange={([v]) => setData('amount', v)} min={c.min_amount} max={maxAmount} step={c.min_amount} tooltip="never" thumbLabels={[t('Loan amount')]} />
                                </div>
                                <div className="grid gap-3">
                                    <Label required>{t('Term')}</Label>
                                    <RadioGroup value={String(term)} onValueChange={(v) => setData('term_months', Number(v))} variant="card" orientation="horizontal" className={cn('max-sm:grid-flow-row', c.max_term - c.min_term + 1 > 4 && 'grid-flow-row grid-cols-3 sm:grid-cols-4')} aria-label={t('Term')}>
                                        {Array.from({ length: c.max_term - c.min_term + 1 }, (_, i) => c.min_term + i).map((n) => (
                                            <RadioGroupItem key={n} value={String(n)} label={n === 1 ? t('1 month') : t(':n months', { n })} />
                                        ))}
                                    </RadioGroup>
                                    {errors.term_months && <p className="text-xs text-destructive">{errors.term_months}</p>}
                                </div>
                                <div className="grid gap-3">
                                    <Label required>{t('Repayment frequency')}</Label>
                                    <RadioGroup value={freq} onValueChange={(v) => setData('repayment_frequency', v)} variant="card" orientation="horizontal" className="max-sm:grid-flow-row" aria-label={t('Repayment frequency')}>
                                        {FREQUENCIES.map((f) => (
                                            <RadioGroupItem key={f} value={f} label={t(FREQ_LABEL[f])} description={t(':n payments', { n: installmentCount(term, f) })} />
                                        ))}
                                    </RadioGroup>
                                </div>
                                {text('purpose', t('What is the loan for?'), { hint: t('e.g. dental treatment, car repair') })}
                            </div>
                        )}

                        {step === 1 && (
                            <div className="grid gap-6 md:grid-cols-2">
                                {text('full_name', t('Full legal name'), { autoComplete: 'name' })}
                                {text('date_of_birth', t('Date of birth'), { type: 'date', max: new Date().toISOString().slice(0, 10) })}
                                {select('gender', t('Gender'), options(GENDER_LABEL, t))}
                                {select('marital_status', t('Marital status'), options(MARITAL_LABEL, t))}
                                {text('email', t('Email'), { type: 'email', autoComplete: 'email' })}
                                {text('phone', t('Mobile number'), { type: 'tel', autoComplete: 'tel' })}
                                {text('address', t('Residential address'), { autoComplete: 'street-address' })}
                                {text('city', t('City'), { autoComplete: 'address-level2' })}
                            </div>
                        )}

                        {step === 2 && (
                            <div className="grid gap-6 md:grid-cols-2">
                                <SubHeading>{t('Employment')}</SubHeading>
                                {select('employment_status', t('Employment status'), options(EMPLOYMENT_LABEL, t))}
                                {!unemployed && text('employer_name', t('Employer or business name'))}
                                {!unemployed && text('occupation', t('Occupation'))}
                                {!unemployed && text('employment_length', t('Length of employment'), { hint: t('e.g. 2 years') })}
                                <SubHeading>{t('Finances')}</SubHeading>
                                {moneyField('monthly_income', t('Monthly income'))}
                                {moneyField('monthly_expenses', t('Monthly living expenses'))}
                                {moneyField('other_income', t('Other income per month'))}
                                {text('other_income_source', t('Source of other income'))}
                                {moneyField('existing_debts', t('Existing loans and debts'))}
                                <div className="md:col-span-2">
                                    <TextArea label={t('Other financial commitments')} value={data.other_commitments} onChange={(e) => setData('other_commitments', e.target.value)} error={errors.other_commitments} className="min-h-24" />
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="grid gap-6">
                                <div className="grid gap-6 md:grid-cols-2">
                                    {select('id_type', t('Type of ID'), options(ID_TYPE_LABEL, t))}
                                    {text('id_number', t('ID, licence or passport number'))}
                                    {select('id_issuing_country', t('Issuing country'), options(ID_COUNTRIES, t))}
                                    {text('id_expiry', t('Expiry date'), { type: 'date' })}
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    {file('id_front', t('ID — front'))}
                                    {file('id_back', t('ID — back'))}
                                    {file('address_proof', t('Proof of address'), t('Utility bill or bank statement, last 3 months'))}
                                    {file('income_proof', t('Proof of income'), t('Optional · payslips or bank statements'))}
                                    {file('other', t('Other document'), t('Optional'))}
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="md:col-span-2">
                                    <p className="mb-2 text-sm font-medium">
                                        {t('How do you want to receive the money?')} <span className="text-destructive">*</span>
                                    </p>
                                    <RadioGroup value={data.disbursement_method} onValueChange={(v) => setData('disbursement_method', v)} variant="card" orientation="horizontal" name="disbursement_method">
                                        <RadioGroupItem value="bank" label={t('Bank transfer')} description={t('Paid into your bank account.')} />
                                        <RadioGroupItem value="cash_pickup" label={t('Cash pick-up')} description={t('Collect it in person with your ID.')} />
                                    </RadioGroup>
                                </div>
                                {cash ? (
                                    <p className="flex gap-2 rounded-xl bg-secondary p-4 text-sm text-navy md:col-span-2">
                                        <Icon name="info" size={18} className="shrink-0" />
                                        {t('Once your loan is approved we will tell you where and when to pick up the cash. Bring the ID you used in this application.')}
                                    </p>
                                ) : (
                                    <>
                                        <p className="flex gap-2 rounded-xl bg-secondary p-4 text-sm text-navy md:col-span-2">
                                            <Icon name="lock" size={18} className="shrink-0" />
                                            {t('We pay your loan into this account. Bank details are encrypted and only used for disbursement and repayments.')}
                                        </p>
                                        {text('bank_name', t('Bank name'))}
                                        {text('account_holder', t("Account holder's name"))}
                                        {!ar && select('account_type', t('Account type'), options(ACCOUNT_TYPE_LABEL, t))}
                                        {text('account_number', ar ? t('CBU / CVU (22 digits) or alias') : t('Account number'), {
                                            inputMode: ar ? 'text' : 'numeric',
                                            autoComplete: 'off',
                                            hint: ar ? t('Example: 2850590940090418135201 or juan.perez.mp') : undefined,
                                        })}
                                    </>
                                )}
                            </div>
                        )}

                        {step === last && (
                            <div className="grid gap-6">
                                <dl className="grid gap-x-6 gap-y-3 rounded-2xl bg-muted/60 p-5 text-sm sm:grid-cols-2">
                                    {review.map(([k, v]) => (
                                        <div key={k} className="min-w-0">
                                            <dt className="text-xs text-muted-foreground">{k}</dt>
                                            <dd className="truncate font-medium">{v || '—'}</dd>
                                        </div>
                                    ))}
                                </dl>
                                <TextArea label={t('Anything else we should know?')} value={data.notes} onChange={(e) => setData('notes', e.target.value)} error={errors.notes} className="min-h-24" />
                                <div className="grid gap-4">
                                    {(
                                        [
                                            ['consent_privacy', <>{t('I have read and agree to the')} <Link href="/privacy" className="underline" target="_blank">{t('Privacy Policy')}</Link>.</>],
                                            ['consent_data_use', t('I consent to Fondex collecting and using my personal information to assess and manage my loan.')],
                                            ['consent_credit_check', t('I authorise Fondex to verify my identity and run a credit check.')],
                                            ['declaration_accurate', t('I declare that all the information I have provided is true and accurate.')],
                                        ] as [Key, ReactNode][]
                                    ).map(([k, label]) => (
                                        <div key={k}>
                                            <Checkbox checked={data[k] as boolean} onChange={(e) => setData(k, e.target.checked as never)} label={label} />
                                            {err(k) && <p className="mt-1 text-xs text-destructive">{err(k)}</p>}
                                        </div>
                                    ))}
                                </div>
                                {form.progress && (
                                    <div className="h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={form.progress.percentage}>
                                        <div className="h-full bg-navy transition-[width]" style={{ width: `${form.progress.percentage}%` }} />
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="mt-10 flex items-center justify-between gap-4 border-t border-border pt-6">
                            {step > 0 ? (
                                <Button variant="ghost" size="lg" onClick={() => setStep(step - 1)} startIcon={<Icon name="arrow-left" />}>
                                    {t('Back')}
                                </Button>
                            ) : (
                                <span />
                            )}
                            <Button type="submit" size="lg" loading={form.processing} endIcon={<Icon name={step < last ? 'arrow-right' : 'send'} />}>
                                {step < last ? t('Continue') : t('Submit application')}
                            </Button>
                        </div>
                    </form>

                    <aside className="sticky top-6 overflow-hidden rounded-[28px] bg-navy p-7 text-white">
                        <p className="text-sm text-white/60">{t('Estimated payment :per', { per: t(PER_LABEL[freq]) })}</p>
                        <p className="mt-1 font-display text-3xl font-bold text-azure">
                            {fmt(installment(amount, RATES[0], term, freq))} – {fmt(installment(amount, RATES[RATES.length - 1], term, freq))}
                        </p>
                        <dl className="mt-6 grid gap-3 text-sm">
                            {[
                                [t('Amount'), fmt(amount)],
                                [t('Term'), term === 1 ? t('1 month') : t(':n months', { n: term })],
                                [t('Number of payments'), String(installmentCount(term, freq))],
                                [t('Flat interest rate'), `${RATES[0]}–${RATES[RATES.length - 1]}%`],
                                [t('Total to repay'), `${fmt(totalPayable(amount, RATES[0]))} – ${fmt(totalPayable(amount, RATES[RATES.length - 1]))}`],
                            ].map(([k, v]) => (
                                <div key={k} className="flex justify-between gap-4 border-b border-white/10 pb-3 last:border-0">
                                    <dt className="text-white/60">{k}</dt>
                                    <dd className="text-right font-semibold">{v}</dd>
                                </div>
                            ))}
                        </dl>
                        <p className="mt-6 flex gap-2 text-xs text-white/50">
                            <Icon name="lock" size={14} className="shrink-0 text-azure" />
                            {t('Your documents are stored privately and only our credit team can see them.')}
                        </p>
                    </aside>
                </div>
            </section>
        </>
    );
}

Apply.layout = siteLayout;
