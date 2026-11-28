import React, { useId } from 'react';
import { ColorItem, CvdMode } from '../types/color';
import { getLuminance, hexToRgb, simulateColorVision } from '../utils/colorUtils';
import {
  DEFAULT_GARMENT_PATTERNS,
  FabricMaterial,
  FabricPattern,
  GARMENT_SLOT_ORDER,
  GarmentMaterials,
  GarmentPatterns,
  GarmentPieces,
  GarmentSlotKey,
  GarmentStyle,
  getDefaultMaterialsForPieces,
  getSlotDisplayLabel,
  LIGHTING_PRESET_META,
  LightingPreset,
  SKIN_TONE_PRESETS,
  SkinToneId,
  STYLE_PRESET_PIECES,
} from '../utils/menswearUtils';

interface MenswearIllustrationProps {
  style: GarmentStyle;
  pieces?: GarmentPieces;
  materials?: GarmentMaterials;
  patterns?: GarmentPatterns;
  patternColors?: Partial<Record<GarmentSlotKey, ColorItem>>;
  skinTone?: SkinToneId;
  lighting?: LightingPreset;
  svgRef?: React.Ref<SVGSVGElement>;
  outfit: Record<GarmentSlotKey, ColorItem>;
  cvdMode?: CvdMode;
  activeSlot?: GarmentSlotKey | null;
  onSelectSlot?: (slot: GarmentSlotKey) => void;
}

function getSeamStroke(hex: string): string {
  const lum = getLuminance(...hexToRgb(hex));
  return lum < 0.08 ? 'rgba(255,255,255,0.34)' : 'rgba(26,22,19,0.25)';
}

function getSoftShade(hex: string): string {
  const lum = getLuminance(...hexToRgb(hex));
  return lum < 0.06 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
}

function getSoftHighlight(hex: string): string {
  const lum = getLuminance(...hexToRgb(hex));
  return lum < 0.08 ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.16)';
}

export function renderTexturePattern(
  id: string,
  material: FabricMaterial,
  hex: string
): React.ReactNode {
  const lum = getLuminance(...hexToRgb(hex));
  const isDark = lum < 0.13;
  const lineInk = isDark ? 'rgba(255,255,255,0.19)' : 'rgba(22,17,14,0.16)';
  const subtleInk = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(22,17,14,0.09)';
  const highlightInk = isDark ? 'rgba(255,255,255,0.13)' : 'rgba(255,255,255,0.32)';
  const strongInk = isDark ? 'rgba(255,255,255,0.28)' : 'rgba(22,17,14,0.24)';

  switch (material) {
    case 'worsted-wool':
      return (
        <pattern id={id} width="7" height="7" patternUnits="userSpaceOnUse">
          <path d="M0 7 L7 0 M-2 2 L2 -2 M5 9 L9 5" stroke={subtleInk} strokeWidth="0.7" />
          <line x1="3.5" y1="0" x2="3.5" y2="7" stroke={highlightInk} strokeWidth="0.45" />
          <circle cx="1.5" cy="2.5" r="0.45" fill={lineInk} />
          <circle cx="5.2" cy="5.8" r="0.4" fill={subtleInk} />
        </pattern>
      );

    case 'tweed-herringbone':
      return (
        <pattern id={id} width="12" height="10" patternUnits="userSpaceOnUse">
          {/* Classic Chevron Herringbone Twill */}
          <path
            d="M0 5 L6 0 L12 5 M0 10 L6 5 L12 10"
            fill="none"
            stroke={lineInk}
            strokeWidth="0.95"
          />
          <path d="M0 7.5 L6 2.5 L12 7.5" fill="none" stroke={highlightInk} strokeWidth="0.55" />
          <circle cx="2.5" cy="4" r="0.55" fill={strongInk} />
          <circle cx="9.2" cy="7.5" r="0.5" fill={subtleInk} />
        </pattern>
      );

    case 'corduroy':
      return (
        <pattern id={id} width="6" height="10" patternUnits="userSpaceOnUse">
          {/* Tactile Vertical Corduroy Wales + Nap */}
          <line x1="1.2" y1="0" x2="1.2" y2="10" stroke={strongInk} strokeWidth="1.25" />
          <line x1="3.2" y1="0" x2="3.2" y2="10" stroke={highlightInk} strokeWidth="1.15" />
          <line x1="4.8" y1="0" x2="4.8" y2="10" stroke={subtleInk} strokeWidth="0.7" />
          <circle cx="3" cy="2.5" r="0.4" fill={subtleInk} />
          <circle cx="3" cy="7.5" r="0.4" fill={subtleInk} />
        </pattern>
      );

    case 'cotton-oxford':
      return (
        <pattern id={id} width="5" height="5" patternUnits="userSpaceOnUse">
          <line x1="0" y1="1.5" x2="5" y2="1.5" stroke={subtleInk} strokeWidth="0.65" />
          <line x1="1.5" y1="0" x2="1.5" y2="5" stroke={subtleInk} strokeWidth="0.65" />
          <rect x="2.6" y="2.6" width="1.2" height="1.2" fill={highlightInk} />
        </pattern>
      );

    case 'heavy-twill':
      return (
        <pattern id={id} width="7" height="7" patternUnits="userSpaceOnUse">
          <path d="M0 7 L7 0 M-3.5 3.5 L3.5 -3.5 M3.5 10.5 L10.5 3.5" stroke={lineInk} strokeWidth="0.9" />
          <path d="M1.5 7 L7 1.5 M0 1.5 L1.5 0" stroke={highlightInk} strokeWidth="0.45" />
        </pattern>
      );

    case 'selvedge-denim':
      return (
        <pattern id={id} width="8" height="8" patternUnits="userSpaceOnUse">
          {/* 3x1 Right-Hand Denim Twill + White-Slub Weft Yarn */}
          <path d="M0 8 L8 0 M-4 4 L4 -4 M4 12 L12 4" stroke={strongInk} strokeWidth="0.95" />
          <line x1="0" y1="2.2" x2="8" y2="2.2" stroke={highlightInk} strokeWidth="0.6" strokeDasharray="3 1" />
          <line x1="0" y1="6.2" x2="8" y2="6.2" stroke={highlightInk} strokeWidth="0.55" strokeDasharray="2 2" />
          <circle cx="5.5" cy="4" r="0.45" fill={lineInk} />
        </pattern>
      );

    case 'rib-knit':
      return (
        <pattern id={id} width="7" height="8" patternUnits="userSpaceOnUse">
          {/* Knitted Chevron Rib Wales */}
          <line x1="0.8" y1="0" x2="0.8" y2="8" stroke={subtleInk} strokeWidth="0.8" />
          <path d="M1.5 1.5 L3.5 4.2 L5.5 1.5 M1.5 5.5 L3.5 8.2 L5.5 5.5" fill="none" stroke={lineInk} strokeWidth="0.85" />
          <line x1="6.2" y1="0" x2="6.2" y2="8" stroke={highlightInk} strokeWidth="0.55" />
        </pattern>
      );

    case 'fleece-jersey':
      return (
        <pattern id={id} width="10" height="10" patternUnits="userSpaceOnUse">
          {/* Soft Marled Cotton Fleece Grain */}
          <circle cx="1.8" cy="2.1" r="0.65" fill={lineInk} />
          <circle cx="6.4" cy="1.5" r="0.5" fill={highlightInk} />
          <circle cx="4.2" cy="5.6" r="0.7" fill={subtleInk} />
          <circle cx="8.5" cy="6.2" r="0.55" fill={lineInk} />
          <circle cx="2.3" cy="8.4" r="0.45" fill={highlightInk} />
          <circle cx="7.1" cy="8.8" r="0.6" fill={subtleInk} />
        </pattern>
      );

    case 'slub-linen':
      return (
        <pattern id={id} width="16" height="14" patternUnits="userSpaceOnUse">
          {/* Organic Uneven Flax / Linen Slub Threads */}
          <line x1="1" y1="3" x2="10" y2="3" stroke={lineInk} strokeWidth="0.8" />
          <line x1="6" y1="8" x2="15" y2="8" stroke={subtleInk} strokeWidth="0.65" />
          <line x1="0" y1="12" x2="7" y2="12" stroke={highlightInk} strokeWidth="0.75" />
          <line x1="4" y1="1" x2="4" y2="9" stroke={subtleInk} strokeWidth="0.65" />
          <line x1="12" y1="5" x2="12" y2="13" stroke={lineInk} strokeWidth="0.75" />
        </pattern>
      );

    case 'nylon-satin':
      return (
        <pattern id={id} width="8" height="8" patternUnits="userSpaceOnUse">
          <line x1="0" y1="1" x2="8" y2="1" stroke={highlightInk} strokeWidth="0.5" />
          <line x1="0" y1="5" x2="8" y2="5" stroke={subtleInk} strokeWidth="0.4" />
        </pattern>
      );

    case 'silk-crepe':
      return (
        <pattern id={id} width="14" height="10" patternUnits="userSpaceOnUse">
          {/* Delicate Undulating Tsumugi / Chirimen Silk Micro-Slub */}
          <path d="M0 3 Q3.5 1.8 7 3 T14 3" fill="none" stroke={subtleInk} strokeWidth="0.6" />
          <path d="M0 7.5 Q3.5 8.6 7 7.5 T14 7.5" fill="none" stroke={highlightInk} strokeWidth="0.55" />
        </pattern>
      );

    case 'full-grain-leather':
      return (
        <pattern id={id} width="9" height="9" patternUnits="userSpaceOnUse">
          <path d="M1 3 Q3 1 5 3 Q3 5 1 3 Z" fill="none" stroke={subtleInk} strokeWidth="0.65" />
          <path d="M5 7 Q7 5 8.5 7" fill="none" stroke={highlightInk} strokeWidth="0.55" />
          <circle cx="7" cy="2" r="0.45" fill={lineInk} />
          <circle cx="2.5" cy="7.2" r="0.4" fill={subtleInk} />
        </pattern>
      );

    case 'brushed-suede':
      return (
        <pattern id={id} width="8" height="8" patternUnits="userSpaceOnUse">
          {/* Dense Matte Velvety Suede Nap Stippling */}
          <circle cx="1.5" cy="1.5" r="0.7" fill={lineInk} />
          <circle cx="5.5" cy="2" r="0.6" fill={subtleInk} />
          <circle cx="3.2" cy="4.5" r="0.75" fill={strongInk} opacity="0.55" />
          <circle cx="6.8" cy="5.5" r="0.65" fill={lineInk} />
          <circle cx="1.8" cy="7" r="0.55" fill={subtleInk} />
        </pattern>
      );

    case 'canvas-rubber':
    default:
      return (
        <pattern id={id} width="6" height="6" patternUnits="userSpaceOnUse">
          <line x1="0" y1="2" x2="6" y2="2" stroke={lineInk} strokeWidth="0.85" />
          <line x1="2" y1="0" x2="2" y2="6" stroke={lineInk} strokeWidth="0.85" />
          <line x1="0" y1="5" x2="6" y2="5" stroke={highlightInk} strokeWidth="0.6" />
          <line x1="5" y1="0" x2="5" y2="6" stroke={highlightInk} strokeWidth="0.6" />
        </pattern>
      );
  }
}

