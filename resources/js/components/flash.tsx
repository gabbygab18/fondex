import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { useToast } from '@/components/glint/toast';
import type { SharedProps } from '@/types';

/** Turns the server's flash messages into Glint toasts. */
export function FlashToasts() {
    const { flash } = usePage<SharedProps>().props;
    const { toast } = useToast();

    useEffect(() => {
        if (flash.success) toast({ title: flash.success, variant: 'success' });
        if (flash.error) toast({ title: flash.error, variant: 'error' });
    }, [flash]);

    return null;
}
