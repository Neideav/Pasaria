import React from 'react';

interface ProductVisualProps {
  imageKey: string;
  name?: string;
  colorHex?: string;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  className?: string;
}

const ProductVisualComponent: React.FC<ProductVisualProps> = ({
  imageKey,
  name = 'Product',
  colorHex,
  size = 'md',
  className = '',
}) => {
  // Dimension mapping
  const heightMap = {
    sm: 'h-14 w-14',
    md: 'h-44 w-full',
    lg: 'h-80 w-full',
    hero: 'h-96 w-full',
  };

  // Determine active color for products that support color changes
  const activeColor = colorHex || '#e87373'; // Default pink for AirPods Max

  // Specific renderers for each product key matching user screenshots
  if (imageKey === 'airpods-max') {
    return (
      <div className={`relative flex items-center justify-center ${heightMap[size]} ${className}`}>
        <svg viewBox="0 0 400 340" className="w-full h-full max-h-full drop-shadow-sm select-none" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Soft studio backdrop glow */}
          <ellipse cx="200" cy="180" rx="140" ry="110" fill="#f4f5f6" fillOpacity="0.7" />
          
          {/* Headband arch */}
          <path
            d="M 100 180 C 100 80, 300 80, 300 180"
            stroke={activeColor}
            strokeWidth="24"
            strokeLinecap="round"
            fill="none"
          />
          {/* Knit mesh canopy */}
          <path
            d="M 125 150 C 125 90, 275 90, 275 150"
            stroke={activeColor}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray="2 3"
            fill="none"
            opacity="0.8"
          />

          {/* Stainless steel telescoping stems */}
          <rect x="90" y="165" width="10" height="45" rx="5" fill="#d1d5db" />
          <rect x="300" y="165" width="10" height="45" rx="5" fill="#d1d5db" />

          {/* Left Ear Cup */}
          <g transform="translate(60, 180) rotate(-8 35 60)">
            <rect x="0" y="0" width="72" height="110" rx="36" fill={activeColor} />
            <rect x="6" y="6" width="60" height="98" rx="30" fill="url(#metalShine)" opacity="0.3" />
            {/* Cushion */}
            <rect x="35" y="10" width="34" height="90" rx="17" fill="#ffffff" opacity="0.25" />
          </g>

          {/* Right Ear Cup */}
          <g transform="translate(268, 180) rotate(8 35 60)">
            <rect x="0" y="0" width="72" height="110" rx="36" fill={activeColor} />
            <rect x="6" y="6" width="60" height="98" rx="30" fill="url(#metalShine)" opacity="0.3" />
            {/* Cushion */}
            <rect x="3" y="10" width="34" height="90" rx="17" fill="#ffffff" opacity="0.25" />
          </g>

          {/* Separate Earcup Profile Detail (as shown in AirPods Max shot) */}
          {size === 'lg' && (
            <g transform="translate(275, 110)">
              {/* Stand bracket */}
              <path d="M40 0 C40 30, 25 45, 25 60 L25 80" stroke="#e11d48" strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.85" />
              <path d="M10 0 C10 30, 25 45, 25 60" stroke="#e11d48" strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.85" />
              {/* Profile cup */}
              <rect x="5" y="70" width="55" height="85" rx="27" fill={activeColor} filter="drop-shadow(0 4px 6px rgba(0,0,0,0.1))" />
              <rect x="10" y="75" width="45" height="75" rx="22" fill="#ffffff" opacity="0.2" />
            </g>
          )}

          <defs>
            <linearGradient id="metalShine" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.4" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  }

  if (imageKey === 'wireless-earbuds-ipx8') {
    return (
      <div className={`relative flex items-center justify-center ${heightMap[size]} ${className}`}>
        <svg viewBox="0 0 320 280" className="w-full h-full max-h-full drop-shadow-sm select-none" fill="none">
          <ellipse cx="160" cy="180" rx="100" ry="60" fill="#f4f5f6" />
          {/* Open charging case base */}
          <path d="M 60 150 C 60 220, 260 220, 260 150 C 260 120, 60 120, 60 150 Z" fill="#18181b" />
          <path d="M 70 145 C 70 195, 250 195, 250 145 Z" fill="#27272a" />
          
          {/* LED battery percentage */}
          <rect x="135" y="160" width="50" height="22" rx="4" fill="#09090b" />
          <text x="160" y="176" fill="#38bdf8" fontSize="13" fontWeight="bold" textAnchor="middle" fontFamily="monospace">100%</text>
          
          {/* Left Earbud in cradle */}
          <circle cx="110" cy="140" r="22" fill="#09090b" stroke="#3b82f6" strokeWidth="2" />
          <ellipse cx="110" cy="140" rx="12" ry="7" fill="#27272a" />
          
          {/* Right Earbud in cradle */}
          <circle cx="210" cy="140" r="22" fill="#09090b" stroke="#3b82f6" strokeWidth="2" />
          <ellipse cx="210" cy="140" rx="12" ry="7" fill="#27272a" />

          {/* Open lid flipped back */}
          <path d="M 80 125 C 80 50, 240 50, 240 125 Z" fill="#27272a" stroke="#3f3f46" strokeWidth="3" opacity="0.9" />
        </svg>
      </div>
    );
  }

  if (imageKey === 'bose-bt-earphones') {
    return (
      <div className={`relative flex items-center justify-center ${heightMap[size]} ${className}`}>
        <svg viewBox="0 0 320 280" className="w-full h-full max-h-full drop-shadow-sm select-none" fill="none">
          <ellipse cx="160" cy="170" rx="90" ry="70" fill="#f4f5f6" />
          {/* Headband */}
          <path d="M 85 160 C 85 70, 235 70, 235 160" stroke="#18181b" strokeWidth="22" strokeLinecap="round" />
          <path d="M 105 130 C 105 85, 215 85, 215 130" stroke="#27272a" strokeWidth="14" strokeLinecap="round" />
          
          {/* Left Ear Cup */}
          <g transform="translate(60, 140)">
            <ellipse cx="25" cy="45" rx="26" ry="42" fill="#18181b" />
            <ellipse cx="25" cy="45" rx="20" ry="36" fill="#27272a" />
            <text x="25" y="49" fill="#71717a" fontSize="10" fontWeight="bold" textAnchor="middle">BOSE</text>
          </g>
          
          {/* Right Ear Cup */}
          <g transform="translate(210, 140)">
            <ellipse cx="25" cy="45" rx="26" ry="42" fill="#18181b" />
            <ellipse cx="25" cy="45" rx="20" ry="36" fill="#27272a" />
            <text x="25" y="49" fill="#71717a" fontSize="10" fontWeight="bold" textAnchor="middle">BOSE</text>
          </g>
        </svg>
      </div>
    );
  }

  if (imageKey === 'vivefox-headphones') {
    return (
      <div className={`relative flex items-center justify-center ${heightMap[size]} ${className}`}>
        <svg viewBox="0 0 320 280" className="w-full h-full max-h-full drop-shadow-sm select-none" fill="none">
          <ellipse cx="160" cy="170" rx="90" ry="70" fill="#fdf2f2" />
          {/* Red Headband */}
          <path d="M 80 160 C 80 65, 240 65, 240 160" stroke="#ef4444" strokeWidth="20" strokeLinecap="round" />
          <path d="M 100 135 C 100 80, 220 80, 220 135" stroke="#f87171" strokeWidth="12" strokeLinecap="round" />
          
          {/* Left Red Ear Cup */}
          <circle cx="80" cy="180" r="38" fill="#dc2626" />
          <circle cx="80" cy="180" r="28" fill="#b91c1c" />
          <circle cx="80" cy="180" r="20" fill="#ef4444" />

          {/* Right Red Ear Cup */}
          <circle cx="240" cy="180" r="38" fill="#dc2626" />
          <circle cx="240" cy="180" r="28" fill="#b91c1c" />
          <circle cx="240" cy="180" r="20" fill="#ef4444" />

          {/* Red 3.5mm cable */}
          <path d="M 240 215 C 240 250, 270 240, 280 265" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" fill="none" />
          <rect x="276" y="255" width="8" height="15" rx="3" fill="#b91c1c" />
        </svg>
      </div>
    );
  }

  if (imageKey === 'jbl-tune-600btnc') {
    return (
      <div className={`relative flex items-center justify-center ${heightMap[size]} ${className}`}>
        <svg viewBox="0 0 320 280" className="w-full h-full max-h-full drop-shadow-sm select-none" fill="none">
          <ellipse cx="160" cy="170" rx="90" ry="70" fill="#f4f5f6" />
          {/* Dark Navy Headband */}
          <path d="M 85 160 C 85 70, 235 70, 235 160" stroke="#1e293b" strokeWidth="22" strokeLinecap="round" />
          
          {/* Folded design cups */}
          <circle cx="85" cy="185" r="36" fill="#0f172a" />
          <circle cx="85" cy="185" r="26" fill="#1e293b" />
          <text x="85" y="190" fill="#94a3b8" fontSize="12" fontWeight="bold" textAnchor="middle">JBL</text>

          <circle cx="235" cy="185" r="36" fill="#0f172a" />
          <circle cx="235" cy="185" r="26" fill="#1e293b" />
          <text x="235" y="190" fill="#94a3b8" fontSize="12" fontWeight="bold" textAnchor="middle">JBL</text>
        </svg>
      </div>
    );
  }

  if (imageKey === 'tagry-bluetooth') {
    return (
      <div className={`relative flex items-center justify-center ${heightMap[size]} ${className}`}>
        <svg viewBox="0 0 320 280" className="w-full h-full max-h-full drop-shadow-sm select-none" fill="none">
          <ellipse cx="160" cy="180" rx="90" ry="60" fill="#f4f5f6" />
          {/* Angular charging pod */}
          <polygon points="100,120 220,120 250,180 200,230 120,230 70,180" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
          <rect x="135" y="160" width="50" height="24" rx="4" fill="#020617" />
          <text x="160" y="177" fill="#22c55e" fontSize="13" fontWeight="bold" textAnchor="middle" fontFamily="monospace">98%</text>
          
          {/* Floating glowing earbud */}
          <circle cx="110" cy="150" r="14" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
          <circle cx="210" cy="150" r="14" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
        </svg>
      </div>
    );
  }

  if (imageKey === 'monster-mnflex') {
    return (
      <div className={`relative flex items-center justify-center ${heightMap[size]} ${className}`}>
        <svg viewBox="0 0 320 280" className="w-full h-full max-h-full drop-shadow-sm select-none" fill="none">
          <ellipse cx="160" cy="180" rx="90" ry="60" fill="#f4f5f6" />
          {/* Neckband arch */}
          <path d="M 60 170 C 60 120, 260 120, 260 170" stroke="#1f2937" strokeWidth="12" strokeLinecap="round" fill="none" />
          {/* Ear hooks */}
          <path d="M 75 160 C 65 130, 95 110, 115 130" stroke="#374151" strokeWidth="10" strokeLinecap="round" fill="none" />
          <path d="M 245 160 C 255 130, 225 110, 205 130" stroke="#374151" strokeWidth="10" strokeLinecap="round" fill="none" />
          <rect x="105" y="130" width="20" height="30" rx="8" fill="#111827" />
          <rect x="195" y="130" width="20" height="30" rx="8" fill="#111827" />
        </svg>
      </div>
    );
  }

  if (imageKey === 'mpow-ch6') {
    return (
      <div className={`relative flex items-center justify-center ${heightMap[size]} ${className}`}>
        <svg viewBox="0 0 320 280" className="w-full h-full max-h-full drop-shadow-sm select-none" fill="none">
          <ellipse cx="160" cy="170" rx="90" ry="70" fill="#f0f9ff" />
          {/* Blue Kids Headband */}
          <path d="M 80 160 C 80 65, 240 65, 240 160" stroke="#0284c7" strokeWidth="22" strokeLinecap="round" />
          <circle cx="80" cy="180" r="36" fill="#38bdf8" />
          <circle cx="80" cy="180" r="26" fill="#bae6fd" />
          <circle cx="240" cy="180" r="36" fill="#38bdf8" />
          <circle cx="240" cy="180" r="26" fill="#bae6fd" />
        </svg>
      </div>
    );
  }

  if (imageKey === 'gaming-headphone') {
    return (
      <div className={`relative flex items-center justify-center ${heightMap[size]} ${className}`}>
        <svg viewBox="0 0 320 280" className="w-full h-full max-h-full drop-shadow-sm select-none" fill="none">
          <ellipse cx="160" cy="170" rx="90" ry="70" fill="#f0fdf4" />
          {/* Neon green headband strip */}
          <path d="M 85 160 C 85 70, 235 70, 235 160" stroke="#22c55e" strokeWidth="24" strokeLinecap="round" />
          <path d="M 95 130 C 95 85, 225 85, 225 130" stroke="#18181b" strokeWidth="16" strokeLinecap="round" />
          
          {/* Angular black cups */}
          <polygon points="60,150 110,150 115,220 55,220" fill="#18181b" stroke="#22c55e" strokeWidth="3" />
          <polygon points="210,150 260,150 265,220 205,220" fill="#18181b" stroke="#22c55e" strokeWidth="3" />
          
          {/* Boom Mic */}
          <path d="M 100 210 C 110 240, 160 250, 180 240" stroke="#18181b" strokeWidth="6" strokeLinecap="round" fill="none" />
          <rect x="175" y="235" width="16" height="10" rx="4" fill="#22c55e" />
        </svg>
      </div>
    );
  }

  if (imageKey === 'macbook-pro-13') {
    return (
      <div className={`relative flex items-center justify-center ${heightMap[size]} ${className}`}>
        <svg viewBox="0 0 340 280" className="w-full h-full max-h-full drop-shadow-sm select-none" fill="none">
          <ellipse cx="170" cy="180" rx="110" ry="60" fill="#f5f3ff" />
          {/* Lavender anodized Macbook screen standing up */}
          <rect x="75" y="70" width="190" height="130" rx="8" fill="#c4b5fd" stroke="#a78bfa" strokeWidth="2" />
          {/* Apple logo in center */}
          <circle cx="170" cy="130" r="14" fill="#ffffff" opacity="0.9" />
          <path d="M 174 112 C 177 106, 172 104, 169 105" stroke="#ffffff" strokeWidth="3" fill="none" />
          {/* Laptop thin base */}
          <rect x="55" y="196" width="230" height="8" rx="4" fill="#8b5cf6" />
        </svg>
      </div>
    );
  }

  if (imageKey === 'homepod-mini') {
    return (
      <div className={`relative flex items-center justify-center ${heightMap[size]} ${className}`}>
        <svg viewBox="0 0 320 280" className="w-full h-full max-h-full drop-shadow-sm select-none" fill="none">
          <ellipse cx="160" cy="200" rx="75" ry="40" fill="#fff7ed" />
          {/* Spherical orange woven texture */}
          <circle cx="160" cy="150" r="68" fill="#ea580c" />
          <circle cx="160" cy="150" r="65" fill="#f97316" stroke="#c2410c" strokeWidth="2" strokeDasharray="3 3" />
          {/* Glowing touch glass on top */}
          <ellipse cx="160" cy="100" rx="34" ry="12" fill="#ffffff" opacity="0.8" />
          <ellipse cx="160" cy="100" rx="20" ry="7" fill="#fb923c" />
        </svg>
      </div>
    );
  }

  if (imageKey === 'laptop-sleeve-macbook') {
    return (
      <div className={`relative flex items-center justify-center ${heightMap[size]} ${className}`}>
        <svg viewBox="0 0 340 280" className="w-full h-full max-h-full drop-shadow-sm select-none" fill="none">
          <ellipse cx="170" cy="180" rx="100" ry="50" fill="#fef3c7" />
          {/* Yellow canvas bag */}
          <rect x="70" y="80" width="200" height="140" rx="16" fill="#d97706" />
          <rect x="80" y="90" width="180" height="120" rx="12" fill="#f59e0b" />
          {/* Front organizer pocket */}
          <rect x="90" y="125" width="160" height="75" rx="8" fill="#b45309" opacity="0.6" />
          <rect x="100" y="140" width="40" height="40" rx="4" fill="#ffffff" opacity="0.8" />
          <rect x="150" y="140" width="40" height="40" rx="4" fill="#ffffff" opacity="0.8" />
        </svg>
      </div>
    );
  }

  if (imageKey === 'ipad-mini') {
    return (
      <div className={`relative flex items-center justify-center ${heightMap[size]} ${className}`}>
        <svg viewBox="0 0 320 280" className="w-full h-full max-h-full drop-shadow-sm select-none" fill="none">
          <ellipse cx="160" cy="190" rx="90" ry="50" fill="#f1f5f9" />
          {/* Tablet bezel */}
          <rect x="90" y="70" width="140" height="170" rx="14" fill="#1e293b" />
          {/* Screen */}
          <rect x="96" y="76" width="128" height="158" rx="8" fill="#334155" />
          <circle cx="160" cy="226" r="3" fill="#64748b" />
        </svg>
      </div>
    );
  }

  if (imageKey === 'beats-solo3') {
    return (
      <div className={`relative flex items-center justify-center ${heightMap[size]} ${className}`}>
        <svg viewBox="0 0 320 280" className="w-full h-full max-h-full drop-shadow-sm select-none" fill="none">
          <ellipse cx="160" cy="170" rx="90" ry="70" fill="#fff1f2" />
          {/* Rose Gold Headband */}
          <path d="M 85 160 C 85 70, 235 70, 235 160" stroke="#fda4af" strokeWidth="22" strokeLinecap="round" />
          <circle cx="85" cy="180" r="34" fill="#f43f5e" />
          <circle cx="85" cy="180" r="24" fill="#ffffff" />
          <text x="85" y="186" fill="#f43f5e" fontSize="16" fontWeight="bold" textAnchor="middle">b</text>

          <circle cx="235" cy="180" r="34" fill="#f43f5e" />
          <circle cx="235" cy="180" r="24" fill="#ffffff" />
          <text x="235" y="186" fill="#f43f5e" fontSize="16" fontWeight="bold" textAnchor="middle">b</text>
        </svg>
      </div>
    );
  }

  // Custom uploaded image or external image URL
  if (imageKey && (imageKey.startsWith('data:') || imageKey.startsWith('http') || imageKey.startsWith('/') || imageKey.startsWith('blob:'))) {
    return (
      <div className={`relative flex items-center justify-center overflow-hidden ${heightMap[size]} ${className}`}>
        <img
          src={imageKey}
          alt={name}
          className="w-full h-full object-contain drop-shadow-xs"
          onError={(e) => {
            // Fallback if broken image
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      </div>
    );
  }

  // Fallback for other items
  return (
    <div className={`relative flex items-center justify-center ${heightMap[size]} ${className}`}>
      <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl w-4/5 h-4/5 border border-slate-100">
        <div className="w-16 h-16 rounded-full bg-emerald-50 text-[#003d29] flex items-center justify-center font-bold text-xl mb-2">
          {name.charAt(0)}
        </div>
        <span className="text-xs text-slate-500 font-medium text-center line-clamp-1">{name}</span>
      </div>
    </div>
  );
};

export const ProductVisual = React.memo(ProductVisualComponent);
ProductVisual.displayName = 'ProductVisual';