export function renderThreadPattern(
  id: string,
  pattern: FabricPattern,
  threadHex: string
): React.ReactNode {
  switch (pattern) {
    case 'pinstripe':
      return (
        <pattern id={id} width="9" height="9" patternUnits="userSpaceOnUse">
          <line
            x1="4.5"
            y1="0"
            x2="4.5"
            y2="9"
            stroke={threadHex}
            strokeOpacity="0.62"
            strokeWidth="0.95"
            strokeDasharray="1.8 1.1"
          />
        </pattern>
      );

    case 'windowpane':
      return (
        <pattern id={id} width="18" height="18" patternUnits="userSpaceOnUse">
          <line x1="9" y1="0" x2="9" y2="18" stroke={threadHex} strokeOpacity="0.52" strokeWidth="0.85" />
          <line x1="0" y1="9" x2="18" y2="9" stroke={threadHex} strokeOpacity="0.52" strokeWidth="0.85" />
        </pattern>
      );

    case 'breton':
      return (
        <pattern id={id} width="12" height="10" patternUnits="userSpaceOnUse">
          <rect x="0" y="0" width="12" height="3.1" fill={threadHex} fillOpacity="0.72" />
        </pattern>
      );

    case 'gingham':
      return (
        <pattern id={id} width="12" height="12" patternUnits="userSpaceOnUse">
          <rect x="0" y="0" width="6" height="12" fill={threadHex} fillOpacity="0.28" />
          <rect x="0" y="0" width="12" height="6" fill={threadHex} fillOpacity="0.28" />
        </pattern>
      );

    case 'solid':
    default:
      return null;
  }
}

interface TexturedPathProps {
  d: string;
  fill: string;
  patFill?: string;
  texFill: string;
  shadeFill?: string;
  stroke: string;
  strokeWidth?: number;
}

const TexturedPath: React.FC<TexturedPathProps> = ({
  d,
  fill,
  patFill,
  texFill,
  shadeFill,
  stroke,
  strokeWidth = 1.05,
}) => (
  <>
    <path d={d} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    {patFill && <path d={d} fill={patFill} stroke="none" pointerEvents="none" />}
    <path d={d} fill={texFill} stroke="none" pointerEvents="none" />
    {shadeFill && <path d={d} fill={shadeFill} stroke="none" pointerEvents="none" />}
  </>
);

