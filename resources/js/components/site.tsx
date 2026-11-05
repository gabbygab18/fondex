import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { EnterView } from '@/components/glint/enter-view';
import { GridBackground } from '@/components/glint/grid-background';
import { UnblurHeading } from '@/components/glint/unblur-heading';
import { Icon } from '@/icons/icon';
import { cn } from '@/lib/utils';

/**
 * Brand mark: an "F" of two rounded pieces: a top bar, and an arch that is both the stem and the middle bar.
 * The top bar takes the text colour; the arch uses the accent. Same drawing as public/favicon.svg.
 */
export function LogoMark({ className, coin = '#7cc4ff' }: { className?: string; coin?: string }) {
    return (
        <svg viewBox="0 0 32 32" aria-hidden className={cn('size-8 shrink-0', className)}>
            <path fill="currentColor" d="M4 10V9a5 5 0 0 1 5-5h16a3 3 0 0 1 0 6Z" />
            <path fill={coin} d="M4 24A10 10 0 0 1 14 14H25a3 3 0 0 1 0 6H15a5 5 0 0 0-5 5v3a3 3 0 0 1-6 0Z" />
        </svg>
    );
}

export function Logo({ name, light = false }: { name: string; light?: boolean }) {
    return (
        <Link href="/" className={cn('group flex items-center gap-2.5 font-display text-[1.45rem] font-medium tracking-[-0.03em]', light ? 'text-white' : 'text-navy')}>
            <LogoMark coin={light ? '#7cc4ff' : '#2563eb'} className="size-8 transition-transform duration-300 group-hover:-translate-y-0.5" />
            {name}
        </Link>
    );
}

/** The azure pill with a dark arrow chip from the reference design. */
export function PillLink({ href, children, dark = false, className }: { href: string; children: ReactNode; dark?: boolean; className?: string }) {
    return (
        <Link
            href={href}
            className={cn(
                'group inline-flex items-center gap-2 rounded-full p-1 ps-5 text-sm font-semibold transition-colors',
                dark ? 'bg-navy text-white hover:bg-navy-soft' : 'bg-azure text-navy hover:bg-[#a3d6ff]',
                className,
            )}
        >
            {children}
            <span
                className={cn('grid size-9 place-items-center rounded-full transition-transform group-hover:translate-x-0.5', dark ? 'bg-azure text-navy' : 'bg-navy text-azure')}
            >
                <Icon name="arrow-right" size={16} />
            </span>
        </Link>
    );
}

