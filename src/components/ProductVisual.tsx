import React from 'react';

interface ProductVisualProps {
  imageKey: string;
  name?: string;
  colorHex?: string;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  className?: string;
}

export const ProductVisual: React.FC<ProductVisualProps> = ({
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

  if (imageKey === 'sneakers-urban-pro') {
    return (
      <div className={`relative flex items-center justify-center ${heightMap[size]} ${className}`}>
        <svg viewBox="0 0 320 280" className="w-full h-full max-h-full drop-shadow-sm select-none" fill="none">
          <ellipse cx="160" cy="190" rx="100" ry="50" fill="#ecfdf5" />
          {/* Sneaker Sole */}
          <path d="M 50 185 Q 160 195 265 175 C 275 175 280 185 270 195 C 250 215 70 215 50 195 Z" fill="#003d29" />
          {/* Upper Body */}
          <path d="M 60 185 C 65 150 90 120 120 120 C 145 120 170 145 205 150 C 240 155 260 165 265 175 Z" fill="#10b981" />
          {/* Ankle Collar */}
          <path d="M 100 135 C 105 110 130 105 145 115 C 150 125 140 145 130 150 Z" fill="#047857" />
          {/* Laces & Accents */}
          <line x1="140" y1="130" x2="165" y2="150" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
          <line x1="150" y1="125" x2="180" y2="145" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
          <circle cx="85" cy="175" r="8" fill="#ffffff" opacity="0.8" />
        </svg>
      </div>
    );
  }

  if (imageKey === 'mechanical-keyboard-rgb') {
    return (
      <div className={`relative flex items-center justify-center ${heightMap[size]} ${className}`}>
        <svg viewBox="0 0 320 280" className="w-full h-full max-h-full drop-shadow-sm select-none" fill="none">
          <ellipse cx="160" cy="180" rx="100" ry="50" fill="#f8fafc" />
          {/* Keyboard Case */}
          <rect x="50" y="100" width="220" height="100" rx="10" fill="#1e293b" stroke="#334155" strokeWidth="2" />
          {/* Key Rows */}
          <rect x="62" y="112" width="26" height="18" rx="3" fill="#0ea5e9" opacity="0.9" />
          <rect x="94" y="112" width="26" height="18" rx="3" fill="#6366f1" opacity="0.9" />
          <rect x="126" y="112" width="26" height="18" rx="3" fill="#8b5cf6" opacity="0.9" />
          <rect x="158" y="112" width="26" height="18" rx="3" fill="#ec4899" opacity="0.9" />
          <rect x="190" y="112" width="26" height="18" rx="3" fill="#f43f5e" opacity="0.9" />
          <rect x="222" y="112" width="36" height="18" rx="3" fill="#0284c7" />

          <rect x="62" y="136" width="32" height="18" rx="3" fill="#334155" />
          <rect x="100" y="136" width="26" height="18" rx="3" fill="#475569" />
          <rect x="132" y="136" width="26" height="18" rx="3" fill="#475569" />
          <rect x="164" y="136" width="26" height="18" rx="3" fill="#475569" />
          <rect x="196" y="136" width="26" height="18" rx="3" fill="#475569" />
          <rect x="228" y="136" width="30" height="18" rx="3" fill="#334155" />

          {/* Spacebar Row */}
          <rect x="62" y="160" width="40" height="18" rx="3" fill="#334155" />
          <rect x="108" y="160" width="104" height="18" rx="4" fill="#06b6d4" />
          <rect x="218" y="160" width="40" height="18" rx="3" fill="#334155" />
        </svg>
      </div>
    );
  }

  if (imageKey === 'nordic-ergonomic-chair') {
    return (
      <div className={`relative flex items-center justify-center ${heightMap[size]} ${className}`}>
        <svg viewBox="0 0 320 280" className="w-full h-full max-h-full drop-shadow-sm select-none" fill="none">
          <ellipse cx="160" cy="230" rx="70" ry="25" fill="#f1f5f9" />
          {/* Headrest */}
          <rect x="130" y="55" width="60" height="24" rx="8" fill="#0f172a" />
          {/* Spine & Back Mesh */}
          <rect x="110" y="85" width="100" height="95" rx="14" fill="#334155" />
          <path d="M 120 95 L 200 95 M 120 115 L 200 115 M 120 135 L 200 135 M 120 155 L 200 155" stroke="#64748b" strokeWidth="2" strokeDasharray="4 3" />
          {/* Seat Cushion */}
          <rect x="100" y="175" width="120" height="20" rx="8" fill="#003d29" />
          {/* Gas Lift Stem & Star Base */}
          <rect x="155" y="195" width="10" height="30" fill="#64748b" />
          <path d="M 160 225 L 110 240 M 160 225 L 210 240 M 160 225 L 160 245" stroke="#334155" strokeWidth="6" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  if (imageKey === 'leather-slim-wallet') {
    return (
      <div className={`relative flex items-center justify-center ${heightMap[size]} ${className}`}>
        <svg viewBox="0 0 320 280" className="w-full h-full max-h-full drop-shadow-sm select-none" fill="none">
          <ellipse cx="160" cy="190" rx="85" ry="45" fill="#fef3c7" />
          {/* Leather Wallet Body */}
          <rect x="90" y="90" width="140" height="100" rx="12" fill="#78350f" stroke="#92400e" strokeWidth="2" />
          {/* Card Slot Inset */}
          <path d="M 90 120 Q 160 140 230 120" stroke="#b45309" strokeWidth="3" fill="none" />
          <path d="M 90 145 Q 160 165 230 145" stroke="#b45309" strokeWidth="3" fill="none" />
          {/* Credit Card Peek */}
          <rect x="110" y="70" width="100" height="50" rx="6" fill="#1e293b" />
          <rect x="120" y="82" width="20" height="14" rx="2" fill="#eab308" />
        </svg>
      </div>
    );
  }

  if (imageKey === 'smart-led-desk-lamp') {
    return (
      <div className={`relative flex items-center justify-center ${heightMap[size]} ${className}`}>
        <svg viewBox="0 0 320 280" className="w-full h-full max-h-full drop-shadow-sm select-none" fill="none">
          <ellipse cx="160" cy="225" rx="70" ry="30" fill="#fef9c3" opacity="0.6" />
          {/* Base */}
          <circle cx="160" cy="215" r="38" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="2" />
          {/* Stem */}
          <path d="M 160 215 L 160 100 Q 160 80 180 80 L 230 80" stroke="#94a3b8" strokeWidth="8" strokeLinecap="round" fill="none" />
          {/* Lamp Head & Light Glow */}
          <rect x="200" y="74" width="60" height="12" rx="6" fill="#0f172a" />
          <polygon points="205,86 255,86 280,180 180,180" fill="#fef08a" opacity="0.25" />
        </svg>
      </div>
    );
  }

  if (imageKey === 'running-trail-sneakers') {
    return (
      <div className={`relative flex items-center justify-center ${heightMap[size]} ${className}`}>
        <svg viewBox="0 0 320 280" className="w-full h-full max-h-full drop-shadow-sm select-none" fill="none">
          <ellipse cx="160" cy="190" rx="100" ry="50" fill="#f0fdfa" />
          {/* Sole */}
          <path d="M 50 180 Q 160 195 265 170 C 275 170 280 180 270 190 C 245 210 75 210 50 190 Z" fill="#0d9488" />
          {/* Upper Body */}
          <path d="M 60 180 C 65 145 90 115 120 115 C 145 115 170 140 205 145 C 240 150 260 160 265 170 Z" fill="#042f2e" />
          {/* Laces */}
          <line x1="135" y1="125" x2="160" y2="145" stroke="#2dd4bf" strokeWidth="3" strokeLinecap="round" />
          <line x1="145" y1="120" x2="175" y2="140" stroke="#2dd4bf" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  if (imageKey === 'sony-wh1000xm5') {
    return (
      <div className={`relative flex items-center justify-center ${heightMap[size]} ${className}`}>
        <svg viewBox="0 0 320 280" className="w-full h-full max-h-full drop-shadow-sm select-none" fill="none">
          <ellipse cx="160" cy="170" rx="90" ry="70" fill="#fafaf9" />
          {/* Thin Minimal Headband */}
          <path d="M 85 160 C 85 65, 235 65, 235 160" stroke="#292524" strokeWidth="16" strokeLinecap="round" />
          {/* Left Silky Cup */}
          <g transform="translate(62, 140)">
            <rect x="0" y="0" width="45" height="75" rx="22" fill="#1c1917" />
            <text x="22" y="42" fill="#a8a29e" fontSize="9" fontWeight="bold" textAnchor="middle">SONY</text>
          </g>
          {/* Right Silky Cup */}
          <g transform="translate(213, 140)">
            <rect x="0" y="0" width="45" height="75" rx="22" fill="#1c1917" />
            <text x="22" y="42" fill="#a8a29e" fontSize="9" fontWeight="bold" textAnchor="middle">SONY</text>
          </g>
        </svg>
      </div>
    );
  }

  if (imageKey === 'waterproof-travel-backpack') {
    return (
      <div className={`relative flex items-center justify-center ${heightMap[size]} ${className}`}>
        <svg viewBox="0 0 320 280" className="w-full h-full max-h-full drop-shadow-sm select-none" fill="none">
          <ellipse cx="160" cy="205" rx="80" ry="40" fill="#f1f5f9" />
          {/* Main Body */}
          <rect x="95" y="70" width="130" height="150" rx="28" fill="#1e293b" />
          {/* Top Carry Handle */}
          <path d="M 135 70 C 135 50, 185 50, 185 70" stroke="#0f172a" strokeWidth="8" strokeLinecap="round" fill="none" />
          {/* Front Pocket */}
          <rect x="110" y="130" width="100" height="70" rx="14" fill="#334155" />
          <line x1="125" y1="150" x2="195" y2="150" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  if (imageKey === 'smart-fitness-band') {
    return (
      <div className={`relative flex items-center justify-center ${heightMap[size]} ${className}`}>
        <svg viewBox="0 0 320 280" className="w-full h-full max-h-full drop-shadow-sm select-none" fill="none">
          <ellipse cx="160" cy="180" rx="80" ry="50" fill="#ecfdf5" />
          {/* Strap Band */}
          <rect x="142" y="60" width="36" height="160" rx="18" fill="#047857" />
          {/* Capsule Screen */}
          <rect x="136" y="100" width="48" height="80" rx="16" fill="#022c22" stroke="#10b981" strokeWidth="2" />
          {/* Digital Clock display */}
          <text x="160" y="135" fill="#34d399" fontSize="13" fontWeight="bold" textAnchor="middle" fontFamily="monospace">10:45</text>
          <text x="160" y="152" fill="#ffffff" fontSize="9" textAnchor="middle">7,850 BPM</text>
        </svg>
      </div>
    );
  }

  if (imageKey === 'logitech-mx-master-3s') {
    return (
      <div className={`relative flex items-center justify-center ${heightMap[size]} ${className}`}>
        <svg viewBox="0 0 320 280" className="w-full h-full max-h-full drop-shadow-sm select-none" fill="none">
          <ellipse cx="160" cy="180" rx="85" ry="55" fill="#f8fafc" />
          {/* Ergonomic Mouse Body */}
          <path d="M 110 130 C 110 80, 200 80, 205 130 C 210 180, 190 220, 150 220 C 115 220, 105 180, 110 130 Z" fill="#334155" />
          {/* Thumb Rest Wing */}
          <path d="M 110 130 C 85 150, 85 180, 115 190" fill="#1e293b" />
          {/* Metal MagSpeed Scroll Wheel */}
          <rect x="152" y="95" width="12" height="30" rx="6" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
        </svg>
      </div>
    );
  }

  if (imageKey === 'buku-atomic-habits') {
    return (
      <div className={`relative flex items-center justify-center ${heightMap[size]} ${className}`}>
        <svg viewBox="0 0 320 280" className="w-full h-full max-h-full drop-shadow-sm select-none" fill="none">
          <ellipse cx="160" cy="205" rx="80" ry="40" fill="#fffbeb" />
          {/* Book Cover */}
          <rect x="100" y="65" width="120" height="160" rx="8" fill="#ffffff" stroke="#f59e0b" strokeWidth="3" />
          <rect x="95" y="65" width="12" height="160" rx="4" fill="#d97706" />
          {/* Title and Atomic dot ring */}
          <circle cx="160" cy="120" r="22" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3 3" />
          <circle cx="160" cy="120" r="6" fill="#d97706" />
          <text x="160" y="165" fill="#1e293b" fontSize="10" fontWeight="extrabold" textAnchor="middle">ATOMIC HABITS</text>
          <text x="160" y="180" fill="#64748b" fontSize="8" textAnchor="middle">James Clear</text>
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
