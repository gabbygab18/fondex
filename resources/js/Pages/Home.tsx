import { useGSAP } from '@gsap/react';
import { Head, Link } from '@inertiajs/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'motion/react';
import { useRef, type ReactNode } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/glint/accordion';
import { KineticTestimonials } from '@/components/glint/kinetic-testimonials';
import { GridBackground } from '@/components/glint/grid-background';
import { WordCycle } from '@/components/glint/word-cycle';
import { LoanProductCards } from '@/components/home/LoanProductCards';
import { LoanCalculator } from '@/components/LoanCalculator';
import { StatsShowcase } from '@/components/StatsShowcase';
import { Eyebrow, G, GridLines, initialsAvatar, MockCard, PillLink, Rails, Title } from '@/components/site';
import { Icon } from '@/icons/icon';
import { siteLayout } from '@/Layouts/SiteLayout';
import { useT, visitorCountry } from '@/lib/i18n';
import { cn } from '@/lib/utils';

gsap.registerPlugin(useGSAP, ScrollTrigger);

const NO_REDUCED_MOTION = '(prefers-reduced-motion: no-preference)';
const css = '@keyframes bob{0%,100%{translate:0 0}50%{translate:0 -8px}}';

/** Fades content up the first time it scrolls into view (Motion). */
function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
    return (
        <motion.div
            className={className}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, delay, ease: [0.2, 0.7, 0.2, 1] }}
        >
            {children}
        </motion.div>
    );
}

function Stars({ size = 12 }: { size?: number }) {
    return (
        <span className="flex text-amber-400">
            {Array.from({ length: 5 }, (_, i) => <Icon key={i} name="star" size={size} />)}
        </span>
    );
}

