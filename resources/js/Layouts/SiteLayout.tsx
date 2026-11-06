import { Link, router, usePage } from '@inertiajs/react';
import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useState, type ReactNode } from 'react';
import { FlashToasts } from '@/components/flash';
import { ToastProvider } from '@/components/glint/toast';
import { Glow, Logo, PillLink } from '@/components/site';
import { ChatWidget } from '@/components/ChatWidget';
import { Icon } from '@/icons/icon';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { SharedProps } from '@/types';

const NAV = [
    ['/', 'Home'],
    ['/about', 'About Us'],
    ['/loans', 'Loans'],
    ['/faqs', 'FAQs'],
    ['/contact', 'Contact'],
] as const;

export function LanguageSwitch({ className, dark = false }: { className?: string; dark?: boolean }) {
    const { locale } = usePage<SharedProps>().props;
    // Pill moves on click; the page language follows when the request finishes.
    const [pending, setPending] = useState<string | null>(null);
    const active = pending ?? locale;
    return (
        <div
            className={cn('relative grid grid-cols-2 rounded-full p-0.5 text-xs font-semibold', dark ? 'bg-white/10 text-white' : 'bg-black/10', className)}
            role="group"
            aria-label="Language"
        >
            <span
                aria-hidden
                className={cn(
                    'absolute inset-y-0.5 left-0.5 w-[calc(50%-2px)] rounded-full shadow-sm transition-transform duration-500 ease-[cubic-bezier(.2,.8,.2,1)]',
                    dark ? 'bg-azure' : 'bg-navy',
                    active === 'en' && 'translate-x-full',
                )}
            />
            {(['es', 'en'] as const).map((l) => (
                <button
                    key={l}
                    type="button"
                    aria-pressed={active === l}
                    onClick={() => {
                        if (l === active) return;
                        setPending(l);
                        router.post(`/locale/${l}`, {}, { preserveScroll: true, onFinish: () => setPending(null) });
                    }}
                    className={cn(
                        'relative rounded-full px-2.5 py-1 uppercase transition-[color,opacity] duration-500',
                        active === l ? (dark ? 'text-navy' : 'text-white') : 'opacity-70 hover:opacity-100',
                    )}
                >
                    {l}
                </button>
            ))}
        </div>
    );
}

/** Light/dark switch for the public site; the choice is remembered on this device. */
function ThemeSwitch() {
    const t = useT();
    const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
    const flip = () => {
        localStorage.setItem('theme', dark ? 'light' : 'dark');
        document.documentElement.classList.toggle('dark', !dark);
        setDark(!dark);
    };
    return (
        <button
            type="button"
            onClick={flip}
            aria-pressed={dark}
            aria-label={dark ? t('Light mode') : t('Dark mode')}
            title={dark ? t('Light mode') : t('Dark mode')}
            className="grid size-9 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
        >
            <Icon name={dark ? 'sun' : 'moon'} size={18} />
        </button>
    );
}

