import { Head, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { Button } from '@/components/glint/button';
import { AuthShell, authLayout } from '@/components/public/AuthShell';
import { Field, PasswordField } from '@/components/public/Field';
import { Icon } from '@/icons/icon';

import { useT } from '@/lib/i18n';

export default function ResetPassword({ token, email }: { token: string; email: string | null }) {
    const t = useT();
    const form = useForm({ token, email: email ?? '', password: '', password_confirmation: '' });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.post('/reset-password', { onFinish: () => form.reset('password', 'password_confirmation') });
    };

    return (
        <>
            <Head title={t('Choose a new password')} />
            <AuthShell title={t('Choose a new password')}>
                <form onSubmit={submit} className="grid gap-5" noValidate>
                    <Field label={t('Email')} type="email" required autoComplete="email" startIcon={<Icon name="mail" />} value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} error={form.errors.email} />
                    <PasswordField label={t('New password')} required autoComplete="new-password" autoFocus value={form.data.password} onChange={(e) => form.setData('password', e.target.value)} error={form.errors.password} />
                    <PasswordField label={t('Confirm password')} required autoComplete="new-password" value={form.data.password_confirmation} onChange={(e) => form.setData('password_confirmation', e.target.value)} />
                    <Button type="submit" size="lg" loading={form.processing} endIcon={<Icon name="check" />} className="w-full rounded-full">
                        {t('Reset password')}
                    </Button>
                </form>
            </AuthShell>
        </>
    );
}

ResetPassword.layout = authLayout;
