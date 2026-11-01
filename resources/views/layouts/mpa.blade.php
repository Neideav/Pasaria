<!doctype html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', 'PASARIA — Modern Multi-Vendor Marketplace')</title>
    <link rel="icon" type="image/png" href="/images/logo_light.png" />
    <meta name="description" content="PASARIA — Platform marketplace multi-vendor modern, aman, dan terpercaya untuk belanja kebutuhan audio, teknologi, dan gaya hidup." />
    <meta property="og:title" content="@yield('title', 'PASARIA — Modern Multi-Vendor Marketplace')" />
    <meta property="og:description" content="PASARIA — Platform marketplace multi-vendor modern, aman, dan terpercaya untuk belanja kebutuhan audio, teknologi, dan gaya hidup." />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap" rel="stylesheet">

    <script>
      (function() {
        try {
          var root = document.documentElement;
          var theme = localStorage.getItem('pasaria_theme') || 'light';
          if (theme === 'dark' || (theme === 'system' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            root.classList.add('dark');
          } else {
            root.classList.remove('dark');
          }
          if (localStorage.getItem('pasaria_font_size') === 'large') root.classList.add('text-scale-large');
          if (localStorage.getItem('pasaria_reduced_motion') === 'true') root.classList.add('reduced-motion');
          if (localStorage.getItem('pasaria_high_contrast') === 'true') root.classList.add('high-contrast');
        } catch (e) {}
      })();
    </script>

    @php
        $hotPath = public_path('hot');
        $isHot = file_exists($hotPath);
        $hotUrl = $isHot ? trim(file_get_contents($hotPath)) : '';

        $manifestPaths = [
            public_path('build/.vite/manifest.json'),
            public_path('build/manifest.json'),
        ];
        $manifest = null;
        foreach ($manifestPaths as $mp) {
            if (file_exists($mp)) {
                $decoded = json_decode(file_get_contents($mp), true);
                if (is_array($decoded)) {
                    $manifest = $decoded;
                    break;
                }
            }
        }

        $cssFiles = [];
        $jsFiles = [];

        if (!$isHot && $manifest) {
            $entry = $manifest['index.html'] ?? $manifest['src/main.tsx'] ?? reset($manifest);
            if ($entry) {
                if (!empty($entry['file'])) {
                    $jsFiles[] = '/build/' . $entry['file'];
                }
                if (!empty($entry['css']) && is_array($entry['css'])) {
                    foreach ($entry['css'] as $c) {
                        $cssFiles[] = '/build/' . $c;
                    }
                }
            }
        } elseif (!$isHot) {
            $buildAssetFiles = glob(public_path('build/assets/*.{css,js}'), GLOB_BRACE) ?: [];
            foreach ($buildAssetFiles as $bf) {
                $rel = '/build/assets/' . basename($bf);
                if (str_ends_with($bf, '.css')) $cssFiles[] = $rel;
                if (str_ends_with($bf, '.js')) $jsFiles[] = $rel;
            }
        }
    @endphp

    @if($isHot)
      <script type="module" src="{{ $hotUrl }}/@vite/client"></script>
      <script type="module" src="{{ $hotUrl }}/src/main.tsx"></script>
    @else
      @foreach($cssFiles as $css)
        <link rel="stylesheet" href="{{ asset($css) }}">
      @endforeach
      @foreach($jsFiles as $js)
        <script type="module" src="{{ asset($js) }}"></script>
      @endforeach
    @endif
  </head>
  <body class="bg-[#f8faf9] text-[#1c2a23] antialiased selection:bg-[#003d29] selection:text-white">
    @yield('content')
  </body>
</html>