/** Nav sits inside the top of each page's rounded navy panel (the hero), like the reference design. */
function Header() {
    const { app, auth } = usePage<SharedProps>().props;
    const { url } = usePage();
    const t = useT();
    const [open, setOpen] = useState(false);
    const path = url.split('?')[0];
    useEffect(() => setOpen(false), [url]);

    const account = auth.user ? (auth.user.role === 'borrower' ? '/account' : '/admin') : '/login';

    return (
        <header className="absolute inset-x-2 top-2 z-40 sm:inset-x-4 sm:top-4">
            <nav className="container-page flex h-[76px] items-center justify-between" aria-label="Main">
                <Logo name={app.name} light />
                <ul className="hidden items-center gap-1 lg:flex">
                    {NAV.map(([href, label]) => (
                        <li key={href}>
                            <Link
                                href={href}
                                className={cn(
                                    'rounded-full px-4 py-2 text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white',
                                    path === href && 'bg-white/10 text-white',
                                )}
                            >
                                {t(label)}
                            </Link>
                        </li>
                    ))}
                </ul>
                <div className="hidden items-center gap-3 lg:flex">
                    <ThemeSwitch />
                    <LanguageSwitch dark />
                    <Link href={account} className="px-2 text-sm text-white/80 hover:text-white">
                        {auth.user ? t('My account') : t('Sign in')}
                    </Link>
                    <Link href="/apply" className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-navy transition-colors hover:bg-azure">
                        {t('Apply now')}
                    </Link>
                </div>
                <button
                    type="button"
                    className="grid size-10 place-items-center rounded-full bg-white/10 text-white lg:hidden"
                    aria-expanded={open}
                    aria-controls="mobile-nav"
                    aria-label={t('Menu')}
                    onClick={() => setOpen((o) => !o)}
                >
                    <Icon name={open ? 'close' : 'menu'} size={20} />
                </button>
            </nav>
            {open && (
                <div id="mobile-nav" className="mx-3 grid gap-1 rounded-3xl bg-navy-deep p-4 shadow-2xl lg:hidden">
                    {NAV.map(([href, label]) => (
                        <Link key={href} href={href} className={cn('rounded-xl px-3 py-3 text-white/85', path === href && 'bg-white/10 text-azure')}>
                            {t(label)}
                        </Link>
                    ))}
                    <Link href={account} className="rounded-xl px-3 py-3 text-white/85">
                        {auth.user ? t('My account') : t('Sign in')}
                    </Link>
                    <div className="mt-3 flex items-center justify-between">
                        <PillLink href="/apply">{t('Apply now')}</PillLink>
                        <div className="flex items-center gap-2">
                            <ThemeSwitch />
                            <LanguageSwitch dark />
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}

/** Footer panel mirrors the hero panel. */
function Footer() {
    const { app } = usePage<SharedProps>().props;
    const t = useT();
    return (
        <div className="p-2 sm:p-4">
            <footer className="relative overflow-hidden rounded-[2rem] bg-[linear-gradient(180deg,#0b2a5c,#061a3d)] text-white">
                <Glow />
                <div className="container-page relative grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
                    <div>
                        <Logo name={app.name} light />
                        <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">
                            {t('Clear, fast personal loans for everyday people.')}
                        </p>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-azure">{t('Company')}</h3>
                        <ul className="mt-4 grid gap-2.5 text-sm text-white/70">
                            {NAV.slice(1).map(([href, label]) => (
                                <li key={href}>
                                    <Link href={href} className="hover:text-white">{t(label)}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-azure">{t('Legal')}</h3>
                        <ul className="mt-4 grid gap-2.5 text-sm text-white/70">
                            <li><Link href="/privacy" className="hover:text-white">{t('Privacy Policy')}</Link></li>
                            <li><Link href="/terms" className="hover:text-white">{t('Terms and Conditions')}</Link></li>
                            <li><Link href="/apply" className="hover:text-white">{t('Apply now')}</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-azure">{t('Get in touch')}</h3>
                        <ul className="mt-4 grid gap-3 text-sm text-white/70">
                            <li className="flex items-center gap-2"><Icon name="mail" size={16} className="text-azure" /> {app.email}</li>
                            {app.phone && <li className="flex items-center gap-2"><Icon name="phone" size={16} className="text-azure" /> {app.phone}</li>}
                            <li className="flex items-center gap-2"><Icon name="map-pin" size={16} className="text-azure" /> Buenos Aires · Bogotá</li>
                        </ul>
                    </div>
                </div>
                <div className="container-page relative flex flex-col gap-2 border-t border-white/10 py-6 text-xs text-white/50 md:flex-row md:justify-between">
                    <span>© {new Date().getFullYear()} {app.name}. {t('All rights reserved.')}</span>
                    <span>{t('Loans are subject to credit approval. Rates shown are estimates.')}</span>
                </div>
            </footer>
        </div>
    );
}

export default function SiteLayout({ children }: { children: ReactNode }) {
    const { component } = usePage();
    const reduce = useReducedMotion();
    // Dark mode is for the public site only: apply the saved choice here, drop it when leaving for the portal.
    useEffect(() => {
        document.documentElement.classList.toggle('dark', localStorage.getItem('theme') === 'dark');
        return () => document.documentElement.classList.remove('dark');
    }, []);
    return (
        <ToastProvider placement="top-center">
            <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2">
                Skip to content
            </a>
            <Header />
            {/* Persistent layout: re-keying on the page component fades each new page in. */}
            <motion.main
                id="main"
                key={component}
                initial={reduce ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
                {children}
            </motion.main>
            <Footer />
            <ChatWidget />
            <FlashToasts />
        </ToastProvider>
    );
}

export const siteLayout = (page: ReactNode) => <SiteLayout>{page}</SiteLayout>;
