@props([
'url',
'color' => 'primary',
'align' => 'center',
])
<table class="action" role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 24px 0;">
<tr>
<td align="center">
<a href="{{ $url }}" class="button" target="_blank" rel="noopener" style="display:block;width:100%;text-align:center;padding:16px 0;background-color:{{ $color === 'error' ? '#d93f2b' : '#2563eb' }};border-radius:999px;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:700;text-decoration:none;box-shadow:0 10px 24px rgba(37,99,235,0.30);">{!! $slot !!}</a>
</td>
</tr>
</table>
