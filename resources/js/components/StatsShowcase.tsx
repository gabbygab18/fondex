import { animate, motion, useInView, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/** Counts from 0 up to `to` the first time it scrolls into view. */
function CountUp({ to, decimals = 0 }: { to: number; decimals?: number }) {
    const ref = useRef<HTMLSpanElement>(null);
    const inView = useInView(ref, { once: true, margin: '-60px' });
    const reduce = useReducedMotion();
    const [v, setV] = useState(0);
    useEffect(() => {
        if (!inView) return;
        if (reduce) return setV(to);
        const c = animate(0, to, { duration: 1.8, ease: [0.16, 1, 0.3, 1], onUpdate: setV });
        return () => c.stop();
    }, [inView, to, reduce]);
    return (
        <span ref={ref} className="tabular-nums">
            {v.toFixed(decimals)}
        </span>
    );
}

function Pill({ children, className }: { children: ReactNode; className?: string }) {
    return <span className={cn('inline-block rounded-full bg-azure px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-navy', className)}>{children}</span>;
}

/** Impact numbers in hairline columns, then how we lend: copy and chips beside the globe. */
export function StatsShowcase({ className }: { className?: string }) {
    const t = useT();
    const stats = [
        { title: t('Loans funded'), sub: t('and counting'), value: <CountUp to={10} />, unit: 'K+' },
        { title: t('Typical decision time'), sub: t('on business days'), value: <CountUp to={24} />, unit: 'h' },
        { title: t('Average rating'), sub: t('from 5,200+ reviews'), value: <CountUp to={4.9} decimals={1} />, unit: '/5' },
        { title: t('Repayment options'), sub: t('daily, weekly or fortnightly'), value: <CountUp to={3} />, unit: '' },
    ];

    return (
        <div className={className}>
            <Pill>{t('Our impact')}</Pill>
            <dl className="mt-8 grid grid-cols-2 gap-y-10 lg:grid-cols-4">
                {stats.map((s, i) => (
                    <motion.div
                        key={s.title}
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-60px' }}
                        transition={{ duration: 0.6, delay: i * 0.1, ease: [0.2, 0.7, 0.2, 1] }}
                        className={cn('flex min-h-48 flex-col justify-between border-border px-4 sm:px-6', i % 2 === 1 && 'border-l', i > 0 && 'lg:border-l', i === 0 && 'lg:pl-0')}
                    >
                        <dt className="text-[15px] leading-snug">
                            <span className="block font-semibold text-navy">{s.title}</span>
                            <span className="text-muted-foreground">{s.sub}</span>
                        </dt>
                        <dd className="mt-8 font-display text-5xl tracking-tight text-navy sm:text-6xl xl:text-7xl">
                            <span className="font-bold">{s.value}</span>
                            <span className="font-light text-navy/70">{s.unit}</span>
                        </dd>
                    </motion.div>
                ))}
            </dl>

            <div className="mt-20 grid items-center gap-12 lg:grid-cols-[1fr_1.1fr]">
                <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
                    <Pill className="bg-secondary">{t('How we lend')}</Pill>
                    <p className="mt-6 max-w-md text-2xl font-medium leading-snug tracking-tight text-navy sm:text-3xl">
                        {t('We lend locally, with')} <b className="font-bold">{t('clear conditions')}</b> {t('in your own currency.')}
                    </p>
                    <ul className="mt-8 flex flex-wrap gap-2">
                        {[t('Local currency'), t('Local payment methods'), t('Local support'), t('Fully online')].map((c) => (
                            <li key={c} className="rounded-full border border-border bg-card px-4 py-2 text-xs text-navy">
                                {c}
                            </li>
                        ))}
                    </ul>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9, rotate: -8 }}
                    whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                    className="relative mx-auto aspect-square w-full max-w-md"
                >
                    <img src="/images/3d/globe.webp" alt="" width={1000} height={996} loading="lazy" className="size-full object-contain drop-shadow-[0_30px_60px_rgb(11_42_92/0.18)] transition-transform duration-500 ease-out hover:scale-110 hover:-rotate-6" />
                </motion.div>
            </div>
        </div>
    );
}
