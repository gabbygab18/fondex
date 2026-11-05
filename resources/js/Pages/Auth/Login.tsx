import { Head, Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { Button } from '@/components/glint/button';
import { Checkbox } from '@/components/glint/checkbox';
import { AuthShell, authLayout } from '@/components/public/AuthShell';
import { Field, PasswordField } from '@/components/public/Field';
import { Icon } from '@/icons/icon';

import { useT } from '@/lib/i18n';

export default function Login() {
    const t = useT();
    const form = useForm({ email: '', password: '', remember: false });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.post('/login', { onFinish: () => form.reset('password') });
    };

    return (
        <>
            <Head title={t('Sign in')} />
            <AuthShell
                title={t('Welcome back')}
                subtitle={
                    <>
                        {t('New here?')}{' '}
                        <Link href="/register" className="font-semibold text-navy underline underline-offset-4">
                            {t('Create an account')}
                        </Link>
                    </>
                }
            >
                <form onSubmit={submit} className="grid gap-5" noValidate>
                    <Field label={t('Email')} type="email" required autoComplete="email" autoFocus startIcon={<Icon name="mail" />} value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} error={form.errors.email} />
                    <PasswordField label={t('Password')} required autoComplete="current-password" value={form.data.password} onChange={(e) => form.setData('password', e.target.value)} error={form.errors.password} />
                    <div className="flex items-center justify-between gap-4">
                        <Checkbox label={t('Remember me')} checked={form.data.remember} onChange={(e) => form.setData('remember', e.target.checked)} />
                        <Link href="/forgot-password" className="text-sm font-medium text-navy hover:underline">
                            {t('Forgot your password?')}
                        </Link>
                    </div>
                    <Button type="submit" size="lg" loading={form.processing} endIcon={<Icon name="arrow-right" />} className="mt-2 w-full rounded-full">
                        {t('Sign in')}
                    </Button>
                </form>
            </AuthShell>
        </>
    );
}

Login.layout = authLayout;
