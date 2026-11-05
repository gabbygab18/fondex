<?php

namespace App\Support;

use Illuminate\Support\Str;

/**
 * Keyword auto-answers for the live chat while the visitor waits for staff.
 *
 * Matching: the message is lowercased, accents dropped ("interés" -> "interes") and stretched letters squeezed
 * ("holaaa" -> "hola"). Each keyword matches the start of a word, so "document" matches "documentos". Keywords of
 * 5+ letters also tolerate typos (1 wrong letter, 2 for 8+ letters): "intrest", "documnts", "rquisitos".
 * Multi-word keywords must appear in order and score higher, exact hits score above typo hits.
 *
 * Each topic: keywords, the answer (an English key translated with __() via lang/es.json), the chip question shown
 * as a suggestion, and the follow-up topics to suggest after it. To add a topic: add a row here and the Spanish
 * text of its answer and question to lang/es.json.
 */
class ChatBot
{
    public const TOPICS = [
        'greeting' => [
            ['hola', 'hello', 'hey', 'buenas', 'buen dia', 'buenos dias', 'buenas tardes', 'buenas noches', 'good morning', 'good afternoon', 'good evening', 'saludos', 'que tal', 'ola'],
            'Hi! I am the Fondex assistant. Ask me about amounts, rates, documents or payments while a team member joins.',
            null, ['amount', 'rate', 'requirements'],
        ],
        'how_it_works' => [
            ['como funciona', 'how does it work', 'how it works', 'how does this work', 'info', 'informacion', 'information', 'explica', 'explain', 'proceso', 'process', 'pasos', 'steps', 'de que se trata', 'que ofrecen', 'what do you offer', 'que es fondex', 'what is fondex'],
            'It is simple: apply online in a few minutes, we review your application within 24 hours, and once approved we send you the money. Then you repay in equal payments over 1 to 3 months.',
            'How does it work?', ['requirements', 'amount', 'rate'],
        ],
        'requirements' => [
            ['requisit', 'requirement', 'req', 'reqs', 'quien puede', 'who can', 'eligib', 'edad', 'mayor de edad', 'age', 'old enough', 'puedo solicitar', 'puedo pedir', 'can i apply', 'can i get', 'calific', 'qualif', 'que necesito', 'what do i need', 'condicion', 'condition'],
            'Anyone 18 or older who lives in a country where we operate, has a valid national ID, a verifiable income and a bank account in their name.',
            'Who can apply for a loan?', ['documents', 'apply', 'amount'],
        ],
        'amount' => [
            ['cuanto puedo', 'cuanto me prestan', 'cuanto prestan', 'how much', 'how mutch', 'hw much', 'monto', 'amount', 'amt', 'maximo', 'minimo', 'maximum', 'minimum', 'max', 'limite', 'limit', 'borrow', 'cuanta plata', 'cuanto dinero', 'cuanto me dan', 'cupo'],
            'It depends on your country and your income. You can see the current minimum and maximum amounts on our Loans page and try them in the calculator.',
            'How much can I borrow?', ['rate', 'term', 'apply'],
        ],
        'rate' => [
            ['interes', 'interest', 'tasa', 'rate', 'rates', 'porcentaje', 'percent', 'cuesta', 'cost', 'costo', 'comision', 'fee', 'fees', 'cargo', 'charge', 'cobran', 'cuanto pago de', 'hidden'],
            'Your rate depends on your profile and your application. It is charged once on the amount you borrow, and we confirm your exact rate and total to repay when we approve your loan, before any money is sent.',
            'What interest rate will I pay?', ['term', 'repay', 'early'],
        ],
        'term' => [
            ['plazo', 'term', 'meses', 'months', 'month', 'mes', 'cuanto tiempo tengo', 'how long can', 'how long do i have', 'duracion', 'duration', 'cuotas', 'semanal', 'weekly', 'diario', 'daily', 'quincenal', 'fortnight', 'biweekly'],
            'From 1 to 3 months. You choose to pay daily, weekly or fortnightly, in equal payments.',
            'How long can I borrow for?', ['repay', 'early', 'apply'],
        ],
        'speed' => [
            ['aprob', 'approv', 'demora', 'tarda', 'decision', 'cuando me', 'when will', 'when do i', 'how long does', 'how long will', 'how long to', 'rapido', 'quick', 'fast', 'urgente', 'urgent', 'hoy', 'today', 'cuanto tiempo', 'how soon', 'respuesta', 'respond', 'contest', 'reply', 'answer'],
            'Most applications get a decision within 24 hours on business days. We email you as soon as the status changes.',
            'How long does it take to get an answer?', ['payout', 'status', 'documents'],
        ],
        'documents' => [
            ['document', 'docs', 'doc', 'papeles', 'papers', 'dni', 'cedula', 'identific', 'id card', 'pasaporte', 'passport', 'comprobante de ingreso', 'proof of income', 'payslip', 'pay slip', 'recibo de sueldo', 'recibo de pago', 'colilla', 'extracto', 'bank statement', 'declaracion de renta', 'tax return', 'que piden', 'what do you need'],
            'A photo or scan of your ID (front, and back if it has one) and a recent proof of income such as a payslip, bank statement or tax return.',
            'Which documents do I need?', ['apply', 'speed', 'amount'],
        ],
        'repay' => [
            ['como pago', 'como pagar', 'donde pago', 'how do i pay', 'how can i pay', 'how to pay', 'where do i pay', 'pay', 'repay', 'pagar', 'pago', 'pagos', 'payment', 'cuota', 'installment', 'transferencia', 'transfer', 'efectivo', 'cash', 'medios de pago', 'payment method', 'pse', 'mercado pago', 'rapipago', 'pago facil', 'efecty', 'nequi', 'daviplata', 'tarjeta', 'card'],
            'In equal daily, weekly or fortnightly payments. Pay online from your account, or by bank transfer, cash or local payment apps. We email you a reminder before each due date.',
            'How do I repay the loan?', ['early', 'missed', 'term'],
        ],
        'early' => [
            ['adelant', 'early', 'anticip', 'pay off', 'payoff', 'pay it off', 'cancelar el prestamo', 'cancelar la deuda', 'saldar', 'liquidar', 'pagar todo', 'pay everything', 'pay all', 'penalidad', 'penalty', 'penalties', 'antes de tiempo', 'pagar antes', 'pago antes', 'pay before', 'pay sooner', 'pay ahead'],
            'Yes. You can make extra payments or pay the full balance at any time without penalties.',
            'Can I pay off my loan early?', ['another_loan', 'repay'],
        ],
        'missed' => [
            ['atras', 'late', 'late payment', 'missed payment', 'miss', 'missed', 'mora', 'moroso', 'no puedo pagar', 'no pude pagar', 'cant pay', "can't pay", 'cannot pay', 'unable to pay', 'overdue', 'vencid', 'retras', 'atrasad', 'extension', 'prorroga', 'refinanc'],
            'Contact us right away. We will look for a solution with you. Late installments are marked as overdue in your account.',
            'What happens if I miss a payment?', ['human', 'repay'],
        ],
        'status' => [
            ['estado', 'status', 'seguimiento', 'track', 'mi solicitud', 'my application', 'ya aplique', 'already applied', 'ya envie', 'i applied', 'novedad', 'update'],
            'Yes. Create an account, and you will see the status of every application, your loans and your payment schedule.',
            'Can I track my application?', ['speed', 'payout'],
        ],
        'safety' => [
            ['seguro', 'segura', 'safe', 'secure', 'datos', 'my data', 'personal data', 'privacidad', 'privacy', 'confiable', 'trust', 'legit', 'legal', 'estafa', 'scam', 'fraud', 'fraude'],
            'Yes. Documents are stored privately and encrypted, only our credit team can see them, and we never sell your data. Read our Privacy Policy for details.',
            'Is my personal information safe?', ['apply', 'requirements'],
        ],
        'apply' => [
            ['solicitar', 'solicito', 'solicitud', 'apply', 'aplicar', 'aplico', 'como pido', 'como saco', 'how do i get', 'how to get', 'quiero un prestamo', 'quiero pedir', 'i want a loan', 'need a loan', 'necesito un prestamo', 'necesito dinero', 'necesito plata', 'need money', 'register', 'registr', 'sign up', 'crear cuenta', 'formulario', 'application form'],
            'You can apply online in a few minutes: create an account, fill in the form and upload your ID and proof of income. Go to Apply now at the top of the page.',
            'How do I apply?', ['documents', 'speed', 'amount'],
        ],
        'countries' => [
            ['pais', 'paises', 'country', 'countries', 'argentina', 'colombia', 'donde', 'where', 'otro pais', 'mexico', 'peru', 'chile', 'venezuela', 'ecuador', 'uruguay', 'espana', 'spain', 'usa', 'estados unidos', 'extranjero', 'foreigner'],
            'We lend in Argentina (ARS) and Colombia (COP). You need to live in one of these countries to apply.',
            'Which countries do you lend in?', ['requirements', 'amount'],
        ],
        'payout' => [
            ['desembolso', 'disburse', 'recibo el dinero', 'recibir el dinero', 'recibo la plata', 'get the money', 'receive the money', 'receive my money', 'deposit', 'deposito', 'transfieren', 'cuenta bancaria', 'bank account', 'cbu', 'cvu', 'billetera', 'wallet', 'cuando llega', 'when does the money'],
            'Once your loan is approved, we send the money to the bank account or payment method you chose in your application.',
            'How do I receive the money?', ['repay', 'term'],
        ],
        'credit_history' => [
            ['veraz', 'datacredito', 'cifin', 'buro', 'credit score', 'credit history', 'historial', 'bad credit', 'mal historial', 'reportado', 'reported', 'deudas', 'debts', 'embargo', 'score', 'clearing', 'rechaz', 'reject', 'denied', 'declined', 'negaron'],
            'We look at your current income and your ability to pay, not only your credit history. Apply and our team will review your case.',
            'Can I apply with bad credit?', ['requirements', 'apply'],
        ],
        'self_employed' => [
            ['independiente', 'monotribut', 'autonomo', 'freelanc', 'self employed', 'self-employed', 'informal', 'sin recibo', 'no payslip', 'trabajo por mi cuenta', 'my own business', 'negocio propio', 'emprendedor', 'jubilad', 'pensionad', 'retired', 'pension'],
            'Yes, as long as you can show a regular income, for example with bank statements or tax returns.',
            null, ['documents', 'apply'],
        ],
        'another_loan' => [
            ['otro prestamo', 'segundo prestamo', 'another loan', 'second loan', 'more than one', 'mas de un', 'dos prestamos', 'two loans', 'renovar', 'renew', 'aumentar', 'increase', 'mas dinero', 'more money'],
            'You can have one active loan at a time. When it is paid off you can apply again, often for a higher limit.',
            'Can I get another loan?', ['early', 'amount'],
        ],
        'hours' => [
            ['horario', 'hours', 'hora', 'abierto', 'open', 'atienden', 'cierran', 'close', 'fin de semana', 'weekend', 'sabado', 'saturday', 'domingo', 'sunday', 'feriado', 'holiday'],
            'Our team is available Monday to Friday, 8:00 to 18:00. You can leave a message here at any time and we will answer as soon as we are back.',
            'What are your opening hours?', ['contact', 'human'],
        ],
        'contact' => [
            ['telefono', 'phone', 'numero', 'number', 'llamar', 'call', 'llamada', 'email', 'correo', 'mail', 'whatsapp', 'wsp', 'oficina', 'office', 'direccion', 'address', 'contact'],
            'You can keep writing here, or call or email us. All our contact details are on the Contact page.',
            'How can I contact you?', ['hours', 'human'],
        ],
        'human' => [
            ['humano', 'agente', 'asesor', 'asesora', 'operador', 'human', 'agent', 'una persona', 'a person', 'staff', 'alguien', 'someone', 'representante', 'representative', 'real person', 'hablar con'],
            'Sure. You are in the queue and a team member will join this chat shortly.',
            'Can I talk to a person?', [],
        ],
        'thanks' => [
            ['gracias', 'thank', 'thanks', 'thx', 'genial', 'perfecto', 'great', 'excelente', 'ok gracias', 'muy amable', 'buenisimo', 'dale'],
            'You are welcome! Anything else I can help with?',
            null, [],
        ],
        'bye' => [
            ['chau', 'chao', 'adios', 'bye', 'goodbye', 'hasta luego', 'nos vemos', 'see you'],
            'Thanks for writing! If you need anything else, we are here.',
            null, [],
        ],
    ];

