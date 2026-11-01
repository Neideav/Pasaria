@extends('layouts.mpa')

@section('title', 'Checkout Pembayaran — PASARIA')

@section('content')
<div id="pasaria-root" data-page="checkout" data-props='{!! json_encode($pageProps ?? new stdClass(), JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP) !!}'></div>
@endsection

