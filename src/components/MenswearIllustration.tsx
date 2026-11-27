import React from 'react';
import { ColorItem, CvdMode } from '../types/color';
import { getLuminance, hexToRgb, simulateColorVision } from '../utils/colorUtils';
import {
  GarmentPieces,
  GarmentSlotKey,
  GarmentStyle,
  getSlotDisplayLabel,
  STYLE_PRESET_PIECES,
} from '../utils/menswearUtils';

interface MenswearIllustrationProps {
  style: GarmentStyle;
  pieces?: GarmentPieces;
  outfit: Record<GarmentSlotKey, ColorItem>;
  cvdMode?: CvdMode;
  activeSlot?: GarmentSlotKey | null;
  onSelectSlot?: (slot: GarmentSlotKey) => void;
}

function getSeamStroke(hex: string): string {
  const lum = getLuminance(...hexToRgb(hex));
  return lum < 0.08 ? 'rgba(255,255,255,0.34)' : 'rgba(26,22,19,0.24)';
}

function getSoftShade(hex: string): string {
  const lum = getLuminance(...hexToRgb(hex));
  return lum < 0.06 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
}

function getSoftHighlight(hex: string): string {
  const lum = getLuminance(...hexToRgb(hex));
  return lum < 0.08 ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.16)';
}

