import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { DataTable, Filters, PageHeader, Pager } from '@/components/admin';
import { Badge } from '@/components/glint/badge';
import { Button } from '@/components/glint/button';
import { Checkbox } from '@/components/glint/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/glint/dialog';
import { Input } from '@/components/glint/input';
import { Label } from '@/components/glint/label';
import { Select } from '@/components/glint/select';
import { Icon } from '@/icons/icon';
import { portalLayout } from '@/Layouts/PortalLayout';
import { date } from '@/lib/format';
import { useLocale, useT } from '@/lib/i18n';
import type { Paginated, SharedProps, User } from '@/types';

type Row = User & { is_active: boolean; applications_count: number; created_at: string };

function AddMember() {
    const t = useT();
    const [open, setOpen] = useState(false);
    const form = useForm({ name: '', email: '', role: 'staff', password: '' });
    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/admin/users', {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                setOpen(false);
            },
        });
    };

    return (
        <>
            <Button onClick={() => setOpen(true)} startIcon={<Icon name="user-plus" />}>
                {t('Add team member')}
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <form onSubmit={submit} className="grid gap-4">
                        <DialogHeader>
                            <DialogTitle>{t('Add team member')}</DialogTitle>
                            <DialogDescription>{t('Staff can review applications and record payments. Admins can also change settings and manage the team.')}</DialogDescription>
                        </DialogHeader>
                        <div>
                            <Label htmlFor="m-name" required>{t('Full name')}</Label>
                            <Input id="m-name" className="mt-1.5" required value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} error={form.errors.name} />
                        </div>
                        <div>
                            <Label htmlFor="m-email" required>{t('Email')}</Label>
                            <Input id="m-email" className="mt-1.5" type="email" required value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} error={form.errors.email} />
                        </div>
                        <div>
                            <Label htmlFor="m-role" required>{t('Role')}</Label>
                            <div className="mt-1.5">
                                <Select
                                    id="m-role"
                                    value={form.data.role}
                                    onValueChange={(v) => form.setData('role', v)}
                                    options={[
                                        { value: 'staff', label: t('Staff') },
                                        { value: 'admin', label: t('Administrator') },
                                    ]}
                                />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="m-password" required hint={t('At least 8 characters')}>{t('Temporary password')}</Label>
                            <Input
                                id="m-password"
                                className="mt-1.5"
                                type="password"
                                autoComplete="new-password"
                                required
                                value={form.data.password}
                                onChange={(e) => form.setData('password', e.target.value)}
                                error={form.errors.password}
                            />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setOpen(false)}>{t('Cancel')}</Button>
                            <Button type="submit" loading={form.processing}>{t('Add member')}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

export default function Users({ users, filters }: { users: Paginated<Row>; filters: Record<string, string> }) {
    const t = useT();
    const locale = useLocale();
    const me = usePage<SharedProps>().props.auth.user;
    const roles = [
        { value: 'borrower', label: t('Borrower') },
        { value: 'staff', label: t('Staff') },
        { value: 'admin', label: t('Administrator') },
    ];
    const update = (u: Row, data: { role?: string; is_active?: boolean }) =>
        router.patch(`/admin/users/${u.id}`, { role: u.role, is_active: u.is_active, ...data }, { preserveScroll: true });

    return (
        <>
            <Head title={t('Team & users')} />
            <PageHeader title={t('Team & users')} subtitle={t('Manage staff accounts, roles and access.')} actions={<AddMember />} />
            <Filters
                url="/admin/users"
                filters={filters}
                fields={[
                    { key: 'search', type: 'search', label: t('Search name or email') },
                    { key: 'role', type: 'select', label: t('All roles'), options: roles },
                ]}
            />
            <DataTable head={[t('Name'), t('Role'), t('Applications'), t('Joined'), t('Active')]} empty={users.data.length === 0}>
                {users.data.map((u) => {
                    const self = u.id === me?.id;
                    return (
                        <tr key={u.id} className={u.is_active ? '' : 'opacity-60'}>
                            <td>
                                <span className="block font-medium">
                                    {u.name} {self && <Badge size="sm" variant="secondary">{t('You')}</Badge>}
                                </span>
                                <span className="text-xs text-muted-foreground">{u.email}</span>
                            </td>
                            <td className="w-44">
                                {self ? (
                                    <span className="text-sm">{t('Administrator')}</span>
                                ) : (
                                    <Select aria-label={t('Role for :name', { name: u.name })} value={u.role} options={roles} onValueChange={(role) => update(u, { role })} />
                                )}
                            </td>
                            <td className="tabular-nums">{u.applications_count}</td>
                            <td className="whitespace-nowrap">{date(u.created_at, locale)}</td>
                            <td>
                                <Checkbox
                                    aria-label={t('Active')}
                                    checked={u.is_active}
                                    disabled={self}
                                    onChange={(e) => update(u, { is_active: e.target.checked })}
                                />
                            </td>
                        </tr>
                    );
                })}
            </DataTable>
            <Pager page={users} url="/admin/users" filters={filters} />
        </>
    );
}

Users.layout = portalLayout;
