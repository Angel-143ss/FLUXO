import React from 'react';
import { Sparkles } from 'lucide-react';

export type MascotShape = 'pentagon' | 'circle' | 'cloud' | 'square' | 'diamond' | 'pill' | 'star';
export type MascotEyes = 'normal' | 'stars' | 'closed' | 'winking' | 'heart';

interface MascotProps {
  shape?: MascotShape;
  color?: string;
  eyes?: MascotEyes;
  className?: string;
  size?: string;
}

export const Mascot = ({ 
  shape = 'circle', 
  color = '#4F46E5', 
  eyes = 'normal', 
  className = "",
  size = "w-32 h-32"
}: MascotProps) => {
  const getPath = () => {
    switch (shape) {
      case 'pentagon':
        return "M50 5 L95 38 L78 92 L22 92 L5 38 Z";
      case 'square':
        return "M15 15 H85 V85 H15 Z";
      case 'diamond':
        return "M50 5 L95 50 L50 95 L5 50 Z";
      case 'pill':
        return "M20 35 H80 Q90 35 90 50 Q90 65 80 65 H20 Q10 65 10 50 Q10 35 20 35 Z";
      case 'cloud':
        return "M25 40 A20 20 0 0 1 75 40 A15 15 0 0 1 75 70 H25 A15 15 0 0 1 25 40 Z";
      case 'circle':
      default:
        return "M50 50 m-45 0 a45 45 0 1 0 90 0 a45 45 0 1 0 -90 0";
    }
  };

  const Eye = ({ x }: { x: number }) => {
    switch (eyes) {
      case 'stars':
        return (
          <path 
            d={`M${x-5} 45 L${x} 35 L${x+5} 45 L${x+10} 40 L${x+5} 50 L${x+10} 60 L${x} 55 L${x-10} 60 L${x-5} 50 L${x-10} 40 Z`} 
            fill="black" 
          />
        );
      case 'closed':
        return <path d={`M${x-8} 45 Q${x} 55 ${x+8} 45`} stroke="black" strokeWidth="4" fill="none" strokeLinecap="round" />;
      case 'normal':
      default:
        return (
          <g>
            <circle cx={x} cy="50" r="8" fill="black" />
            <circle cx={x+3} cy="47" r="2.5" fill="white" />
          </g>
        );
    }
  };

  return (
    <div className={`relative flex items-center justify-center shrink-0 ${size} ${className}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl overflow-visible">
        <path d={getPath()} fill={color} />
        <Eye x={35} />
        <Eye x={65} />
        <path d="M40 70 Q50 80 60 70" stroke="black" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.8" />
      </svg>
      {eyes === 'stars' && <Sparkles className="absolute -top-2 -right-2 text-yellow-400 w-6 h-6 animate-pulse" />}
    </div>
  );
};
