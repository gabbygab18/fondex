import { useId, useState, type ReactNode } from 'react';
import { Input, type InputProps } from '@/components/glint/input';
import { Label } from '@/components/glint/label';
import { Icon } from '@/icons/icon';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/** Glint Label + Input with the server validation message under it. */
export function Field({ label, error, required, hint, ...props }: Omit<InputProps, 'error'> & { label: ReactNode; error?: string; hint?: ReactNode }) {
    const id = useId();
    return (
        <div className="grid min-w-0 gap-2">
            <Label htmlFor={id} required={required} hint={hint}>
                {label}
            </Label>
            <Input id={id} required={required} error={error} size="lg" {...props} />
        </div>
    );
}

/** Field with a show/hide toggle, so people can check what they typed. */
export function PasswordField(props: Omit<InputProps, 'error' | 'type'> & { label: ReactNode; error?: string; hint?: ReactNode }) {
    const t = useT();
    const [shown, setShown] = useState(false);
    return (
        <Field
            {...props}
            type={shown ? 'text' : 'password'}
            startIcon={<Icon name="lock" />}
            endIcon={
                <button
                    type="button"
                    onClick={() => setShown((s) => !s)}
                    aria-label={shown ? t('Hide password') : t('Show password')}
                    aria-pressed={shown}
                    className="grid place-items-center rounded-md p-1 hover:text-foreground"
                >
                    <Icon name={shown ? 'eye-off' : 'eye'} />
                </button>
            }
        />
    );
}

/** Native textarea styled to match Glint Input (Glint has no textarea). */
export function TextArea({ label, error, required, className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: ReactNode; error?: string }) {
    const id = useId();
    return (
        <div className="grid gap-2">
            <Label htmlFor={id} required={required}>
                {label}
            </Label>
            <textarea
                id={id}
                required={required}
                aria-invalid={!!error || undefined}
                aria-describedby={error ? `${id}-error` : undefined}
                className={cn(
                    'min-h-32 w-full rounded-xl border border-input bg-background px-4 py-3 text-base text-foreground shadow-xs outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground hover:border-foreground/25',
                    'focus:border-ring focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--ring)_25%,transparent)] aria-invalid:border-destructive/70',
                    className,
                )}
                {...props}
            />
            {error && (
                <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
                    {error}
                </p>
            )}
        </div>
    );
}