    /** Suggested before the first question, and to fill in when a topic has run out of follow-ups. */
    public const STARTERS = ['how_it_works', 'amount', 'rate', 'documents', 'speed', 'apply', 'requirements', 'repay'];

    public const FALLBACKS = [
        'I am not sure about that one. A team member will join this chat shortly and help you.',
        'Could you put it another way? For example: "interest rate", "documents" or "how to pay". You can also tap one of the questions below.',
        'Noted! A team member will read this as soon as they join.',
    ];

    public const REPEAT = 'I answered that just above. Is there something specific you would like to know? A team member can also help you when they join.';

    /** The topic a message is about, or null. Tapping a suggested question always hits its own topic. */
    public static function topic(string $message): ?string
    {
        $words = self::words($message);
        if (! $words) {
            return null;
        }
        foreach (self::TOPICS as $id => [, , $question]) {
            if ($question && ($words === self::words($question) || $words === self::words(__($question)))) {
                return $id;
            }
        }

        $best = [0, null];
        foreach (self::TOPICS as $id => [$keywords]) {
            $score = 0;
            foreach ($keywords as $k) {
                $score += self::hit(self::words($k), $words);
            }
            if ($score > $best[0]) {
                $best = [$score, $id];
            }
        }

        return $best[1];
    }

