import { usePage } from '@inertiajs/react';
import es from '../../../lang/es.json';

// English text is the key; Spanish comes from lang/es.json, the same file Laravel's __() reads.
const dict: Record<string, Record<string, string>> = { es };

export function useT() {
    const { locale } = usePage<{ locale: string }>().props;
    return (key: string, vars?: Record<string, string | number>) => {
        let s = dict[locale]?.[key] ?? key;
        if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`:${k}`, String(v));
        return s;
    };
}

export function useLocale() {
    return usePage<{ locale: 'es' | 'en' }>().props.locale;
}

/** Visitor's country from the browser time zone, so Argentina sees ARS and Colombia sees COP first. No IP lookup. */
export function visitorCountry(): 'AR' | 'CO' | undefined {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
    if (tz.startsWith('America/Argentina') || tz === 'America/Buenos_Aires') return 'AR';
    if (tz === 'America/Bogota') return 'CO';
}
