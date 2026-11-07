@props(['url'])
<tr>
<td class="header" style="background-color:#0b2a5c;background-image:linear-gradient(135deg,#1d4fb8 0%,#0b2a5c 55%,#061a3d 100%);padding:34px 32px 30px 32px;text-align:center;">
<a href="{{ $url }}" style="display:inline-block;text-decoration:none;">
<img src="{{ url('/images/email/logo-white.png') }}" width="138" height="40" alt="{{ config('app.name') }}" style="display:block;border:0;font-family:Arial,Helvetica,sans-serif;font-size:26px;font-weight:700;color:#ffffff;">
</a>
<div style="margin-top:12px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#a9c8f0;">{{ __('Fast, transparent personal loans.') }}</div>
</td>
</tr>
