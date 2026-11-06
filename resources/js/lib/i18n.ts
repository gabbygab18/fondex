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

/** Only the visitor's own country (and so one currency) on the public pages; all of them if it isn't offered. */
export function localCountries<T extends { code: string }>(countries: T[]): T[] {
    const mine = countries.filter((c) => c.code === visitorCountry());
    return mine.length ? mine : countries;
}

/** Countries closer to Colombia than to Argentina: its neighbours, Central America, Mexico and the Caribbean. */
const NEAR_CO_COUNTRIES = new Set(['CO', 'VE', 'EC', 'PE', 'PA', 'CR', 'NI', 'HN', 'SV', 'GT', 'BZ', 'MX', 'CU', 'JM', 'DO', 'PR', 'HT', 'TT', 'CW', 'AW', 'BB', 'GY', 'SR']);

/** Time zones closer to Colombia, for when the IP lookup gave nothing. */
const NEAR_CO = new Set([
    'America/Bogota', 'America/Caracas', 'America/Guayaquil', 'Pacific/Galapagos', 'America/Lima', 'America/Panama',
    'America/Manaus', 'America/Boa_Vista', 'America/Porto_Velho', 'America/Rio_Branco', 'America/Eirunepe',
    'America/Costa_Rica', 'America/Managua', 'America/Tegucigalpa', 'America/El_Salvador', 'America/Guatemala', 'America/Belize',
    'America/Mexico_City', 'America/Monterrey', 'America/Merida', 'America/Cancun', 'America/Tijuana', 'America/Hermosillo', 'America/Chihuahua',
    'America/Havana', 'America/Jamaica', 'America/Santo_Domingo', 'America/Puerto_Rico', 'America/Port-au-Prince',
    'America/Port_of_Spain', 'America/Curacao', 'America/Aruba', 'America/Barbados', 'America/Guyana', 'America/Paramaribo',
]);

/** Visitor's country (IP first, then browser time zone), mapped to the nearest country we lend in. */
export function visitorCountry(): 'AR' | 'CO' {
    // From the visitor's IP, looked up on the server (App\Support\VisitorCountry); a VPN counts.
    const ip = document.documentElement.dataset.country;
    if (ip) return NEAR_CO_COUNTRIES.has(ip) ? 'CO' : 'AR';
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
    // Colombia and nearby countries see COP; Argentina, the Southern Cone (Uruguay, Chile, Paraguay,
    // Bolivia, southern Brazil) and everyone else see ARS, the main market (fondex.com.ar).
    return NEAR_CO.has(tz) ? 'CO' : 'AR';
}