export function Eyebrow({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
    return (
        <span className={cn('eyebrow py-1 pl-1 pr-3 shadow-sm', dark && 'border-white/15 bg-white/10 text-white shadow-none')}>
            <span className="grid size-5 place-items-center rounded-full bg-white text-navy">
                <LogoMark coin="#2563eb" className="size-3.5" />
            </span>
            {children}
        </span>
    );
}

export function SectionHeading({
    eyebrow,
    title,
    children,
    align = 'left',
    dark = false,
}: {
    eyebrow: string;
    title: ReactNode;
    children?: ReactNode;
    align?: 'left' | 'center';
    dark?: boolean;
}) {
    return (
        <div className={cn('max-w-2xl', align === 'center' && 'mx-auto text-center')}>
            <EnterView distance={16} scale={1} duration={600}>
                <Eyebrow dark={dark}>{eyebrow}</Eyebrow>
            </EnterView>
            {/* Plain-text titles get Glint's blur-in; titles with highlighted parts render as-is. */}
            {typeof title === 'string' ? (
                <UnblurHeading as="h2" text={title} className={cn('mt-4 text-3xl font-medium leading-[1.1] tracking-tight md:text-[2.75rem]', dark ? 'text-white' : 'text-navy')} />
            ) : (
                <EnterView distance={30} scale={1}>
                    <h2 className={cn('mt-4 text-3xl font-medium leading-[1.1] tracking-tight md:text-[2.75rem]', dark ? 'text-white' : 'text-navy')}>{title}</h2>
                </EnterView>
            )}
            {children && (
                <EnterView distance={24} scale={1} delay={150}>
                    <p className={cn('mt-4 text-[15px] leading-relaxed', dark ? 'text-white/70' : 'text-muted-foreground')}>{children}</p>
                </EnterView>
            )}
        </div>
    );
}

/**
 * Rounded blue panel at the top of inner pages; the nav sits inside its top edge.
 * layout: 'split' = text left, image right; 'reverse' = image left; 'stacked' = image above a centred title.
 * Two images always flank a centred title. bg overrides the panel's background classes; extra renders under the text (each page's own widget).
 */
export function PageHero({
    eyebrow,
    title,
    image,
    layout = 'split',
    bg,
    extra,
    children,
}: {
    eyebrow: string;
    title: ReactNode;
    image?: string | [string, string];
    layout?: 'split' | 'reverse' | 'stacked';
    bg?: string;
    extra?: ReactNode;
    children?: ReactNode;
}) {
    const flank = Array.isArray(image);
    const center = flank || layout === 'stacked';
    const art = (src: string, i: number, className?: string) => (
        <EnterView key={src} distance={30} scale={0.9} delay={150 + i * 200} className={className}>
            <img
                src={src}
                alt=""
                className={cn(
                    'mx-auto w-auto object-contain drop-shadow-[0_30px_40px_rgba(4,17,46,.4)] transition-transform duration-500 ease-out hover:scale-110',
                    i ? 'hover:rotate-6' : 'hover:-rotate-6',
                    flank ? 'max-h-24 sm:max-h-32 xl:max-h-48' : layout === 'stacked' ? 'max-h-40 lg:max-h-56' : 'max-h-56 lg:max-h-80',
                )}
            />
        </EnterView>
    );
    return (
        <div className="p-2 sm:p-4">
            <section
                className={cn(
                    'relative isolate overflow-hidden rounded-[2rem] pb-16 text-white md:pb-20',
                    layout === 'stacked' && !flank ? 'pt-28 md:pt-32' : 'pt-32 md:pt-40',
                    bg ?? 'bg-[linear-gradient(180deg,#0b2a5c_0%,#0f3577_70%,#163f86_100%)]',
                )}
            >
                <GridBackground className="absolute inset-0 -z-10 size-full opacity-60" cellSize={64} color="#7cc4ff" lineColor="#23478f" density={0.05} speed={0.6} fade={0.9} />
                <div
                    className={cn(
                        'container-page relative',
                        center ? 'text-center' : image && cn('grid items-center gap-10', layout === 'reverse' ? 'lg:grid-cols-[1fr_1.3fr]' : 'lg:grid-cols-[1.3fr_1fr]'),
                    )}
                >
                    {flank && art(image[0], 0, 'absolute left-0 top-1/2 hidden -translate-y-1/2 md:block')}
                    {typeof image === 'string' && layout === 'stacked' && art(image, 0, 'mb-6')}
                    <div className={cn(flank && 'mx-auto max-w-2xl md:px-28 xl:max-w-4xl xl:px-48', layout === 'stacked' && 'mx-auto max-w-3xl')}>
                        <EnterView distance={16} scale={1} duration={600}>
                            <Eyebrow dark>{eyebrow}</Eyebrow>
                        </EnterView>
                        {typeof title === 'string' ? (
                            <UnblurHeading
                                as="h1"
                                text={title}
                                delay={70}
                                className={cn('mt-5 max-w-3xl text-4xl font-medium leading-[1.08] tracking-tight md:text-6xl', center && 'mx-auto')}
                            />
                        ) : (
                            <EnterView distance={30} scale={1}>
                                <h1 className={cn('mt-5 max-w-3xl text-4xl font-medium leading-[1.08] tracking-tight md:text-6xl', center && 'mx-auto')}>{title}</h1>
                            </EnterView>
                        )}
                        {children && (
                            <EnterView distance={20} scale={1} delay={250}>
                                <p className={cn('mt-5 max-w-xl text-white/70', center && 'mx-auto')}>{children}</p>
                            </EnterView>
                        )}
                        {extra && (
                            <EnterView distance={20} scale={1} delay={350}>
                                <div className="mt-8">{extra}</div>
                            </EnterView>
                        )}
                        {/* Small screens: the two images sit together under the text. */}
                        {flank && <div className="mt-8 flex justify-center gap-6 md:hidden">{image.map((src, i) => art(src, i))}</div>}
                    </div>
                    {flank && art(image[1], 1, 'absolute right-0 top-1/2 hidden -translate-y-1/2 md:block')}
                    {typeof image === 'string' && layout !== 'stacked' && art(image, 0, layout === 'reverse' ? 'lg:order-first' : undefined)}
                </div>
            </section>
        </div>
    );
}

/** White app-style card used for every product mockup. */
export function MockCard({ children, className }: { children: ReactNode; className?: string }) {
    return <div className={cn('rounded-2xl border border-white/80 bg-white p-4 text-navy shadow-[0_20px_50px_-12px_rgb(6_26_61/0.22)]', className)}>{children}</div>;
}

/** Faint grid lines behind a section. */
export function GridLines({ className, line = 'rgb(11 42 92 / .07)' }: { className?: string; line?: string }) {
    return (
        <div
            aria-hidden
            className={cn('pointer-events-none absolute inset-0 -z-10', className)}
            style={{
                backgroundImage: `linear-gradient(${line} 1px, transparent 1px), linear-gradient(90deg, ${line} 1px, transparent 1px)`,
                backgroundSize: '110px 110px',
                maskImage: 'radial-gradient(ellipse 75% 65% at 50% 50%, #000 25%, transparent 75%)',
            }}
        />
    );
}

/** Horizontal rules running from a mockup's edges out to the page sides. */
export function Rails() {
    return (
        <>
            <span aria-hidden className="absolute right-full top-1/4 h-px w-[50vw] bg-gradient-to-l from-[#c7dcf7] to-transparent" />
            <span aria-hidden className="absolute left-full top-1/4 h-px w-[50vw] bg-gradient-to-r from-[#c7dcf7] to-transparent" />
            <span aria-hidden className="absolute right-full top-3/4 h-px w-[50vw] bg-gradient-to-l from-[#c7dcf7] to-transparent" />
            <span aria-hidden className="absolute left-full top-3/4 h-px w-[50vw] bg-gradient-to-r from-[#c7dcf7] to-transparent" />
        </>
    );
}

/** Section title in the reference's weight: medium, tight, with a green highlight inside. */
export function Title({ children, className }: { children: ReactNode; className?: string }) {
    return <h2 className={cn('mt-4 text-3xl font-medium leading-tight tracking-tight text-navy sm:text-[2.6rem]', className)}>{children}</h2>;
}

export function G({ children }: { children: ReactNode }) {
    return <span className="text-[#2563eb]">{children}</span>;
}

export function Glow() {
    return (
        <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -right-40 -top-40 size-[36rem] animate-[glow-drift_14s_ease-in-out_infinite_alternate] rounded-full bg-azure/15 blur-[120px] motion-reduce:animate-none" />
            <div className="absolute -bottom-60 -left-40 size-[30rem] rounded-full bg-blue-400/10 blur-[120px]" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgb(255_255_255/0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.04)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_70%)]" />
        </div>
    );
}

/** Initials avatar as a data URI, for components that expect an image src. */
export function initialsAvatar(name: string, bg = '#0b2a5c', fg = '#7cc4ff') {
    const initials = name
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="${bg}"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="Poppins,sans-serif" font-size="24" font-weight="600" fill="${fg}">${initials}</text></svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** Lime highlight for one or two words inside a heading. */
export function Hl({ children }: { children: ReactNode }) {
    return <span className="text-azure">{children}</span>;
}