function Hero() {
    const t = useT();
    const root = useRef<HTMLElement>(null);

    // GSAP: the floating cards rise into place one after another.
    useGSAP(
        () => {
            gsap.matchMedia().add(NO_REDUCED_MOTION, () => {
                gsap.from('[data-hero-card]', { y: 80, opacity: 0, duration: 1, stagger: 0.12, ease: 'power3.out', delay: 0.35 });
            });
        },
        { scope: root },
    );

    return (
        <div className="p-2 sm:p-4">
            <section ref={root} className="relative isolate overflow-hidden rounded-[2rem] bg-[radial-gradient(ellipse_at_75%_45%,#3a6fe0_0%,#1d4bb0_40%,#0f3577_80%)] px-4 pb-14 pt-28 text-white sm:px-8 sm:pt-32 lg:pb-20">
                <style>{css}</style>
                <GridBackground className="absolute inset-0 -z-10 size-full opacity-70" cellSize={64} color="#7cc4ff" lineColor="#23478f" density={0.06} speed={0.6} fade={0.9} />
                <div aria-hidden className="absolute -left-24 top-48 -z-10 h-96 w-64 rotate-[18deg] rounded-[3.5rem] bg-gradient-to-b from-white/10 to-white/0" />
                <div aria-hidden className="absolute -right-24 top-56 -z-10 h-96 w-64 -rotate-[18deg] rounded-[3.5rem] bg-gradient-to-b from-white/10 to-white/0" />

                <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_1fr]">
                    <Reveal className="relative text-center lg:text-left">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 py-1 pl-1 pr-3 text-[11px] backdrop-blur">
                            <span className="rounded-full bg-azure px-2 py-0.5 font-semibold text-navy">4.9 ★</span>
                            {t('Loans for')} <WordCycle words={[t('emergencies'), t('your home'), t('your studies'), t('your next step')]} interval={2200} className="font-semibold" />
                        </span>
                        <h1 className="mt-6 text-4xl font-medium leading-[1.12] tracking-tight sm:text-[3.4rem]">
                            {t('Borrow Smarter, Repay Easier,')} <span className="text-azure">{t('Every Step of the Way')}</span>
                        </h1>
                        <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-white/75 sm:text-base lg:mx-0">
                            {t('Short-term personal loans. Apply online in minutes, get a decision fast, and repay daily, weekly or fortnightly.')}
                        </p>
                        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                            <Link href="/apply" className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-navy transition-colors hover:bg-azure">
                                {t('Apply now')}
                            </Link>
                            <a href="#calculator" className="rounded-full border border-white/30 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10">
                                {t('Calculate my payment')}
                            </a>
                        </div>
                        <ul className="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-white/80 lg:justify-start">
                            {[t('Decision in 24h'), t('Secure & private'), t('No hidden fees')].map((x) => (
                                <li key={x} className="flex items-center gap-1.5">
                                    <Icon name="check-circle" className="text-azure" /> {x}
                                </li>
                            ))}
                        </ul>
                    </Reveal>

                    {/* 3D illustration on a soft glow, with two small cards floating over it. */}
                    <div className="relative mx-auto w-full max-w-md lg:max-w-none">
                        <div aria-hidden className="absolute inset-[7%] -z-10 rounded-full bg-white/10 ring-1 ring-white/15" />
                        <div aria-hidden className="absolute inset-[20%] -z-10 rounded-full bg-azure/40 blur-3xl" />
                        <img src="/images/3d/house-cash.webp" alt="" width={1187} height={1200} className="w-full drop-shadow-[0_30px_40px_rgba(4,17,46,.35)]" />
                        <div data-hero-card className="absolute bottom-[12%] left-0 hidden w-60 sm:block" style={{ animation: 'bob 5s ease-in-out -1s infinite' }}>
                            <MockCard className="flex items-center gap-2 rounded-xl py-2.5">
                                <span className="grid size-7 place-items-center rounded-full bg-azure text-navy">
                                    <Icon name="banknote" size={14} />
                                </span>
                                <span className="text-xs">
                                    <span className="block text-[10px] text-muted-foreground">{t('Received')}</span>
                                    <b className="font-bold">{visitorCountry() === 'CO' ? 'COP 8.000.000' : 'ARS 2.500.000'}</b>
                                </span>
                                <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">{t('Today')}</span>
                            </MockCard>
                        </div>
                        <div data-hero-card className="absolute right-0 top-[6%] hidden w-56 sm:block" style={{ animation: 'bob 5s ease-in-out -3s infinite' }}>
                            <MockCard className="flex items-center gap-2 rounded-xl py-2.5">
                                <span className="flex -space-x-2">
                                    {['Martina F', 'Santiago R'].map((n, i) => (
                                        <img key={n} src={initialsAvatar(n, ['#0b2a5c', '#2563eb'][i])} alt="" className="size-7 rounded-full ring-2 ring-white" />
                                    ))}
                                </span>
                                <span className="text-xs leading-tight">
                                    <b className="block">12K+</b>
                                    <span className="text-[10px] text-muted-foreground">{t('Trusted borrowers')}</span>
                                </span>
                                <span className="ml-auto">
                                    <Stars size={10} />
                                </span>
                            </MockCard>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

function About() {
    const t = useT();
    const rows = [
        [t('Fast'), t('Apply online in minutes and get a decision, usually within 24 hours.')],
        [t('Flexible'), t('Choose your amount and term. Pay early at any time without penalties.')],
        [t('Fair'), t('One clear rate, no hidden fees. You see the total cost before you sign.')],
    ];
    return (
        <section className="relative isolate mx-auto max-w-6xl px-4 py-24">
            <GridLines />
            <Reveal className="text-center">
                <Eyebrow>{t('About us')}</Eyebrow>
                <Title>
                    {t('Comprehensive and Smart')}
                    <br /> <G>{t('Loan Solutions')}</G>
                </Title>
                <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground">
                    {t('We help people get the money they need for life’s expenses, with clear conditions and no paperwork marathons.')}
                </p>
            </Reveal>
            <div className="mt-14 grid items-center gap-16 lg:grid-cols-2">
                <Reveal className="relative">
                    <div className="relative mx-auto aspect-[4/3] w-full">
                        <div aria-hidden className="absolute inset-y-[4%] left-1/2 aspect-square -translate-x-1/2 rounded-full bg-[#dce8fb]" />
                        <img src="/images/3d/loan.webp" alt="" width={1077} height={1200} loading="lazy" className="relative mx-auto h-full w-auto drop-shadow-xl transition-transform duration-500 ease-out hover:scale-110 hover:-rotate-3" style={{ animation: 'bob 6s ease-in-out infinite' }} />
                    </div>
                    <div className="absolute -bottom-8 right-3 grid w-56 grid-cols-2 gap-2 rounded-2xl bg-navy p-3 text-white shadow-2xl sm:-right-6 sm:w-64">
                        {[
                            ['92%', t('Approval rate')],
                            ['24h', t('Typical decision')],
                            ['10K+', t('Loans funded')],
                            ['4.9', t('Average rating')],
                        ].map(([v, k]) => (
                            <div key={k} className="rounded-xl bg-white/10 p-2.5">
                                <p className="text-[10px] text-white/60">{k}</p>
                                <p className="font-display text-lg font-bold text-azure">{v}</p>
                            </div>
                        ))}
                    </div>
                </Reveal>
                <Reveal delay={0.1}>
                    <h3 className="text-2xl font-medium tracking-tight text-navy">{t('Smarter lending')}</h3>
                    <ul className="mt-6 grid gap-5">
                        {rows.map(([label, text]) => (
                            <li key={label} className="flex items-start gap-4">
                                <span className="w-24 shrink-0 rounded-lg bg-secondary px-3 py-2 text-center text-xs font-semibold text-navy">{label}</span>
                                <p className="text-sm leading-relaxed text-muted-foreground">{text}</p>
                            </li>
                        ))}
                    </ul>
                    <div className="mt-8">
                        <PillLink href="/about" dark>{t('More about us')}</PillLink>
                    </div>
                </Reveal>
            </div>
        </section>
    );
}

function Products() {
    const t = useT();
    return (
        <section className="relative isolate mx-auto max-w-5xl px-4 py-20 text-center">
            <GridLines />
            <Reveal>
                <Eyebrow>{t('Our loans')}</Eyebrow>
                <Title>
                    {t('Simple Loans Built for')} <G>{t('Real Life')}</G>
                </Title>
            </Reveal>
            <Reveal delay={0.1} className="mt-10">
                <LoanProductCards />
            </Reveal>
        </section>
    );
}

function Tools() {
    const t = useT();
    return (
        <section className="mx-auto max-w-6xl px-4 py-12">
            <div className="rounded-[2rem] bg-white px-5 py-16 ring-1 ring-border sm:px-10">
                <Reveal className="text-center">
                    <Eyebrow>{t('How we help')}</Eyebrow>
                    <Title>
                        {t('Tools That Make Borrowing')} <G>{t('Easy')}</G>
                    </Title>
                    <p className="mx-auto mt-4 max-w-lg text-sm text-muted-foreground">{t('Everything happens online, from the first question to the last installment.')}</p>
                </Reveal>
                <div className="mt-12 grid gap-5 md:grid-cols-2">
                    <Reveal className="rounded-3xl bg-muted/60 p-6">
                        <MockCard className="mx-auto max-w-sm">
                            <div className="flex items-center justify-between text-xs">
                                <b>{t('Your application')}</b>
                                <span className="text-muted-foreground">{t(':n of :total done', { n: 3, total: 4 })}</span>
                            </div>
                            <ul className="mt-3 grid gap-2 text-xs">
                                {[t('Loan details'), t('About you'), t('Documents'), t('Decision')].map((s, i) => (
                                    <li key={s} className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2">
                                        <Icon name={i < 3 ? 'check-circle' : 'clock'} className={i < 3 ? 'text-[#2563eb]' : 'text-amber-500'} />
                                        {s}
                                    </li>
                                ))}
                            </ul>
                        </MockCard>
                        <h3 className="mt-6 text-lg font-medium text-navy">{t('Online application')}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{t('Three short steps, about five minutes, from your phone or computer.')}</p>
                    </Reveal>
                    <Reveal delay={0.08} className="rounded-3xl bg-muted/60 p-6">
                        <MockCard className="mx-auto max-w-sm">
                            <div className="flex items-center justify-between text-xs">
                                <b>{t('Repayment plan')}</b>
                                <span className="rounded-full bg-azure px-2 py-0.5 text-[10px] font-semibold text-navy">67%</span>
                            </div>
                            <svg viewBox="0 0 200 70" className="mt-3 h-24 w-full" aria-hidden>
                                <defs>
                                    <linearGradient id="area" x1="0" x2="0" y1="0" y2="1">
                                        <stop offset="0" stopColor="#2563eb" stopOpacity=".35" />
                                        <stop offset="1" stopColor="#2563eb" stopOpacity="0" />
                                    </linearGradient>
                                </defs>
                                <path d="M0 62 C30 58 45 50 70 44 S120 30 140 22 S180 10 200 6 V70 H0Z" fill="url(#area)" />
                                <path d="M0 62 C30 58 45 50 70 44 S120 30 140 22 S180 10 200 6" fill="none" stroke="#2563eb" strokeWidth="2.5" />
                            </svg>
                        </MockCard>
                        <h3 className="mt-6 text-lg font-medium text-navy">{t('Clear repayment plan')}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{t('See every due date, what you paid and what is left, anytime.')}</p>
                    </Reveal>
                    <Reveal className="rounded-3xl bg-muted/60 p-6">
                        <MockCard className="mx-auto max-w-sm">
                            <b className="text-xs">{t('Documents')}</b>
                            <ul className="mt-3 grid gap-2 text-xs">
                                {[
                                    ['id-card', t('ID — front')],
                                    ['file-text', t('Proof of income')],
                                ].map(([icon, label]) => (
                                    <li key={label} className="flex items-center gap-2 rounded-xl border px-3 py-2.5">
                                        <Icon name={icon} className="text-[#2563eb]" /> {label}
                                        <Icon name="lock" className="ml-auto text-muted-foreground" />
                                    </li>
                                ))}
                            </ul>
                        </MockCard>
                        <h3 className="mt-6 text-lg font-medium text-navy">{t('Secure documents')}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{t('Your documents are stored encrypted and only our credit team can see them.')}</p>
                    </Reveal>
                    <Reveal delay={0.08} className="rounded-3xl bg-muted/60 p-6">
                        <MockCard className="mx-auto max-w-sm">
                            <ul className="grid gap-2 text-xs">
                                {[
                                    ['mail', t('Application received'), t('2 min ago')],
                                    ['badge-check', t('Loan approved'), t('Today')],
                                    ['bell', t('Payment reminder'), t('In 3 days')],
                                ].map(([icon, label, when]) => (
                                    <li key={label} className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2">
                                        <span className="grid size-6 place-items-center rounded-full bg-navy text-azure">
                                            <Icon name={icon} size={12} />
                                        </span>
                                        {label}
                                        <span className="ml-auto text-[10px] text-muted-foreground">{when}</span>
                                    </li>
                                ))}
                            </ul>
                        </MockCard>
                        <h3 className="mt-6 text-lg font-medium text-navy">{t('Updates at every step')}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{t('We email you when your status changes, and remind you before each due date.')}</p>
                    </Reveal>
                </div>
            </div>
        </section>
    );
}

function Calculator() {
    const t = useT();
    return (
        <section id="calculator" className="relative isolate mx-auto max-w-6xl scroll-mt-8 px-4 py-24">
            <GridLines />
            <Reveal className="text-center">
                <Eyebrow>{t('Loan calculator')}</Eyebrow>
                <Title>
                    {t('See Your Payments')} <G>{t('Before You Apply')}</G>
                </Title>
                <p className="mx-auto mt-4 max-w-lg text-sm text-muted-foreground">{t('Pick an amount, a term of 1 to 3 months and how often you want to pay. No sign-up, no impact on your credit score.')}</p>
            </Reveal>
            <Reveal delay={0.1} className="relative mt-12">
                <LoanCalculator />
            </Reveal>
        </section>
    );
}

function Steps() {
    const t = useT();
    const root = useRef<HTMLElement>(null);
    const steps = [
        [t('Apply'), t('Tell us how much you need and upload your ID and proof of income.'), 'calculator', '#dce8fb'],
        [t('Get approved'), t('Our team reviews it and emails you, usually within 24 hours.'), 'approved', '#d9f5e6'],
        [t('Receive your money'), t('Funds go to your bank account; track every payment online.'), 'card', '#fff1c2'],
    ];

    // GSAP: the dashboard mock tilts up into place as the section scrolls into view.
    useGSAP(
        () => {
            gsap.matchMedia().add(NO_REDUCED_MOTION, () => {
                gsap.from('.steps-dash', { y: 120, opacity: 0, rotateX: 18, ease: 'power2.out', scrollTrigger: { trigger: root.current, start: 'top 75%', end: 'center 60%', scrub: 0.6 } });
            });
        },
        { scope: root },
    );

    return (
        <div className="p-2 sm:p-4">
            <section ref={root} className="relative isolate overflow-hidden rounded-[2rem] bg-[radial-gradient(ellipse_at_50%_0%,#163f86_0%,#0b2a5c_45%,#061a3d_100%)] px-4 pt-20 text-white">
                <GridBackground className="absolute inset-0 -z-10 size-full opacity-50" cellSize={64} color="#7cc4ff" lineColor="#1b3f80" density={0.04} speed={0.5} fade={0.85} />
                <Reveal className="mx-auto max-w-2xl text-center">
                    <Eyebrow dark>{t('How it works')}</Eyebrow>
                    <h2 className="mt-4 text-3xl font-medium leading-tight tracking-tight sm:text-[2.6rem]">
                        {t('Simple Steps to Get')} <span className="text-azure">{t('Your Loan')}</span>
                    </h2>
                </Reveal>
                <ol className="mx-auto mt-12 grid max-w-4xl gap-8 sm:grid-cols-3">
                    {steps.map(([title, text, img, bg], i) => (
                        <li key={title}>
                            <Reveal delay={i * 0.1} className="text-center">
                                <span className="group relative mx-auto grid size-40 place-items-center rounded-full" style={{ background: bg }}>
                                    <img src={`/images/3d/${img}.webp`} alt="" loading="lazy" className="w-32 drop-shadow-xl transition-transform duration-500 ease-out group-hover:scale-115 group-hover:-rotate-6" />
                                    <span className="absolute right-0 top-1 grid size-9 place-items-center rounded-full bg-azure font-display font-bold text-navy">{i + 1}</span>
                                </span>
                                <h3 className="mt-5 font-medium">{title}</h3>
                                <p className="mx-auto mt-1 max-w-56 text-xs leading-relaxed text-white/60">{text}</p>
                            </Reveal>
                        </li>
                    ))}
                </ol>
                <div className="relative mx-auto mt-14 max-w-4xl [perspective:1200px]">
                    <div className="steps-dash rounded-t-3xl bg-white p-5 text-navy shadow-2xl">
                        <div className="flex items-center justify-between">
                            <b className="text-sm">{t('Repayment schedule')}</b>
                            <span className="rounded-full bg-azure px-3 py-1 text-xs font-semibold">56% {t('Repaid')}</span>
                        </div>
                        <div className="mt-4 overflow-hidden rounded-2xl border">
                            {[
                                ['1', '06/08/2026', 'paid'],
                                ['2', '06/09/2026', 'paid'],
                                ['3', '06/10/2026', 'paid'],
                                ['4', '06/11/2026', 'upcoming'],
                            ].map(([n, d, s]) => (
                                <div key={n} className="flex items-center gap-2 whitespace-nowrap border-b px-3 py-3 text-[11px] last:border-0 sm:gap-4 sm:px-4 sm:text-xs">
                                    <span className="text-muted-foreground">#{n}</span>
                                    <span className="flex-1">{d}</span>
                                    <b className="tabular-nums">{visitorCountry() === 'CO' ? 'COP 554.360' : 'ARS 173.238'}</b>
                                    <span className={cn('rounded-full px-2.5 py-0.5 text-[10px] font-semibold', s === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700')}>
                                        {s === 'paid' ? t('Paid') : t('Upcoming')}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

function Benefits() {
    const t = useT();
    const items = [
        ['receipt', t('No hidden fees'), t('You see the rate, the installment and the total cost before you sign.')],
        ['rotate-ccw', t('Early repayment'), t('Pay extra or settle the full balance at any time, without penalties.')],
        ['chat-round', t('Human support'), t('Real people answer you by email, phone or live chat in Spanish and English.')],
        ['shield-check', t('Private and secure'), t('Encrypted documents, and we never sell your data.')],
    ];
    return (
        <section className="relative isolate mx-auto max-w-6xl px-4 py-24">
            <GridLines />
            <Reveal className="text-center">
                <Eyebrow>{t('Why choose us')}</Eyebrow>
                <Title>
                    {t('Lending Built Around')} <G>{t('Your Growth')}</G>
                </Title>
            </Reveal>
            <div className="mt-12 grid gap-4 lg:grid-cols-3">
                <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
                    {items.map(([icon, title, text], i) => (
                        <Reveal key={title} delay={(i % 2) * 0.08} className="rounded-3xl bg-white p-6 ring-1 ring-border">
                            <span className="grid size-11 place-items-center rounded-full bg-secondary text-navy">
                                <Icon name={icon} size={20} />
                            </span>
                            <h3 className="mt-5 font-medium text-navy">{title}</h3>
                            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{text}</p>
                        </Reveal>
                    ))}
                </div>
                <Reveal delay={0.16} className="relative overflow-hidden rounded-3xl bg-navy p-7 text-white">
                    <span aria-hidden className="absolute -right-16 -top-16 size-56 rounded-full bg-azure/20 blur-3xl" />
                    <span className="relative grid size-11 place-items-center rounded-full bg-azure text-navy">
                        <Icon name="lightning" size={20} />
                    </span>
                    <h3 className="relative mt-5 text-2xl font-medium">{t('Decision in 24 hours')}</h3>
                    <p className="relative mt-2 text-sm leading-relaxed text-white/70">{t('Most applications get a decision within 24 hours on business days. We email you as soon as the status changes.')}</p>
                    <div className="relative mt-8 grid gap-2">
                        {[t('Application received'), t('Under review'), t('Loan approved')].map((s, i) => (
                            <span key={s} className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2.5 text-xs">
                                <Icon name={i < 2 ? 'check-circle' : 'badge-check'} className="text-azure" /> {s}
                            </span>
                        ))}
                    </div>
                    <div className="relative mt-8">
                        <PillLink href="/apply">{t('Apply now')}</PillLink>
                    </div>
                </Reveal>
            </div>
        </section>
    );
}

function Numbers() {
    const t = useT();
    return (
        <section className="mx-auto max-w-6xl px-4 py-16">
            <StatsShowcase />
        </section>
    );
}

function Testimonials() {
    const t = useT();
    const people = [
        { name: 'Martina Fernández', title: t('Teacher, Córdoba'), quote: t('My fridge broke in the middle of summer and I had the money in two days. The weekly payments fit my salary and the team answered every question in the chat.') },
        { name: 'Santiago Rojas', title: t('Graphic designer, Medellín'), quote: t('The calculator showed me exactly what I would pay each week. No surprises, no hidden fees. I already recommended them to my brother.') },
        { name: 'Camila Herrera', title: t('Nurse, Bogotá'), quote: t('I consolidated three credit cards into one loan and now I pay much less every month. Uploading my documents from my phone was easy.') },
        { name: 'Joaquín Pérez', title: t('Mechanic, Rosario'), quote: t('I needed money for my daughter’s dental treatment and the bank said no. Here a real person looked at my case and approved it in one day.') },
        { name: 'Valentina López', title: t('Student, Cali'), quote: t('I paid my last semester with a small loan. The app reminds me of every installment, so I have never been late.') },
        { name: 'Mateo Díaz', title: t('Electrician, Mendoza'), quote: t('My car needed a repair before a long trip. Fast, clear and friendly: they explained every number before I signed, and answered in the chat on a Saturday.') },
    ];
    return (
        <section className="relative isolate overflow-hidden py-24">
            <div className="mx-auto flex max-w-6xl flex-col justify-between gap-6 px-4 md:flex-row md:items-end">
                <Reveal>
                    <Eyebrow>{t('Testimonials')}</Eyebrow>
                    <Title>
                        {t('Real stories,')} <G>{t('real results')}</G>
                    </Title>
                </Reveal>
                <Reveal delay={0.1} className="flex items-center gap-3 text-sm">
                    <span className="font-display text-3xl font-bold text-navy">4.9</span>
                    <span>
                        <Stars size={14} />
                        <span className="text-muted-foreground">{t('Based on 5,200+ reviews')}</span>
                    </span>
                </Reveal>
            </div>
            {/* Same Glint KineticTestimonials setup as the portfolio: one straight drifting row, initials instead of pictures. */}
            <Reveal delay={0.15} className="mt-8">
                <KineticTestimonials rows={1} tilt={0} cardWidth={360} duration={70} className="py-10" testimonials={people} />
            </Reveal>
        </section>
    );
}

function Faq() {
    const t = useT();
    const faq = [
        [t('Who can apply for a loan?'), t('Anyone 18 or older who lives in a country where we operate, has a valid national ID, a verifiable income and a bank account in their name.')],
        [t('How much can I borrow?'), t('It depends on your country and your income. You can see the current minimum and maximum amounts on our Loans page and try them in the calculator.')],
        [t('How long does it take to get an answer?'), t('Most applications get a decision within 24 hours on business days. We email you as soon as the status changes.')],
        [t('Can I pay off my loan early?'), t('Yes. You can make extra payments or pay the full balance at any time without penalties.')],
    ];
    return (
        <section className="mx-auto grid max-w-6xl gap-12 px-4 py-20 md:grid-cols-2">
            <Reveal>
                <Eyebrow>{t('FAQs')}</Eyebrow>
                <Title>
                    {t('Got A')} <G>{t('Question?')}</G>
                </Title>
                <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">{t('Send us your question and we will reply within one business day.')}</p>
                <div className="mt-8 flex flex-wrap gap-3">
                    <PillLink href="/contact" dark>{t('Contact us')}</PillLink>
                    <Link href="/faqs" className="rounded-full px-4 py-3 text-sm font-medium text-navy hover:underline">
                        {t('View all')}
                    </Link>
                </div>
            </Reveal>
            <Reveal delay={0.1}>
                <Accordion type="single" collapsible>
                    {faq.map(([q, a]) => (
                        <AccordionItem key={q} value={q} className="border-b">
                            <AccordionTrigger>{q}</AccordionTrigger>
                            <AccordionContent>
                                <p className="pb-4 text-sm text-muted-foreground">{a}</p>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </Reveal>
        </section>
    );
}

function Cta() {
    const t = useT();
    return (
        <section className="relative mx-auto max-w-4xl px-4 pb-16 pt-6">
            <Reveal className="relative">
                <Rails />
                <div className="relative overflow-hidden rounded-[2rem] bg-[radial-gradient(ellipse_at_50%_120%,#2a5bb8,#0b2a5c_60%)] px-6 py-14 text-center text-white">
                    <GridBackground className="absolute inset-0 size-full opacity-50" cellSize={48} color="#7cc4ff" lineColor="#23478f" density={0.05} speed={0.6} fade={0.85} />
                    <img src="/images/3d/jar.webp" alt="" loading="lazy" className="pointer-events-none absolute -bottom-6 -right-6 hidden w-44 rotate-6 drop-shadow-2xl md:block lg:w-52" />
                    <h2 className="relative text-3xl font-medium leading-tight tracking-tight sm:text-4xl">
                        {t('Start Your Loan Journey Today')}
                        <br /> <span className="text-azure">{t('Apply in Minutes')}</span>
                    </h2>
                    <div className="relative mt-8 flex flex-wrap justify-center gap-3">
                        <Link href="/apply" className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-navy transition-colors hover:bg-azure">
                            {t('Apply now')}
                        </Link>
                        <Link href="/contact" className="rounded-full border border-white/30 px-6 py-3 text-sm font-medium transition-colors hover:bg-white/10">
                            {t('Talk to us')}
                        </Link>
                    </div>
                </div>
            </Reveal>
        </section>
    );
}

export default function Home() {
    const t = useT();
    return (
        <>
            <Head title={t('Fast, simple personal loans')} />
            <Hero />
            <About />
            <Products />
            <Tools />
            <Calculator />
            <Steps />
            <Benefits />
            <Numbers />
            <Testimonials />
            <Faq />
            <Cta />
        </>
    );
}

Home.layout = siteLayout;
