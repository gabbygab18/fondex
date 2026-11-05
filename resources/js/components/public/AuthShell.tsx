import { Link, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { FlashToasts } from '@/components/flash';
import { EnterView } from '@/components/glint/enter-view';
import { PromoSlides } from '@/components/PromoSlides';
import { ToastProvider } from '@/components/glint/toast';
import { Logo } from '@/components/site';
import { Icon } from '@/icons/icon';
import { LanguageSwitch } from '@/Layouts/SiteLayout';
import { useT } from '@/lib/i18n';
import type { SharedProps } from '@/types';

/**
 * Full-screen split for sign-in, sign-up and password screens (same pattern as the Isla portal):
 * rotating photo ads on the left (PromoSlides), the form on its own on the right. No site header or footer.
 */
export function AuthShell({ title, subtitle, children }: { title: string; subtitle?: ReactNode; children: ReactNode }) {
    const { app } = usePage<SharedProps>().props;
    const t = useT();

    return (
        <div className="grid min-h-dvh bg-background lg:h-dvh lg:grid-cols-[1.05fr_1fr] lg:overflow-hidden">
            <div className="relative hidden p-3 lg:block">
                <PromoSlides className="h-full" />
                <div className="absolute left-10 top-10">
                    <Logo name={app.name} light />
                </div>
            </div>

            <div className="flex min-h-0 flex-col px-5 py-6 sm:px-10">
                <div className="flex items-center justify-between gap-4">
                    <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-navy">
                        <Icon name="arrow-left" size={16} /> {t('Back to site')}
                    </Link>
                    <LanguageSwitch />
                </div>
                <div className="flex min-h-0 flex-1 items-center justify-center py-6 lg:overflow-y-auto lg:py-4">
                    <EnterView distance={30} scale={1} className="w-full max-w-md">
                        <div className="mb-8 lg:hidden">
                            <Logo name={app.name} />
                        </div>
                        <h1 className="text-3xl font-bold text-navy xl:text-4xl">{title}</h1>
                        {subtitle && <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{subtitle}</p>}
                        <div className="mt-6 xl:mt-8">{children}</div>
                    </EnterView>
                </div>
            </div>
        </div>
    );
}

export const authLayout = (page: ReactNode) => (
    <ToastProvider placement="top-center">
        {page}
        <FlashToasts />
    </ToastProvider>
);
