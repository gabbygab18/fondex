import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/glint/button';
import { PageHero } from '@/components/site';
import { Icon } from '@/icons/icon';
import { siteLayout } from '@/Layouts/SiteLayout';
import { money } from '@/lib/format';
import { useT } from '@/lib/i18n';
import type { SharedProps } from '@/types';

interface Props extends SharedProps {
    loan: { id: number; reference: string; currency: string };
    amount: number;
    confirmUrl: string;
}

/** Built-in test checkout used until the client connects a real payment gateway (PAYMENT_GATEWAY=sandbox). */
export default function Sandbox() {
    const { loan, amount, confirmUrl, locale, app } = usePage<Props>().props;
    const t = useT();
    const [paying, setPaying] = useState(false);

    return (
        <>
            <Head title={t('Checkout')} />
            <PageHero eyebrow={t('Secure checkout')} title={t('Pay :ref', { ref: loan.reference })} />
            <section className="py-14 md:py-20">
                <div className="container-page">
                    <div className="mx-auto max-w-md overflow-hidden rounded-[28px] bg-card shadow-2xl shadow-navy/10 ring-1 ring-border">
                        <p className="flex items-center justify-center gap-2 bg-amber-100 px-4 py-2.5 text-xs font-semibold text-amber-800">
                            <Icon name="warning" size={15} /> {t('Test mode — no real money is charged')}
                        </p>
                        <div className="p-7">
                            <p className="text-sm text-muted-foreground">{t('Amount to pay')}</p>
                            <p className="mt-1 font-display text-4xl font-bold text-navy">{money(amount, loan.currency, locale)}</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {app.name} · {loan.reference}
                            </p>

                            {/* Card preview: decorative, nothing is typed or stored. */}
                            <div aria-hidden className="relative mt-7 aspect-[1.6] overflow-hidden rounded-2xl bg-gradient-to-br from-navy-soft via-navy to-navy-deep p-5 text-white shadow-xl">
                                <span className="absolute -right-10 -top-10 size-40 rounded-full bg-azure/25 blur-2xl" />
                                <div className="relative flex h-full flex-col justify-between">
                                    <div className="flex items-center justify-between">
                                        <span className="h-7 w-10 rounded-md bg-gradient-to-br from-amber-200 to-amber-400" />
                                        <span className="text-sm font-semibold tracking-wider">TEST</span>
                                    </div>
                                    <p className="font-mono text-lg tracking-[0.2em]">4242 4242 4242 4242</p>
                                    <div className="flex justify-between text-xs text-white/70">
                                        <span>{t('Card holder')}</span>
                                        <span>12/34</span>
                                    </div>
                                </div>
                            </div>

                            <Button
                                size="lg"
                                className="mt-7 w-full rounded-full"
                                loading={paying}
                                onClick={() => {
                                    setPaying(true);
                                    router.post(confirmUrl, {}, { onFinish: () => setPaying(false) });
                                }}
                                startIcon={<Icon name="lock" />}
                            >
                                {t('Pay :amount', { amount: money(amount, loan.currency, locale) })}
                            </Button>
                            <Link href={`/account/loans/${loan.id}?payment=cancelled`} className="mt-4 block text-center text-sm text-muted-foreground hover:text-navy">
                                {t('Cancel and go back')}
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}

Sandbox.layout = siteLayout;
