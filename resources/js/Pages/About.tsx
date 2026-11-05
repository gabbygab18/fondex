import { Head } from '@inertiajs/react';
import { StatsShowcase } from '@/components/StatsShowcase';
import { Glow, Hl, PageHero, PillLink, SectionHeading } from '@/components/site';
import { Icon } from '@/icons/icon';
import { siteLayout } from '@/Layouts/SiteLayout';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export default function About() {
    const t = useT();
    const values = [
        { icon: 'eye', title: t('Transparency'), text: t('You see the rate, the installment and the total cost before you sign. No hidden fees.') },
        { icon: 'lightning', title: t('Speed'), text: t('Online application, digital documents and a decision usually within 24 hours.') },
        { icon: 'heart', title: t('Human support'), text: t('Real people review every application and answer you by email, phone or live chat.') },
        { icon: 'shield-check', title: t('Security'), text: t('Your documents are stored encrypted and only our credit team can see them.') },
    ];
    const offices = [
        { icon: 'banknote', title: t('Your local currency'), text: t('Loans and payments in the currency you use every day.') },
        { icon: 'wallet', title: t('Local payment methods'), text: t('Pay by bank transfer, cash or the payment apps you already use.') },
    ];

    return (
        <>
            <Head title={t('About Us')} />
            <PageHero
                eyebrow={t('About Us')}
                image="/images/3d/about.webp"
                layout="reverse"
                bg="bg-[radial-gradient(ellipse_at_25%_45%,#3a6fe0_0%,#1d4bb0_45%,#0f3577_100%)]"
                extra={
                    <div className="grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-4">
                        {[
                            ['10K+', t('Loans funded')],
                            ['24h', t('Typical decision')],
                            ['92%', t('Approval rate')],
                            ['4.9', t('Average rating')],
                        ].map(([v, k]) => (
                            <div key={k} className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/15 backdrop-blur">
                                <p className="font-display text-2xl font-bold text-azure">{v}</p>
                                <p className="text-[11px] text-white/70">{k}</p>
                            </div>
                        ))}
                    </div>
                }
                title={
                    <>
                        {t('Credit that is')} <Hl>{t('fair, fast')}</Hl> {t('and simple')}
                    </>
                }
            >
                {t('We help people get the money they need for life’s expenses, with clear conditions and no paperwork marathons.')}
            </PageHero>

            <section className="py-20 md:py-28">
                <div className="container-page grid items-center gap-14 lg:grid-cols-2">
                    <SectionHeading eyebrow={t('Our story')} title={t('Born to make credit simple for everyone')}>
                        {t(
                            'Too many people are turned away by banks because of long forms, rigid rules or a thin credit history. We built a lender that looks at your real situation, answers quickly and explains every number.',
                        )}
                    </SectionHeading>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 rounded-[28px] bg-navy p-8 text-white">
                            <Icon name="target" size={36} className="text-azure" />
                            <h3 className="mt-5 text-2xl font-bold">{t('Our mission')}</h3>
                            <p className="mt-2 text-sm leading-relaxed text-white/70">
                                {t('Give every hard-working person access to responsible credit that helps them grow, not drown.')}
                            </p>
                        </div>
                        <div className="rounded-[28px] bg-azure p-7 text-navy">
                            <Icon name="rocket" size={30} />
                            <h3 className="mt-4 text-lg font-bold">{t('Our vision')}</h3>
                            <p className="mt-1 text-sm text-navy/75">{t('The most trusted digital lender in Latin America.')}</p>
                        </div>
                        <div className="rounded-[28px] bg-card p-7 ring-1 ring-border">
                            <Icon name="users" size={30} className="text-navy" />
                            <h3 className="mt-4 text-lg font-bold text-navy">{t('Our team')}</h3>
                            <p className="mt-1 text-sm text-muted-foreground">{t('Credit analysts and support staff in both countries.')}</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-16 md:py-24">
                <div className="container-page">
                    <StatsShowcase />
                </div>
            </section>

            <section className="py-20 md:py-28">
                <div className="container-page">
                    <SectionHeading eyebrow={t('Our values')} title={t('What you can always expect from us')} align="center" />
                    <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        {values.map((v, i) => (
                            <article key={v.title} className={cn('rounded-[28px] p-7', i === 1 ? 'bg-azure text-navy' : 'bg-card ring-1 ring-border')}>
                                <span className={cn('grid size-12 place-items-center rounded-2xl', i === 1 ? 'bg-navy text-azure' : 'bg-azure-soft text-navy')}>
                                    <Icon name={v.icon} size={22} />
                                </span>
                                <h3 className="mt-6 text-lg font-bold text-navy">{v.title}</h3>
                                <p className={cn('mt-2 text-sm leading-relaxed', i === 1 ? 'text-navy/75' : 'text-muted-foreground')}>{v.text}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="relative overflow-hidden bg-navy py-20 text-white md:py-28">
                <Glow />
                <div className="container-page relative">
                    <SectionHeading
                        eyebrow={t('How we lend')}
                        title={
                            <>
                                {t('Local lending,')} <Hl>{t('one standard')}</Hl>
                            </>
                        }
                        dark
                    />
                    <div className="mt-12 grid gap-6 md:grid-cols-2">
                        {offices.map((o) => (
                            <div key={o.title} className="flex items-start gap-5 rounded-[28px] border border-white/10 bg-white/5 p-8">
                                <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-azure text-navy">
                                    <Icon name={o.icon} size={26} />
                                </span>
                                <div>
                                    <h3 className="text-xl font-bold">{o.title}</h3>
                                    <p className="mt-2 text-sm text-white/70">{o.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-12">
                        <PillLink href="/apply">{t('Apply now')}</PillLink>
                    </div>
                </div>
            </section>
        </>
    );
}

About.layout = siteLayout;