    /**
     * English answer key for a matched topic (or null), given the topics already answered in this chat
     * (null entries are earlier fallbacks).
     */
    public static function answer(?string $topic, array $history): string
    {
        if ($topic === null) {
            $misses = count(array_filter($history, fn ($t) => $t === null));

            return self::FALLBACKS[min($misses, count(self::FALLBACKS) - 1)];
        }
        // Greetings and thanks can repeat; a real question asked twice gets a nudge instead of the same paragraph.
        if (self::TOPICS[$topic][2] && in_array($topic, $history, true)) {
            return self::REPEAT;
        }

        return self::TOPICS[$topic][1];
    }

    /** Up to 3 English chip questions: follow-ups to the last topic first, never one already answered. */
    public static function suggest(?string $last, array $history): array
    {
        $ids = array_merge($last ? self::TOPICS[$last][3] : [], self::STARTERS);
        $ids = array_filter(array_unique($ids), fn ($id) => ! in_array($id, $history, true) && self::TOPICS[$id][2]);

        return array_map(fn ($id) => self::TOPICS[$id][2], array_slice(array_values($ids), 0, 3));
    }

    /** Texting shorthand, expanded before matching. */
    private const SHORT = ['q' => 'que', 'k' => 'que', 'xq' => 'porque', 'pq' => 'porque', 'x' => 'por', 'd' => 'de', 'tb' => 'tambien', 'tmb' => 'tambien', 'hw' => 'how', 'u' => 'you', 'r' => 'are', 'pls' => 'please', 'plz' => 'please'];

