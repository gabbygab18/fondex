<?php

namespace Tests\Unit;

use App\Support\ChatBot;
use Tests\TestCase;

class ChatBotTest extends TestCase
{
    public function test_matches_questions_typos_and_short_forms(): void
    {
        $cases = [
            '¿Cuál es la tasa de interés?' => 'rate',
            'What is the interest rate?' => 'rate',
            'intrest rate??' => 'rate',
            'Qué documentos necesito?' => 'documents',
            'documnts' => 'documents',
            'docs?' => 'documents',
            '¿Cuánto tarda la aprobación?' => 'speed',
            'cuanto puedo pedir' => 'amount',
            'hw much' => 'amount',
            'How can I pay?' => 'repay',
            'pay?' => 'repay',
            'rquisitos' => 'requirements',
            'holaaa' => 'greeting',
            'puedo pagar antes?' => 'early',
            'no puedo pagar la cuota' => 'missed',
            'soy monotributista' => 'self_employed',
            'estoy en el veraz' => 'credit_history',
            'atienden los sabados?' => 'hours',
            'quiero hablar con un asesor' => 'human',
            'prestamo personal' => null,
            'asdf qwerty' => null,
        ];
        foreach ($cases as $message => $topic) {
            $this->assertSame($topic, ChatBot::topic($message), $message);
        }
        // Tapping a suggested question (English or Spanish) always lands on its topic.
        $this->assertSame('payout', ChatBot::topic('How do I receive the money?'));
    }

    public function test_follow_ups_and_no_repeats(): void
    {
        // Follow-ups to "documents", skipping what was already answered.
        $this->assertSame(['How do I apply?', 'How long does it take to get an answer?', 'How much can I borrow?'], ChatBot::suggest('documents', ['documents']));
        $this->assertNotContains('Which documents do I need?', ChatBot::suggest('apply', ['documents', 'apply']));
        // Same question twice: a nudge, not the same paragraph. Fallbacks vary.
        $this->assertSame(ChatBot::REPEAT, ChatBot::answer('rate', ['rate']));
        $this->assertSame(ChatBot::FALLBACKS[0], ChatBot::answer(null, []));
        $this->assertSame(ChatBot::FALLBACKS[1], ChatBot::answer(null, ['rate', null]));
    }
}
