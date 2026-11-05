import { Link, router, usePage } from '@inertiajs/react';
import { motion } from 'motion/react';
import { useState, type CSSProperties, type ReactNode } from 'react';
import { FlashToasts } from '@/components/flash';
import { Avatar } from '@/components/glint/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/glint/dropdown-menu';
import { StretchRail } from '@/components/glint/stretch-rail';
import { ToastProvider } from '@/components/glint/toast';
import { Logo } from '@/components/site';
import { Icon } from '@/icons/icon';
import { LanguageSwitch } from '@/Layouts/SiteLayout';
import { useT } from '@/lib/i18n';
import type { SharedProps } from '@/types';

type NavItem = {
    href: string;
    label: string;
    icon: string;
    adminOnly?: boolean;
};

const STAFF_MENU: NavItem[] = [
    { href: '/admin', label: 'Dashboard', icon: 'grid' },
    { href: '/admin/applications', label: 'Applications', icon: 'file-text' },
    { href: '/admin/clients', label: 'Clients', icon: 'users' },
    { href: '/admin/loans', label: 'Loans', icon: 'banknote' },
    { href: '/admin/chats', label: 'Chats', icon: 'chat-round' },
];
const STAFF_TOOLS: NavItem[] = [
    { href: '/admin/reports', label: 'Reports', icon: 'bar-chart' },
    { href: '/admin/accounting', label: 'Accounting', icon: 'wallet', adminOnly: true },
    {
        href: '/admin/settings',
        label: 'Settings',
        icon: 'settings',
        adminOnly: true,
    },
    {
        href: '/admin/users',
        label: 'Team & users',
        icon: 'users',
        adminOnly: true,
    },
];
const BORROWER_MENU: NavItem[] = [
    { href: '/account', label: 'My account', icon: 'grid' },
    { href: '/apply', label: 'New application', icon: 'file-plus' },
];

// The sidebar is always dark, so the theme tokens the Glint rail reads are switched to light-on-navy here.
const DARK_TOKENS = {
    '--foreground': '#ffffff',
    '--muted-foreground': 'rgb(255 255 255 / 0.6)',
    '--muted': 'rgb(255 255 255 / 0.08)',
    '--border': 'rgb(255 255 255 / 0.12)',
} as CSSProperties;

const logout = () => router.post('/logout');

/**
 * Signed-in area for staff and borrowers, laid out like the LCT Stocks app: a floating dark sidebar
 * (Glint StretchRail menu, a tools list and a call-to-action card), and a rounded header card with the page title,
 * a client search for staff, the language switch and the account menu.
 */
