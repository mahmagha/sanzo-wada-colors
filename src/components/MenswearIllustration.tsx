import React from 'react';
import { ColorItem, CvdMode } from '../types/color';
import { getLuminance, hexToRgb, simulateColorVision } from '../utils/colorUtils';
import {
  GarmentSlotKey,
  GarmentStyle,
  GARMENT_STYLE_CONFIG,
} from '../utils/menswearUtils';

interface MenswearIllustrationProps {
  style: GarmentStyle;
  outfit: Record<GarmentSlotKey, ColorItem>;
  cvdMode?: CvdMode;
  activeSlot?: GarmentSlotKey | null;
  onSelectSlot?: (slot: GarmentSlotKey) => void;
}

function getSeamStroke(hex: string): string {
  const lum = getLuminance(...hexToRgb(hex));
  return lum < 0.08 ? 'rgba(255,255,255,0.34)' : 'rgba(24,20,18,0.28)';
}

export const MenswearIllustration: React.FC<MenswearIllustrationProps> = ({
  style,
  outfit,
  cvdMode = 'normal',
  activeSlot = null,
  onSelectSlot,
}) => {
  const meta = GARMENT_STYLE_CONFIG[style];

  const shownHex = {
    outerwear: simulateColorVision(outfit.outerwear.hex, cvdMode),
    top: simulateColorVision(outfit.top.hex, cvdMode),
    bottom: simulateColorVision(outfit.bottom.hex, cvdMode),
    accent: simulateColorVision(outfit.accent.hex, cvdMode),
    footwear: simulateColorVision(outfit.footwear.hex, cvdMode),
  };

  const interactiveProps = (slot: GarmentSlotKey) => {
    const label = `${meta.slots[slot].label}: #${outfit[slot].id} ${outfit[slot].name} (${outfit[slot].hex})`;
    if (!onSelectSlot) {
      return { 'aria-label': label };
    }
    return {
      role: 'button' as const,
      tabIndex: 0,
      'aria-label': `Edit ${label}`,
      'aria-pressed': activeSlot === slot,
      onClick: () => onSelectSlot(slot),
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelectSlot(slot);
        }
      },
      className: 'cursor-pointer focus:outline-none',
    };
  };

  const activeStroke = (slot: GarmentSlotKey) =>
    activeSlot === slot ? '#D97706' : undefined;
  const activeWidth = (slot: GarmentSlotKey) => (activeSlot === slot ? 2.6 : 1.15);

  return (
    <svg
      viewBox="0 0 320 430"
      className="w-full max-w-[310px] mx-auto select-none drop-shadow-sm"
      role="img"
      aria-label={`Menswear lookbook illustration (${meta.label})`}
    >
      {/* Editorial Figure Pedestal */}
      <ellipse cx="160" cy="412" rx="68" ry="8" fill="rgba(0,0,0,0.10)" />

      {/* Minimalist Architectural Dress-Form / Mannequin Neck & Head */}
      <circle cx="160" cy="40" r="19" fill="#E3CEBC" stroke="rgba(40,32,26,0.28)" strokeWidth="1" />
      <rect x="149" y="55" width="22" height="19" rx="6" fill="#D8BEA9" />
      {/* Subtle Hands */}
      <ellipse cx="64" cy="236" rx="8" ry="12" fill="#D8BEA9" stroke="rgba(40,32,26,0.22)" strokeWidth="0.9" />
      <ellipse cx="256" cy="236" rx="8" ry="12" fill="#D8BEA9" stroke="rgba(40,32,26,0.22)" strokeWidth="0.9" />

      {/* 1. FOOTWEAR / OXFORDS / ZORI + BELT */}
      <g {...interactiveProps('footwear')}>
        <title>{meta.slots.footwear.label}: {outfit.footwear.name}</title>
        {style === 'wafuku' ? (
          <>
            {/* Tabi socks + Zori sandals */}
            <path
              d="M114 378 L142 378 L144 398 L108 400 Q106 390 114 378 Z"
              fill={shownHex.footwear}
              stroke={activeStroke('footwear') || getSeamStroke(shownHex.footwear)}
              strokeWidth={activeWidth('footwear')}
            />
            <path
              d="M178 378 L206 378 Q214 390 212 400 L176 398 Z"
              fill={shownHex.footwear}
              stroke={activeStroke('footwear') || getSeamStroke(shownHex.footwear)}
              strokeWidth={activeWidth('footwear')}
            />
            {/* Zori thongs */}
            <path d="M107 401 L145 401 L145 407 L107 407 Z" fill="#C9A875" stroke="rgba(0,0,0,0.3)" strokeWidth="0.9" />
            <path d="M175 401 L213 401 L213 407 L175 407 Z" fill="#C9A875" stroke="rgba(0,0,0,0.3)" strokeWidth="0.9" />
          </>
        ) : (
          <>
            {/* Left & Right Oxford Shoes / Boots */}
            <path
              d="M113 375 L146 375 L148 398 L105 402 Q100 392 113 375 Z"
              fill={shownHex.footwear}
              stroke={activeStroke('footwear') || getSeamStroke(shownHex.footwear)}
              strokeWidth={activeWidth('footwear')}
            />
            <path
              d="M174 375 L207 375 Q220 392 215 402 L172 398 Z"
              fill={shownHex.footwear}
              stroke={activeStroke('footwear') || getSeamStroke(shownHex.footwear)}
              strokeWidth={activeWidth('footwear')}
            />
            {/* Leather Belt at waist */}
            <rect
              x="111"
              y="222"
              width="98"
              height="10"
              rx="2"
              fill={shownHex.footwear}
              stroke={activeStroke('footwear') || getSeamStroke(shownHex.footwear)}
              strokeWidth={activeWidth('footwear')}
            />
            <rect x="154" y="222" width="12" height="10" rx="1.5" fill="#D4AF37" stroke="rgba(0,0,0,0.35)" strokeWidth="0.8" />
          </>
        )}
      </g>

      {/* 2. TROUSERS / CHINOS / HAKAMA */}
      <g {...interactiveProps('bottom')}>
        <title>{meta.slots.bottom.label}: {outfit.bottom.name}</title>
        {style === 'wafuku' ? (
          <>
            {/* Wide pleated Hakama silhouette */}
            <path
              d="M110 222 L210 222 L226 382 L166 382 L160 280 L154 382 L94 382 Z"
              fill={shownHex.bottom}
              stroke={activeStroke('bottom') || getSeamStroke(shownHex.bottom)}
              strokeWidth={activeWidth('bottom')}
            />
            {/* Traditional Hakama Pleats */}
            <line x1="128" y1="226" x2="114" y2="380" stroke={getSeamStroke(shownHex.bottom)} strokeWidth="1" />
            <line x1="145" y1="226" x2="138" y2="380" stroke={getSeamStroke(shownHex.bottom)} strokeWidth="1" />
            <line x1="175" y1="226" x2="182" y2="380" stroke={getSeamStroke(shownHex.bottom)} strokeWidth="1" />
            <line x1="192" y1="226" x2="206" y2="380" stroke={getSeamStroke(shownHex.bottom)} strokeWidth="1" />
          </>
        ) : (
          <>
            {/* Tailored Trousers / Chinos */}
            <path
              d="M110 229 L210 229 L212 378 L171 378 L160 268 L149 378 L108 378 Z"
              fill={shownHex.bottom}
              stroke={activeStroke('bottom') || getSeamStroke(shownHex.bottom)}
              strokeWidth={activeWidth('bottom')}
            />
            {/* Crease Lines & Cuffs */}
            <line x1="129" y1="242" x2="128" y2="376" stroke={getSeamStroke(shownHex.bottom)} strokeWidth="0.85" strokeDasharray={style === 'casual' ? 'none' : '2 1'} />
            <line x1="191" y1="242" x2="192" y2="376" stroke={getSeamStroke(shownHex.bottom)} strokeWidth="0.85" strokeDasharray={style === 'casual' ? 'none' : '2 1'} />
            <line x1="108" y1="368" x2="149" y2="368" stroke={getSeamStroke(shownHex.bottom)} strokeWidth="1" />
            <line x1="171" y1="368" x2="212" y2="368" stroke={getSeamStroke(shownHex.bottom)} strokeWidth="1" />
          </>
        )}
      </g>

      {/* 3. SHIRT / KNIT / KIMONO INNER ROBE */}
      <g {...interactiveProps('top')}>
        <title>{meta.slots.top.label}: {outfit.top.name}</title>
        {style === 'suit' && (
          <>
            {/* Dress shirt V chest + collar */}
            <path
              d="M133 70 L187 70 L194 224 L126 224 Z"
              fill={shownHex.top}
              stroke={activeStroke('top') || getSeamStroke(shownHex.top)}
              strokeWidth={activeWidth('top')}
            />
            <polygon points="145,68 160,84 139,88" fill={shownHex.top} stroke={getSeamStroke(shownHex.top)} strokeWidth="1" />
            <polygon points="175,68 160,84 181,88" fill={shownHex.top} stroke={getSeamStroke(shownHex.top)} strokeWidth="1" />
            {/* Cuffs */}
            <path d="M62 224 L76 228 L73 236 L59 231 Z" fill={shownHex.top} stroke={getSeamStroke(shownHex.top)} strokeWidth="0.9" />
            <path d="M258 224 L244 228 L247 236 L261 231 Z" fill={shownHex.top} stroke={getSeamStroke(shownHex.top)} strokeWidth="0.9" />
          </>
        )}

        {style === 'casual' && (
          <>
            {/* Knit Sweater / Crewneck */}
            <path
              d="M132 70 Q160 88 188 70 L196 224 L124 224 Z"
              fill={shownHex.top}
              stroke={activeStroke('top') || getSeamStroke(shownHex.top)}
              strokeWidth={activeWidth('top')}
            />
            <path
              d="M135 73 Q160 92 185 73"
              fill="none"
              stroke={getSeamStroke(shownHex.top)}
              strokeWidth="2"
            />
          </>
        )}

        {style === 'wafuku' && (
          <>
            {/* Kimono Left-Over-Right Y-collar & torso */}
            <path
              d="M128 69 L192 69 L204 224 L116 224 Z"
              fill={shownHex.top}
              stroke={activeStroke('top') || getSeamStroke(shownHex.top)}
              strokeWidth={activeWidth('top')}
            />
            {/* Crossed Collar Lines (Hidari-mae: wearer's left over right) */}
            <line x1="138" y1="69" x2="173" y2="146" stroke={getSeamStroke(shownHex.top)} strokeWidth="2.2" />
            <line x1="182" y1="69" x2="156" y2="128" stroke={getSeamStroke(shownHex.top)} strokeWidth="2.2" />
            {/* White Han-eri Undercollar Accent */}
            <path d="M142 69 L160 112 L178 69" fill="none" stroke="#F6F3EB" strokeWidth="3.5" />
          </>
        )}
      </g>

      {/* 4. JACKET / BLAZER / CHORE COAT / HAORI MANTLE */}
      <g {...interactiveProps('outerwear')}>
        <title>{meta.slots.outerwear.label}: {outfit.outerwear.name}</title>
        {style === 'suit' && (
          <>
            {/* Left & Right Tailored Blazer Panels */}
            <path
              d="M138 69 L88 85 L58 225 L80 230 L103 130 L108 232 L159 232 L159 148 L138 69 Z"
              fill={shownHex.outerwear}
              stroke={activeStroke('outerwear') || getSeamStroke(shownHex.outerwear)}
              strokeWidth={activeWidth('outerwear')}
            />
            <path
              d="M182 69 L232 85 L262 225 L240 230 L217 130 L212 232 L161 232 L161 148 L182 69 Z"
              fill={shownHex.outerwear}
              stroke={activeStroke('outerwear') || getSeamStroke(shownHex.outerwear)}
              strokeWidth={activeWidth('outerwear')}
            />
            {/* Notch Lapels */}
            <polygon
              points="138,69 124,102 135,108 128,118 158,150 144,72"
              fill={shownHex.outerwear}
              stroke={getSeamStroke(shownHex.outerwear)}
              strokeWidth="1"
            />
            <polygon
              points="182,69 196,102 185,108 192,118 162,150 176,72"
              fill={shownHex.outerwear}
              stroke={getSeamStroke(shownHex.outerwear)}
              strokeWidth="1"
            />
            {/* Flap Pockets & Suit Buttons */}
            <line x1="115" y1="190" x2="142" y2="190" stroke={getSeamStroke(shownHex.outerwear)} strokeWidth="1.5" />
            <line x1="178" y1="190" x2="205" y2="190" stroke={getSeamStroke(shownHex.outerwear)} strokeWidth="1.5" />
            <circle cx="160" cy="166" r="2.8" fill={getSeamStroke(shownHex.outerwear)} />
            <circle cx="160" cy="192" r="2.8" fill={getSeamStroke(shownHex.outerwear)} />
          </>
        )}

        {style === 'casual' && (
          <>
            {/* Chore Coat / Overshirt with Straight Placket & Patch Pockets */}
            <path
              d="M132 70 L84 86 L58 222 L82 228 L103 132 L106 232 L144 232 L144 82 L132 70 Z"
              fill={shownHex.outerwear}
              stroke={activeStroke('outerwear') || getSeamStroke(shownHex.outerwear)}
              strokeWidth={activeWidth('outerwear')}
            />
            <path
              d="M188 70 L236 86 L262 222 L238 228 L217 132 L214 232 L176 232 L176 82 L188 70 Z"
              fill={shownHex.outerwear}
              stroke={activeStroke('outerwear') || getSeamStroke(shownHex.outerwear)}
              strokeWidth={activeWidth('outerwear')}
            />
            {/* Overshirt Collar */}
            <polygon points="132,70 116,92 142,96" fill={shownHex.outerwear} stroke={getSeamStroke(shownHex.outerwear)} strokeWidth="1" />
            <polygon points="188,70 204,92 178,96" fill={shownHex.outerwear} stroke={getSeamStroke(shownHex.outerwear)} strokeWidth="1" />
            {/* Patch Pockets */}
            <rect x="113" y="172" width="24" height="28" rx="3" fill="none" stroke={getSeamStroke(shownHex.outerwear)} strokeWidth="1.2" />
            <rect x="183" y="172" width="24" height="28" rx="3" fill="none" stroke={getSeamStroke(shownHex.outerwear)} strokeWidth="1.2" />
            <rect x="183" y="118" width="20" height="22" rx="2" fill="none" stroke={getSeamStroke(shownHex.outerwear)} strokeWidth="1.1" />
          </>
        )}

        {style === 'wafuku' && (
          <>
            {/* Traditional Haori Wide Sleeves & Open Front Panels */}
            <path
              d="M134 69 L56 84 L56 205 L102 205 L104 142 L106 250 L146 250 L146 82 L134 69 Z"
              fill={shownHex.outerwear}
              stroke={activeStroke('outerwear') || getSeamStroke(shownHex.outerwear)}
              strokeWidth={activeWidth('outerwear')}
            />
            <path
              d="M186 69 L264 84 L264 205 L218 205 L216 142 L214 250 L174 250 L174 82 L186 69 Z"
              fill={shownHex.outerwear}
              stroke={activeStroke('outerwear') || getSeamStroke(shownHex.outerwear)}
              strokeWidth={activeWidth('outerwear')}
            />
            {/* Vertical Haori Lapel Bands */}
            <line x1="138" y1="73" x2="138" y2="250" stroke={getSeamStroke(shownHex.outerwear)} strokeWidth="1.4" />
            <line x1="182" y1="73" x2="182" y2="250" stroke={getSeamStroke(shownHex.outerwear)} strokeWidth="1.4" />
          </>
        )}
      </g>

      {/* 5. ACCENT (NECKTIE + POCKET SQUARE / SCARF / OBI + HAORI-HIMO) */}
      <g {...interactiveProps('accent')}>
        <title>{meta.slots.accent.label}: {outfit.accent.name}</title>
        {style === 'suit' && (
          <>
            {/* Necktie */}
            <polygon
              points="154,82 166,82 164,94 156,94"
              fill={shownHex.accent}
              stroke={activeStroke('accent') || 'rgba(0,0,0,0.32)'}
              strokeWidth={activeWidth('accent')}
            />
            <polygon
              points="156,94 164,94 167,156 160,166 153,156"
              fill={shownHex.accent}
              stroke={activeStroke('accent') || 'rgba(0,0,0,0.32)'}
              strokeWidth={activeWidth('accent')}
            />
            {/* Breast Pocket Square */}
            <polygon
              points="182,126 196,116 204,126"
              fill={shownHex.accent}
              stroke={activeStroke('accent') || 'rgba(0,0,0,0.3)'}
              strokeWidth="1"
            />
            <line x1="178" y1="126" x2="205" y2="126" stroke={getSeamStroke(shownHex.outerwear)} strokeWidth="1.5" />
          </>
        )}

        {style === 'casual' && (
          <>
            {/* Ribbed Neck Scarf */}
            <path
              d="M137 68 Q160 92 183 68 Q186 84 160 98 Q134 84 137 68 Z"
              fill={shownHex.accent}
              stroke={activeStroke('accent') || 'rgba(0,0,0,0.3)'}
              strokeWidth={activeWidth('accent')}
            />
            <path
              d="M148 92 L162 92 L160 156 L146 148 Z"
              fill={shownHex.accent}
              stroke={activeStroke('accent') || 'rgba(0,0,0,0.3)'}
              strokeWidth={activeWidth('accent')}
            />
          </>
        )}

        {style === 'wafuku' && (
          <>
            {/* Kaku-obi sash waist band + Haori-himo braided chest cord */}
            <rect
              x="146"
              y="196"
              width="28"
              height="24"
              rx="2"
              fill={shownHex.accent}
              stroke={activeStroke('accent') || 'rgba(0,0,0,0.32)'}
              strokeWidth={activeWidth('accent')}
            />
            {/* Haori-himo chest tie cord & tassel */}
            <path
              d="M144 138 Q160 144 176 138"
              fill="none"
              stroke={shownHex.accent}
              strokeWidth="4.2"
              strokeLinecap="round"
            />
            <circle cx="160" cy="143" r="4" fill={shownHex.accent} stroke="rgba(0,0,0,0.3)" strokeWidth="0.9" />
          </>
        )}
      </g>
    </svg>
  );
};
