import { Head, Link, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { PageHeader } from '@/components/admin';
import { PillLink } from '@/components/site';
import { StatusBadge } from '@/components/StatusBadge';
import { Icon } from '@/icons/icon';
import { portalLayout } from '@/Layouts/PortalLayout';
import { date, FREQ_LABEL, money } from '@/lib/format';
import { useT } from '@/lib/i18n';
import { ACCOUNT_TYPE_LABEL, DISBURSEMENT_LABEL, DOC_LABEL, EMPLOYMENT_LABEL, GENDER_LABEL, ID_COUNTRIES, ID_TYPE_LABEL, LOAN_TYPE_LABEL, MARITAL_LABEL } from '@/lib/labels';
import { cn } from '@/lib/utils';
import type { Application as App, SharedProps } from '@/types';

function Section({ title, rows }: { title: string; rows: [string, ReactNode][] }) {
    return (
        <div className="rounded-3xl bg-card p-7 shadow-sm">
            <h2 className="text-xl font-bold text-navy">{title}</h2>
            <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                {rows.map(([k, v]) => (
                    <div key={k} className="min-w-0">
                        <dt className="text-xs text-muted-foreground">{k}</dt>
                        <dd className="break-words font-medium">{v || '—'}</dd>
                    </div>
                ))}
            </dl>
        </div>
    );
}

export default function Application() {
    const { application: a, locale } = usePage<SharedProps & { application: App }>().props;
    const t = useT();
    const decided = a.status === 'approved' || a.status === 'rejected';
    const fmt = (v: number) => money(v, a.currency, locale);
    const label = (map: Record<string, string>, v: string | null) => (v ? t(map[v] ?? v) : '—');

    const timeline = [
        { title: t('Application submitted'), when: date(a.created_at, locale), done: true },
        { title: t('Under review'), when: a.status === 'pending' ? t('Next') : '', done: a.status !== 'pending' },
        {
            title: a.status === 'rejected' ? t('Not approved') : t('Approved'),
            when: decided ? date(a.reviewed_at, locale) : '',
            done: decided,
            bad: a.status === 'rejected',
        },
    ];
    const consents = [
        [a.consent_privacy, t('Privacy Policy accepted')],
        [a.consent_data_use, t('Consent to use my personal information')],
        [a.consent_credit_check, t('Identity and credit check authorised')],
        [a.declaration_accurate, t('Information declared accurate')],
    ] as const;

    return (
        <>
            <Head title={a.reference} />
            <PageHeader title={fmt(a.amount)} subtitle={<>{a.reference} · {t(LOAN_TYPE_LABEL[a.loan_type] ?? a.loan_type)} · {a.term_months === 1 ? t('1 month') : t(':n months', { n: a.term_months })} · {t(FREQ_LABEL[a.repayment_frequency])}</>} />
            <div className="grid gap-6 lg:grid-cols-[1fr_24rem] lg:items-start">
                    <div className="grid min-w-0 gap-6">
                        <div className="rounded-3xl bg-card p-7 shadow-sm">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-navy">{t('Status')}</h2>
                                <StatusBadge status={a.status} />
                            </div>
                            <ol className="mt-6 grid gap-5">
                                {timeline.map((s) => (
                                    <li key={s.title} className="flex items-center gap-4">
                                        <span
                                            className={cn(
                                                'grid size-9 shrink-0 place-items-center rounded-full',
                                                s.done ? (s.bad ? 'bg-destructive/15 text-destructive' : 'bg-azure text-navy') : 'bg-muted text-muted-foreground',
                                            )}
                                        >
                                            <Icon name={s.done ? (s.bad ? 'x-circle' : 'check') : 'clock'} size={16} />
                                        </span>
                                        <span className="flex-1 font-medium">{s.title}</span>
                                        <span className="text-sm text-muted-foreground">{s.when}</span>
                                    </li>
                                ))}
                            </ol>
                            {a.admin_notes && (
                                <p className="mt-6 rounded-xl bg-muted p-4 text-sm">
                                    <b>{t('Note from our team')}:</b> {a.admin_notes}
                                </p>
                            )}
                            {a.loan && (
                                <div className="mt-6">
                                    <PillLink href={`/account/loans/${a.loan.id}`} dark>
                                        {t('See my repayment schedule')}
                                    </PillLink>
                                </div>
                            )}
                        </div>

                        <Section
                            title={t('About you')}
                            rows={[
                                [t('Full legal name'), a.full_name],
                                [t('Date of birth'), date(a.date_of_birth, locale)],
                                [t('Gender'), label(GENDER_LABEL, a.gender)],
                                [t('Marital status'), label(MARITAL_LABEL, a.marital_status)],
                                [t('Email'), a.email],
                                [t('Mobile number'), a.phone],
                                [t('Residential address'), `${a.address}, ${a.city}`],
                            ]}
                        />
                        <Section
                            title={t('Work and money')}
                            rows={[
                                [t('Employment status'), label(EMPLOYMENT_LABEL, a.employment_status)],
                                [t('Employer or business name'), a.employer_name],
                                [t('Occupation'), a.occupation],
                                [t('Length of employment'), a.employment_length],
                                [t('Monthly income'), fmt(a.monthly_income)],
                                [t('Other income per month'), a.other_income ? `${fmt(a.other_income)}${a.other_income_source ? ` · ${a.other_income_source}` : ''}` : '—'],
                                [t('Monthly living expenses'), fmt(a.monthly_expenses)],
                                [t('Existing loans and debts'), a.existing_debts ? fmt(a.existing_debts) : '—'],
                            ]}
                        />
                        <Section
                            title={t('Identity and bank account')}
                            rows={[
                                [t('Type of ID'), label(ID_TYPE_LABEL, a.id_type)],
                                [t('Issuing country'), ID_COUNTRIES[a.id_issuing_country] ?? a.id_issuing_country],
                                [t('Receive the money by'), t(DISBURSEMENT_LABEL[a.disbursement_method])],
                                ...(a.disbursement_method === 'cash_pickup'
                                    ? []
                                    : ([
                                          [t('Bank name'), a.bank_name],
                                          [t("Account holder's name"), a.account_holder],
                                          [t('Account type'), label(ACCOUNT_TYPE_LABEL, a.account_type)],
                                          [t('Account number'), a.account_number_masked],
                                      ] as [string, ReactNode][])),
                            ]}
                        />

                        <div className="rounded-3xl bg-card p-7 shadow-sm">
                            <h2 className="text-xl font-bold text-navy">{t('Documents')}</h2>
                            <ul className="mt-4 grid gap-2">
                                {a.documents?.map((d) => (
                                    <li key={d.id}>
                                        <a href={`/documents/${d.id}`} target="_blank" rel="noopener" className="flex items-center gap-3 rounded-xl p-3 hover:bg-muted">
                                            <Icon name={d.mime === 'application/pdf' ? 'file-text' : 'file-image'} size={20} className="text-navy" />
                                            <span className="min-w-0 flex-1 text-sm">
                                                <span className="block font-medium">{t(DOC_LABEL[d.type] ?? d.type)}</span>
                                                <span className="block truncate text-xs text-muted-foreground">{d.original_name}</span>
                                            </span>
                                            <Icon name="external-link" size={16} className="text-muted-foreground" />
                                        </a>
                                    </li>
                                ))}
                            </ul>
                            <h3 className="mt-6 text-sm font-semibold text-navy">{t('Consents')}</h3>
                            <ul className="mt-3 grid gap-2 text-sm">
                                {consents.map(([ok, text]) => (
                                    <li key={text} className="flex items-center gap-2">
                                        <Icon name={ok ? 'check-circle' : 'x-circle'} size={16} className={ok ? 'text-[#2563eb]' : 'text-muted-foreground'} />
                                        {text}
                                    </li>
                                ))}
                            </ul>
                            {a.consented_at && <p className="mt-3 text-xs text-muted-foreground">{t('Given on :date', { date: date(a.consented_at, locale) })}</p>}
                        </div>
                    </div>

                    <aside className="rounded-[24px] bg-navy p-7 text-white">
                        <h2 className="text-lg font-bold">{t('Summary')}</h2>
                        <dl className="mt-4 grid gap-3 text-sm">
                            {[
                                [t('Type of loan'), t(LOAN_TYPE_LABEL[a.loan_type] ?? a.loan_type)],
                                [t('Amount'), fmt(a.amount)],
                                [t('Term'), a.term_months === 1 ? t('1 month') : t(':n months', { n: a.term_months })],
                                [t('Repayment frequency'), t(FREQ_LABEL[a.repayment_frequency])],
                                [t('Flat interest rate'), a.interest_rate !== null ? `${a.interest_rate}%` : t('Set when approved')],
                                [t('Purpose'), a.purpose],
                            ].map(([k, v]) => (
                                <div key={k} className="flex justify-between gap-4 border-b border-white/10 pb-3 last:border-0">
                                    <dt className="text-white/60">{k}</dt>
                                    <dd className="text-right font-semibold">{v}</dd>
                                </div>
                            ))}
                        </dl>
                        <Link href="/account" className="mt-6 inline-flex items-center gap-2 text-sm text-azure hover:underline">
                            <Icon name="arrow-left" size={16} /> {t('Back to my account')}
                        </Link>
                    </aside>
            </div>
        </>
    );
}

Application.layout = portalLayout;
