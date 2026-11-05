import { Head, Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { Button } from '@/components/glint/button';
import { AuthShell, authLayout } from '@/components/public/AuthShell';
import { Field } from '@/components/public/Field';
import { Icon } from '@/icons/icon';

import { useT } from '@/lib/i18n';

export default function ForgotPassword() {
    const t = useT();
    const form = useForm({ email: '' });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.post('/forgot-password');
    };

    return (
        <>
            <Head title={t('Forgot your password?')} />
            <AuthShell title={t('Forgot your password?')} subtitle={t('Enter your email and we will send you a link to choose a new one.')}>
                <form onSubmit={submit} className="grid gap-5" noValidate>
                    <Field label={t('Email')} type="email" required autoComplete="email" autoFocus startIcon={<Icon name="mail" />} value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} error={form.errors.email} />
                    <Button type="submit" size="lg" loading={form.processing} endIcon={<Icon name="send" />} className="w-full rounded-full">
                        {t('Send reset link')}
                    </Button>
                    <Link href="/login" className="flex items-center justify-center gap-1.5 text-sm font-medium text-navy hover:underline">
                        <Icon name="arrow-left" size={16} /> {t('Back to sign in')}
                    </Link>
                </form>
            </AuthShell>
        </>
    );
}

ForgotPassword.layout = authLayout;
