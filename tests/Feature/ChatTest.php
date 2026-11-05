<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ChatTest extends TestCase
{
    use RefreshDatabase;

    public function test_bot_replies_in_the_visitors_language(): void
    {
        // Stored in English, shown in Spanish (the default) even after the visitor's own message.
        $res = $this->post('/chat', ['body' => 'como funciona', 'name' => 'Ana'])->assertOk();
        $this->assertSame(['visitor', 'bot'], array_column($res->json('messages'), 'kind'));
        $this->assertStringStartsWith('Es simple', $res->json('messages.1.body'));
    }
}
