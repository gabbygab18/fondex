import { Head, usePage } from '@inertiajs/react';
import { LoanCalculator } from '@/components/LoanCalculator';
import { Glow, Hl, PageHero, PillLink, SectionHeading } from '@/components/site';
import { Icon } from '@/icons/icon';
import { siteLayout } from '@/Layouts/SiteLayout';
import { money } from '@/lib/format';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { SharedProps } from '@/types';

export default function Services() {
    const { countries, locale } = usePage<SharedProps>().props;
    const t = useT();

    const products = [
        {
            img: 'personal',
            title: t('Personal loans'),
            text: t('For planned expenses, studies or travel, repaid in 1 to 3 months.'),
            points: [t('No collateral required'), t('Use the money for anything'), t('Early repayment without penalty')],
        },
        {
            img: 'emergency',
            title: t('Emergency loans'),
            text: t('A fast answer when something can’t wait: a repair, a bill or a trip to the doctor.'),
            points: [t('Decision usually within 24 hours'), t('From 1 month'), t('Daily, weekly or fortnightly payments')],
        },
        {
            img: 'debt',
            title: t('Debt consolidation'),
            text: t('Combine credit cards and other debts into one loan with a single lower installment.'),
            points: [t('One payment instead of many'), t('Usually a lower total rate'), t('Clear payoff date')],
        },
    ];
    const requirements = [
        t('Be 18 years or older'),
        t('Live in a country where we operate'),
        t('Valid ID: national ID, driver’s licence or passport'),
        t('A verifiable monthly income'),
        t('An active bank account in your name'),
        t('An email address and mobile phone'),
    ];
    const documents = [
        { icon: 'id-card', title: t('ID document'), text: t('Front and back of your national ID, driver’s licence or passport.') },
        { icon: 'home', title: t('Proof of address'), text: t('A utility bill or bank statement from the last 3 months.') },
        { icon: 'receipt', title: t('Proof of income'), text: t('Recent payslips or bank statements.') },
        { icon: 'file-check', title: t('Optional extras'), text: t('Any document that supports your application, like a utility bill.') },
    ];

    return (
        <>
            <Head title={t('Loans')} />
            <PageHero
                eyebrow={t('Loans')}
                image="/images/3d/loans.webp"
                bg="bg-[radial-gradient(ellipse_at_80%_50%,#1f6fd1_0%,#0f3577_45%,#0b2a5c_100%)]"
                extra={
                    <>
                        <div className="flex flex-wrap gap-3">
                            <PillLink href="/apply">{t('Apply now')}</PillLink>
                            <a href="#calculator" className="rounded-full border border-white/30 px-6 py-3 text-sm font-medium transition-colors hover:bg-white/10">
                                {t('Calculate my payment')}
                            </a>
                        </div>
                        <div className="mt-6 flex flex-wrap gap-2">
                            {products.map((p) => (
                                <a
                                    key={p.title}
                                    href="#products"
                                    className="flex items-center gap-2 rounded-full bg-white/10 py-1.5 pl-1.5 pr-4 text-xs ring-1 ring-white/15 transition-colors hover:bg-white/20"
                                >
                                    <img src={`/images/3d/${p.img}.webp`} alt="" className="size-7 object-contain" />
                                    {p.title}
                                </a>
                            ))}
                        </div>
                    </>
                }
                title={
                    <>
                        {t('Loans that fit')} <Hl>{t('your plans')}</Hl>
                    </>
                }
            >
                {t('Choose the loan you need, see the conditions for your country and apply online in minutes.')}
            </PageHero>

            <section id="products" className="scroll-mt-8 py-20 md:py-28">
                <div className="container-page">
                    <SectionHeading eyebrow={t('Our loans')} title={t('Simple loans built for real life')} />
                    <div className="mt-12 grid gap-6 lg:grid-cols-3">
                        {products.map((p, i) => (
                            <article key={p.title} className={cn('flex flex-col rounded-[28px] p-8', i === 1 ? 'bg-navy text-white' : 'bg-card ring-1 ring-border')}>
                                <img
                                    src={`/images/3d/${p.img}.webp`}
                                    alt=""
                                    loading="lazy"
                                    className="size-20 object-contain drop-shadow-lg transition-transform duration-500 ease-out hover:scale-110 hover:-rotate-6"
                                />
                                <h3 className={cn('mt-7 text-2xl font-bold', i !== 1 && 'text-navy')}>{p.title}</h3>
                                <p className={cn('mt-3 text-sm leading-relaxed', i === 1 ? 'text-white/70' : 'text-muted-foreground')}>{p.text}</p>
                                <ul className="mt-6 grid gap-3 text-sm">
                                    {p.points.map((x) => (
                                        <li key={x} className="flex items-center gap-2.5">
                                            <Icon name="check-circle" size={18} className={i === 1 ? 'text-azure' : 'text-[#2563eb]'} />
                                            {x}
                                        </li>
                                    ))}
                                </ul>
                                <div className="mt-auto pt-8">
                                    <PillLink href="/apply" dark={i !== 1}>
                                        {t('Apply now')}
                                    </PillLink>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="relative overflow-hidden bg-navy py-20 text-white md:py-28">
                <Glow />
                <div className="container-page relative">
                    <SectionHeading
                        eyebrow={t('Conditions by country')}
                        title={
                            <>
                                {t('Clear conditions in')} <Hl>{t('your currency')}</Hl>
                            </>
                        }
                        dark
                    >
                        {t('These are our current lending limits. Your final rate is confirmed when your application is approved.')}
                    </SectionHeading>
                    <div className="mt-12 grid gap-6 md:grid-cols-2">
                        {countries.map((c) => (
                            <div key={c.code} className="rounded-[28px] border border-white/10 bg-white/5 p-8">
                                <div className="flex items-center justify-between">
                                    <h3 className="flex items-center gap-3 text-2xl font-bold">
                                        <Icon name="map-pin" size={22} className="text-azure" /> {c.name}
                                    </h3>
                                    <span className="rounded-full bg-azure px-3 py-1 text-xs font-semibold text-navy">{c.currency}</span>
                                </div>
                                <dl className="mt-8 grid grid-cols-2 gap-6">
                                    <div>
                                        <dt className="text-xs uppercase tracking-wider text-white/50">{t('Interest rate')}</dt>
                                        <dd className="mt-1 font-display text-xl font-bold leading-tight text-azure">{t('Based on your profile')}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs uppercase tracking-wider text-white/50">{t('Terms')}</dt>
                                        <dd className="mt-1 font-display text-3xl font-bold">{t(':min–:max months', { min: c.min_term, max: c.max_term })}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs uppercase tracking-wider text-white/50">{t('Minimum amount')}</dt>
                                        <dd className="mt-1 text-lg font-semibold">{money(c.min_amount, c.currency, locale)}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs uppercase tracking-wider text-white/50">{t('Maximum amount')}</dt>
                                        <dd className="mt-1 text-lg font-semibold">{money(c.max_amount, c.currency, locale)}</dd>
                                    </div>
                                </dl>
                                <p className="mt-6 border-t border-white/10 pt-4 text-xs text-white/60">
                                    {t('Pay daily, weekly or fortnightly. Your rate is charged once on the amount you borrow and confirmed when we approve your loan.')}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section id="calculator" className="bg-card py-20 md:py-28">
                <div className="container-page">
                    <SectionHeading eyebrow={t('Loan calculator')} title={t('See your payments before you apply')} align="center">
                        {t('Pick an amount, a term of 1 to 3 months and how often you want to pay. No sign-up, no impact on your credit score.')}
                    </SectionHeading>
                    <LoanCalculator className="mt-12" />
                </div>
            </section>

            <section className="py-20 md:py-28">
                <div className="container-page grid gap-12 lg:grid-cols-2">
                    <div>
                        <SectionHeading eyebrow={t('Requirements')} title={t('What you need to apply')} />
                        <ul className="mt-10 grid gap-3 sm:grid-cols-2">
                            {requirements.map((r) => (
                                <li key={r} className="flex items-center gap-3 rounded-2xl bg-card p-4 text-sm ring-1 ring-border">
                                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-azure text-navy">
                                        <Icon name="check" size={14} />
                                    </span>
                                    {r}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <SectionHeading eyebrow={t('Documents')} title={t('Documents to upload')} />
                        <ul className="mt-10 grid gap-4">
                            {documents.map((d) => (
                                <li key={d.title} className="flex items-start gap-4 rounded-2xl bg-card p-5 ring-1 ring-border">
                                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-navy text-azure">
                                        <Icon name={d.icon} size={20} />
                                    </span>
                                    <div>
                                        <h3 className="font-bold text-navy">{d.title}</h3>
                                        <p className="mt-1 text-sm text-muted-foreground">{d.text}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        <p className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
                            <Icon name="info" size={14} /> {t('Accepted formats: JPG, PNG, WEBP or PDF, up to 8 MB each.')}
                        </p>
                    </div>
                </div>
            </section>
        </>
    );
}

Services.layout = siteLayout;
