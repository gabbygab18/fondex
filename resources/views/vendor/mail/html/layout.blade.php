{{-- Fondex email shell (Fetti-style): soft background, rounded white card, navy banner, signature footer. --}}
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
<title>{{ config('app.name') }}</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<style>
@media only screen and (max-width: 600px) {
.card { border-radius: 0 !important; }
.content-cell { padding: 28px 22px 4px 22px !important; }
}
</style>
{!! $head ?? '' !!}
</head>
<body style="margin:0;padding:0;background-color:#eef2f8;-webkit-text-size-adjust:100%;">
<table class="wrapper" role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eef2f8;padding:32px 12px;">
<tr>
<td align="center">
<table class="card" role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #e1e8f2;box-shadow:0 10px 40px rgba(11,42,92,0.08);">
{!! $header ?? '' !!}
<tr>
<td class="content-cell" style="padding:36px 36px 8px 36px;">
{!! Illuminate\Mail\Markdown::parse($slot) !!}

{!! $subcopy ?? '' !!}
</td>
</tr>
{!! $footer ?? '' !!}
</table>
</td>
</tr>
</table>
</body>
</html>
