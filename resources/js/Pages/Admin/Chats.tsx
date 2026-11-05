import { Head, Link, router, useForm, usePoll, usePage } from '@inertiajs/react';
import { useEffect, useRef, type FormEvent } from 'react';
import { PageHeader } from '@/components/admin';
import { Avatar } from '@/components/glint/avatar';
import { Icon } from '@/icons/icon';
import { portalLayout } from '@/Layouts/PortalLayout';
import { useLocale, useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';

type Row = { id: number; name: string; email: string | null; user_id: number | null; last: string | null; at: string; unread: boolean };
type Open = { id: number; name: string; email: string | null; user_id: number | null; messages: { id: number; kind: 'visitor' | 'staff' | 'bot' | 'system'; body: string; created_at: string }[] };

export default function Chats() {
    const { chats, open } = usePage<{ chats: Row[]; open: Open | null }>().props;
    const t = useT();
    const locale = useLocale();
    usePoll(4000);
    const form = useForm({ body: '' });
    const list = useRef<HTMLDivElement>(null);
    const count = open?.messages.length ?? 0;

    useEffect(() => list.current?.scrollTo({ top: list.current.scrollHeight }), [open?.id, count]);

    const when = (at: string) => {
        const d = new Date(at);
        return d.toDateString() === new Date().toDateString()
            ? d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
            : d.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
    };
    const reply = (e: FormEvent) => {
        e.preventDefault();
        if (open && form.data.body.trim()) form.post(`/admin/chats/${open.id}`, { preserveScroll: true, onSuccess: () => form.reset() });
    };

    return (
        <>
            <Head title={t('Chats')} />
            <PageHeader title={t('Chats')} subtitle={t('Messages from the chat bubble on the website. New messages appear automatically.')} />
            <div className="grid h-[calc(100vh-15rem)] min-h-[28rem] overflow-hidden rounded-3xl bg-card ring-1 ring-border md:grid-cols-[20rem_1fr]">
                <ul className={cn('overflow-y-auto border-r border-border', open && 'hidden md:block')}>
                    {chats.length === 0 && <li className="p-6 text-sm text-muted-foreground">{t('No chats yet.')}</li>}
                    {chats.map((c) => (
                        <li key={c.id}>
                            <Link
                                href={`/admin/chats?chat=${c.id}`}
                                preserveScroll
                                className={cn('flex items-center gap-3 border-b border-border px-4 py-3 transition-colors hover:bg-muted', open?.id === c.id && 'bg-[#eef4ff]')}
                            >
                                <Avatar name={c.name} size="sm" />
                                <span className="min-w-0 flex-1">
                                    <span className="flex items-center gap-2">
                                        <b className={cn('truncate text-sm', c.unread ? 'text-navy' : 'font-medium')}>{c.name}</b>
                                        <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">{when(c.at)}</span>
                                    </span>
                                    <span className={cn('block truncate text-xs', c.unread ? 'font-semibold text-navy' : 'text-muted-foreground')}>{c.last}</span>
                                </span>
                                {c.unread && <span className="size-2.5 shrink-0 rounded-full bg-[#2563eb]" aria-label="unread" />}
                            </Link>
                        </li>
                    ))}
                </ul>

                {open ? (
                    <section className="flex min-h-0 flex-col">
                        <header className="flex items-center gap-3 border-b border-border px-5 py-3">
                            <Link href="/admin/chats" className="rounded-lg p-1 hover:bg-muted md:hidden" aria-label={t('Back')}>
                                <Icon name="arrow-left" size={18} />
                            </Link>
                            <Avatar name={open.name} size="sm" />
                            <span className="min-w-0 flex-1 leading-tight">
                                <b className="block truncate text-sm text-navy">{open.name}</b>
                                <span className="text-xs text-muted-foreground">
                                    {open.email && `${open.email} · `}
                                    {open.user_id ? t('Client') : t('Guest')}
                                </span>
                            </span>
                            {open.email && (
                                <a href={`mailto:${open.email}`} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-navy" aria-label={t('Email')}>
                                    <Icon name="mail" size={18} />
                                </a>
                            )}
                            {open.user_id && (
                                <Link href={`/admin/clients/${open.user_id}`} className="rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted">
                                    {t('View client')}
                                </Link>
                            )}
                        </header>
                        <div ref={list} className="flex flex-1 flex-col gap-2 overflow-y-auto bg-[#f4f7fc] p-5 text-sm">
                            {open.messages.map((m) =>
                                m.kind === 'system' ? (
                                    <p key={m.id} className="mx-auto my-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800">
                                        {t(':name joined the chat', { name: m.body })} · {when(m.created_at)}
                                    </p>
                                ) : (
                                    <div key={m.id} className={cn('max-w-[75%]', m.kind !== 'visitor' && 'ml-auto text-right')}>
                                        {m.kind === 'bot' && (
                                            <span className="mb-1 flex items-center justify-end gap-1 text-[10px] font-semibold uppercase tracking-wider text-[#2563eb]">
                                                <Icon name="robot" size={12} /> {t('Assistant (automatic)')}
                                            </span>
                                        )}
                                        <p
                                            className={cn(
                                                'whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-left shadow-sm',
                                                m.kind === 'visitor' ? 'rounded-tl-md bg-white text-navy' : 'rounded-tr-md',
                                                m.kind === 'staff' && 'bg-[#2563eb] text-white',
                                                m.kind === 'bot' && 'bg-[#e8f0fe] text-navy',
                                            )}
                                        >
                                            {m.body}
                                        </p>
                                        <span className="mt-1 block px-1 text-[10px] text-muted-foreground">{when(m.created_at)}</span>
                                    </div>
                                ),
                            )}
                        </div>
                        <form onSubmit={reply} className="flex items-end gap-2 border-t border-border p-3">
                            <textarea
                                rows={2}
                                className="max-h-40 flex-1 resize-none rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20"
                                placeholder={t('Write a reply…')}
                                aria-label={t('Reply')}
                                maxLength={2000}
                                value={form.data.body}
                                onChange={(e) => form.setData('body', e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && reply(e)}
                            />
                            <button
                                type="submit"
                                disabled={form.processing || !form.data.body.trim()}
                                className="flex h-10 items-center gap-2 rounded-xl bg-[#2563eb] px-4 text-sm font-semibold text-white transition hover:bg-navy disabled:opacity-40"
                            >
                                <Icon name="send" size={16} /> {t('Send')}
                            </button>
                        </form>
                    </section>
                ) : (
                    <div className="hidden place-items-center p-8 text-center text-sm text-muted-foreground md:grid">
                        <span>
                            <Icon name="chat-round" size={40} className="mx-auto mb-3 text-[#2563eb]/50" />
                            {t('Pick a chat to read and reply.')}
                        </span>
                    </div>
                )}
            </div>
        </>
    );
}

Chats.layout = portalLayout;
