import { Head, usePage } from '@inertiajs/react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/glint/accordion';
import { Hl, PageHero, PillLink } from '@/components/site';
import { Icon } from '@/icons/icon';
import { siteLayout } from '@/Layouts/SiteLayout';
import { useT } from '@/lib/i18n';
import type { SharedProps } from '@/types';

export default function Faqs() {
    const { app } = usePage<SharedProps>().props;
    const t = useT();
    // Same list as the FAQPage structured data (App\Support\Seo::FAQS), already translated.
    const { faqs } = usePage<{ faqs: [string, string][] }>().props;

    return (
        <>
            <Head title={t('FAQs')} />
            <PageHero
                eyebrow={t('FAQs')}
                image="/images/3d/faq.webp"
                layout="stacked"
                bg="bg-[radial-gradient(ellipse_at_50%_0%,#2a6fd6_0%,#0f3577_55%,#081d45_100%)]"
                title={
                    <>
                        {t('Questions?')} <Hl>{t('We have answers')}</Hl>
                    </>
                }
            >
                {t('Everything you need to know about applying, rates and repayments.')}
            </PageHero>
            <section className="py-20 md:py-28">
                <div className="container-page grid gap-12 lg:grid-cols-[1fr_2fr]">
                    <aside className="h-fit rounded-[28px] bg-navy p-8 text-white lg:sticky lg:top-32">
                        <Icon name="chat-question" size={40} className="text-azure" />
                        <h2 className="mt-6 text-2xl font-bold">{t('Still have questions?')}</h2>
                        <p className="mt-3 text-sm text-white/70">{t('Our team answers by email, phone or live chat in Spanish and English.')}</p>
                        <div className="mt-8 flex flex-wrap gap-3">
                            <PillLink href="/contact">{t('Contact us')}</PillLink>
                        </div>
                        {app.phone && (
                            <p className="mt-6 flex items-center gap-2 text-sm text-white/70">
                                <Icon name="phone" size={16} className="text-azure" /> {app.phone}
                            </p>
                        )}
                    </aside>
                    <Accordion type="single" collapsible defaultValue={['q0']} className="rounded-[28px] bg-card px-6 ring-1 ring-border md:px-8">
                        {faqs.map(([q, a], i) => (
                            <AccordionItem key={q} value={`q${i}`}>
                                <AccordionTrigger className="py-5 text-base font-semibold text-navy">{q}</AccordionTrigger>
                                <AccordionContent>
                                    <p className="pb-5 text-sm leading-relaxed text-muted-foreground">{a}</p>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            </section>
        </>
    );
}

Faqs.layout = siteLayout;
