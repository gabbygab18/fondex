import { useMemo } from 'react';
import { renderSVG } from 'uqr';
import { Button, buttonVariants } from '@/components/glint/button';
import { useToast } from '@/components/glint/toast';
import { Icon } from '@/icons/icon';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const svgFor = (value: string) => renderSVG(value, { border: 2, ecc: 'M', blackColor: '#0b2a5c', whiteColor: '#ffffff' });

/** A QR code for a link, drawn in the browser (no outside service). */
export function QrCode({ value, label, className }: { value: string; label: string; className?: string }) {
    const svg = useMemo(() => svgFor(value), [value]);
    // The SVG is generated locally from our own URL, so it is safe to inject.
    return <div role="img" aria-label={label} className={cn('overflow-hidden rounded-xl bg-white [&>svg]:block [&>svg]:size-full', className)} dangerouslySetInnerHTML={{ __html: svg }} />;
}

/** Saves the QR code as a 1024px PNG, ready to print or post. */
export function downloadQr(value: string, filename: string) {
    const img = new Image();
    img.onload = () => {
        const canvas = Object.assign(document.createElement('canvas'), { width: 1024, height: 1024 });
        const ctx = canvas.getContext('2d')!;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0, 1024, 1024);
        Object.assign(document.createElement('a'), { href: canvas.toDataURL('image/png'), download: filename }).click();
    };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgFor(value));
}

/** Copy / share / WhatsApp buttons for a link. "Share" uses the phone's own share sheet where there is one. */
export function ShareButtons({ url, text }: { url: string; text: string }) {
    const t = useT();
    const { toast } = useToast();
    const copy = () => navigator.clipboard.writeText(url).then(() => toast({ title: t('Link copied'), variant: 'success', duration: 1500 }));
    return (
        <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={copy} startIcon={<Icon name="copy" />}>
                {t('Copy link')}
            </Button>
            <a href={`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: 'outline' })}>
                <Icon name="chat" /> WhatsApp
            </a>
            {typeof navigator.share === 'function' && (
                <Button type="button" onClick={() => navigator.share({ title: 'Fondex', text, url }).catch(() => {})} startIcon={<Icon name="share" />}>
                    {t('Share')}
                </Button>
            )}
        </div>
    );
}
