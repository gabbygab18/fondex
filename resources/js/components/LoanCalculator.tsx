import { usePage } from '@inertiajs/react';
import { motion, useReducedMotion, useSpring, useTransform } from 'motion/react';
import { useEffect, useState } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/glint/radio-group';
import { Slider } from '@/components/glint/slider';
import { PillLink } from '@/components/site';
import { FREQ_LABEL, FREQUENCIES, installment, installmentCount, money, PER_LABEL, RATES, totalPayable } from '@/lib/format';
import { useT, visitorCountry } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { Frequency, SharedProps } from '@/types';

/** Money that springs to each new value instead of jumping (Motion). */
function AnimatedMoney({ value, format }: { value: number; format: (v: number) => string }) {
    const reduce = useReducedMotion();
    const spring = useSpring(value, { stiffness: 140, damping: 24 });
    const text = useTransform(spring, (v) => format(v));
    useEffect(() => (reduce ? spring.jump(value) : spring.set(value)), [value, reduce]);
    return <motion.span>{text}</motion.span>;
}

/** Round slider steps to a clean power of ten (10.000 for ARS/COP ranges). */
const stepFor = (max: number) => 10 ** Math.max(0, Math.floor(Math.log10(max / 100)));

const LOW = RATES[0];
const HIGH = RATES[RATES.length - 1];

export function LoanCalculator({ className }: { className?: string }) {
    const { countries, locale } = usePage<SharedProps>().props;
    const t = useT();
    const [code, setCode] = useState(() => (countries.find((x) => x.code === visitorCountry()) ?? countries[0])?.code ?? 'CO');
    const c = countries.find((x) => x.code === code) ?? countries[0];
    const step = c ? stepFor(c.max_amount) : 1;
    const [amount, setAmount] = useState(() => (c ? Math.round((c.max_amount * 0.2) / step) * step : 0));
    const [term, setTerm] = useState(2);
    const [freq, setFreq] = useState<Frequency>('weekly');

    if (!c) return null;

    const switchCountry = (next: string) => {
        const n = countries.find((x) => x.code === next)!;
        const s = stepFor(n.max_amount);
        setCode(n.code);
        setAmount(Math.round((n.max_amount * 0.2) / s) * s);
    };

    const a = Math.min(Math.max(amount, c.min_amount), c.max_amount);
    const m = Math.min(Math.max(term, c.min_term), c.max_term);
    const terms = Array.from({ length: c.max_term - c.min_term + 1 }, (_, i) => c.min_term + i);
    const fmt = (v: number) => money(v, c.currency, locale);

    return (
        <div className={cn('grid overflow-hidden rounded-[28px] bg-card shadow-2xl shadow-navy/10 ring-1 ring-border lg:grid-cols-[1.25fr_1fr]', className)}>
            <div className="grid gap-7 p-6 md:p-9">
                {countries.length > 1 && (
                    <RadioGroup value={code} onValueChange={switchCountry} variant="card" orientation="horizontal" aria-label={t('Country')}>
                        {countries.map((x) => (
                            <RadioGroupItem key={x.code} value={x.code} label={x.name} description={x.currency} />
                        ))}
                    </RadioGroup>
                )}
                <div>
                    <div className="mb-3 flex items-baseline justify-between gap-4">
                        <span className="text-sm font-medium text-muted-foreground">{t('How much do you need?')}</span>
                        <span className="font-display text-2xl font-bold text-navy">{fmt(a)}</span>
                    </div>
                    <Slider value={[a]} onValueChange={([v]) => setAmount(v)} min={c.min_amount} max={c.max_amount} step={step} tooltip="never" thumbLabels={[t('Loan amount')]} />
                    <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                        <span>{fmt(c.min_amount)}</span>
                        <span>{fmt(c.max_amount)}</span>
                    </div>
                </div>
                <div className="grid gap-3">
                    <span className="text-sm font-medium text-muted-foreground">{t('For how long?')}</span>
                    <RadioGroup value={String(m)} onValueChange={(v) => setTerm(Number(v))} variant="card" orientation="horizontal" className={cn('max-sm:grid-flow-row', terms.length > 4 && 'grid-flow-row grid-cols-3 sm:grid-cols-4')} aria-label={t('Term')}>
                        {terms.map((n) => (
                            <RadioGroupItem key={n} value={String(n)} label={n === 1 ? t('1 month') : t(':n months', { n })} />
                        ))}
                    </RadioGroup>
                </div>
                <div className="grid gap-3">
                    <span className="text-sm font-medium text-muted-foreground">{t('How often do you want to pay?')}</span>
                    <RadioGroup value={freq} onValueChange={(v) => setFreq(v as Frequency)} variant="card" orientation="horizontal" className="max-sm:grid-flow-row" aria-label={t('Repayment frequency')}>
                        {FREQUENCIES.map((f) => (
                            <RadioGroupItem key={f} value={f} label={t(FREQ_LABEL[f])} />
                        ))}
                    </RadioGroup>
                </div>
            </div>
            <div className="relative flex flex-col justify-between gap-8 overflow-hidden bg-navy p-6 text-white md:p-9">
                <div aria-hidden className="absolute -right-16 -top-16 size-56 rounded-full bg-azure/20 blur-3xl" />
                <div className="relative">
                    <p className="text-sm text-white/70">{t('Estimated payment :per', { per: t(PER_LABEL[freq]) })}</p>
                    <p className="mt-2 break-words font-display text-4xl font-bold text-azure xl:text-5xl" aria-live="polite">
                        <span className="text-base font-medium text-white/60">{t('from')} </span>
                        <AnimatedMoney key={c.currency} value={installment(a, LOW, m, freq)} format={fmt} />
                    </p>
                    <p className="mt-1 text-sm text-white/60">{t('up to :amount, depending on your approved rate', { amount: fmt(installment(a, HIGH, m, freq)) })}</p>
                    <dl className="mt-6 grid gap-3 text-sm">
                        <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
                            <dt className="text-white/60">{t('Number of payments')}</dt>
                            <dd className="font-semibold">{installmentCount(m, freq)}</dd>
                        </div>
                        <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
                            <dt className="text-white/60">{t('Interest rate')}</dt>
                            <dd className="text-right font-semibold">{t('Based on your profile')}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                            <dt className="text-white/60">{t('Total to repay')}</dt>
                            <dd className="text-right font-semibold">
                                {fmt(totalPayable(a, LOW))} – {fmt(totalPayable(a, HIGH))}
                            </dd>
                        </div>
                    </dl>
                </div>
                <div className="relative">
                    <PillLink href={`/apply?country=${c.code}&amount=${a}&term=${m}&frequency=${freq}`}>{t('Apply with these numbers')}</PillLink>
                    <p className="mt-3 text-xs text-white/50">{t('Estimate only. Your rate depends on your profile and is confirmed when we approve your loan, before any money is sent.')}</p>
                </div>
            </div>
        </div>
    );
}
