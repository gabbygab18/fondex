@php($seo = \App\Support\Seo::for($page))
<!DOCTYPE html>
<html lang="{{ app()->getLocale() }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="description" content="{{ $seo['description'] }}">
        <meta name="robots" content="{{ $seo['index'] ? 'index, follow, max-image-preview:large, max-snippet:-1' : 'noindex, nofollow' }}">
        @if ($seo['index'])
            <link rel="canonical" href="{{ $seo['url'] }}">
        @endif
        <meta name="theme-color" content="#0b2a5c">

        {{-- Link previews (WhatsApp, Messenger, Facebook, X, LinkedIn) --}}
        <meta property="og:type" content="website">
        <meta property="og:site_name" content="{{ config('app.name') }}">
        <meta property="og:title" content="{{ $seo['title'] }}">
        <meta property="og:description" content="{{ $seo['description'] }}">
        <meta property="og:url" content="{{ $seo['url'] }}">
        <meta property="og:locale" content="{{ $seo['locale'] }}">
        <meta property="og:image" content="{{ $seo['image'] }}">
        <meta property="og:image:width" content="1200">
        <meta property="og:image:height" content="630">
        <meta property="og:image:alt" content="{{ $seo['title'] }}">
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="{{ $seo['title'] }}">
        <meta name="twitter:description" content="{{ $seo['description'] }}">
        <meta name="twitter:image" content="{{ $seo['image'] }}">

        @if (in_array($page['component'] ?? '', ['Home', 'About', 'Services', 'Faqs', 'Contact', 'Legal', 'Apply'], true))
            {{-- Saved dark theme before first paint, so the public site doesn't flash light. --}}
            <script>if (localStorage.getItem('theme') === 'dark') document.documentElement.classList.add('dark');</script>
        @endif
        <script type="application/ld+json">{!! json_encode($seo['schema'], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG) !!}</script>

        <link rel="icon" href="/favicon.svg" type="image/svg+xml">
        <link rel="alternate icon" href="/favicon.png" type="image/png">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">
        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx'])
        <x-inertia::head>
            <title>{{ $seo['title'] }}</title>
        </x-inertia::head>
    </head>
    <body class="antialiased">
        <x-inertia::app />
    </body>
</html>
