// Renders the wraith boss. As hpPct drops, more cracks/broken chain links appear —
// implementing the "armor cracks, chains break" spec from the original design doc.
export default function BossCreature({ hpPct = 100 }) {
  const showCrack2 = hpPct <= 66
  const showCrack3 = hpPct <= 33
  const chainBroken1 = hpPct <= 75
  const chainBroken2 = hpPct <= 40

  return (
    <>
      <div className="boss-shadow-blob" />
      <div className="boss-wrap">
        <svg viewBox="0 0 210 270" fill="none">
          <path d="M100 4 L128 14 C158 26 176 58 172 92 L182 100 C204 112 210 142 200 172 L206 200 C210 220 198 240 178 248 L182 262 L150 254 L118 264 L100 256 L78 264 L46 254 L52 240 C30 234 16 214 20 192 L10 168 C4 140 14 112 38 98 L46 88 C46 54 66 22 100 4 Z"
            fill="#0e0f16" stroke="#3a3d4e" strokeWidth="2.5"/>
          <path d="M100 18 C128 20 148 46 146 78 C145 96 138 108 100 106 C64 108 56 96 55 78 C53 46 74 18 100 18 Z" fill="#020203"/>
          <path d="M78 56 L92 48 L108 50 L124 58 L130 74 L120 90 L100 96 L82 90 L72 74 Z" fill="url(#voidGrad)"/>
          <path d="M84 68 L96 65 L94 71 L83 72 Z" fill="#ff3b30" opacity="0.95">
            <animate attributeName="opacity" values="0.95;0.5;0.95" dur="3.1s" repeatCount="indefinite"/>
          </path>
          <path d="M108 64 L122 67 L121 73 L109 70 Z" fill="#ff3b30" opacity="0.95">
            <animate attributeName="opacity" values="0.95;0.5;0.95" dur="2.6s" repeatCount="indefinite"/>
          </path>
          <defs>
            <radialGradient id="voidGrad" cx="50%" cy="40%" r="65%">
              <stop offset="0%" stopColor="#1c0e26"/>
              <stop offset="100%" stopColor="#020203"/>
            </radialGradient>
          </defs>
          <path d="M40 96 L8 118 L14 148 L44 156 L58 118 Z" fill="#16171f" stroke="#3a3d4e" strokeWidth="2.5"/>
          <path d="M174 92 L206 108 L204 142 L168 154 L152 116 Z" fill="#1a1b24" stroke="#3a3d4e" strokeWidth="2.5"/>
          <path d="M14 118 L2 100 L20 112 Z" fill="#0e0f16" stroke="#3a3d4e" strokeWidth="2"/>
          <path d="M198 108 L212 88 L200 116 Z" fill="#0e0f16" stroke="#3a3d4e" strokeWidth="2"/>
          <path d="M72 122 L100 116 L138 126 L146 168 L134 208 L96 222 L64 202 L58 160 Z" fill="#131019" stroke="#3a3d4e" strokeWidth="2.5"/>
          <path d="M100 116 L96 222" stroke="#2a2733" strokeWidth="1.5"/>

          {/* damage cracks — always show the first, more appear as HP drops */}
          <path d="M92 130 L80 150 L90 166 L76 186" stroke="#020203" strokeWidth="5" fill="none"/>
          {showCrack2 && <path d="M118 134 L130 154 L118 172 L132 194" stroke="#020203" strokeWidth="5" fill="none"/>}
          {showCrack3 && <path d="M46 108 L34 124 L44 136" stroke="#020203" strokeWidth="3.5" fill="none"/>}

          <circle cx="80" cy="150" r="2.2" fill="#ff3b30" opacity="0.8">
            <animate attributeName="opacity" values="0.8;0.1;0.8" dur="1.6s" repeatCount="indefinite"/>
          </circle>
          {showCrack2 && (
            <circle cx="130" cy="160" r="2.2" fill="#ff3b30" opacity="0.8">
              <animate attributeName="opacity" values="0.8;0.1;0.8" dur="1.9s" repeatCount="indefinite"/>
            </circle>
          )}

          {/* left chain — one link shows broken once HP crosses threshold */}
          <g stroke="#44475a" strokeWidth="3.5" fill="none" opacity="0.95">
            <path d="M46 130 Q30 158 46 186 Q60 208 40 246"/>
            <ellipse cx="46" cy="130" rx="5" ry="4"/>
            <ellipse cx="35" cy="150" rx="5" ry="4" fill={chainBroken1 ? 'none' : undefined} stroke={chainBroken1 ? '#8a6a2a' : '#44475a'} strokeDasharray={chainBroken1 ? '2 3' : undefined}/>
            <ellipse cx="49" cy="170" rx="5" ry="4"/>
            <ellipse cx="38" cy="192" rx="5" ry="4" stroke={chainBroken2 ? '#8a6a2a' : '#44475a'} strokeDasharray={chainBroken2 ? '2 3' : undefined}/>
            <ellipse cx="53" cy="214" rx="5" ry="4"/>
            <ellipse cx="40" cy="246" rx="5" ry="4"/>
          </g>
          <g stroke="#44475a" strokeWidth="3.5" fill="none" opacity="0.95">
            <path d="M164 126 Q182 152 168 182 Q156 206 174 240"/>
            <ellipse cx="164" cy="126" rx="5" ry="4"/>
            <ellipse cx="175" cy="146" rx="5" ry="4"/>
            <ellipse cx="163" cy="166" rx="5" ry="4" stroke={chainBroken2 ? '#8a6a2a' : '#44475a'} strokeDasharray={chainBroken2 ? '2 3' : undefined}/>
            <ellipse cx="173" cy="190" rx="5" ry="4"/>
            <ellipse cx="159" cy="212" rx="5" ry="4"/>
            <ellipse cx="174" cy="240" rx="5" ry="4"/>
          </g>

          <path d="M46 254 L40 270 L52 260 L48 274 L60 258" fill="#0e0f16" opacity="0.8"/>
          <path d="M150 254 L156 272 L146 258 L152 274 L140 260" fill="#0e0f16" opacity="0.8"/>
        </svg>
      </div>
    </>
  )
}
