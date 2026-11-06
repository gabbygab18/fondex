<?php

namespace Tests\Feature;

use App\Models\CountrySetting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SeoTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_pages_have_meta_and_private_ones_are_noindex(): void
    {
        CountrySetting::create(['code' => 'AR', 'name' => 'Argentina', 'currency' => 'ARS', 'min_amount' => 50000, 'max_amount' => 3000000, 'starting_limit' => 1500000, 'limit_increase_pct' => 50, 'min_term' => 1, 'max_term' => 3, 'is_active' => true]);

        // Server-rendered for crawlers and link previews, in Spanish by default.
        $this->get('/faqs')->assertOk()
            ->assertSee('<title>Preguntas frecuentes · Fondex</title>', false)
            ->assertSee('property="og:image" content="'.url('/images/og.jpg').'"', false)
            ->assertSee('"@type":"FAQPage"', false)
            ->assertSee('index, follow', false);
        $this->get('/loans')->assertSee('"@type":"LoanOrCredit"', false);
        $this->get('/login')->assertSee('noindex, nofollow', false);

        $this->get('/llms.txt')->assertOk()->assertHeader('Content-Type', 'text/plain; charset=utf-8')
            ->assertSee('Argentina: from 50.000 to 3.000.000 ARS', false)
            ->assertSee('### Who can apply for a loan?', false);
    }
}