    /** Lowercase, accent-free, stretched letters squeezed ("holaaa"), shorthand expanded, split into words. */
    private static function words(string $text): array
    {
        $text = preg_replace('/(\p{L})\1{2,}/u', '$1', Str::lower(Str::ascii($text)));
        $words = preg_split('/[^a-z0-9]+/', $text, -1, PREG_SPLIT_NO_EMPTY);

        return array_map(fn ($w) => self::SHORT[$w] ?? $w, $words);
    }

    /** Score for a keyword (as words) found in the message: 2 per word when exact, 1 per word with a typo. */
    private static function hit(array $kw, array $words): int
    {
        $n = count($kw);
        for ($i = 0; $i + $n <= count($words); $i++) {
            $exact = true;
            for ($j = 0; $j < $n; $j++) {
                $m = self::wordMatch($kw[$j], $words[$i + $j]);
                if ($m === 0) {
                    continue 2;
                }
                $exact = $exact && $m === 2;
            }

            return $exact ? 2 * $n : $n;
        }

        return 0;
    }

    /** 2 = the word starts with the keyword, 1 = it does with a small typo, 0 = no match. */
    private static function wordMatch(string $k, string $w): int
    {
        if (str_starts_with($w, $k)) {
            return 2;
        }
        $len = strlen($k);
        $tolerance = $len >= 8 ? 2 : ($len >= 5 ? 1 : 0);
        if (! $tolerance) {
            return 0;
        }
        // Compare against the word's start at the keyword's length, give or take a letter (missing or extra letter).
        foreach ([$len - 1, $len, $len + 1] as $l) {
            if (strlen($w) >= $l && levenshtein($k, substr($w, 0, $l)) <= $tolerance) {
                return 1;
            }
        }

        return 0;
    }
}
