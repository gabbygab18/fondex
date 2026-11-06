<?php

namespace App\Support;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

/**
 * The visitor's country (ISO code) from their IP address, looked up once per session, so the public
 * site shows the local currency (a VPN counts as being there). Empty when unknown: the page then
 * falls back to the browser time zone.
 */
class VisitorCountry
{
    public static function for(Request $request): string
    {
        if (! $request->hasSession()) {
            return '';
        }

        return $request->session()->remember('visitor_country', function () use ($request) {
            // Behind Cloudflare the country comes for free.
            if ($cf = $request->header('CF-IPCountry')) {
                return strtoupper($cf);
            }
            $ip = $request->ip();
            if (! filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                return '';
            }
            try {
                // ponytail: free public lookup (country.is, no key); a local GeoIP database if it ever gets slow.
                return (string) Http::timeout(2)->get("https://api.country.is/{$ip}")->json('country', '');
            } catch (\Throwable) {
                return '';
            }
        });
    }
}