export default function PortalLayout({ children }: { children: ReactNode }) {
    const page = usePage<SharedProps>();
    const { app, auth } = page.props;
    const t = useT();
    const user = auth.user!;
    const staff = user.role === 'admin' || user.role === 'staff';
    const path = page.url.split('?')[0];
    const [q, setQ] = useState('');

    const menu = staff ? STAFF_MENU : BORROWER_MENU.filter((n) => auth.can_apply || n.href !== '/apply');
    const tools = staff ? STAFF_TOOLS.filter((n) => !n.adminOnly || user.role === 'admin') : [];
    const isActive = (href: string) => (href === '/admin' || href === '/account' ? path === href : path.startsWith(href));
    // Detail pages (a loan, an application) light up the section they belong to.
    const active = menu.findIndex((n) => isActive(n.href)) >= 0 ? menu.findIndex((n) => isActive(n.href)) : path.startsWith('/account') ? 0 : -1;
    const title = [...menu, ...tools].find((n) => isActive(n.href))?.label ?? (staff ? 'Dashboard' : 'My account');

    const toolLink = 'flex items-center gap-3 rounded-lg px-3 py-2.5 text-white/60 hover:bg-white/10 hover:text-white';

    return (
        <ToastProvider placement="top-right">
            <div className="min-h-screen overflow-x-clip bg-[#eef2f8] lg:flex lg:gap-4 lg:p-4">
                <aside
                    style={DARK_TOKENS}
                    className="sticky top-4 hidden h-[calc(100vh-2rem)] w-64 shrink-0 flex-col overflow-y-auto rounded-3xl bg-navy-deep p-5 text-white [scrollbar-width:none] lg:flex"
                >
                    <div className="mb-7 shrink-0 px-2 pt-1">
                        <Logo name={app.name} light />
                    </div>

                    <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wider text-white/45">{t('Menu')}</p>
                    <StretchRail
                        items={menu.map((n) => ({
                            label: t(n.label) + (n.href === '/admin/chats' && auth.unread_chats ? ` (${auth.unread_chats})` : ''),
                            icon: <Icon name={n.icon} />,
                        }))}
                        active={active}
                        color="#7cc4ff"
                        onSelect={(i) => router.visit(menu[i].href)}
                    />

                    <p className="mb-2 mt-8 px-1 text-xs font-medium uppercase tracking-wider text-white/45">{t('Tools')}</p>
                    <nav className="mb-6 grid gap-1 pl-4 text-sm font-medium">
                        {tools.map((n) => (
                            <Link
                                key={n.href}
                                href={n.href}
                                aria-current={isActive(n.href) ? 'page' : undefined}
                                className={`${toolLink} aria-[current=page]:bg-white/10 aria-[current=page]:font-semibold aria-[current=page]:text-white aria-[current=page]:[&>svg]:text-azure`}
                            >
                                <Icon name={n.icon} size={16} /> {t(n.label)}
                            </Link>
                        ))}
                        <Link href="/" className={toolLink}>
                            <Icon name="external-link" size={16} /> {t('View site')}
                        </Link>
                        <button type="button" onClick={logout} className={`${toolLink} text-left`}>
                            <Icon name="log-out" size={16} /> {t('Sign out')}
                        </button>
                    </nav>

                    {(staff || auth.can_apply) && (
                        <div className="mt-auto shrink-0 rounded-2xl bg-gradient-to-br from-[#2563eb] to-navy-soft p-4">
                            <Icon name={staff ? 'file-text' : 'plus-circle'} size={30} className="mb-3 opacity-90" />
                            <p className="font-semibold leading-snug">{staff ? t('New applications waiting?') : t('Need another loan?')}</p>
                            <p className="mt-1 text-xs text-white/70">{staff ? t('Review them and pick the rate for each client.') : t('Apply online in minutes.')}</p>
                            <Link
                                href={staff ? '/admin/applications' : '/apply'}
                                className="mt-3 block w-full rounded-xl bg-white/20 py-2 text-center text-sm font-medium backdrop-blur transition hover:bg-white/30"
                            >
                                {staff ? t('Review applications') : t('Apply now')}
                            </Link>
                        </div>
                    )}
                </aside>

                <main className="min-w-0 flex-1 space-y-4 p-3 lg:p-0">
                    <header className="flex items-center gap-3 rounded-3xl bg-card px-4 py-3 shadow-sm sm:px-6">
                        {/* Phones and tablets have no sidebar: everything in it is in this menu. */}
                        <DropdownMenu>
                            <DropdownMenuTrigger aria-label={t('Menu')} className="rounded-lg p-2 hover:bg-muted lg:hidden">
                                <Icon name="menu" size={20} />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                {[...menu, ...tools].map((n) => (
                                    <DropdownMenuItem key={n.href} icon={<Icon name={n.icon} />} onSelect={() => router.visit(n.href)}>
                                        {t(n.label)}
                                    </DropdownMenuItem>
                                ))}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem icon={<Icon name="external-link" />} onSelect={() => router.visit('/')}>
                                    {t('View site')}
                                </DropdownMenuItem>
                                <DropdownMenuItem icon={<Icon name="log-out" />} variant="destructive" onSelect={logout}>
                                    {t('Sign out')}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <p className="max-w-48 shrink-0 truncate font-display text-lg font-black text-navy sm:text-xl xl:max-w-64">{t(title)}</p>

                        {staff && (
                            <form
                                className="relative mx-2 hidden min-w-0 flex-1 md:block lg:mx-4"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    router.get('/admin/clients', q.trim() ? { search: q.trim() } : {});
                                }}
                            >
                                <Icon name="search" size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="search"
                                    value={q}
                                    onChange={(e) => setQ(e.target.value)}
                                    placeholder={t('Search name, email or phone')}
                                    aria-label={t('Search clients')}
                                    className="h-10 w-full rounded-full border border-border bg-muted/60 pl-10 pr-4 text-sm outline-none transition focus:border-ring focus:bg-card"
                                />
                            </form>
                        )}

                        <div className="ml-auto flex items-center gap-2 sm:gap-3">
                            <LanguageSwitch />
                            <DropdownMenu>
                                <DropdownMenuTrigger className="flex items-center gap-3 rounded-full p-1 pr-2 hover:bg-muted">
                                    <Avatar name={user.name} size="sm" status="online" />
                                    <span className="hidden text-left leading-tight xl:block">
                                        <span className="block text-sm font-medium">
                                            {t('Hey, :name', {
                                                name: user.name.split(' ')[0],
                                            })}
                                        </span>
                                        <span className="block text-xs text-muted-foreground">{user.email}</span>
                                    </span>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>{user.name}</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem icon={<Icon name="external-link" />} onSelect={() => router.visit('/')}>
                                        {t('View site')}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem icon={<Icon name="log-out" />} variant="destructive" onSelect={logout}>
                                        {t('Sign out')}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </header>

                    {/* Opacity only: a transform here would trap fixed-position popovers inside the page. */}
                    <motion.div key={page.component} className="pb-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}>
                        {children}
                    </motion.div>
                </main>
            </div>
            <FlashToasts />
        </ToastProvider>
    );
}

export const portalLayout = (page: ReactNode) => <PortalLayout>{page}</PortalLayout>;
