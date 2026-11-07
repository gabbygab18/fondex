<tr>
<td class="footer" style="padding:26px 36px 32px 36px;text-align:center;border-top:1px solid #eef2f8;">
<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#64748b;">{{ __('Regards,') }}</div>
<div style="margin-top:2px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#0b2a5c;">{{ __('The :app team', ['app' => config('app.name')]) }}</div>
<img src="{{ url('/images/email/logo.png') }}" width="96" height="28" alt="{{ config('app.name') }}" style="display:inline-block;margin-top:12px;border:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#0b2a5c;">
<div style="margin-top:10px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#94a3b8;">{{ __('Short-term personal loans in Argentina and Colombia.') }}</div>
<div style="margin-top:4px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#94a3b8;"><a href="{{ url('/') }}" style="color:#2563eb;text-decoration:none;">{{ parse_url(config('app.url'), PHP_URL_HOST) }}</a> · {{ $slot }}</div>
</td>
</tr>