export const MenswearIllustration: React.FC<MenswearIllustrationProps> = ({
  style,
  pieces = STYLE_PRESET_PIECES[style],
  outfit,
  cvdMode = 'normal',
  activeSlot = null,
  onSelectSlot,
}) => {
  const shown = {
    outerwear: simulateColorVision(outfit.outerwear.hex, cvdMode),
    top: simulateColorVision(outfit.top.hex, cvdMode),
    bottom: simulateColorVision(outfit.bottom.hex, cvdMode),
    accent: simulateColorVision(outfit.accent.hex, cvdMode),
    footwear: simulateColorVision(outfit.footwear.hex, cvdMode),
  };

  const interactiveProps = (slot: GarmentSlotKey) => {
    const label = `${getSlotDisplayLabel(slot, pieces)}: #${outfit[slot].id} ${outfit[slot].name} (${outfit[slot].hex})`;
    const isActive = activeSlot === slot;
    if (!onSelectSlot) {
      return { 'aria-label': label };
    }
    return {
      role: 'button' as const,
      tabIndex: 0,
      'aria-label': `Edit ${label}`,
      'aria-pressed': isActive,
      onClick: () => onSelectSlot(slot),
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelectSlot(slot);
        }
      },
      style: isActive
        ? { filter: 'drop-shadow(0 0 4px rgba(217,119,6,0.55))' }
        : undefined,
      className: 'cursor-pointer focus:outline-none transition-opacity hover:opacity-95',
    };
  };

  const hasCoat = pieces.outerwear !== 'none';
  const showBareForearms = !hasCoat && pieces.top === 'camp-shirt';
  const showBareCalves = pieces.bottom === 'shorts';
  const showsChestPocketSquare =
    hasCoat &&
    (pieces.outerwear === 'blazer' ||
      pieces.outerwear === 'overcoat' ||
      pieces.outerwear === 'chore');

  return (
    <svg
      viewBox="0 0 360 490"
      shapeRendering="geometricPrecision"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-full max-w-[320px] mx-auto select-none drop-shadow-sm"
      role="img"
      aria-label={`Menswear lookbook illustration (${style})`}
    >
      {/* Ground Shadow */}
      <ellipse cx="180" cy="466" rx="68" ry="8" fill="rgba(0,0,0,0.08)" />

      {/* Croquis Head, Hair, Ears, Neck, Arms & Legs */}
      <g aria-hidden="true">
        {/* Subtle Neck & Trapezius Base */}
        <path
          d="M168 58 L192 58 L195 82 C195 88, 165 88, 165 82 Z"
          fill="#D7BDA9"
        />
        <path
          d="M150 79 Q180 94 210 79 L213 90 Q180 102 147 90 Z"
          fill="#E2CBB9"
        />

        {/* Ears */}
        <ellipse cx="161" cy="43" rx="3" ry="6" fill="#D8BFA9" />
        <ellipse cx="199" cy="43" rx="3" ry="6" fill="#D8BFA9" />

        {/* Head Oval */}
        <ellipse
          cx="180"
          cy="41"
          rx="18"
          ry="22.5"
          fill="#E7D1C2"
          stroke="rgba(42,32,26,0.18)"
          strokeWidth="0.9"
        />
        {/* Natural Soft Cropped Hair */}
        <path
          d="M161 39 C160 22, 171 16, 180 16 C191 16, 200 23, 199 39 C197 30, 190 25, 180 25 C170 25, 163 30, 161 39 Z"
          fill="#3B322C"
          opacity="0.78"
        />

        {/* Bare Forearms for Short-Sleeve Camp/Polo Top (No Coat) */}
        {showBareForearms && (
          <>
            <path
              d="M111 148 C105 182, 99 216, 95 244 L105 244 C110 216, 118 184, 124 150 Z"
              fill="#DFC6B4"
              stroke="rgba(42,32,26,0.14)"
              strokeWidth="0.8"
            />
            <path
              d="M249 148 C255 182, 261 216, 265 244 L255 244 C250 216, 242 184, 236 150 Z"
              fill="#DFC6B4"
              stroke="rgba(42,32,26,0.14)"
              strokeWidth="0.8"
            />
          </>
        )}

        {/* Sleeved Forearms peeking cleanly from Haori */}
        {pieces.outerwear === 'haori' && (
          <>
            <path
              d="M99 215 L117 215 L110 245 L94 245 Z"
              fill={shown.top}
              stroke={getSeamStroke(shown.top)}
              strokeWidth="0.9"
            />
            <path
              d="M243 215 L261 215 L266 245 L250 245 Z"
              fill={shown.top}
              stroke={getSeamStroke(shown.top)}
              strokeWidth="0.9"
            />
          </>
        )}

        {/* Relaxed Tapered Hands */}
        <path
          d="M94 242 C90 255, 92 267, 100 268 C106 268, 109 258, 106 242"
          fill="#DEC4B2"
          stroke="rgba(42,32,26,0.16)"
          strokeWidth="0.8"
        />
        <path
          d="M266 242 C270 255, 268 267, 260 268 C254 268, 251 258, 254 242"
          fill="#DEC4B2"
          stroke="rgba(42,32,26,0.16)"
          strokeWidth="0.8"
        />

        {/* Lower Bare Legs & Ankles for Tailored Shorts (extend smoothly into loafer tongue) */}
        {showBareCalves && (
          <>
            <path
              d="M134 322 C134 358, 139 398, 143 442 L163 442 C166 398, 169 358, 170 322 Z"
              fill="#DFC6B4"
              stroke="rgba(42,32,26,0.16)"
              strokeWidth="0.85"
            />
            <path
              d="M226 322 C226 358, 221 398, 217 442 L197 442 C194 398, 191 358, 190 322 Z"
              fill="#DFC6B4"
              stroke="rgba(42,32,26,0.16)"
              strokeWidth="0.85"
            />
          </>
        )}
      </g>

      {/* ================================================================= */}
      {/* 1. FOOTWEAR LAYER (Oxfords, Sneakers, Loafers, Boots, Zori)       */}
      {/* ================================================================= */}
      <g {...interactiveProps('footwear')}>
        <title>{getSlotDisplayLabel('footwear', pieces)}: {outfit.footwear.name}</title>

        {pieces.footwear === 'oxfords' && (
          <>
            <path
              d="M141 428 L166 428 C168 439, 169 448, 165 454 C150 457, 130 456, 122 450 C119 444, 129 434, 141 428 Z"
              fill={shown.footwear}
              stroke={getSeamStroke(shown.footwear)}
              strokeWidth="1.05"
            />
            <path
              d="M219 428 L194 428 C192 439, 191 448, 195 454 C210 457, 230 456, 238 450 C241 444, 231 434, 219 428 Z"
              fill={shown.footwear}
              stroke={getSeamStroke(shown.footwear)}
              strokeWidth="1.05"
            />
            <path d="M124 452 Q145 456 165 453" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.2" />
            <path d="M195 453 Q215 456 236 452" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.2" />
            <path d="M140 434 Q148 439 158 434" fill="none" stroke={getSeamStroke(shown.footwear)} strokeWidth="0.95" />
            <path d="M202 434 Q212 439 220 434" fill="none" stroke={getSeamStroke(shown.footwear)} strokeWidth="0.95" />
          </>
        )}

        {pieces.footwear === 'boots' && (
          <>
            <path
              d="M139 406 L166 406 L168 452 C152 456, 131 455, 123 449 C121 442, 131 429, 139 406 Z"
              fill={shown.footwear}
              stroke={getSeamStroke(shown.footwear)}
              strokeWidth="1.05"
            />
            <path
              d="M221 406 L194 406 L192 452 C208 456, 229 455, 237 449 C239 442, 229 429, 221 406 Z"
              fill={shown.footwear}
              stroke={getSeamStroke(shown.footwear)}
              strokeWidth="1.05"
            />
            <path d="M146 411 C143 420, 143 428, 149 431 C154 428, 155 420, 152 411 Z" fill={getSoftShade(shown.footwear)} />
            <path d="M214 411 C217 420, 217 428, 211 431 C206 428, 205 420, 208 411 Z" fill={getSoftShade(shown.footwear)} />
            <path d="M123 450 Q145 456 168 453 L167 458 Q144 460 123 454 Z" fill="rgba(22,19,17,0.72)" />
            <path d="M192 453 Q215 456 237 450 L237 454 Q216 460 193 458 Z" fill="rgba(22,19,17,0.72)" />
          </>
        )}

        {pieces.footwear === 'sneakers' && (
          <>
            <path
              d="M139 426 L166 426 C168 436, 168 443, 166 448 L123 448 C120 441, 128 433, 139 426 Z"
              fill={shown.footwear}
              stroke={getSeamStroke(shown.footwear)}
              strokeWidth="1.05"
            />
            <path
              d="M221 426 L194 426 C192 436, 192 443, 194 448 L237 448 C240 441, 232 433, 221 426 Z"
              fill={shown.footwear}
              stroke={getSeamStroke(shown.footwear)}
              strokeWidth="1.05"
            />
            <rect x="121" y="447" width="46" height="7.5" rx="3.7" fill="#F5F2EA" stroke="rgba(0,0,0,0.22)" strokeWidth="0.9" />
            <rect x="193" y="447" width="46" height="7.5" rx="3.7" fill="#F5F2EA" stroke="rgba(0,0,0,0.22)" strokeWidth="0.9" />
            <line x1="141" y1="432" x2="154" y2="432" stroke={getSeamStroke(shown.footwear)} strokeWidth="1.15" />
            <line x1="138" y1="437" x2="151" y2="437" stroke={getSeamStroke(shown.footwear)} strokeWidth="1.15" />
            <line x1="206" y1="432" x2="219" y2="432" stroke={getSeamStroke(shown.footwear)} strokeWidth="1.15" />
            <line x1="209" y1="437" x2="222" y2="437" stroke={getSeamStroke(shown.footwear)} strokeWidth="1.15" />
          </>
        )}

        {pieces.footwear === 'loafers' && (
          <>
            {!showBareCalves && (
              <>
                <rect x="142" y="424" width="22" height="9" rx="2" fill="#DBC1AE" />
                <rect x="196" y="424" width="22" height="9" rx="2" fill="#DBC1AE" />
              </>
            )}
            <path
              d="M141 431 Q153 442 165 431 L166 452 C151 456, 130 455, 122 449 C120 443, 130 436, 141 431 Z"
              fill={shown.footwear}
              stroke={getSeamStroke(shown.footwear)}
              strokeWidth="1.05"
            />
            <path
              d="M195 431 Q207 442 219 431 C230 436, 240 443, 238 449 C230 455, 209 456, 194 452 Z"
              fill={shown.footwear}
              stroke={getSeamStroke(shown.footwear)}
              strokeWidth="1.05"
            />
            <path d="M135 441 Q147 437 157 441" fill="none" stroke={getSeamStroke(shown.footwear)} strokeWidth="1.2" />
            <path d="M203 441 Q213 437 225 441" fill="none" stroke={getSeamStroke(shown.footwear)} strokeWidth="1.2" />
          </>
        )}

        {pieces.footwear === 'zori' && (
          <>
            <path
              d="M138 426 L165 426 L166 448 C151 451, 134 450, 126 446 C124 440, 131 432, 138 426 Z"
              fill={shown.footwear}
              stroke={getSeamStroke(shown.footwear)}
              strokeWidth="1.05"
            />
            <path
              d="M222 426 L195 426 L194 448 C209 451, 226 450, 234 446 C236 440, 229 432, 222 426 Z"
              fill={shown.footwear}
              stroke={getSeamStroke(shown.footwear)}
              strokeWidth="1.05"
            />
            <rect x="122" y="448" width="46" height="7" rx="3" fill="#D5BC93" stroke="rgba(0,0,0,0.26)" strokeWidth="0.9" />
            <rect x="192" y="448" width="46" height="7" rx="3" fill="#D5BC93" stroke="rgba(0,0,0,0.26)" strokeWidth="0.9" />
            <path d="M135 448 L146 437 L157 448" fill="none" stroke={shown.accent} strokeWidth="2.3" />
            <path d="M203 448 L214 437 L225 448" fill="none" stroke={shown.accent} strokeWidth="2.3" />
          </>
        )}
      </g>

      {/* ================================================================= */}
      {/* 2. BOTTOM LAYER (Trousers, Chinos, Denim, Shorts, Hakama)         */}
      {/* ================================================================= */}
      <g {...interactiveProps('bottom')}>
        <title>{getSlotDisplayLabel('bottom', pieces)}: {outfit.bottom.name}</title>

        {(pieces.bottom === 'trousers' || pieces.bottom === 'chinos') && (
          <>
            <path
              d={
                pieces.bottom === 'chinos'
                  ? 'M134 228 L226 228 C231 268, 229 344, 221 430 L195 430 C191 364, 187 308, 180 282 C173 308, 169 364, 165 430 L139 430 C131 344, 129 268, 134 228 Z'
                  : 'M133 228 L227 228 C232 272, 230 350, 223 434 L194 434 C191 368, 187 310, 180 282 C173 310, 169 368, 166 434 L137 434 C130 350, 128 272, 133 228 Z'
              }
              fill={shown.bottom}
              stroke={getSeamStroke(shown.bottom)}
              strokeWidth="1.05"
            />
            {pieces.bottom === 'trousers' ? (
              <>
                <line x1="152" y1="250" x2="152" y2="431" stroke={getSeamStroke(shown.bottom)} strokeWidth="0.9" strokeOpacity="0.6" />
                <line x1="208" y1="250" x2="208" y2="431" stroke={getSeamStroke(shown.bottom)} strokeWidth="0.9" strokeOpacity="0.6" />
              </>
            ) : (
              <>
                <path d="M136 240 Q145 256 142 274" fill="none" stroke={getSeamStroke(shown.bottom)} strokeWidth="1" />
                <path d="M224 240 Q215 256 218 274" fill="none" stroke={getSeamStroke(shown.bottom)} strokeWidth="1" />
                <line x1="139" y1="423" x2="165" y2="423" stroke={getSeamStroke(shown.bottom)} strokeWidth="1" />
                <line x1="195" y1="423" x2="221" y2="423" stroke={getSeamStroke(shown.bottom)} strokeWidth="1" />
              </>
            )}
          </>
        )}

        {pieces.bottom === 'denim' && (
          <>
            <path
              d="M133 228 L227 228 C232 278, 229 354, 222 434 L194 434 C190 368, 186 310, 180 284 C174 310, 170 368, 166 434 L138 434 C131 354, 128 278, 133 228 Z"
              fill={shown.bottom}
              stroke={getSeamStroke(shown.bottom)}
              strokeWidth="1.05"
            />
            <path d="M135 244 Q148 258 156 242" fill="none" stroke={getSeamStroke(shown.bottom)} strokeWidth="1" />
            <path d="M225 244 Q212 258 204 242" fill="none" stroke={getSeamStroke(shown.bottom)} strokeWidth="1" />
            <path d="M180 232 L180 270 Q176 276 172 278" fill="none" stroke={getSeamStroke(shown.bottom)} strokeWidth="1" />
            <rect x="137" y="423" width="30" height="10" rx="2" fill={getSoftShade(shown.bottom)} stroke={getSeamStroke(shown.bottom)} strokeWidth="0.95" />
            <rect x="193" y="423" width="30" height="10" rx="2" fill={getSoftShade(shown.bottom)} stroke={getSeamStroke(shown.bottom)} strokeWidth="0.95" />
          </>
        )}

        {pieces.bottom === 'shorts' && (
          <>
            <path
              d="M133 228 L227 228 C232 260, 232 292, 229 324 L189 324 C186 300, 184 286, 180 278 C176 286, 174 300, 171 324 L131 324 C128 292, 128 260, 133 228 Z"
              fill={shown.bottom}
              stroke={getSeamStroke(shown.bottom)}
              strokeWidth="1.05"
            />
            <path d="M136 242 Q145 258 142 274" fill="none" stroke={getSeamStroke(shown.bottom)} strokeWidth="1" />
            <path d="M224 242 Q215 258 218 274" fill="none" stroke={getSeamStroke(shown.bottom)} strokeWidth="1" />
            <line x1="131" y1="316" x2="171" y2="316" stroke={getSeamStroke(shown.bottom)} strokeWidth="1" />
            <line x1="189" y1="316" x2="229" y2="316" stroke={getSeamStroke(shown.bottom)} strokeWidth="1" />
          </>
        )}

        {pieces.bottom === 'hakama' && (
          <>
            <path
              d="M132 224 L228 224 C238 286, 242 362, 238 434 L187 434 C184 374, 183 324, 180 296 C177 324, 176 374, 173 434 L122 434 C118 362, 122 286, 132 224 Z"
              fill={shown.bottom}
              stroke={getSeamStroke(shown.bottom)}
              strokeWidth="1.05"
            />
            <path d="M148 230 Q142 320 138 432" fill="none" stroke={getSeamStroke(shown.bottom)} strokeWidth="1" />
            <path d="M165 230 Q162 320 159 432" fill="none" stroke={getSeamStroke(shown.bottom)} strokeWidth="1" />
            <path d="M195 230 Q198 320 201 432" fill="none" stroke={getSeamStroke(shown.bottom)} strokeWidth="1" />
            <path d="M212 230 Q218 320 222 432" fill="none" stroke={getSeamStroke(shown.bottom)} strokeWidth="1" />
          </>
        )}
      </g>

      {/* ================================================================= */}
      {/* 3. TOP LAYER (Smooth G1 shoulders M -> C -> S smooth arm curves)  */}
      {/* ================================================================= */}
      <g {...interactiveProps('top')}>
        <title>{getSlotDisplayLabel('top', pieces)}: {outfit.top.name}</title>

        {!hasCoat ? (
          <>
            {pieces.top === 'camp-shirt' ? (
              /* Smooth Short-Sleeve Resort Shirt / Polo */
              <>
                <path
                  d="M164 76 C146 80, 128 84, 121 93 C114 102, 108 122, 102 150 L127 154 L134 128 L133 230 C164 235, 196 235, 227 230 L226 128 L233 154 L258 150 C252 122, 246 102, 239 93 C232 84, 214 80, 196 76 Q180 94 164 76 Z"
                  fill={shown.top}
                  stroke={getSeamStroke(shown.top)}
                  strokeWidth="1.05"
                />
                {/* Soft Open Camp Collar */}
                <path d="M164 76 Q155 91 168 104 L180 95" fill={getSoftHighlight(shown.top)} stroke={getSeamStroke(shown.top)} strokeWidth="1" />
                <path d="M196 76 Q205 91 192 104 L180 95" fill={getSoftHighlight(shown.top)} stroke={getSeamStroke(shown.top)} strokeWidth="1" />
                <line x1="180" y1="95" x2="180" y2="232" stroke={getSeamStroke(shown.top)} strokeWidth="0.95" />
                <circle cx="180" cy="126" r="1.6" fill={getSeamStroke(shown.top)} />
                <circle cx="180" cy="156" r="1.6" fill={getSeamStroke(shown.top)} />
                <circle cx="180" cy="186" r="1.6" fill={getSeamStroke(shown.top)} />
              </>
            ) : (
              /* Smooth Long-Sleeve Top (G1 continuous S-spline shoulders -> elbows -> wrists) */
              <>
                <path
                  d="M164 76 C146 80, 128 84, 120 94 S97 168, 92 242 L110 245 C115 204, 123 158, 134 128 C136 164, 135 200, 133 230 C164 235, 196 235, 227 230 C225 200, 224 164, 226 128 C237 158, 245 204, 250 245 L268 242 C263 168, 248 104, 240 94 S214 80, 196 76 Q180 88 164 76 Z"
                  fill={shown.top}
                  stroke={getSeamStroke(shown.top)}
                  strokeWidth="1.05"
                />
                <path d="M134 128 Q131 112 136 96" fill="none" stroke={getSeamStroke(shown.top)} strokeWidth="0.85" strokeOpacity="0.55" />
                <path d="M226 128 Q229 112 224 96" fill="none" stroke={getSeamStroke(shown.top)} strokeWidth="0.85" strokeOpacity="0.55" />
              </>
            )}
          </>
        ) : (
          /* Layered Chest Base Under Coat + Crisp Forearm Cuff Peek */
          <>
            <path
              d="M150 77 L210 77 L218 232 L142 232 Z"
              fill={shown.top}
              stroke={getSeamStroke(shown.top)}
              strokeWidth="0.95"
            />
            {pieces.outerwear !== 'haori' && pieces.top !== 'camp-shirt' && (
              <>
                <path d="M91 236 L109 240 L108 247 L90 243 Z" fill={shown.top} stroke={getSeamStroke(shown.top)} strokeWidth="0.9" />
                <path d="M269 236 L251 240 L252 247 L270 243 Z" fill={shown.top} stroke={getSeamStroke(shown.top)} strokeWidth="0.9" />
              </>
            )}
          </>
        )}

        {/* Top Neckline & Details */}
        {pieces.top === 'dress-shirt' && (
          <>
            <path d="M164 76 Q172 86 180 91 L160 95 Q157 85 164 76 Z" fill={shown.top} stroke={getSeamStroke(shown.top)} strokeWidth="1" />
            <path d="M196 76 Q188 86 180 91 L200 95 Q203 85 196 76 Z" fill={shown.top} stroke={getSeamStroke(shown.top)} strokeWidth="1" />
            <line x1="180" y1="91" x2="180" y2="230" stroke={getSeamStroke(shown.top)} strokeWidth="0.95" />
            <circle cx="180" cy="122" r="1.6" fill={getSeamStroke(shown.top)} />
            <circle cx="180" cy="152" r="1.6" fill={getSeamStroke(shown.top)} />
            <circle cx="180" cy="182" r="1.6" fill={getSeamStroke(shown.top)} />
          </>
        )}

        {pieces.top === 'crewneck' && (
          <>
            <path d="M158 77 Q180 97 202 77" fill="none" stroke={getSeamStroke(shown.top)} strokeWidth="2.4" />
            <path d="M155 81 Q180 101 205 81" fill="none" stroke={getSoftShade(shown.top)} strokeWidth="3" />
            {!hasCoat && (
              <rect x="133" y="220" width="94" height="10" rx="3" fill={getSoftShade(shown.top)} stroke={getSeamStroke(shown.top)} strokeWidth="0.85" />
            )}
          </>
        )}

        {pieces.top === 'turtleneck' && (
          <>
            <path
              d="M164 62 C164 58, 196 58, 196 62 L200 81 C188 86, 172 86, 160 81 Z"
              fill={shown.top}
              stroke={getSeamStroke(shown.top)}
              strokeWidth="1.05"
            />
            <line x1="164" y1="71" x2="196" y2="71" stroke={getSeamStroke(shown.top)} strokeWidth="0.85" />
          </>
        )}

        {pieces.top === 'hoodie' && (
          <>
            {/* Natural Rolled Neck Hood without pointy corners */}
            <path
              d="M160 75 C159 66, 169 65, 180 74 C191 65, 201 66, 200 75 C202 86, 192 95, 180 97 C168 95, 158 86, 160 75 Z"
              fill={shown.top}
              stroke={getSeamStroke(shown.top)}
              strokeWidth="1.05"
            />
            <path d="M172 95 L171 128" fill="none" stroke={getSeamStroke(shown.top)} strokeWidth="1.5" />
            <path d="M188 95 L189 128" fill="none" stroke={getSeamStroke(shown.top)} strokeWidth="1.5" />
            {!hasCoat && (
              <>
                <path
                  d="M152 178 L208 178 L216 216 L144 216 Z"
                  fill={getSoftShade(shown.top)}
                  stroke={getSeamStroke(shown.top)}
                  strokeWidth="0.95"
                />
                <rect x="133" y="220" width="94" height="10" rx="3" fill={getSoftShade(shown.top)} stroke={getSeamStroke(shown.top)} strokeWidth="0.85" />
              </>
            )}
          </>
        )}

        {pieces.top === 'kimono' && (
          <>
            <path d="M161 76 L180 116 L199 76" fill="none" stroke="#F6F3EB" strokeWidth="3.8" />
            <path d="M158 76 Q172 112 192 146" fill="none" stroke={getSeamStroke(shown.top)} strokeWidth="2" />
            <path d="M202 76 Q188 104 176 128" fill="none" stroke={getSeamStroke(shown.top)} strokeWidth="2" />
          </>
        )}
      </g>

      {/* ================================================================= */}
      {/* 4. OUTERWEAR LAYER (G1 continuous draped shoulders & sleeves)     */}
      {/* ================================================================= */}
      {hasCoat && (
        <g {...interactiveProps('outerwear')}>
          <title>{getSlotDisplayLabel('outerwear', pieces)}: {outfit.outerwear.name}</title>

          {pieces.outerwear === 'blazer' && (
            <>
              <path
                d="M163 75 C144 79, 126 83, 118 93 S95 166, 90 238 L109 242 C115 202, 124 156, 134 128 C134 172, 131 214, 132 248 C148 253, 165 253, 179 242 L179 160 Z"
                fill={shown.outerwear}
                stroke={getSeamStroke(shown.outerwear)}
                strokeWidth="1.05"
              />
              <path
                d="M197 75 C216 79, 234 83, 242 93 S265 166, 270 238 L251 242 C245 202, 236 156, 226 128 C226 172, 229 214, 228 248 C212 253, 195 253, 181 242 L181 160 Z"
                fill={shown.outerwear}
                stroke={getSeamStroke(shown.outerwear)}
                strokeWidth="1.05"
              />
              {/* Softly Shaded Rolled Notch Lapels */}
              <path d="M163 75 C154 89, 148 103, 145 111 L156 115 L149 125 L179 160 L165 78 Z" fill={getSoftHighlight(shown.outerwear)} stroke={getSeamStroke(shown.outerwear)} strokeWidth="1" />
              <path d="M197 75 C206 89, 212 103, 215 111 L204 115 L211 125 L181 160 L195 78 Z" fill={getSoftHighlight(shown.outerwear)} stroke={getSeamStroke(shown.outerwear)} strokeWidth="1" />
              <path d="M141 198 Q154 200 166 198" fill="none" stroke={getSeamStroke(shown.outerwear)} strokeWidth="1.4" />
              <path d="M194 198 Q206 200 219 198" fill="none" stroke={getSeamStroke(shown.outerwear)} strokeWidth="1.4" />
              <circle cx="180" cy="174" r="2.6" fill={getSeamStroke(shown.outerwear)} />
              <circle cx="180" cy="202" r="2.6" fill={getSeamStroke(shown.outerwear)} />
            </>
          )}

          {pieces.outerwear === 'overcoat' && (
            <>
              <path
                d="M161 74 C142 78, 123 82, 115 93 S93 168, 88 242 L108 246 C114 204, 123 156, 132 128 C126 206, 122 278, 124 338 C144 342, 163 343, 179 341 L179 166 Z"
                fill={shown.outerwear}
                stroke={getSeamStroke(shown.outerwear)}
                strokeWidth="1.05"
              />
              <path
                d="M199 74 C218 78, 237 82, 245 93 S267 168, 272 242 L252 246 C246 204, 237 156, 228 128 C234 206, 238 278, 236 338 C216 342, 197 343, 181 341 L181 166 Z"
                fill={shown.outerwear}
                stroke={getSeamStroke(shown.outerwear)}
                strokeWidth="1.05"
              />
              <path d="M161 74 C150 90, 141 108, 139 118 L152 123 L144 134 L179 166 L165 77 Z" fill={getSoftHighlight(shown.outerwear)} stroke={getSeamStroke(shown.outerwear)} strokeWidth="1.05" />
              <path d="M199 74 C210 90, 219 108, 221 118 L208 123 L216 134 L181 166 L195 77 Z" fill={getSoftHighlight(shown.outerwear)} stroke={getSeamStroke(shown.outerwear)} strokeWidth="1.05" />
              <line x1="136" y1="220" x2="153" y2="232" stroke={getSeamStroke(shown.outerwear)} strokeWidth="1.5" />
              <line x1="224" y1="220" x2="207" y2="232" stroke={getSeamStroke(shown.outerwear)} strokeWidth="1.5" />
              <circle cx="174" cy="184" r="2.7" fill={getSeamStroke(shown.outerwear)} />
              <circle cx="174" cy="218" r="2.7" fill={getSeamStroke(shown.outerwear)} />
            </>
          )}

          {pieces.outerwear === 'bomber' && (
            <>
              <path
                d="M161 76 C142 80, 124 85, 116 95 S94 166, 90 236 L111 240 C116 198, 125 154, 134 132 L133 228 L167 228 L167 88 Z"
                fill={shown.outerwear}
                stroke={getSeamStroke(shown.outerwear)}
                strokeWidth="1.05"
              />
              <path
                d="M199 76 C218 80, 236 85, 244 95 S266 166, 270 236 L249 240 C244 198, 235 154, 226 132 L227 228 L193 228 L193 88 Z"
                fill={shown.outerwear}
                stroke={getSeamStroke(shown.outerwear)}
                strokeWidth="1.05"
              />
              <path d="M157 82 Q144 108 134 132" fill="none" stroke={getSeamStroke(shown.outerwear)} strokeWidth="1" />
              <path d="M203 82 Q216 108 226 132" fill="none" stroke={getSeamStroke(shown.outerwear)} strokeWidth="1" />
              <rect x="133" y="217" width="34" height="11" rx="2" fill={getSoftShade(shown.outerwear)} stroke={getSeamStroke(shown.outerwear)} strokeWidth="0.85" />
              <rect x="193" y="217" width="34" height="11" rx="2" fill={getSoftShade(shown.outerwear)} stroke={getSeamStroke(shown.outerwear)} strokeWidth="0.85" />
              <line x1="143" y1="184" x2="153" y2="202" stroke={getSeamStroke(shown.outerwear)} strokeWidth="1.4" />
              <line x1="217" y1="184" x2="207" y2="202" stroke={getSeamStroke(shown.outerwear)} strokeWidth="1.4" />
            </>
          )}

          {pieces.outerwear === 'chore' && (
            <>
              <path
                d="M161 75 C142 79, 124 84, 116 94 S94 166, 90 238 L110 242 C116 200, 125 156, 134 130 L132 242 L166 242 L166 87 Z"
                fill={shown.outerwear}
                stroke={getSeamStroke(shown.outerwear)}
                strokeWidth="1.05"
              />
              <path
                d="M199 75 C218 79, 236 84, 244 94 S266 166, 270 238 L250 242 C244 200, 235 156, 226 130 L228 242 L194 242 L194 87 Z"
                fill={shown.outerwear}
                stroke={getSeamStroke(shown.outerwear)}
                strokeWidth="1.05"
              />
              <path d="M161 75 Q148 90 146 102 L166 96 Z" fill={getSoftHighlight(shown.outerwear)} stroke={getSeamStroke(shown.outerwear)} strokeWidth="1" />
              <path d="M199 75 Q212 90 214 102 L194 96 Z" fill={getSoftHighlight(shown.outerwear)} stroke={getSeamStroke(shown.outerwear)} strokeWidth="1" />
              <rect x="139" y="180" width="21" height="29" rx="3.5" fill={getSoftShade(shown.outerwear)} stroke={getSeamStroke(shown.outerwear)} strokeWidth="1" />
              <rect x="200" y="180" width="21" height="29" rx="3.5" fill={getSoftShade(shown.outerwear)} stroke={getSeamStroke(shown.outerwear)} strokeWidth="1" />
            </>
          )}

          {pieces.outerwear === 'haori' && (
            <>
              {/* Smooth Rounded Drop-Shoulder Haori Mantle */}
              <path
                d="M159 75 C135 80, 108 85, 90 95 C84 128, 84 176, 87 216 Q106 220, 129 216 C130 186, 130 156, 130 142 C128 188, 128 232, 131 264 L165 264 L165 83 Z"
                fill={shown.outerwear}
                stroke={getSeamStroke(shown.outerwear)}
                strokeWidth="1.05"
              />
              <path
                d="M201 75 C225 80, 252 85, 270 95 C276 128, 276 176, 273 216 Q254 220, 231 216 C230 186, 230 156, 230 142 C232 188, 232 232, 229 264 L195 264 L195 83 Z"
                fill={shown.outerwear}
                stroke={getSeamStroke(shown.outerwear)}
                strokeWidth="1.05"
              />
              <path d="M159 79 Q157 168 159 264" fill="none" stroke={getSeamStroke(shown.outerwear)} strokeWidth="1.3" />
              <path d="M201 79 Q203 168 201 264" fill="none" stroke={getSeamStroke(shown.outerwear)} strokeWidth="1.3" />
            </>
          )}
        </g>
      )}

      {/* ================================================================= */}
      {/* 5. ACCENT LAYER (Tie + Sq, Scarf, Belt + Socks, Cap, Obi + Cord)  */}
      {/* ================================================================= */}
      <g {...interactiveProps('accent')}>
        <title>{getSlotDisplayLabel('accent', pieces)}: {outfit.accent.name}</title>

        {pieces.accent === 'tie' && (
          <>
            <path
              d="M174 87 C174 83, 186 83, 186 87 L184 101 C182 103, 178 103, 176 101 Z"
              fill={shown.accent}
              stroke={getSeamStroke(shown.accent)}
              strokeWidth="1"
            />
            <path
              d="M176 101 L184 101 C185 128, 187 154, 186 167 L180 179 L174 167 C173 154, 175 128, 176 101 Z"
              fill={shown.accent}
              stroke={getSeamStroke(shown.accent)}
              strokeWidth="1"
            />
            {showsChestPocketSquare && (
              <>
                <path
                  d="M197 132 C201 122, 206 121, 209 127 C212 121, 217 123, 219 132 Z"
                  fill={shown.accent}
                  stroke={getSeamStroke(shown.accent)}
                  strokeWidth="0.95"
                />
                <line x1="194" y1="133" x2="221" y2="133" stroke={getSeamStroke(shown.outerwear)} strokeWidth="1.4" />
              </>
            )}
          </>
        )}

        {pieces.accent === 'scarf' && (
          <>
            <path
              d="M156 75 C169 93, 191 93, 204 75 C210 82, 207 98, 180 106 C153 98, 150 82, 156 75 Z"
              fill={shown.accent}
              stroke={getSeamStroke(shown.accent)}
              strokeWidth="1.05"
            />
            <path
              d="M168 100 L183 101 C184 128, 183 154, 181 170 Q174 173 167 168 C167 148, 167 124, 168 100 Z"
              fill={shown.accent}
              stroke={getSeamStroke(shown.accent)}
              strokeWidth="1.05"
            />
          </>
        )}

        {pieces.accent === 'belt-socks' && (
          <>
            <rect
              x="133"
              y="224"
              width="94"
              height="9"
              rx="2.5"
              fill={shown.accent}
              stroke={getSeamStroke(shown.accent)}
              strokeWidth="0.95"
            />
            <rect
              x="174"
              y="223"
              width="12"
              height="11"
              rx="1.8"
              fill="none"
              stroke="#D4AF37"
              strokeWidth="1.8"
            />
            {/* Sleek Ribbed Athletic Crew Socks ONLY when pairing sneakers + shorts */}
            {showBareCalves && pieces.footwear === 'sneakers' && (
              <>
                <path d="M141 402 L164 402 L163 428 L143 428 Z" fill={shown.accent} stroke={getSeamStroke(shown.accent)} strokeWidth="0.85" />
                <path d="M196 402 L219 402 L217 428 L197 428 Z" fill={shown.accent} stroke={getSeamStroke(shown.accent)} strokeWidth="0.85" />
              </>
            )}
          </>
        )}

        {pieces.accent === 'cap-trim' && (
          <>
            <path
              d="M161 35 C161 18, 173 13, 180 13 C191 13, 199 20, 199 35 Q180 31, 161 35 Z"
              fill={shown.accent}
              stroke={getSeamStroke(shown.accent)}
              strokeWidth="1"
            />
            <path
              d="M159 34 Q180 40 205 33 Q189 28 159 34 Z"
              fill={shown.accent}
              stroke={getSeamStroke(shown.accent)}
              strokeWidth="0.95"
            />
            {pieces.footwear === 'sneakers' && (
              <>
                <path d="M127 443 Q145 436 164 439" fill="none" stroke={shown.accent} strokeWidth="2.4" />
                <path d="M196 439 Q215 436 233 443" fill="none" stroke={shown.accent} strokeWidth="2.4" />
              </>
            )}
          </>
        )}

        {pieces.accent === 'obi' && (
          <>
            <rect
              x="152"
              y="202"
              width="56"
              height="22"
              rx="2.5"
              fill={shown.accent}
              stroke={getSeamStroke(shown.accent)}
              strokeWidth="0.95"
            />
            <line x1="154" y1="213" x2="206" y2="213" stroke={getSeamStroke(shown.accent)} strokeWidth="0.9" />
            {pieces.outerwear === 'haori' && (
              <>
                <path
                  d="M164 146 Q180 156 196 146"
                  fill="none"
                  stroke={shown.accent}
                  strokeWidth="4"
                />
                <circle cx="180" cy="151" r="4" fill={shown.accent} stroke="rgba(0,0,0,0.28)" strokeWidth="0.85" />
              </>
            )}
          </>
        )}
      </g>
    </svg>
  );
};
