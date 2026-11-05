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
    const faqs = [
        [
            t('Who can apply for a loan?'),
            t('Anyone 18 or older who lives in a country where we operate, has a valid national ID, a verifiable income and a bank account in their name.'),
        ],
        [
            t('How much can I borrow?'),
            t('It depends on your country and your income. You can see the current minimum and maximum amounts on our Loans page and try them in the calculator.'),
        ],
        [
            t('What interest rate will I pay?'),
            t(
                'Your rate depends on your profile and your application. It is charged once on the amount you borrow, and we confirm your exact rate and total to repay when we approve your loan, before any money is sent.',
            ),
        ],
        [t('How long can I borrow for?'), t('From 1 to 3 months. You choose to pay daily, weekly or fortnightly, in equal payments.')],
        [t('How long does it take to get an answer?'), t('Most applications get a decision within 24 hours on business days. We email you as soon as the status changes.')],
        [
            t('Which documents do I need?'),
            t('A photo or scan of your ID (front, and back if it has one) and a recent proof of income such as a payslip, bank statement or tax return.'),
        ],
        [
            t('How do I repay the loan?'),
            t(
                'In equal daily, weekly or fortnightly payments. Pay online from your account, or by bank transfer, cash or local payment apps. We email you a reminder before each due date.',
            ),
        ],
        [t('Can I pay off my loan early?'), t('Yes. You can make extra payments or pay the full balance at any time without penalties.')],
        [t('What happens if I miss a payment?'), t('Contact us right away. We will look for a solution with you. Late installments are marked as overdue in your account.')],
        [t('Can I track my application?'), t('Yes. Create an account, and you will see the status of every application, your loans and your payment schedule.')],
        [
            t('Is my personal information safe?'),
            t('Yes. Documents are stored privately and encrypted, only our credit team can see them, and we never sell your data. Read our Privacy Policy for details.'),
        ],
    ];

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
