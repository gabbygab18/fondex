<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class VisitorCountryTest extends TestCase
{
    use RefreshDatabase;

    public function test_country_comes_from_the_ip_once_per_session(): void
    {
        Http::fake(['api.country.is/*' => Http::response(['ip' => '190.85.1.1', 'country' => 'CO'])]);

        $this->withServerVariables(['REMOTE_ADDR' => '190.85.1.1'])->get('/faqs')->assertSee('data-country="CO"', false);
        $this->withServerVariables(['REMOTE_ADDR' => '190.85.1.1'])->get('/about')->assertSee('data-country="CO"', false);
        Http::assertSentCount(1);

        // Local/private addresses and a failed lookup leave it empty (the browser time zone decides).
        $this->flushSession();
        $this->withServerVariables(['REMOTE_ADDR' => '127.0.0.1'])->get('/faqs')->assertSee('data-country=""', false);
    }
}
