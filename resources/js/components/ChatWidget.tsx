import { usePage } from '@inertiajs/react';
import axios from 'axios';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Icon } from '@/icons/icon';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { SharedProps } from '@/types';

/** kind: visitor | staff | bot (keyword auto-answer while queued) | system (staff joined; body = their first name) */
type Msg = { id: number; kind: 'visitor' | 'staff' | 'bot' | 'system'; body: string; at: string };
type Payload = { started: boolean; messages: Msg[]; agent: string | null; queue: number | null; suggest: string[] };

/** Open the chat from anywhere on the site, e.g. a "Chat with us" button. */
export const openChat = () => window.dispatchEvent(new Event('open-chat'));

/**
 * Live chat bubble. While the visitor waits in the queue, a keyword bot answers common questions;
 * once a staff member replies from /admin/chats, a "joined" notice appears and the bot steps aside.
 * No websockets: it polls every few seconds while open, and slowly while closed so a reply can light up the badge.
 */
export function ChatWidget() {
    const { auth, locale } = usePage<SharedProps>().props;
    const t = useT();
    const [open, setOpen] = useState(false);
    const [state, setState] = useState<Omit<Payload, 'messages'>>({ started: false, agent: null, queue: null, suggest: [] });
    const [msgs, setMsgs] = useState<Msg[]>([]);
    const [typing, setTyping] = useState(false);
    const [unseen, setUnseen] = useState(0);
    const [form, setForm] = useState({ name: '', email: '', body: '' });
    const [error, setError] = useState('');
    const [sending, setSending] = useState(false);
    const list = useRef<HTMLDivElement>(null);
    const nameRef = useRef<HTMLInputElement>(null);
    const last = msgs.at(-1)?.id ?? 0;

    const add = (fresh: Msg[]) => setMsgs((m) => [...m, ...fresh.filter((n) => !m.some((x) => x.id === n.id))]);
    const merge = ({ messages, ...rest }: Payload, countUnseen: boolean, botDelay = false) => {
        setState(rest);
        if (countUnseen) setUnseen((u) => u + messages.filter((n) => n.kind === 'staff').length);
        // A short "typing…" pause before the bot's answer, so it doesn't land in the same instant as the question.
        const bot = botDelay ? messages.filter((n) => n.kind === 'bot') : [];
        add(messages.filter((n) => !bot.includes(n)));
        if (bot.length) {
            setTyping(true);
            setTimeout(() => (add(bot), setTyping(false)), 900);
        }
    };

    // Whole chat again on load and on a language switch, so the assistant's answers follow the new language.
    useEffect(() => {
        axios.get('/chat').then((r) => {
            setMsgs([]);
            merge(r.data, false);
        });
    }, [locale]);

    useEffect(() => {
        const show = () => setOpen(true);
        window.addEventListener('open-chat', show);
        return () => window.removeEventListener('open-chat', show);
    }, []);

    useEffect(() => {
        if (!state.started) return;
        const id = setInterval(() => axios.get('/chat', { params: { after: last } }).then((r) => merge(r.data, !open)), open ? 4000 : 20000);
        return () => clearInterval(id);
    }, [state.started, open, last]);

    useEffect(() => {
        if (open) setUnseen(0);
        list.current?.scrollTo({ top: list.current.scrollHeight, behavior: 'smooth' });
    }, [open, msgs.length, typing]);

    const askName = !state.started && !auth.user;

    const send = (body: string) => {
        if (!body.trim() || sending) return;
        if (askName && !form.name.trim()) {
            setForm((f) => ({ ...f, body }));
            setError(t('Please tell us your name first.'));
            nameRef.current?.focus();
            return;
        }
        setSending(true);
        setError('');
        axios
            .post('/chat', { ...form, body, after: last })
            .then((r) => {
                merge(r.data, false, true);
                setForm((f) => ({ ...f, body: '' }));
            })
            .catch((err) => setError((Object.values(err.response?.data?.errors ?? {}).flat()[0] as string) ?? t('Something went wrong. Please try again.')))
            .finally(() => setSending(false));
    };
    const submit = (e: FormEvent) => {
        e.preventDefault();
        send(form.body);
    };

    const status = state.agent
        ? t('Connected with :name', { name: state.agent })
        : state.queue
          ? t('You are #:n in the queue. Our assistant can help meanwhile.', { n: state.queue })
          : t('We usually reply within minutes, Mon–Fri 8:00–18:00');
    const input = 'w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20';
    const left = 'max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-tl-md px-3.5 py-2.5 shadow-sm';

    return (
        <>
            <AnimatePresence>
                {open && (
                    <motion.div
                        role="dialog"
                        aria-label={t('Chat with us')}
                        initial={{ opacity: 0, y: 16, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 16, scale: 0.96 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        className="fixed inset-x-3 bottom-24 z-50 flex h-[min(34rem,calc(100dvh-8rem))] origin-bottom-right flex-col overflow-hidden rounded-3xl bg-white shadow-2xl shadow-navy/30 ring-1 ring-black/5 sm:left-auto sm:right-5 sm:w-[23rem]"
                    >
                        <div className="flex items-center gap-3 bg-gradient-to-br from-navy-soft via-navy to-navy-deep p-4 text-white">
                            <span className="relative grid size-10 shrink-0 place-items-center rounded-full bg-white/15">
                                <Icon name={state.agent ? 'user-check' : 'chat-round'} size={20} />
                                <span className={cn('absolute bottom-0 right-0 size-2.5 rounded-full ring-2 ring-navy', state.agent || !state.started ? 'bg-emerald-400' : 'bg-amber-400')} />
                            </span>
                            <span className="flex-1 leading-tight">
                                <b className="block text-sm">{state.agent ? t(':name from our team', { name: state.agent }) : t('Chat with us')}</b>
                                <span className="text-xs text-white/70" aria-live="polite">
                                    {status}
                                </span>
                            </span>
                            <button type="button" onClick={() => setOpen(false)} aria-label={t('Close')} className="rounded-full p-1.5 text-white/80 hover:bg-white/10 hover:text-white">
                                <Icon name="close" size={18} />
                            </button>
                        </div>

                        <div ref={list} className="flex flex-1 flex-col gap-2 overflow-y-auto bg-[#f4f7fc] p-4 text-sm" aria-live="polite">
                            <Bot>{t('Hi! How can we help you today?')}</Bot>
                            {msgs.map((m) =>
                                m.kind === 'system' ? (
                                    <p key={m.id} className="mx-auto my-1 flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800">
                                        <Icon name="user-check" size={14} /> {t(':name joined the chat. You are now talking to our team.', { name: m.body })}
                                    </p>
                                ) : m.kind === 'bot' ? (
                                    <Bot key={m.id}>{m.body}</Bot>
                                ) : (
                                    <p key={m.id} className={cn(left, m.kind === 'visitor' ? 'ml-auto rounded-tl-2xl rounded-tr-md bg-[#2563eb] text-white' : 'bg-white text-navy')}>
                                        {m.body}
                                    </p>
                                ),
                            )}
                            {state.suggest.length > 0 && !typing && !sending && (
                                <div className="mt-1 flex flex-wrap gap-1.5">
                                    {state.suggest.map((q) => (
                                        <button
                                            key={q}
                                            type="button"
                                            onClick={() => send(q)}
                                            className="rounded-full border border-[#2563eb]/30 bg-white px-3 py-1 text-left text-xs text-[#2563eb] transition-colors hover:bg-[#2563eb] hover:text-white"
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            )}
                            {typing && (
                                <p className="flex w-fit gap-1 rounded-2xl rounded-tl-md bg-white px-3.5 py-3.5 shadow-sm" aria-label={t('Typing…')}>
                                    {[0, 150, 300].map((d) => (
                                        <span key={d} className="size-1.5 animate-bounce rounded-full bg-navy/40" style={{ animationDelay: `${d}ms` }} />
                                    ))}
                                </p>
                            )}
                        </div>


                        <form onSubmit={submit} className="grid gap-2 border-t border-border p-3">
                            {askName && (
                                <div className="grid grid-cols-2 gap-2">
                                    <input ref={nameRef} className={input} placeholder={t('Your name')} required maxLength={120} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                                    <input className={input} type="email" placeholder={t('Email (optional)')} maxLength={190} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                                </div>
                            )}
                            {error && <p className="text-xs text-destructive">{error}</p>}
                            <div className="flex items-end gap-2">
                                <textarea
                                    className={cn(input, 'max-h-28 min-h-10 resize-none')}
                                    rows={1}
                                    placeholder={t('Write a message…')}
                                    aria-label={t('Message')}
                                    maxLength={2000}
                                    value={form.body}
                                    onChange={(e) => setForm({ ...form, body: e.target.value })}
                                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && submit(e)}
                                />
                                <button
                                    type="submit"
                                    disabled={sending || !form.body.trim()}
                                    aria-label={t('Send')}
                                    className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#2563eb] text-white transition hover:bg-navy disabled:opacity-40"
                                >
                                    <Icon name="send" size={18} />
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-label={open ? t('Close chat') : t('Chat with us')}
                aria-expanded={open}
                className="fixed bottom-5 right-5 z-40 grid size-14 place-items-center rounded-full bg-gradient-to-br from-[#2563eb] to-navy text-white shadow-[0_6px_24px_rgb(37_99_235/0.45)] transition-transform hover:scale-105"
            >
                <Icon name={open ? 'close' : 'chat-round'} size={26} />
                {unseen > 0 && !open && (
                    <span className="absolute -right-0.5 -top-0.5 grid size-5 place-items-center rounded-full bg-rose-500 text-[10px] font-bold ring-2 ring-white">{unseen}</span>
                )}
            </button>
        </>
    );
}

/** Assistant bubble: left side, tinted, with a small "Assistant" label so it's not mistaken for a person. */
function Bot({ children }: { children: string }) {
    const t = useT();
    return (
        <div className="max-w-[85%]">
            <span className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-[#2563eb]">
                <Icon name="robot" size={12} /> {t('Assistant')}
            </span>
            <p className="whitespace-pre-wrap break-words rounded-2xl rounded-tl-md bg-[#e8f0fe] px-3.5 py-2.5 text-navy shadow-sm">{children}</p>
        </div>
    );
}
