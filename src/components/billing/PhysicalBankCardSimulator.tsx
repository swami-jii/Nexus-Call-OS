import React from 'react';
import { Wifi } from 'lucide-react';
import { CardBrandMeta } from '../../lib/cardIntelligenceEngine';
import {
  VisaBrandLogo,
  MastercardBrandLogo,
  AmexBrandLogo,
  DiscoverBrandLogo,
  RupayBrandLogo,
} from './PaymentBrandLogos';

export interface PhysicalBankCardSimulatorProps {
  cardIntelligence: CardBrandMeta;
  cardNumber: string;
  cardHolder: string;
  cardExpiry: string;
  cardCvv: string;
  isFlipped: boolean;
  className?: string;
}

/**
 * Ultra-Sleek Luxury Bank Card Simulator
 * Compact, perfectly proportioned, realistic brushed gold EMV chip,
 * elegant bank typography, embossed foil numbers, and 3D GPU-accelerated flip.
 */
export const PhysicalBankCardSimulator: React.FC<PhysicalBankCardSimulatorProps> = ({
  cardIntelligence,
  cardNumber,
  cardHolder,
  cardExpiry,
  cardCvv,
  isFlipped,
  className = '',
}) => {
  const renderSchemeLogo = (size: 'xs' | 'sm' | 'md' | 'lg' = 'md') => {
    switch (cardIntelligence.scheme) {
      case 'visa':
        return <VisaBrandLogo size={size} />;
      case 'mastercard':
        return <MastercardBrandLogo size={size} />;
      case 'amex':
        return <AmexBrandLogo size={size} />;
      case 'discover':
        return <DiscoverBrandLogo size={size} />;
      case 'rupay':
        return <RupayBrandLogo size={size} />;
      default:
        return (
          <div className="font-mono text-[9px] font-extrabold uppercase tracking-widest text-teal-300 bg-black/40 px-2 py-0.5 rounded border border-teal-500/30">
            SOVEREIGN
          </div>
        );
    }
  };

  return (
    <div className={`w-full flex justify-center select-none ${className}`}>
      {/* 3D Card Container (Compact 340px x 205px) */}
      <div className="w-full max-w-[340px] h-[205px] perspective-1000">
        <div
          className={`relative w-full h-full duration-700 transform-style-3d transition-transform ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* ========================================================================= */}
          {/* FRONT FACE (Luxury Metallic Finish) */}
          {/* ========================================================================= */}
          <div
            className={`absolute inset-0 w-full h-full rounded-xl p-4 sm:p-5 text-white ${cardIntelligence.bgGradient} border ${cardIntelligence.borderColor} ${cardIntelligence.accentGlow} backface-hidden shadow-2xl overflow-hidden flex flex-col justify-between transition-all duration-500`}
            style={{
              boxShadow: '0 12px 30px -5px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.1) inset',
            }}
          >
            {/* Specular Light Reflection Sweep */}
            <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none animate-card-shimmer -skew-x-12" />

            {/* TOP ROW: Bank Name & Brand Scheme Logo */}
            <div className="flex items-start justify-between relative z-10">
              <div className="min-w-0 pr-2">
                <span className="font-sans font-black text-xs sm:text-sm tracking-wider uppercase text-zinc-100 block truncate max-w-[200px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                  {cardIntelligence.bankName}
                </span>
                <span className="text-[8px] font-mono tracking-wide text-zinc-400 uppercase block">
                  {cardIntelligence.cardType} • {cardIntelligence.cardTier}
                </span>
              </div>

              <div className="shrink-0 scale-90 origin-right">
                {renderSchemeLogo('md')}
              </div>
            </div>

            {/* MIDDLE ROW: Brushed Gold EMV Chip & NFC Wave */}
            <div className="space-y-2 relative z-10">
              <div className="flex items-center gap-2.5">
                {/* Brushed Gold EMV Smart Chip */}
                <div
                  className={`w-10 h-7 rounded ${
                    cardIntelligence.chipTone === 'platinum' || cardIntelligence.chipTone === 'silver'
                      ? 'bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 border-slate-100 shadow-[0_1px_4px_rgba(0,0,0,0.4)]'
                      : 'bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 border-amber-200 shadow-[0_1px_4px_rgba(0,0,0,0.5)]'
                  } border relative overflow-hidden flex flex-col justify-around p-0.5`}
                >
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] bg-black/35" />
                  <div className="h-0.5 bg-black/20 rounded-full" />
                  <div className="h-0.5 bg-black/20 rounded-full" />
                  <div className="h-0.5 bg-black/20 rounded-full" />
                </div>

                {/* Contactless Wave */}
                <Wifi className="h-4 w-4 text-zinc-300/80 rotate-90 drop-shadow" />
              </div>

              {/* Embossed Monospace Card Number */}
              <div className="font-mono text-[17px] sm:text-[19px] font-extrabold tracking-[0.18em] text-zinc-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] [text-shadow:_0_1px_0_rgba(255,255,255,0.4),_0_-1px_0_rgba(0,0,0,0.9)]">
                {cardNumber || '•••• •••• •••• ••••'}
              </div>
            </div>

            {/* BOTTOM ROW: Cardholder Name & Expiry Date */}
            <div className="flex items-end justify-between relative z-10 text-zinc-400 font-mono">
              <div className="min-w-0 pr-2">
                <span className="text-[7.5px] uppercase font-bold tracking-widest text-zinc-400/90 block">
                  CARDHOLDER
                </span>
                <span className="font-mono font-bold text-xs tracking-wider uppercase text-zinc-100 truncate block max-w-[180px] drop-shadow-sm">
                  {cardHolder || 'CARDHOLDER NAME'}
                </span>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[7.5px] uppercase font-bold tracking-widest text-zinc-400/90 block">
                  EXPIRES
                </span>
                <span className="font-mono font-bold text-xs tracking-widest text-zinc-100 block drop-shadow-sm">
                  {cardExpiry || 'MM/YY'}
                </span>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* BACK FACE (Flips 180° on CVV Focus) */}
          {/* ========================================================================= */}
          <div
            className={`absolute inset-0 w-full h-full rounded-xl text-white ${cardIntelligence.bgGradient} border ${cardIntelligence.borderColor} ${cardIntelligence.accentGlow} rotate-y-180 backface-hidden shadow-2xl overflow-hidden flex flex-col justify-between py-3.5 transition-all duration-500`}
            style={{
              boxShadow: '0 12px 30px -5px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.1) inset',
            }}
          >
            {/* Magnetic Stripe */}
            <div className="w-full h-9 bg-zinc-950 border-t border-b border-black shadow-inner relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-card-shimmer" />
            </div>

            {/* Signature Strip & Live CVV Security Box */}
            <div className="px-4 space-y-1">
              <div className="flex items-center justify-between text-[8px] font-mono text-zinc-400">
                <span>AUTHORIZED SIGNATURE</span>
                <span className="text-amber-300 font-bold">{cardIntelligence.cvvLabel}</span>
              </div>
              <div className="w-full h-8 bg-zinc-200 rounded flex items-center justify-between px-3 shadow-inner border border-zinc-300">
                <span className="font-serif italic text-zinc-800 text-xs font-bold truncate max-w-[170px]">
                  {cardHolder || 'Authorized Signature'}
                </span>
                <span className="font-mono font-black text-xs bg-zinc-900 text-amber-300 px-2 py-0.5 rounded border border-amber-400/50 shadow-md tracking-widest">
                  {cardCvv || '•••'}
                </span>
              </div>
            </div>

            {/* Back Footer: Scheme Logo & Security Token */}
            <div className="px-4 flex items-center justify-between text-[7.5px] font-mono text-zinc-400/90 leading-tight">
              <span className="truncate max-w-[200px]">
                {cardIntelligence.bankCountry} • 256-Bit Vault Token
              </span>
              <div className="shrink-0 scale-75 origin-right">
                {renderSchemeLogo('sm')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhysicalBankCardSimulator;
