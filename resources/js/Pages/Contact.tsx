import { Head, useForm, usePage } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { Button } from '@/components/glint/button';
import { Label } from '@/components/glint/label';
import { Select } from '@/components/glint/select';
import { Field, TextArea } from '@/components/public/Field';
import { Hl, PageHero } from '@/components/site';
import { openChat } from '@/components/ChatWidget';
import { Icon } from '@/icons/icon';
import { siteLayout } from '@/Layouts/SiteLayout';
import { useT, visitorCountry } from '@/lib/i18n';
import type { SharedProps } from '@/types';

export default function Contact() {
    const { app } = usePage<SharedProps>().props;
    const t = useT();
    const form = useForm({ name: '', email: '', phone: '', country: visitorCountry() ?? '', amount: '', message: '' });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.post('/contact', { preserveScroll: true, onSuccess: () => form.reset() });
    };

    const cards = [
        { icon: 'mail', label: t('Email us'), value: app.email, href: `mailto:${app.email}` },
        app.phone && { icon: 'phone-call', label: t('Call us'), value: app.phone, href: `tel:${app.phone.replace(/\s/g, '')}` },
        { icon: 'clock', label: t('Business hours'), value: t('Mon–Fri, 8:00–18:00') },
        { icon: 'map-pin', label: t('Offices'), value: 'Buenos Aires · Bogotá' },
    ].filter(Boolean) as { icon: string; label: string; value: string; href?: string }[];

    return (
        <>
            <Head title={t('Contact')} />
            <PageHero
                eyebrow={t('Contact')}
                image={['/images/3d/contact-phone.webp', '/images/3d/contact-people.webp']}
                bg="bg-[linear-gradient(120deg,#0b2a5c_0%,#1554a8_50%,#0b2a5c_100%)]"
                extra={
                    <>
                        <div className="flex flex-wrap justify-center gap-3">
                            {app.phone && (
                                <a
                                    href={`tel:${app.phone.replace(/\s/g, '')}`}
                                    className="flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-navy transition-colors hover:bg-azure"
                                >
                                    <Icon name="phone-call" size={16} /> {t('Call us')}
                                </a>
                            )}
                            <button
                                type="button"
                                onClick={openChat}
                                className="flex items-center gap-2 rounded-full bg-[#2563eb] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1d4fd8]"
                            >
                                <Icon name="chat-round" size={18} /> {t('Live chat')}
                            </button>
                            <a
                                href={`mailto:${app.email}`}
                                className="flex items-center gap-2 rounded-full border border-white/30 px-5 py-3 text-sm font-medium transition-colors hover:bg-white/10"
                            >
                                <Icon name="mail" size={16} /> {t('Email us')}
                            </a>
                        </div>
                        <p className="mt-5 flex items-center justify-center gap-2 text-xs text-white/70">
                            <span className="relative flex size-2">
                                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
                            </span>
                            {t('Mon–Fri, 8:00–18:00')}
                        </p>
                    </>
                }
                title={
                    <>
                        {t('Let’s talk about')} <Hl>{t('your loan')}</Hl>
                    </>
                }
            >
                {t('Send us your question and we will reply within one business day.')}
            </PageHero>
            <section className="py-20 md:py-28">
                <div className="container-page grid gap-10 lg:grid-cols-[1fr_1.4fr]">
                    <div className="grid h-fit gap-4">
                        {cards.map((c) => {
                            const body = (
                                <>
                                    <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-azure text-navy">
                                        <Icon name={c.icon} size={22} />
                                    </span>
                                    <span>
                                        <span className="block text-xs text-muted-foreground">{c.label}</span>
                                        <span className="font-semibold text-navy">{c.value}</span>
                                    </span>
                                </>
                            );
                            return c.href ? (
                                <a key={c.label} href={c.href} className="flex items-center gap-4 rounded-2xl bg-card p-5 ring-1 ring-border transition-shadow hover:shadow-lg">
                                    {body}
                                </a>
                            ) : (
                                <div key={c.label} className="flex items-center gap-4 rounded-2xl bg-card p-5 ring-1 ring-border">
                                    {body}
                                </div>
                            );
                        })}
                        <button type="button" onClick={openChat} className="flex items-center gap-4 rounded-2xl bg-navy p-5 text-left text-white transition-colors hover:bg-navy-soft">
                            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#2563eb]">
                                <Icon name="chat-round" size={24} />
                            </span>
                            <span className="flex-1">
                                <span className="block text-xs text-white/60">{t('Prefer chat?')}</span>
                                <span className="font-semibold">{t('Chat with our team now')}</span>
                            </span>
                            <Icon name="arrow-right" size={20} className="text-azure" />
                        </button>
                    </div>

                    <form onSubmit={submit} className="grid gap-5 rounded-[28px] bg-card p-6 ring-1 ring-border md:p-10" noValidate>
                        <h2 className="text-2xl font-bold text-navy">{t('Send us a message')}</h2>
                        <div className="grid gap-5 md:grid-cols-2">
                            <Field
                                label={t('Full name')}
                                required
                                value={form.data.name}
                                onChange={(e) => form.setData('name', e.target.value)}
                                error={form.errors.name}
                                autoComplete="name"
                            />
                            <Field
                                label={t('Email')}
                                type="email"
                                required
                                value={form.data.email}
                                onChange={(e) => form.setData('email', e.target.value)}
                                error={form.errors.email}
                                autoComplete="email"
                            />
                            <Field
                                label={t('Phone')}
                                type="tel"
                                value={form.data.phone}
                                onChange={(e) => form.setData('phone', e.target.value)}
                                error={form.errors.phone}
                                autoComplete="tel"
                            />
                            <div className="grid gap-2">
                                <Label htmlFor="contact-country">{t('Country')}</Label>
                                <Select
                                    id="contact-country"
                                    name="country"
                                    placeholder={t('Select your country')}
                                    value={form.data.country}
                                    onValueChange={(v) => form.setData('country', v)}
                                    options={[
                                        { value: 'AR', label: 'Argentina' },
                                        { value: 'CO', label: 'Colombia' },
                                    ]}
                                />
                                {form.errors.country && <p className="text-xs text-destructive">{form.errors.country}</p>}
                            </div>
                        </div>
                        <Field
                            label={t('How much would you like to borrow?')}
                            inputMode="numeric"
                            value={form.data.amount}
                            onChange={(e) => form.setData('amount', e.target.value)}
                            error={form.errors.amount}
                        />
                        <TextArea label={t('Message')} required value={form.data.message} onChange={(e) => form.setData('message', e.target.value)} error={form.errors.message} />
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <p className="text-xs text-muted-foreground">{t('We only use your details to answer your message.')}</p>
                            <Button type="submit" size="lg" loading={form.processing} endIcon={<Icon name="send" />} className="rounded-full">
                                {t('Send message')}
                            </Button>
                        </div>
                    </form>
                </div>
            </section>
        </>
    );
}

Contact.layout = siteLayout;
