import { Badge, type BadgeVariant } from '@/components/glint/badge';
import { useT } from '@/lib/i18n';

const MAP: Record<string, [BadgeVariant, string]> = {
    pending: ['warning', 'Pending'],
    under_review: ['outline', 'Under review'],
    approved: ['success', 'Approved'],
    rejected: ['destructive', 'Rejected'],
    active: ['success', 'Active'],
    paid: ['secondary', 'Paid'],
    defaulted: ['destructive', 'Defaulted'],
    overdue: ['destructive', 'Overdue'],
    partial: ['warning', 'Partial'],
    upcoming: ['outline', 'Upcoming'],
};

/** One badge for application, loan and installment statuses. */
export function StatusBadge({ status }: { status: string }) {
    const t = useT();
    const [variant, label] = MAP[status] ?? ['outline', status];
    return (
        <Badge variant={variant} dot>
            {t(label)}
        </Badge>
    );
}
