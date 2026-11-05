import { useId, useState } from 'react';
import { Icon } from '@/icons/icon';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/** Native file input dressed as a drop zone: drag-and-drop and click both work, no library. */
export function FileDrop({ label, hint, file, onChange, error, required }: { label: string; hint?: string; file: File | null; onChange: (f: File | null) => void; error?: string; required?: boolean }) {
    const t = useT();
    const id = useId();
    const [over, setOver] = useState(false);

    return (
        <div>
            <label
                htmlFor={id}
                onDragOver={(e) => (e.preventDefault(), setOver(true))}
                onDragLeave={() => setOver(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setOver(false);
                    onChange(e.dataTransfer.files[0] ?? null);
                }}
                className={cn(
                    'flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed bg-background p-4 transition-colors focus-within:ring-[3px] focus-within:ring-ring/40',
                    over ? 'border-ring bg-secondary' : file ? 'border-[#2563eb]/50 bg-secondary/50' : 'border-input hover:border-foreground/30',
                    error && 'border-destructive/60',
                )}
            >
                <span className={cn('grid size-11 shrink-0 place-items-center rounded-xl', file ? 'bg-azure text-navy' : 'bg-muted text-muted-foreground')}>
                    <Icon name={file ? 'file-check' : 'cloud-upload'} size={20} />
                </span>
                <span className="min-w-0 flex-1 text-sm">
                    <span className="block font-medium">
                        {label} {required && <span className="text-destructive">*</span>}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">{file ? file.name : (hint ?? t('JPG, PNG or PDF, up to 8 MB'))}</span>
                </span>
                {file ? (
                    <button
                        type="button"
                        onClick={(e) => (e.preventDefault(), onChange(null))}
                        className="grid size-8 place-items-center rounded-full hover:bg-muted"
                        aria-label={t('Remove file')}
                    >
                        <Icon name="close" size={16} />
                    </button>
                ) : (
                    <span className="text-xs font-semibold text-navy">{t('Browse')}</span>
                )}
                <input id={id} type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" className="sr-only" onChange={(e) => onChange(e.target.files?.[0] ?? null)} />
            </label>
            {error && <p className="mt-1.5 text-xs text-destructive" role="alert">{error}</p>}
        </div>
    );
}
