import { Link, usePage } from '@inertiajs/react';
import { Icon } from '@/icons/icon';
import { money } from '@/lib/format';
import { useLocale, useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { CreditSummary, SharedProps } from '@/types';

const LABEL: Record<CreditSummary['label'], [string, string]> = {
    excellent: ['Excellent', 'bg-emerald-100 text-emerald-700'],
    good: ['Good', 'bg-sky-100 text-sky-700'],
    fair: ['Fair', 'bg-amber-100 text-amber-800'],
    poor: ['Poor', 'bg-red-100 text-red-700'],
    new: ['New client', 'bg-muted text-muted-foreground'],
};

/** "92 · Excellent" pill: the client's internal credit score (see app/Support/CreditProfile.php). */
export function CreditScore({ credit, className }: { credit: CreditSummary; className?: string }) {
    const t = useT();
    const [label, cls] = LABEL[credit.label];
    return (
        <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold', cls, className)}>
            {credit.score !== null && <b className="tabular-nums">{credit.score}</b>}
            {credit.score !== null && <span aria-hidden>·</span>}
            {t(label)}
        </span>
    );
}

/**
 * The client's side: their score and limit, with the good-payer offer.
 * Unlocked (limit above the starting one) → "you can now borrow up to X"; on the way (paying well, next loan would
 * raise it) → "keep paying on time to unlock X"; otherwise just the current limit.
 */
export function CreditOffer({ credit }: { credit: CreditSummary }) {
    const t = useT();
    const locale = useLocale();
    const { auth } = usePage<SharedProps>().props;
    if (!credit.currency || credit.limit === null) return null;
    const fmt = (v: number) => money(v, credit.currency!, locale);
    const unlocked = credit.good && credit.limit > (credit.start ?? 0);
    const onTheWay = !unlocked && credit.good && (credit.next_limit ?? 0) > credit.limit;

    return (
        <div className={cn('flex flex-wrap items-center gap-5 rounded-3xl p-6 shadow-sm', unlocked ? 'bg-gradient-to-br from-emerald-500 to-emerald-700 text-white' : 'bg-card')}>
            <span className={cn('grid size-12 shrink-0 place-items-center rounded-2xl', unlocked ? 'bg-white/20' : 'bg-secondary text-navy')}>
                <Icon name={unlocked ? 'rocket' : 'target'} size={24} />
            </span>
            <div className="min-w-0 flex-1">
                <p className={cn('flex flex-wrap items-center gap-2 text-sm', unlocked ? 'text-white/80' : 'text-muted-foreground')}>
                    {t('Your credit score')} <CreditScore credit={credit} />
                </p>
                <p className={cn('mt-1 font-display text-lg font-bold', !unlocked && 'text-navy')}>
                    {unlocked
                        ? t('Good payer bonus: you can now borrow up to :amount', { amount: fmt(credit.limit) })
                        : onTheWay
                          ? t('Keep paying on time to unlock up to :amount on your next loan', { amount: fmt(credit.next_limit!) })
                          : t('You can borrow up to :amount', { amount: fmt(credit.limit) })}
                </p>
                <p className={cn('mt-0.5 text-xs', unlocked ? 'text-white/75' : 'text-muted-foreground')}>{t('Pay every installment on time to raise your limit after each loan.')}</p>
            </div>
            {unlocked && auth.can_apply && (
                <Link href="/apply" className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50">
                    {t('Apply now')}
                </Link>
            )}
        </div>
    );
}
