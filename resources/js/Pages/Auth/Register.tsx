import { Head, Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { Button } from '@/components/glint/button';
import { RadioGroup, RadioGroupItem } from '@/components/glint/radio-group';
import { AuthShell, authLayout } from '@/components/public/AuthShell';
import { Field, PasswordField } from '@/components/public/Field';
import { Icon } from '@/icons/icon';

import { useT, visitorCountry } from '@/lib/i18n';

export default function Register() {
    const t = useT();
    const form = useForm({ name: '', email: '', phone: '', country: (visitorCountry() ?? 'CO') as string, password: '', password_confirmation: '' });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.post('/register', { onFinish: () => form.reset('password', 'password_confirmation') });
    };

    return (
        <>
            <Head title={t('Create an account')} />
            <AuthShell
                title={t('Create your account')}
                subtitle={
                    <>
                        {t('Already have an account?')}{' '}
                        <Link href="/login" className="font-semibold text-navy underline underline-offset-4">
                            {t('Sign in')}
                        </Link>
                    </>
                }
            >
                <form onSubmit={submit} className="grid gap-4" noValidate>
                    <Field label={t('Full name')} required autoComplete="name" autoFocus value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} error={form.errors.name} />
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label={t('Email')} type="email" required autoComplete="email" value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} error={form.errors.email} />
                        <Field label={t('Phone')} type="tel" required autoComplete="tel" value={form.data.phone} onChange={(e) => form.setData('phone', e.target.value)} error={form.errors.phone} />
                    </div>
                    <fieldset className="grid gap-2">
                        <legend className="mb-1.5 text-sm font-medium text-foreground/85">{t('Country')}</legend>
                        <RadioGroup value={form.data.country} onValueChange={(v) => form.setData('country', v)} variant="card" orientation="horizontal" name="country">
                            <RadioGroupItem value="AR" label="Argentina" />
                            <RadioGroupItem value="CO" label="Colombia" />
                        </RadioGroup>
                        {form.errors.country && <p className="text-xs text-destructive">{form.errors.country}</p>}
                    </fieldset>
                    <div className="grid gap-5 sm:grid-cols-2">
                        <PasswordField label={t('Password')} required autoComplete="new-password" value={form.data.password} onChange={(e) => form.setData('password', e.target.value)} error={form.errors.password} />
                        <PasswordField label={t('Confirm password')} required autoComplete="new-password" value={form.data.password_confirmation} onChange={(e) => form.setData('password_confirmation', e.target.value)} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {t('By creating an account you accept our')}{' '}
                        <Link href="/terms" className="underline">{t('Terms and Conditions')}</Link> {t('and')}{' '}
                        <Link href="/privacy" className="underline">{t('Privacy Policy')}</Link>.
                    </p>
                    <Button type="submit" size="lg" loading={form.processing} endIcon={<Icon name="arrow-right" />} className="w-full rounded-full">
                        {t('Create account')}
                    </Button>
                </form>
            </AuthShell>
        </>
    );
}

Register.layout = authLayout;
