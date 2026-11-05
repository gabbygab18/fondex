import { router } from '@inertiajs/react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { AnimatedTabs } from '@/components/glint/animated-tabs';
import { Icon } from '@/icons/icon';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/** Tabs flanked by rules, then three overlapping cards; the chosen product comes forward in navy blue. */
export function LoanProductCards() {
    const t = useT();
    const products = [
        { id: 'personal', label: t('Personal loans'), icon: 'wallet', img: 'personal', type: 'personal', text: t('Cover medical bills, travel, studies or any planned expense, repaid in 1 to 3 months.'), stat: t('1–3 months'), best: t('Best for planned expenses like studies or travel.') },
        { id: 'emergency', label: t('Emergency loans'), icon: 'lightning', img: 'emergency', type: 'emergency', text: t('A fast answer when something can’t wait: a repair, a bill or a trip to the doctor.'), stat: t('Decision in 24h'), best: t('Best for urgent bills and repairs.') },
        { id: 'debt', label: t('Debt consolidation'), icon: 'piggy-bank', img: 'debt', type: 'debt_consolidation', text: t('Join several debts into one loan with a single payment plan you can follow.'), stat: t('One payment'), best: t('Best for paying off several cards at once.') },
    ];
    const [active, setActive] = useState('emergency');

    // The active card sits in the middle with its neighbors on either side.
    const i = products.findIndex((p) => p.id === active);
    const n = products.length;
    const ordered = [products[(i - 1 + n) % n], products[i], products[(i + 1) % n]];

    return (
        <div className="relative">
            <span aria-hidden className="absolute left-0 right-[calc(50%+13rem)] top-[1.4rem] hidden h-px bg-gradient-to-r from-transparent to-border md:block" />
            <span aria-hidden className="absolute left-[calc(50%+13rem)] right-0 top-[1.4rem] hidden h-px bg-gradient-to-l from-transparent to-border md:block" />
            <div className="hidden md:block">
            <AnimatedTabs
                value={active}
                onChange={setActive}
                transition="fade"
                bounce={0.25}
                tabs={products.map((p) => ({ id: p.id, label: p.label, icon: <Icon name={p.icon} />, content: <p className="text-xs text-muted-foreground">{p.best}</p> }))}
            />
            </div>

            <div className="flex flex-col items-center md:mt-10 lg:flex-row lg:justify-center">
                {ordered.map((p) => {
                    const on = active === p.id;
                    return (
                        <motion.button
                            key={p.id}
                            layout
                            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
                            type="button"
                            onClick={() => setActive(p.id)}
                            className={cn(
                                'relative w-full max-w-sm overflow-hidden rounded-3xl border bg-card p-1.5 text-left lg:w-80',
                                on ? 'z-10 shadow-2xl shadow-navy/25 lg:scale-105' : 'z-0 my-2 shadow-sm lg:-mx-12 lg:my-0 lg:scale-90 [&>*]:opacity-55 hover:[&>*]:opacity-80',
                            )}
                        >
                            <div className={cn('relative overflow-hidden rounded-[1.2rem] p-5 transition-opacity', on ? 'bg-gradient-to-br from-navy-soft via-navy to-navy-deep text-white' : 'bg-muted')}>
                                {on && <span aria-hidden className="absolute -right-10 -top-16 h-56 w-24 rotate-[35deg] bg-azure/20 blur-md" />}
                                <img src={`/images/3d/${p.img}.webp`} alt="" loading="lazy" className="relative size-16 object-contain drop-shadow-lg" />
                                <h3 className="relative mt-4 text-xl font-medium">{p.label}</h3>
                                <p className={cn('relative mt-2 text-xs leading-relaxed', on ? 'text-white/75' : 'text-muted-foreground')}>{p.text}</p>
                            </div>
                            <div className="flex items-center gap-2 p-2 text-[11px]">
                                <span className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-muted-foreground">
                                    <Icon name="calendar" className="text-[#2563eb]" /> {p.stat}
                                </span>
                                {/* The card itself is a button, so this can't be a nested link. */}
                                <span
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        router.visit(`/apply?type=${p.type}`);
                                    }}
                                    className="group/apply ml-auto flex items-center gap-1 rounded-full bg-primary px-3 py-1 font-semibold text-primary-foreground transition-transform hover:scale-105"
                                >
                                    {t('Apply now')} <Icon name="arrow-right" className="transition-transform duration-300 group-hover/apply:translate-x-1" />
                                </span>
                            </div>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}