export const MenswearIllustration: React.FC<MenswearIllustrationProps> = ({
  style,
  pieces = STYLE_PRESET_PIECES[style],
  materials,
  patterns = DEFAULT_GARMENT_PATTERNS,
  patternColors,
  skinTone = 'warm-ivory',
  lighting = 'daylight',
  svgRef,
  outfit,
  cvdMode = 'normal',
  activeSlot = null,
  onSelectSlot,
}) => {
  const uid = useId().replace(/:/g, '');
  const resolvedMaterials = materials ?? getDefaultMaterialsForPieces(pieces);
  const skin = SKIN_TONE_PRESETS[skinTone];
  const lightingMeta = LIGHTING_PRESET_META[lighting];

  const shown = {
    outerwear: simulateColorVision(outfit.outerwear.hex, cvdMode),
    top: simulateColorVision(outfit.top.hex, cvdMode),
    bottom: simulateColorVision(outfit.bottom.hex, cvdMode),
    accent: simulateColorVision(outfit.accent.hex, cvdMode),
    footwear: simulateColorVision(outfit.footwear.hex, cvdMode),
  };

  const getThreadHex = (slot: GarmentSlotKey): string => {
    const custom = patternColors?.[slot];
    if (custom) return simulateColorVision(custom.hex, cvdMode);
    const lum = getLuminance(...hexToRgb(shown[slot]));
    return lum < 0.25 ? '#F5F2EA' : '#262932';
  };

  const texUrl = (slot: GarmentSlotKey) => `url(#${uid}-tex-${slot})`;
  const patUrl = (slot: GarmentSlotKey) =>
    patterns[slot] !== 'solid' ? `url(#${uid}-pat-${slot})` : undefined;
  const bodyShadeUrl = `url(#${uid}-body-shade)`;
  const satinShadeUrl = `url(#${uid}-satin-shade)`;
  const leatherShadeUrl = `url(#${uid}-leather-shade)`;

  const getSlotShade = (slot: GarmentSlotKey): string => {
    const mat = resolvedMaterials[slot];
    if (mat === 'nylon-satin' || mat === 'silk-crepe') return satinShadeUrl;
    if (mat === 'full-grain-leather') return leatherShadeUrl;
    return bodyShadeUrl;
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

  const isDenim = resolvedMaterials.bottom === 'selvedge-denim';
  const denimStitchColor = isDenim ? 'rgba(210,148,86,0.65)' : getSeamStroke(shown.bottom);

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 360 490"
      shapeRendering="geometricPrecision"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-full max-w-[320px] mx-auto select-none drop-shadow-sm"
      role="img"
      aria-label={`Menswear lookbook illustration (${style})`}
    >
      <defs>
        {GARMENT_SLOT_ORDER.map((slot) => (
          <React.Fragment key={slot}>
            {renderTexturePattern(
              `${uid}-tex-${slot}`,
              resolvedMaterials[slot],
              shown[slot]
            )}
            {renderThreadPattern(
              `${uid}-pat-${slot}`,
              patterns[slot],
              getThreadHex(slot)
            )}
          </React.Fragment>
        ))}

        {/* Soft Cylindrical Cloth Shading Gradient (3D torso/sleeve/leg contour) */}
        <linearGradient id={`${uid}-body-shade`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.11" />
          <stop offset="28%" stopColor="#ffffff" stopOpacity="0.06" />
          <stop offset="56%" stopColor="#ffffff" stopOpacity="0.02" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.13" />
        </linearGradient>

        {/* Directional Technical Satin / Silk Luster Sheen */}
        <linearGradient id={`${uid}-satin-shade`} x1="15%" y1="0%" x2="85%" y2="95%">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.09" />
          <stop offset="35%" stopColor="#ffffff" stopOpacity="0.16" />
          <stop offset="68%" stopColor="#000000" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.14" />
        </linearGradient>

        {/* Burnished Toe & Leather Reflection Gradient */}
        <linearGradient id={`${uid}-leather-shade`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.18" />
          <stop offset="45%" stopColor="#ffffff" stopOpacity="0.03" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.18" />
        </linearGradient>
      </defs>

      <g style={lightingMeta.ambientFilter ? { filter: lightingMeta.ambientFilter } : undefined}>
      {/* Layered Ground & Foot Contact Shadows */}
      <ellipse cx="180" cy="466" rx="70" ry="8.5" fill="rgba(0,0,0,0.085)" />
      <ellipse cx="145" cy="456" rx="23" ry="4" fill="rgba(0,0,0,0.10)" />
      <ellipse cx="215" cy="456" rx="23" ry="4" fill="rgba(0,0,0,0.10)" />

      {/* Sculpted Editorial Croquis Head, Hair, Neck, Arms & Legs */}
      <g aria-hidden="true">
        <path d="M168.5 57 L191.5 57 L195 83 Q180 91 165 83 Z" fill={skin.shade} />
        <path d="M150 79 Q180 94 210 79 L213 91 Q180 103 147 91 Z" fill={skin.base} />
        {/* Subtle Collarbone & Under-Chin Contour */}
        <path d="M168 59 Q180 65 192 59" fill="none" stroke="rgba(26,20,16,0.22)" strokeWidth="1.4" />
        <path d="M167 84 Q174 87 178 86 M193 84 Q186 87 182 86" fill="none" stroke={skin.shade} strokeWidth="0.95" opacity="0.8" />
        <ellipse cx="161" cy="43" rx="2.9" ry="5.6" fill={skin.shade} stroke="rgba(42,32,26,0.15)" strokeWidth="0.6" />
        <ellipse cx="199" cy="43" rx="2.9" ry="5.6" fill={skin.shade} stroke="rgba(42,32,26,0.15)" strokeWidth="0.6" />
        {/* Sculpted Cheek & Jawline */}
        <path
          d="M162 38 C162 24, 170 18.5, 180 18.5 C190 18.5, 198 24, 198 38 C198 48, 194 56, 188 60.5 Q180 64.5 172 60.5 C166 56, 162 48, 162 38 Z"
          fill={skin.base}
          stroke="rgba(42,32,26,0.19)"
          strokeWidth="0.9"
        />
        {/* Crisp Architectural Crown & Side-Temple Hair */}
        <path
          d="M161.2 40 C159.5 22, 170 15.2, 180 15.2 C191.5 15.2, 200.5 22.5, 198.8 40 C197.4 33, 195.8 30, 193.5 28.5 C189 24.5, 173 24.5, 166.5 28.5 C164.2 30, 162.6 33, 161.2 40 Z"
          fill={skin.hair}
          opacity="0.88"
        />
        <path d="M168 23.5 Q180 20 192 23.5" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" />

        {showBareForearms && (
          <>
            <path
              d="M111 148 C105 182, 99 216, 95 244 L105 244 C110 216, 118 184, 124 150 Z"
              fill={skin.base}
              stroke="rgba(42,32,26,0.14)"
              strokeWidth="0.8"
            />
            <path
              d="M249 148 C255 182, 261 216, 265 244 L255 244 C250 216, 242 184, 236 150 Z"
              fill={skin.base}
              stroke="rgba(42,32,26,0.14)"
              strokeWidth="0.8"
            />
          </>
        )}

        {pieces.outerwear === 'haori' && (
          <>
            <TexturedPath
              d="M99 215 L117 215 L110 245 L94 245 Z"
              fill={shown.top}
              patFill={patUrl('top')}
              texFill={texUrl('top')}
              shadeFill={getSlotShade('top')}
              stroke={getSeamStroke(shown.top)}
              strokeWidth={0.9}
            />
            <TexturedPath
              d="M243 215 L261 215 L266 245 L250 245 Z"
              fill={shown.top}
              patFill={patUrl('top')}
              texFill={texUrl('top')}
              shadeFill={getSlotShade('top')}
              stroke={getSeamStroke(shown.top)}
              strokeWidth={0.9}
            />
          </>
        )}

        <path
          d="M94 242 C90 255, 92 267, 100 268 C106 268, 109 258, 106 242"
          fill={skin.base}
          stroke="rgba(42,32,26,0.16)"
          strokeWidth="0.8"
        />
        <path
          d="M266 242 C270 255, 268 267, 260 268 C254 268, 251 258, 254 242"
          fill={skin.base}
          stroke="rgba(42,32,26,0.16)"
          strokeWidth="0.8"
        />

        {showBareCalves && (
          <>
            <path
              d="M134 322 C134 358, 139 398, 143 442 L163 442 C166 398, 169 358, 170 322 Z"
              fill={skin.base}
              stroke="rgba(42,32,26,0.16)"
              strokeWidth="0.85"
            />
            <path
              d="M226 322 C226 358, 221 398, 217 442 L197 442 C194 398, 191 358, 190 322 Z"
              fill={skin.base}
              stroke="rgba(42,32,26,0.16)"
              strokeWidth="0.85"
            />
          </>
        )}
      </g>

      {/* ================================================================= */}
      {/* 1. FOOTWEAR LAYER (Textured Leather, Suede, Canvas, Woven Tabi)   */}
      {/* ================================================================= */}
      <g {...interactiveProps('footwear')}>
        <title>{getSlotDisplayLabel('footwear', pieces)}: {outfit.footwear.name}</title>

        {pieces.footwear === 'oxfords' && (
          <>
            <TexturedPath
              d="M141 428 L166 428 C168 439, 169 448, 165 454 C150 457, 130 456, 122 450 C119 444, 129 434, 141 428 Z"
              fill={shown.footwear}
              texFill={texUrl('footwear')}
              shadeFill={getSlotShade('footwear')}
              stroke={getSeamStroke(shown.footwear)}
            />
            <TexturedPath
              d="M219 428 L194 428 C192 439, 191 448, 195 454 C210 457, 230 456, 238 450 C241 444, 231 434, 219 428 Z"
              fill={shown.footwear}
              texFill={texUrl('footwear')}
              shadeFill={getSlotShade('footwear')}
              stroke={getSeamStroke(shown.footwear)}
            />
            <path d="M124 452 Q145 456 165 453" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="1.2" />
            <path d="M195 453 Q215 456 236 452" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="1.2" />
            {/* Oxford Cap-Toe Seam & Quarters */}
            <path d="M125 446 Q133 441 139 449" fill="none" stroke={getSeamStroke(shown.footwear)} strokeWidth="0.75" strokeOpacity="0.65" />
            <path d="M235 446 Q227 441 221 449" fill="none" stroke={getSeamStroke(shown.footwear)} strokeWidth="0.75" strokeOpacity="0.65" />
            <path d="M140 434 Q148 439 158 434" fill="none" stroke={getSeamStroke(shown.footwear)} strokeWidth="0.95" />
            <path d="M202 434 Q212 439 220 434" fill="none" stroke={getSeamStroke(shown.footwear)} strokeWidth="0.95" />
          </>
        )}

        {pieces.footwear === 'boots' && (
          <>
            <TexturedPath
              d="M139 406 L166 406 L168 452 C152 456, 131 455, 123 449 C121 442, 131 429, 139 406 Z"
              fill={shown.footwear}
              texFill={texUrl('footwear')}
              shadeFill={getSlotShade('footwear')}
              stroke={getSeamStroke(shown.footwear)}
            />
            <TexturedPath
              d="M221 406 L194 406 L192 452 C208 456, 229 455, 237 449 C239 442, 229 429, 221 406 Z"
              fill={shown.footwear}
              texFill={texUrl('footwear')}
              shadeFill={getSlotShade('footwear')}
              stroke={getSeamStroke(shown.footwear)}
            />
            <path d="M146 411 C143 420, 143 428, 149 431 C154 428, 155 420, 152 411 Z" fill={getSoftShade(shown.footwear)} />
            <path d="M214 411 C217 420, 217 428, 211 431 C206 428, 205 420, 208 411 Z" fill={getSoftShade(shown.footwear)} />
            <path d="M123 450 Q145 456 168 453 L167 458 Q144 460 123 454 Z" fill="rgba(22,19,17,0.72)" />
            <path d="M192 453 Q215 456 237 450 L237 454 Q216 460 193 458 Z" fill="rgba(22,19,17,0.72)" />
          </>
        )}

        {pieces.footwear === 'sneakers' && (
          <>
            <TexturedPath
              d="M139 426 L166 426 C168 436, 168 443, 166 448 L123 448 C120 441, 128 433, 139 426 Z"
              fill={shown.footwear}
              texFill={texUrl('footwear')}
              shadeFill={getSlotShade('footwear')}
              stroke={getSeamStroke(shown.footwear)}
            />
            <TexturedPath
              d="M221 426 L194 426 C192 436, 192 443, 194 448 L237 448 C240 441, 232 433, 221 426 Z"
              fill={shown.footwear}
              texFill={texUrl('footwear')}
              shadeFill={getSlotShade('footwear')}
              stroke={getSeamStroke(shown.footwear)}
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
                <rect x="142" y="424" width="22" height="9" rx="2" fill={skin.shade} />
                <rect x="196" y="424" width="22" height="9" rx="2" fill={skin.shade} />
              </>
            )}
            <TexturedPath
              d="M141 431 Q153 442 165 431 L166 452 C151 456, 130 455, 122 449 C120 443, 130 436, 141 431 Z"
              fill={shown.footwear}
              texFill={texUrl('footwear')}
              shadeFill={getSlotShade('footwear')}
              stroke={getSeamStroke(shown.footwear)}
            />
            <TexturedPath
              d="M195 431 Q207 442 219 431 C230 436, 240 443, 238 449 C230 455, 209 456, 194 452 Z"
              fill={shown.footwear}
              texFill={texUrl('footwear')}
              shadeFill={getSlotShade('footwear')}
              stroke={getSeamStroke(shown.footwear)}
            />
            <path d="M135 441 Q147 437 157 441" fill="none" stroke={getSeamStroke(shown.footwear)} strokeWidth="1.2" />
            <path d="M203 441 Q213 437 225 441" fill="none" stroke={getSeamStroke(shown.footwear)} strokeWidth="1.2" />
          </>
        )}

        {pieces.footwear === 'zori' && (
          <>
            <TexturedPath
              d="M138 426 L165 426 L166 448 C151 451, 134 450, 126 446 C124 440, 131 432, 138 426 Z"
              fill={shown.footwear}
              texFill={texUrl('footwear')}
              shadeFill={getSlotShade('footwear')}
              stroke={getSeamStroke(shown.footwear)}
            />
            <TexturedPath
              d="M222 426 L195 426 L194 448 C209 451, 226 450, 234 446 C236 440, 229 432, 222 426 Z"
              fill={shown.footwear}
              texFill={texUrl('footwear')}
              shadeFill={getSlotShade('footwear')}
              stroke={getSeamStroke(shown.footwear)}
            />
            <rect x="122" y="448" width="46" height="7" rx="3" fill="#D5BC93" stroke="rgba(0,0,0,0.26)" strokeWidth="0.9" />
            <rect x="192" y="448" width="46" height="7" rx="3" fill="#D5BC93" stroke="rgba(0,0,0,0.26)" strokeWidth="0.9" />
            <path d="M135 448 L146 437 L157 448" fill="none" stroke={shown.accent} strokeWidth="2.3" />
            <path d="M203 448 L214 437 L225 448" fill="none" stroke={shown.accent} strokeWidth="2.3" />
          </>
        )}
      </g>

      {/* ================================================================= */}
      {/* 2. BOTTOM LAYER (Textured Cloth Grain + Natural Knee/Hip Folds)   */}
      {/* ================================================================= */}
      <g {...interactiveProps('bottom')}>
        <title>{getSlotDisplayLabel('bottom', pieces)}: {outfit.bottom.name}</title>

        {(pieces.bottom === 'trousers' || pieces.bottom === 'chinos') && (
          <>
            <TexturedPath
              d={
                pieces.bottom === 'chinos'
                  ? 'M134 228 L226 228 C231 268, 229 344, 221 430 L195 430 C191 364, 187 308, 180 282 C173 308, 169 364, 165 430 L139 430 C131 344, 129 268, 134 228 Z'
                  : 'M133 228 L227 228 C232 272, 230 350, 223 434 L194 434 C191 368, 187 310, 180 282 C173 310, 169 368, 166 434 L137 434 C130 350, 128 272, 133 228 Z'
              }
              fill={shown.bottom}
              patFill={patUrl('bottom')}
              texFill={texUrl('bottom')}
              shadeFill={getSlotShade('bottom')}
              stroke={denimStitchColor}
            />
            {pieces.bottom === 'trousers' ? (
              <>
                <line x1="152" y1="250" x2="152" y2="431" stroke={getSeamStroke(shown.bottom)} strokeWidth="0.9" strokeOpacity="0.6" />
                <line x1="208" y1="250" x2="208" y2="431" stroke={getSeamStroke(shown.bottom)} strokeWidth="0.9" strokeOpacity="0.6" />
              </>
            ) : (
              <>
                <path d="M136 240 Q145 256 142 274" fill="none" stroke={denimStitchColor} strokeWidth="1" />
                <path d="M224 240 Q215 256 218 274" fill="none" stroke={denimStitchColor} strokeWidth="1" />
                <line x1="139" y1="423" x2="165" y2="423" stroke={denimStitchColor} strokeWidth="1" />
                <line x1="195" y1="423" x2="221" y2="423" stroke={denimStitchColor} strokeWidth="1" />
              </>
            )}
            {/* Subtle Natural Knee & Thigh Folds */}
            <path d="M168 278 Q175 286 180 282 M192 278 Q185 286 180 282" fill="none" stroke={getSeamStroke(shown.bottom)} strokeWidth="0.7" strokeOpacity="0.45" />
            <path d="M141 344 Q151 348 160 344 M200 344 Q209 348 219 344" fill="none" stroke={getSeamStroke(shown.bottom)} strokeWidth="0.65" strokeOpacity="0.38" />
          </>
        )}

        {pieces.bottom === 'denim' && (
          <>
            <TexturedPath
              d="M133 228 L227 228 C232 278, 229 354, 222 434 L194 434 C190 368, 186 310, 180 284 C174 310, 170 368, 166 434 L138 434 C131 354, 128 278, 133 228 Z"
              fill={shown.bottom}
              patFill={patUrl('bottom')}
              texFill={texUrl('bottom')}
              shadeFill={getSlotShade('bottom')}
              stroke={getSeamStroke(shown.bottom)}
            />
            <path d="M135 244 Q148 258 156 242" fill="none" stroke={denimStitchColor} strokeWidth="1.1" />
            <path d="M225 244 Q212 258 204 242" fill="none" stroke={denimStitchColor} strokeWidth="1.1" />
            <path d="M180 232 L180 270 Q176 276 172 278" fill="none" stroke={denimStitchColor} strokeWidth="1.1" />
            <path d="M141 342 Q151 347 162 342 M198 342 Q209 347 219 342" fill="none" stroke={getSeamStroke(shown.bottom)} strokeWidth="0.75" strokeOpacity="0.45" />
            <rect x="137" y="423" width="30" height="10" rx="2" fill={getSoftShade(shown.bottom)} stroke={denimStitchColor} strokeWidth="1" />
            <rect x="193" y="423" width="30" height="10" rx="2" fill={getSoftShade(shown.bottom)} stroke={denimStitchColor} strokeWidth="1" />
          </>
        )}

        {pieces.bottom === 'shorts' && (
          <>
            <TexturedPath
              d="M133 228 L227 228 C232 260, 232 292, 229 324 L189 324 C186 300, 184 286, 180 278 C176 286, 174 300, 171 324 L131 324 C128 292, 128 260, 133 228 Z"
              fill={shown.bottom}
              patFill={patUrl('bottom')}
              texFill={texUrl('bottom')}
              shadeFill={getSlotShade('bottom')}
              stroke={getSeamStroke(shown.bottom)}
            />
            <path d="M136 242 Q145 258 142 274" fill="none" stroke={getSeamStroke(shown.bottom)} strokeWidth="1" />
            <path d="M224 242 Q215 258 218 274" fill="none" stroke={getSeamStroke(shown.bottom)} strokeWidth="1" />
            <line x1="131" y1="316" x2="171" y2="316" stroke={getSeamStroke(shown.bottom)} strokeWidth="1" />
            <line x1="189" y1="316" x2="229" y2="316" stroke={getSeamStroke(shown.bottom)} strokeWidth="1" />
          </>
        )}

        {pieces.bottom === 'hakama' && (
          <>
            <TexturedPath
              d="M132 224 L228 224 C238 286, 242 362, 238 434 L187 434 C184 374, 183 324, 180 296 C177 324, 176 374, 173 434 L122 434 C118 362, 122 286, 132 224 Z"
              fill={shown.bottom}
              patFill={patUrl('bottom')}
              texFill={texUrl('bottom')}
              shadeFill={getSlotShade('bottom')}
              stroke={getSeamStroke(shown.bottom)}
            />
            <path d="M148 230 Q142 320 138 432" fill="none" stroke={getSeamStroke(shown.bottom)} strokeWidth="1" />
            <path d="M165 230 Q162 320 159 432" fill="none" stroke={getSeamStroke(shown.bottom)} strokeWidth="1" />
            <path d="M195 230 Q198 320 201 432" fill="none" stroke={getSeamStroke(shown.bottom)} strokeWidth="1" />
            <path d="M212 230 Q218 320 222 432" fill="none" stroke={getSeamStroke(shown.bottom)} strokeWidth="1" />
          </>
        )}
      </g>

      {/* ================================================================= */}
      {/* 3. TOP LAYER (Oxford, Rib Knit, Fleece, Slub Linen, Silk Crêpe)   */}
      {/* ================================================================= */}
      <g {...interactiveProps('top')}>
        <title>{getSlotDisplayLabel('top', pieces)}: {outfit.top.name}</title>

        {!hasCoat ? (
          <>
            {pieces.top === 'camp-shirt' ? (
              <>
                <TexturedPath
                  d="M164 76 C146 80, 128 84, 121 93 C114 102, 108 122, 102 150 L127 154 L134 128 L133 230 C164 235, 196 235, 227 230 L226 128 L233 154 L258 150 C252 122, 246 102, 239 93 C232 84, 214 80, 196 76 Q180 94 164 76 Z"
                  fill={shown.top}
                  patFill={patUrl('top')}
                  texFill={texUrl('top')}
                  shadeFill={getSlotShade('top')}
                  stroke={getSeamStroke(shown.top)}
                />
                <path d="M164 76 Q155 91 168 104 L180 95" fill={getSoftHighlight(shown.top)} stroke={getSeamStroke(shown.top)} strokeWidth="1" />
                <path d="M196 76 Q205 91 192 104 L180 95" fill={getSoftHighlight(shown.top)} stroke={getSeamStroke(shown.top)} strokeWidth="1" />
                <line x1="180" y1="95" x2="180" y2="232" stroke={getSeamStroke(shown.top)} strokeWidth="0.95" />
                <circle cx="180" cy="126" r="1.6" fill={getSeamStroke(shown.top)} />
                <circle cx="180" cy="156" r="1.6" fill={getSeamStroke(shown.top)} />
                <circle cx="180" cy="186" r="1.6" fill={getSeamStroke(shown.top)} />
              </>
            ) : (
              <>
                <TexturedPath
                  d="M164 76 C146 80, 128 84, 120 94 S97 168, 92 242 L110 245 C115 204, 123 158, 134 128 C136 164, 135 200, 133 230 C164 235, 196 235, 227 230 C225 200, 224 164, 226 128 C237 158, 245 204, 250 245 L268 242 C263 168, 248 104, 240 94 S214 80, 196 76 Q180 88 164 76 Z"
                  fill={shown.top}
                  patFill={patUrl('top')}
                  texFill={texUrl('top')}
                  shadeFill={getSlotShade('top')}
                  stroke={getSeamStroke(shown.top)}
                />
                <path d="M134 128 Q131 112 136 96" fill="none" stroke={getSeamStroke(shown.top)} strokeWidth="0.85" strokeOpacity="0.55" />
                <path d="M226 128 Q229 112 224 96" fill="none" stroke={getSeamStroke(shown.top)} strokeWidth="0.85" strokeOpacity="0.55" />
                {/* Subtle Inner-Elbow Creases & Lower Torso Drape */}
                <path d="M107 170 Q114 173 121 169 M253 170 Q246 173 239 169" fill="none" stroke={getSeamStroke(shown.top)} strokeWidth="0.65" strokeOpacity="0.4" />
                <path d="M148 214 Q165 218 176 214 M186 216 Q202 219 214 214" fill="none" stroke={getSeamStroke(shown.top)} strokeWidth="0.65" strokeOpacity="0.35" />
              </>
            )}
          </>
        ) : (
          <>
            <TexturedPath
              d="M150 77 L210 77 L218 232 L142 232 Z"
              fill={shown.top}
              patFill={patUrl('top')}
              texFill={texUrl('top')}
              shadeFill={getSlotShade('top')}
              stroke={getSeamStroke(shown.top)}
              strokeWidth={0.95}
            />
            {pieces.outerwear !== 'haori' && pieces.top !== 'camp-shirt' && (
              <>
                <TexturedPath d="M91 236 L109 240 L108 247 L90 243 Z" fill={shown.top} patFill={patUrl('top')} texFill={texUrl('top')} stroke={getSeamStroke(shown.top)} strokeWidth={0.9} />
                <TexturedPath d="M269 236 L251 240 L252 247 L270 243 Z" fill={shown.top} patFill={patUrl('top')} texFill={texUrl('top')} stroke={getSeamStroke(shown.top)} strokeWidth={0.9} />
              </>
            )}
          </>
        )}

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
            <TexturedPath
              d="M164 62 C164 58, 196 58, 196 62 L200 81 C188 86, 172 86, 160 81 Z"
              fill={shown.top}
              patFill={patUrl('top')}
              texFill={texUrl('top')}
              shadeFill={getSlotShade('top')}
              stroke={getSeamStroke(shown.top)}
            />
            <line x1="164" y1="71" x2="196" y2="71" stroke={getSeamStroke(shown.top)} strokeWidth="0.85" />
          </>
        )}

        {pieces.top === 'hoodie' && (
          <>
            <TexturedPath
              d="M160 75 C159 66, 169 65, 180 74 C191 65, 201 66, 200 75 C202 86, 192 95, 180 97 C168 95, 158 86, 160 75 Z"
              fill={shown.top}
              patFill={patUrl('top')}
              texFill={texUrl('top')}
              shadeFill={getSlotShade('top')}
              stroke={getSeamStroke(shown.top)}
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
      {/* 4. OUTERWEAR LAYER (Tweed Herringbone, Worsted Wool, Satin, Cord) */}
      {/* ================================================================= */}
      {hasCoat && (
        <g {...interactiveProps('outerwear')}>
          <title>{getSlotDisplayLabel('outerwear', pieces)}: {outfit.outerwear.name}</title>

          {pieces.outerwear === 'blazer' && (
            <>
              <TexturedPath
                d="M163 75 C144 79, 126 83, 118 93 S95 166, 90 238 L109 242 C115 202, 124 156, 134 128 C134 172, 131 214, 132 248 C148 253, 165 253, 179 242 L179 160 Z"
                fill={shown.outerwear}
                patFill={patUrl('outerwear')}
                texFill={texUrl('outerwear')}
                shadeFill={getSlotShade('outerwear')}
                stroke={getSeamStroke(shown.outerwear)}
              />
              <TexturedPath
                d="M197 75 C216 79, 234 83, 242 93 S265 166, 270 238 L251 242 C245 202, 236 156, 226 128 C226 172, 229 214, 228 248 C212 253, 195 253, 181 242 L181 160 Z"
                fill={shown.outerwear}
                patFill={patUrl('outerwear')}
                texFill={texUrl('outerwear')}
                shadeFill={getSlotShade('outerwear')}
                stroke={getSeamStroke(shown.outerwear)}
              />
              {/* Rolled Notch Lapels, Tailoring Darts, Jetted Pocket Flaps & Cuff Buttons */}
              <path d="M163 75 C154 89, 148 103, 145 111 L156 115 L149 125 L179 160 L165 78 Z" fill={getSoftHighlight(shown.outerwear)} stroke={getSeamStroke(shown.outerwear)} strokeWidth="1" />
              <path d="M197 75 C206 89, 212 103, 215 111 L204 115 L211 125 L181 160 L195 78 Z" fill={getSoftHighlight(shown.outerwear)} stroke={getSeamStroke(shown.outerwear)} strokeWidth="1" />
              {/* Subtle Torso Waist Suppression Darts */}
              <path d="M149 152 Q147 182 146 218" fill="none" stroke={getSeamStroke(shown.outerwear)} strokeWidth="0.65" strokeOpacity="0.38" />
              <path d="M211 152 Q213 182 214 218" fill="none" stroke={getSeamStroke(shown.outerwear)} strokeWidth="0.65" strokeOpacity="0.38" />
              <path d="M174 175 Q158 178 148 183 M186 175 Q202 178 212 183" fill="none" stroke={getSeamStroke(shown.outerwear)} strokeWidth="0.65" strokeOpacity="0.45" />
              <path d="M106 168 Q114 171 122 167 M254 168 Q246 171 238 167" fill="none" stroke={getSeamStroke(shown.outerwear)} strokeWidth="0.65" strokeOpacity="0.4" />
              {/* Jetted Waist Pocket Flaps */}
              <rect x="141" y="198" width="25" height="6.5" rx="1" fill={getSoftShade(shown.outerwear)} stroke={getSeamStroke(shown.outerwear)} strokeWidth="1" />
              <rect x="194" y="198" width="25" height="6.5" rx="1" fill={getSoftShade(shown.outerwear)} stroke={getSeamStroke(shown.outerwear)} strokeWidth="1" />
              {/* Horn Front & Cuff Buttons */}
              <circle cx="180" cy="174" r="2.7" fill={getSoftShade(shown.outerwear)} stroke={getSeamStroke(shown.outerwear)} strokeWidth="0.9" />
              <circle cx="180" cy="202" r="2.7" fill={getSoftShade(shown.outerwear)} stroke={getSeamStroke(shown.outerwear)} strokeWidth="0.9" />
              <circle cx="96.5" cy="233" r="1.2" fill={getSeamStroke(shown.outerwear)} />
              <circle cx="98" cy="227" r="1.2" fill={getSeamStroke(shown.outerwear)} />
              <circle cx="263.5" cy="233" r="1.2" fill={getSeamStroke(shown.outerwear)} />
              <circle cx="262" cy="227" r="1.2" fill={getSeamStroke(shown.outerwear)} />
            </>
          )}

          {pieces.outerwear === 'overcoat' && (
            <>
              <TexturedPath
                d="M161 74 C142 78, 123 82, 115 93 S93 168, 88 242 L108 246 C114 204, 123 156, 132 128 C126 206, 122 278, 124 338 C144 342, 163 343, 179 341 L179 166 Z"
                fill={shown.outerwear}
                patFill={patUrl('outerwear')}
                texFill={texUrl('outerwear')}
                shadeFill={getSlotShade('outerwear')}
                stroke={getSeamStroke(shown.outerwear)}
              />
              <TexturedPath
                d="M199 74 C218 78, 237 82, 245 93 S267 168, 272 242 L252 246 C246 204, 237 156, 228 128 C234 206, 238 278, 236 338 C216 342, 197 343, 181 341 L181 166 Z"
                fill={shown.outerwear}
                patFill={patUrl('outerwear')}
                texFill={texUrl('outerwear')}
                shadeFill={getSlotShade('outerwear')}
                stroke={getSeamStroke(shown.outerwear)}
              />
              <path d="M161 74 C150 90, 141 108, 139 118 L152 123 L144 134 L179 166 L165 77 Z" fill={getSoftHighlight(shown.outerwear)} stroke={getSeamStroke(shown.outerwear)} strokeWidth="1.05" />
              <path d="M199 74 C210 90, 219 108, 221 118 L208 123 L216 134 L181 166 L195 77 Z" fill={getSoftHighlight(shown.outerwear)} stroke={getSeamStroke(shown.outerwear)} strokeWidth="1.05" />
              <path d="M104 168 Q113 171 121 167 M256 168 Q247 171 239 167" fill="none" stroke={getSeamStroke(shown.outerwear)} strokeWidth="0.65" strokeOpacity="0.4" />
              {/* Slanted Welt Pockets & Horn Overcoat Buttons */}
              <path d="M135 219 L154 231 L151 236 L132 224 Z" fill={getSoftShade(shown.outerwear)} stroke={getSeamStroke(shown.outerwear)} strokeWidth="0.95" />
              <path d="M225 219 L206 231 L209 236 L228 224 Z" fill={getSoftShade(shown.outerwear)} stroke={getSeamStroke(shown.outerwear)} strokeWidth="0.95" />
              <circle cx="174" cy="184" r="2.8" fill={getSoftShade(shown.outerwear)} stroke={getSeamStroke(shown.outerwear)} strokeWidth="0.9" />
              <circle cx="174" cy="218" r="2.8" fill={getSoftShade(shown.outerwear)} stroke={getSeamStroke(shown.outerwear)} strokeWidth="0.9" />
              <circle cx="174" cy="252" r="2.8" fill={getSoftShade(shown.outerwear)} stroke={getSeamStroke(shown.outerwear)} strokeWidth="0.9" />
            </>
          )}

          {pieces.outerwear === 'bomber' && (
            <>
              <TexturedPath
                d="M161 76 C142 80, 124 85, 116 95 S94 166, 90 236 L111 240 C116 198, 125 154, 134 132 L133 228 L167 228 L167 88 Z"
                fill={shown.outerwear}
                patFill={patUrl('outerwear')}
                texFill={texUrl('outerwear')}
                shadeFill={getSlotShade('outerwear')}
                stroke={getSeamStroke(shown.outerwear)}
              />
              <TexturedPath
                d="M199 76 C218 80, 236 85, 244 95 S266 166, 270 236 L249 240 C244 198, 235 154, 226 132 L227 228 L193 228 L193 88 Z"
                fill={shown.outerwear}
                patFill={patUrl('outerwear')}
                texFill={texUrl('outerwear')}
                shadeFill={getSlotShade('outerwear')}
                stroke={getSeamStroke(shown.outerwear)}
              />
              <path d="M157 82 Q144 108 134 132" fill="none" stroke={getSeamStroke(shown.outerwear)} strokeWidth="1" />
              <path d="M203 82 Q216 108 226 132" fill="none" stroke={getSeamStroke(shown.outerwear)} strokeWidth="1" />
              {/* Characteristic Bomber Ruched Sleeve Gathering Marks */}
              <path d="M103 158 Q112 162 121 157 M100 182 Q110 185 119 180 M96 206 Q106 209 115 204" fill="none" stroke={getSeamStroke(shown.outerwear)} strokeWidth="0.7" strokeOpacity="0.45" />
              <path d="M257 158 Q248 162 239 157 M260 182 Q250 185 241 180 M264 206 Q254 209 245 204" fill="none" stroke={getSeamStroke(shown.outerwear)} strokeWidth="0.7" strokeOpacity="0.45" />
              <rect x="133" y="217" width="34" height="11" rx="2" fill={getSoftShade(shown.outerwear)} stroke={getSeamStroke(shown.outerwear)} strokeWidth="0.85" />
              <rect x="193" y="217" width="34" height="11" rx="2" fill={getSoftShade(shown.outerwear)} stroke={getSeamStroke(shown.outerwear)} strokeWidth="0.85" />
              <line x1="143" y1="184" x2="153" y2="202" stroke={getSeamStroke(shown.outerwear)} strokeWidth="1.4" />
              <line x1="217" y1="184" x2="207" y2="202" stroke={getSeamStroke(shown.outerwear)} strokeWidth="1.4" />
            </>
          )}

          {pieces.outerwear === 'chore' && (
            <>
              <TexturedPath
                d="M161 75 C142 79, 124 84, 116 94 S94 166, 90 238 L110 242 C116 200, 125 156, 134 130 L132 242 L166 242 L166 87 Z"
                fill={shown.outerwear}
                patFill={patUrl('outerwear')}
                texFill={texUrl('outerwear')}
                shadeFill={getSlotShade('outerwear')}
                stroke={getSeamStroke(shown.outerwear)}
              />
              <TexturedPath
                d="M199 75 C218 79, 236 84, 244 94 S266 166, 270 238 L250 242 C244 200, 235 156, 226 130 L228 242 L194 242 L194 87 Z"
                fill={shown.outerwear}
                patFill={patUrl('outerwear')}
                texFill={texUrl('outerwear')}
                shadeFill={getSlotShade('outerwear')}
                stroke={getSeamStroke(shown.outerwear)}
              />
              <path d="M161 75 Q148 90 146 102 L166 96 Z" fill={getSoftHighlight(shown.outerwear)} stroke={getSeamStroke(shown.outerwear)} strokeWidth="1" />
              <path d="M199 75 Q212 90 214 102 L194 96 Z" fill={getSoftHighlight(shown.outerwear)} stroke={getSeamStroke(shown.outerwear)} strokeWidth="1" />
              <path d="M106 168 Q114 171 122 167 M254 168 Q246 171 238 167" fill="none" stroke={getSeamStroke(shown.outerwear)} strokeWidth="0.65" strokeOpacity="0.4" />
              <rect x="139" y="180" width="21" height="29" rx="3.5" fill={getSoftShade(shown.outerwear)} stroke={getSeamStroke(shown.outerwear)} strokeWidth="1" />
              <rect x="200" y="180" width="21" height="29" rx="3.5" fill={getSoftShade(shown.outerwear)} stroke={getSeamStroke(shown.outerwear)} strokeWidth="1" />
            </>
          )}

          {pieces.outerwear === 'haori' && (
            <>
              <TexturedPath
                d="M159 75 C135 80, 108 85, 90 95 C84 128, 84 176, 87 216 Q106 220, 129 216 C130 186, 130 156, 130 142 C128 188, 128 232, 131 264 L165 264 L165 83 Z"
                fill={shown.outerwear}
                patFill={patUrl('outerwear')}
                texFill={texUrl('outerwear')}
                shadeFill={getSlotShade('outerwear')}
                stroke={getSeamStroke(shown.outerwear)}
              />
              <TexturedPath
                d="M201 75 C225 80, 252 85, 270 95 C276 128, 276 176, 273 216 Q254 220, 231 216 C230 186, 230 156, 230 142 C232 188, 232 232, 229 264 L195 264 L195 83 Z"
                fill={shown.outerwear}
                patFill={patUrl('outerwear')}
                texFill={texUrl('outerwear')}
                shadeFill={getSlotShade('outerwear')}
                stroke={getSeamStroke(shown.outerwear)}
              />
              <path d="M159 79 Q157 168 159 264" fill="none" stroke={getSeamStroke(shown.outerwear)} strokeWidth="1.3" />
              <path d="M201 79 Q203 168 201 264" fill="none" stroke={getSeamStroke(shown.outerwear)} strokeWidth="1.3" />
            </>
          )}
        </g>
      )}

      {/* ================================================================= */}
      {/* 5. ACCENT LAYER (Silk Tie/Obi, Ribbed Knit Scarf, Pebbled Belt)   */}
      {/* ================================================================= */}
      <g {...interactiveProps('accent')}>
        <title>{getSlotDisplayLabel('accent', pieces)}: {outfit.accent.name}</title>

        {pieces.accent === 'tie' && (
          <>
            <TexturedPath
              d="M174 87 C174 83, 186 83, 186 87 L184 101 C182 103, 178 103, 176 101 Z"
              fill={shown.accent}
              texFill={texUrl('accent')}
              shadeFill={getSlotShade('accent')}
              stroke={getSeamStroke(shown.accent)}
              strokeWidth={1}
            />
            <TexturedPath
              d="M176 101 L184 101 C185 128, 187 154, 186 167 L180 179 L174 167 C173 154, 175 128, 176 101 Z"
              fill={shown.accent}
              texFill={texUrl('accent')}
              shadeFill={getSlotShade('accent')}
              stroke={getSeamStroke(shown.accent)}
              strokeWidth={1}
            />
            {showsChestPocketSquare && (
              <>
                <TexturedPath
                  d="M197 132 C201 122, 206 121, 209 127 C212 121, 217 123, 219 132 Z"
                  fill={shown.accent}
                  texFill={texUrl('accent')}
                  stroke={getSeamStroke(shown.accent)}
                  strokeWidth={0.95}
                />
                <path d="M209 127 L207 132" fill="none" stroke={getSeamStroke(shown.accent)} strokeWidth="0.7" strokeOpacity="0.6" />
                <line x1="194" y1="133" x2="221" y2="133" stroke={getSeamStroke(shown.outerwear)} strokeWidth="1.4" />
              </>
            )}
          </>
        )}

        {pieces.accent === 'scarf' && (
          <>
            <TexturedPath
              d="M156 75 C169 93, 191 93, 204 75 C210 82, 207 98, 180 106 C153 98, 150 82, 156 75 Z"
              fill={shown.accent}
              texFill={texUrl('accent')}
              shadeFill={getSlotShade('accent')}
              stroke={getSeamStroke(shown.accent)}
            />
            <TexturedPath
              d="M168 100 L183 101 C184 128, 183 154, 181 170 Q174 173 167 168 C167 148, 167 124, 168 100 Z"
              fill={shown.accent}
              texFill={texUrl('accent')}
              shadeFill={getSlotShade('accent')}
              stroke={getSeamStroke(shown.accent)}
            />
          </>
        )}

        {pieces.accent === 'belt-socks' && (
          <>
            <TexturedPath
              d="M135.5 224 L224.5 224 Q227 224 227 226.5 L227 230.5 Q227 233 224.5 233 L135.5 233 Q133 233 133 230.5 L133 226.5 Q133 224 135.5 224 Z"
              fill={shown.accent}
              texFill={texUrl('accent')}
              shadeFill={getSlotShade('accent')}
              stroke={getSeamStroke(shown.accent)}
              strokeWidth={0.95}
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
            {showBareCalves && pieces.footwear === 'sneakers' && (
              <>
                <TexturedPath d="M141 402 L164 402 L163 428 L143 428 Z" fill={shown.accent} texFill={texUrl('accent')} stroke={getSeamStroke(shown.accent)} strokeWidth={0.85} />
                <TexturedPath d="M196 402 L219 402 L217 428 L197 428 Z" fill={shown.accent} texFill={texUrl('accent')} stroke={getSeamStroke(shown.accent)} strokeWidth={0.85} />
              </>
            )}
          </>
        )}

        {pieces.accent === 'cap-trim' && (
          <>
            <TexturedPath
              d="M161 35 C161 18, 173 13, 180 13 C191 13, 199 20, 199 35 Q180 31, 161 35 Z"
              fill={shown.accent}
              texFill={texUrl('accent')}
              shadeFill={getSlotShade('accent')}
              stroke={getSeamStroke(shown.accent)}
              strokeWidth={1}
            />
            <TexturedPath
              d="M159 34 Q180 40 205 33 Q189 28 159 34 Z"
              fill={shown.accent}
              texFill={texUrl('accent')}
              stroke={getSeamStroke(shown.accent)}
              strokeWidth={0.95}
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
            <TexturedPath
              d="M154.5 202 L205.5 202 Q208 202 208 204.5 L208 221.5 Q208 224 205.5 224 L154.5 224 Q152 224 152 221.5 L152 204.5 Q152 202 154.5 202 Z"
              fill={shown.accent}
              texFill={texUrl('accent')}
              shadeFill={getSlotShade('accent')}
              stroke={getSeamStroke(shown.accent)}
              strokeWidth={0.95}
            />
            <line x1="154" y1="213" x2="206" y2="213" stroke={getSeamStroke(shown.accent)} strokeWidth="0.9" />
            {pieces.outerwear === 'haori' && (
              <>
                <path d="M164 146 Q180 156 196 146" fill="none" stroke={shown.accent} strokeWidth="4" />
                <circle cx="180" cy="151" r="4" fill={shown.accent} stroke="rgba(0,0,0,0.28)" strokeWidth="0.85" />
              </>
            )}
          </>
        )}
      </g>
      </g>
    </svg>
  );
};
