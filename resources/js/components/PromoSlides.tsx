import { Link } from '@inertiajs/react';
import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Icon } from '@/icons/icon';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const EVERY = 7000;
const ease = [0.16, 1, 0.3, 1] as const;

type Slide = { tab: string; badge: string; title: ReactNode; body: string; image: string; cta: [string, string]; more?: [string, string] };

/**
 * Rotating photo ads, laid out like the Isla home hero: the slides lie on top of each other and cross-fade,
 * the words sit bottom-left over the photo, and the slides are named along the foot as glass tabs with a timer bar.
 * Holds while hovered or focused, has a pause button, swipes on touch, and never turns on its own for reduced motion.
 * Used on the sign-in and sign-up side panel.
 * Photos: free Unsplash images (Unsplash License).
 */
export function PromoSlides({ className }: { className?: string }) {
    const t = useT();
    const slides: Slide[] = [
        {
            tab: t('Why Fondex'),
            badge: t('Simple personal loans'),
            title: (
                <>
                    {t('Borrow Smarter, Repay Easier,')} <span className="text-azure">{t('Every Step of the Way')}</span>
                </>
            ),
            body: t('Short-term personal loans. Apply online in minutes, get a decision fast, and repay daily, weekly or fortnightly.'),
            image: '/images/promo-1.jpg',
            cta: [t('Apply now'), '/apply'],
            more: [t('Calculate my payment'), '/#calculator'],
        },
        {
            tab: t('100% online'),
            badge: t('100% online'),
            title: (
                <>
                    {t('Online loans,')} <span className="text-azure">{t('fast and simple')}</span>
                </>
            ),
            body: t('For your plans and needs.'),
            image: '/images/promo-2.jpg',
            cta: [t('Apply now'), '/apply'],
        },
        {
            tab: t('Payments'),
            badge: t('From 1 to 3 months'),
            title: (
                <>
                    {t('Pay your way:')} <span className="text-azure">{t('daily, weekly or fortnightly')}</span>
                </>
            ),
            body: t('Short terms from 1 to 3 months, with every payment shown upfront.'),
            image: '/images/promo-3.jpg',
            cta: [t('Try the calculator'), '/#calculator'],
        },
        {
            tab: t('Your account'),
            badge: t('Always online'),
            title: (
                <>
                    {t('Your loan,')} <span className="text-azure">{t('always at hand')}</span>
                </>
            ),
            body: t('Track your application and pay online from your account.'),
            image: '/images/promo-4.jpg',
            cta: [t('Create account'), '/register'],
        },
    ];

    const [active, setActive] = useState(0);
    const [paused, setPaused] = useState(false);
    // Held while the pointer or focus is inside: nobody wants the slide changing mid-read.
    const [held, setHeld] = useState(false);
    const still = useReducedMotion();
    const running = !paused && !held && !still;
    const go = (step: number) => setActive((i) => (i + step + slides.length) % slides.length);
    const touch = useRef(0);
    const pad = (n: number) => String(n).padStart(2, '0');

    useEffect(() => {
        if (!running) return;
        const timer = setTimeout(() => go(1), EVERY);
        return () => clearTimeout(timer);
    }, [active, running]);

    return (
        <div
            aria-roledescription="carousel"
            className={cn('relative overflow-hidden rounded-[28px] bg-navy text-white', className)}
            onMouseEnter={() => setHeld(true)}
            onMouseLeave={(e) => setHeld(e.currentTarget.contains(document.activeElement))}
            onFocus={() => setHeld(true)}
            onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setHeld(e.currentTarget.matches(':hover'))}
            onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
            onTouchEnd={(e) => {
                const moved = e.changedTouches[0].clientX - touch.current;
                if (Math.abs(moved) > 50) go(moved < 0 ? 1 : -1);
            }}
        >
            {slides.map((slide, i) => {
                const on = i === active;
                return (
                    <div
                        key={slide.image}
                        role="group"
                        aria-roledescription="slide"
                        aria-label={`${i + 1} / ${slides.length}`}
                        aria-hidden={!on}
                        inert={!on}
                        className={cn('absolute inset-0 transition-opacity duration-700 ease-out', on ? 'opacity-100' : 'pointer-events-none opacity-0')}
                    >
                        {/* Slow push-in while the slide is up. */}
                        <img
                            src={slide.image}
                            alt=""
                            loading={i === 0 ? 'eager' : 'lazy'}
                            className={cn('absolute inset-0 size-full object-cover transition-transform ease-out', on ? 'scale-100 duration-[7000ms]' : 'scale-110 duration-0', still && 'scale-100')}
                        />
                        <div className="absolute inset-0 bg-navy-deep/60" />
                        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-navy-deep/85 to-transparent" />

                        <motion.div
                            initial={false}
                            animate={on ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
                            transition={{ duration: 0.8, ease, delay: on ? 0.15 : 0 }}
                            className="relative flex h-full flex-col items-start justify-end pb-32 pl-9 pr-16 pt-20 text-left"
                        >
                            <span className="w-full truncate text-[11px] font-semibold uppercase tracking-[0.16em] text-white/85 sm:text-xs">{slide.badge}</span>
                            <h2 className="mt-4 max-w-3xl text-4xl font-medium leading-[1.06] tracking-[-0.03em] xl:text-5xl">{slide.title}</h2>
                            <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-white/85">{slide.body}</p>
                            <div className="mt-8 flex flex-wrap items-center gap-3">
                                <Link href={slide.cta[1]} className="group inline-flex items-center gap-2 rounded-full bg-white p-1 ps-6 text-sm font-semibold text-navy transition-colors hover:bg-azure">
                                    {slide.cta[0]}
                                    <span className="grid size-10 place-items-center rounded-full bg-navy text-azure transition-transform group-hover:translate-x-0.5">
                                        <Icon name="arrow-right" size={16} />
                                    </span>
                                </Link>
                                {slide.more && (
                                    <Link href={slide.more[1]} className="rounded-full border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-medium backdrop-blur-md transition-colors hover:bg-white/20">
                                        {slide.more[0]}
                                    </Link>
                                )}
                            </div>
                        </motion.div>
                    </div>
                );
            })}

            {/* Where you are, up the right-hand edge. */}
            <div className="absolute right-5 top-1/2 hidden -translate-y-1/2 flex-col items-center gap-3 text-[11px] font-semibold tabular-nums text-white/70 md:flex">
                <span>{pad(active + 1)}</span>
                <span className="relative h-24 w-px bg-white/25">
                    <span
                        className="absolute left-1/2 w-[3px] -translate-x-1/2 rounded-full bg-azure transition-all duration-500"
                        style={{ top: `${(active / slides.length) * 100}%`, height: `${100 / slides.length}%` }}
                    />
                </span>
                <span>{pad(slides.length)}</span>
            </div>

            {/* The slides by name, as glass tabs along the foot. */}
            <div className={'absolute inset-x-0 bottom-0 flex items-end gap-3 px-5 pb-5'}>
                <div className="flex min-w-0 flex-1 gap-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {slides.map((slide, i) => (
                        <button
                            key={slide.image}
                            type="button"
                            onClick={() => setActive(i)}
                            aria-current={i === active}
                            aria-label={`${i + 1}: ${slide.tab}`}
                            className={cn(
                                'relative min-w-[110px] flex-1 overflow-hidden rounded-2xl px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors',
                                i === active ? 'bg-white text-navy' : 'border border-white/20 bg-white/15 backdrop-blur-md hover:bg-white/25',
                            )}
                        >
                            <span className="block truncate">{slide.tab}</span>
                            {/* Time left on this slide; gone while held, starts over when let go. */}
                            {i === active && running && (
                                <span key={active} className="absolute bottom-0 left-0 h-[3px] w-full origin-left animate-[promo-fill_linear_forwards] bg-[#2563eb]" style={{ animationDuration: `${EVERY}ms` }} />
                            )}
                        </button>
                    ))}
                </div>
                <button
                    type="button"
                    onClick={() => setPaused((p) => !p)}
                    aria-label={paused ? t('Play slides') : t('Pause slides')}
                    className="grid size-[46px] shrink-0 place-items-center rounded-2xl border border-white/20 bg-white/15 backdrop-blur-md transition-colors hover:bg-white/25"
                >
                    <Icon name={paused ? 'play' : 'pause'} size={18} />
                </button>
            </div>
        </div>
    );
}
