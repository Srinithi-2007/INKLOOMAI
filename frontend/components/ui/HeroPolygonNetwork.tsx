import React from "react";

export default function HeroPolygonNetwork() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden select-none -z-10"
      aria-hidden="true"
    >
      {/* Deep cosmic base glow atmospheres */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] bg-[radial-gradient(ellipse_at_center,_rgba(124,58,237,0.18)_0%,_rgba(88,28,135,0.08)_40%,_transparent_75%)] blur-3xl" />
      <div className="absolute top-12 -left-20 w-[600px] h-[450px] bg-[radial-gradient(ellipse_at_center,_rgba(192,38,211,0.14)_0%,_rgba(124,58,237,0.06)_50%,_transparent_70%)] blur-3xl transform -rotate-12" />
      <div className="absolute top-0 right-0 w-[700px] h-[650px] bg-[radial-gradient(circle_at_70%_40%,_rgba(6,182,212,0.15)_0%,_rgba(139,92,246,0.12)_35%,_transparent_70%)] blur-2xl" />

      {/* Futuristic angled light streak on the left */}
      <div
        className="absolute top-28 -left-36 w-[800px] h-[220px] opacity-40 blur-xl transform rotate-[-22deg]"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(192,38,211,0.0) 10%, rgba(217,70,239,0.25) 45%, rgba(124,58,237,0.3) 70%, transparent 100%)",
        }}
      />
      <div
        className="absolute top-44 -left-10 w-[650px] h-[2px] opacity-60 transform rotate-[-20deg]"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(236,72,153,0.8) 50%, rgba(168,85,247,0.9) 80%, transparent 100%)",
          boxShadow: "0 0 12px rgba(236,72,153,0.8), 0 0 24px rgba(168,85,247,0.6)",
        }}
      />

      {/* High-fidelity 3D Geometric Glowing Polygon Network SVG */}
      <svg
        className="absolute right-[-120px] sm:right-[-60px] md:right-[-20px] lg:right-[0px] top-[-30px] sm:top-[-20px] w-[680px] sm:w-[820px] md:w-[940px] lg:w-[1050px] h-[550px] sm:h-[680px] md:h-[780px] opacity-90 transition-opacity duration-700"
        viewBox="0 0 1000 800"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Glow Filters */}
          <filter id="glow-cyan" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="glow-magenta" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="glow-node" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Facet Fill Gradients */}
          <linearGradient id="facet-cyan-blue" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.28" />
            <stop offset="60%" stopColor="#2563EB" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.06" />
          </linearGradient>

          <linearGradient id="facet-magenta-violet" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#EC4899" stopOpacity="0.32" />
            <stop offset="50%" stopColor="#A855F7" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.08" />
          </linearGradient>

          <linearGradient id="facet-electric" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#00F0FF" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#9333EA" stopOpacity="0.12" />
          </linearGradient>

          <linearGradient id="facet-bright-pink" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.38" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.15" />
          </linearGradient>

          <linearGradient id="facet-deep-blue" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#1E1B4B" stopOpacity="0.05" />
          </linearGradient>

          {/* Line Stroke Gradients */}
          <linearGradient id="line-cyan-mag" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.85" />
            <stop offset="60%" stopColor="#D946EF" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.6" />
          </linearGradient>

          <linearGradient id="line-laser-blue" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#4F46E5" stopOpacity="0.5" />
          </linearGradient>

          <linearGradient id="line-laser-pink" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#EC4899" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#A855F7" stopOpacity="0.6" />
          </linearGradient>
        </defs>

        {/* --- Translucent Polygonal Crystal Facet Faces --- */}
        <g className="facets" style={{ mixBlendMode: "screen" }}>
          {/* Main cluster facets */}
          <polygon points="780,260 880,180 920,290" fill="url(#facet-cyan-blue)" />
          <polygon points="780,260 920,290 850,380" fill="url(#facet-magenta-violet)" />
          <polygon points="780,260 850,380 720,360" fill="url(#facet-electric)" />
          <polygon points="780,260 720,360 710,240" fill="url(#facet-bright-pink)" />
          <polygon points="710,240 780,260 880,180" fill="url(#facet-deep-blue)" />

          {/* Core high-intensity geometric facets */}
          <polygon points="720,360 850,380 790,490" fill="url(#facet-bright-pink)" />
          <polygon points="850,380 950,420 790,490" fill="url(#facet-cyan-blue)" />
          <polygon points="850,380 920,290 950,420" fill="url(#facet-magenta-violet)" />
          <polygon points="920,290 980,220 950,420" fill="url(#facet-deep-blue)" />
          <polygon points="880,180 980,220 920,290" fill="url(#facet-electric)" />

          {/* Lower polyhedron facets */}
          <polygon points="720,360 790,490 690,520" fill="url(#facet-cyan-blue)" />
          <polygon points="790,490 860,590 750,630" fill="url(#facet-magenta-violet)" />
          <polygon points="790,490 950,420 860,590" fill="url(#facet-deep-blue)" />
          <polygon points="690,520 790,490 750,630" fill="url(#facet-electric)" />

          {/* Branching leftward facets toward center hero text */}
          <polygon points="710,240 720,360 600,320" fill="url(#facet-magenta-violet)" />
          <polygon points="710,240 600,320 630,200" fill="url(#facet-cyan-blue)" />
          <polygon points="600,320 720,360 580,440" fill="url(#facet-bright-pink)" />
          <polygon points="720,360 690,520 580,440" fill="url(#facet-electric)" />
          <polygon points="600,320 580,440 480,370" fill="url(#facet-deep-blue)" />
          <polygon points="630,200 600,320 480,370" fill="url(#facet-magenta-violet)" />

          {/* Far left reaching subtle triangles */}
          <polygon points="480,370 600,320 420,260" fill="url(#facet-cyan-blue)" opacity="0.6" />
          <polygon points="480,370 420,260 340,350" fill="url(#facet-magenta-violet)" opacity="0.5" />
          <polygon points="480,370 340,350 430,480" fill="url(#facet-bright-pink)" opacity="0.6" />
          <polygon points="480,370 580,440 430,480" fill="url(#facet-deep-blue)" opacity="0.5" />

          {/* Distant background facets */}
          <polygon points="880,180 940,110 980,220" fill="url(#facet-cyan-blue)" opacity="0.5" />
          <polygon points="780,260 710,240 760,130" fill="url(#facet-magenta-violet)" opacity="0.5" />
          <polygon points="780,260 760,130 880,180" fill="url(#facet-deep-blue)" opacity="0.5" />
        </g>

        {/* --- Neon Laser Lines and Connecting Edges --- */}
        <g className="edges" strokeLinecap="round" strokeLinejoin="round">
          {/* Main primary bright neon edges */}
          <line x1="780" y1="260" x2="880" y2="180" stroke="#00E5FF" strokeWidth="1.8" filter="url(#glow-cyan)" />
          <line x1="880" y1="180" x2="920" y2="290" stroke="#38BDF8" strokeWidth="1.5" />
          <line x1="920" y1="290" x2="780" y2="260" stroke="#EC4899" strokeWidth="2.0" filter="url(#glow-magenta)" />
          <line x1="780" y1="260" x2="850" y2="380" stroke="#F43F5E" strokeWidth="2.2" filter="url(#glow-magenta)" />
          <line x1="850" y1="380" x2="920" y2="290" stroke="#D946EF" strokeWidth="1.6" />
          <line x1="850" y1="380" x2="720" y2="360" stroke="#00E5FF" strokeWidth="2.0" filter="url(#glow-cyan)" />
          <line x1="720" y1="360" x2="780" y2="260" stroke="#A855F7" strokeWidth="1.6" />
          <line x1="720" y1="360" x2="710" y2="240" stroke="#38BDF8" strokeWidth="1.5" />
          <line x1="710" y1="240" x2="780" y2="260" stroke="#EC4899" strokeWidth="1.6" />
          <line x1="710" y1="240" x2="880" y2="180" stroke="#8B5CF6" strokeWidth="1.2" />

          {/* Lower crystal cluster edges */}
          <line x1="720" y1="360" x2="790" y2="490" stroke="#EC4899" strokeWidth="2.0" filter="url(#glow-magenta)" />
          <line x1="850" y1="380" x2="790" y2="490" stroke="#00E5FF" strokeWidth="1.8" filter="url(#glow-cyan)" />
          <line x1="850" y1="380" x2="950" y2="420" stroke="#38BDF8" strokeWidth="1.6" />
          <line x1="920" y1="290" x2="950" y2="420" stroke="#D946EF" strokeWidth="1.5" />
          <line x1="950" y1="420" x2="790" y2="490" stroke="#A855F7" strokeWidth="1.7" />
          <line x1="790" y1="490" x2="690" y2="520" stroke="#00E5FF" strokeWidth="1.8" filter="url(#glow-cyan)" />
          <line x1="720" y1="360" x2="690" y2="520" stroke="#8B5CF6" strokeWidth="1.4" />
          <line x1="790" y1="490" x2="860" y2="590" stroke="#EC4899" strokeWidth="1.8" filter="url(#glow-magenta)" />
          <line x1="860" y1="590" x2="750" y2="630" stroke="#00E5FF" strokeWidth="1.5" />
          <line x1="790" y1="490" x2="750" y2="630" stroke="#38BDF8" strokeWidth="1.4" />
          <line x1="690" y1="520" x2="750" y2="630" stroke="#A855F7" strokeWidth="1.3" />

          {/* Upper outer network */}
          <line x1="880" y1="180" x2="940" y2="110" stroke="#00E5FF" strokeWidth="1.3" />
          <line x1="940" y1="110" x2="980" y2="220" stroke="#38BDF8" strokeWidth="1.2" />
          <line x1="980" y1="220" x2="920" y2="290" stroke="#EC4899" strokeWidth="1.5" />
          <line x1="980" y1="220" x2="950" y2="420" stroke="#8B5CF6" strokeWidth="1.2" />
          <line x1="760" y1="130" x2="880" y2="180" stroke="#D946EF" strokeWidth="1.2" />
          <line x1="760" y1="130" x2="710" y2="240" stroke="#00E5FF" strokeWidth="1.4" filter="url(#glow-cyan)" />
          <line x1="760" y1="130" x2="780" y2="260" stroke="#38BDF8" strokeWidth="1.1" />

          {/* Leftward laser extensions connecting to center hero */}
          <line x1="710" y1="240" x2="630" y2="200" stroke="#00E5FF" strokeWidth="1.6" filter="url(#glow-cyan)" />
          <line x1="710" y1="240" x2="600" y2="320" stroke="#EC4899" strokeWidth="1.7" filter="url(#glow-magenta)" />
          <line x1="720" y1="360" x2="600" y2="320" stroke="#A855F7" strokeWidth="1.8" />
          <line x1="630" y1="200" x2="600" y2="320" stroke="#38BDF8" strokeWidth="1.5" />
          <line x1="720" y1="360" x2="580" y2="440" stroke="#F43F5E" strokeWidth="1.7" filter="url(#glow-magenta)" />
          <line x1="690" y1="520" x2="580" y2="440" stroke="#00E5FF" strokeWidth="1.5" filter="url(#glow-cyan)" />
          <line x1="600" y1="320" x2="580" y2="440" stroke="#D946EF" strokeWidth="1.6" />
          <line x1="600" y1="320" x2="480" y2="370" stroke="#00E5FF" strokeWidth="1.8" filter="url(#glow-cyan)" />
          <line x1="630" y1="200" x2="480" y2="370" stroke="#8B5CF6" strokeWidth="1.3" />
          <line x1="580" y1="440" x2="480" y2="370" stroke="#EC4899" strokeWidth="1.6" />

          {/* Distant left nodes */}
          <line x1="480" y1="370" x2="420" y2="260" stroke="#38BDF8" strokeWidth="1.3" />
          <line x1="600" y1="320" x2="420" y2="260" stroke="#A855F7" strokeWidth="1.2" />
          <line x1="420" y1="260" x2="340" y2="350" stroke="#00E5FF" strokeWidth="1.4" filter="url(#glow-cyan)" />
          <line x1="480" y1="370" x2="340" y2="350" stroke="#EC4899" strokeWidth="1.5" filter="url(#glow-magenta)" />
          <line x1="480" y1="370" x2="430" y2="480" stroke="#8B5CF6" strokeWidth="1.3" />
          <line x1="340" y1="350" x2="430" y2="480" stroke="#38BDF8" strokeWidth="1.2" />
          <line x1="580" y1="440" x2="430" y2="480" stroke="#00E5FF" strokeWidth="1.3" />

          {/* Far left subtle fading laser lines */}
          <line x1="340" y1="350" x2="220" y2="390" stroke="#EC4899" strokeWidth="1.1" strokeDasharray="3 3" opacity="0.6" />
          <line x1="420" y1="260" x2="280" y2="210" stroke="#00E5FF" strokeWidth="1.0" strokeDasharray="4 4" opacity="0.5" />
          <line x1="430" y1="480" x2="310" y2="540" stroke="#8B5CF6" strokeWidth="1.0" opacity="0.5" />
          <line x1="310" y1="540" x2="180" y2="580" stroke="#00E5FF" strokeWidth="0.8" opacity="0.4" />
        </g>

        {/* --- Bright Glowing Vertices / Constellation Nodes --- */}
        <g className="nodes">
          {/* Main central intense glowing nodes */}
          <circle cx="780" cy="260" r="5" fill="#FFFFFF" filter="url(#glow-node)" />
          <circle cx="780" cy="260" r="8" fill="none" stroke="#00E5FF" strokeWidth="1.5" opacity="0.8" />

          <circle cx="850" cy="380" r="5.5" fill="#FFFFFF" filter="url(#glow-node)" />
          <circle cx="850" cy="380" r="9" fill="none" stroke="#EC4899" strokeWidth="1.5" opacity="0.8" />

          <circle cx="720" cy="360" r="4.5" fill="#FFFFFF" filter="url(#glow-node)" />
          <circle cx="720" cy="360" r="7" fill="none" stroke="#00E5FF" strokeWidth="1.2" opacity="0.75" />

          <circle cx="920" cy="290" r="4" fill="#00E5FF" filter="url(#glow-cyan)" />
          <circle cx="880" cy="180" r="3.5" fill="#FFFFFF" filter="url(#glow-node)" />
          <circle cx="710" cy="240" r="4" fill="#EC4899" filter="url(#glow-magenta)" />
          <circle cx="790" cy="490" r="4.5" fill="#FFFFFF" filter="url(#glow-node)" />
          <circle cx="950" cy="420" r="3.5" fill="#00E5FF" filter="url(#glow-cyan)" />
          <circle cx="690" cy="520" r="3.5" fill="#D946EF" filter="url(#glow-magenta)" />
          <circle cx="860" cy="590" r="3.5" fill="#38BDF8" />
          <circle cx="750" cy="630" r="3" fill="#FFFFFF" />

          {/* Outer cluster nodes */}
          <circle cx="980" cy="220" r="3" fill="#38BDF8" />
          <circle cx="940" cy="110" r="2.5" fill="#00E5FF" />
          <circle cx="760" cy="130" r="3" fill="#EC4899" />

          {/* Left connector nodes */}
          <circle cx="600" cy="320" r="4.5" fill="#FFFFFF" filter="url(#glow-node)" />
          <circle cx="600" cy="320" r="7" fill="none" stroke="#EC4899" strokeWidth="1.2" opacity="0.75" />

          <circle cx="630" cy="200" r="3.5" fill="#00E5FF" filter="url(#glow-cyan)" />
          <circle cx="580" cy="440" r="3.5" fill="#A855F7" />
          <circle cx="480" cy="370" r="4" fill="#FFFFFF" filter="url(#glow-node)" />
          <circle cx="480" cy="370" r="6.5" fill="none" stroke="#00E5FF" strokeWidth="1.2" opacity="0.7" />

          <circle cx="420" cy="260" r="3" fill="#38BDF8" />
          <circle cx="340" cy="350" r="3.5" fill="#EC4899" filter="url(#glow-magenta)" />
          <circle cx="430" cy="480" r="3" fill="#00E5FF" />
          <circle cx="220" cy="390" r="2" fill="#D946EF" opacity="0.8" />
          <circle cx="280" cy="210" r="2" fill="#38BDF8" opacity="0.7" />
          <circle cx="310" cy="540" r="2" fill="#A855F7" opacity="0.7" />
          <circle cx="180" cy="580" r="2" fill="#00E5FF" opacity="0.5" />
        </g>

        {/* --- Ambient Starfield / Micro-sparkles in depth --- */}
        <g className="sparkles" opacity="0.7">
          <circle cx="650" cy="120" r="1" fill="#FFFFFF" />
          <circle cx="820" cy="100" r="1.5" fill="#00E5FF" />
          <circle cx="910" cy="60" r="1" fill="#FFFFFF" />
          <circle cx="550" cy="160" r="1.2" fill="#EC4899" />
          <circle cx="520" cy="290" r="1" fill="#FFFFFF" />
          <circle cx="670" cy="410" r="1.5" fill="#38BDF8" />
          <circle cx="740" cy="450" r="1.2" fill="#FFFFFF" />
          <circle cx="890" cy="480" r="1" fill="#EC4899" />
          <circle cx="980" cy="350" r="1.5" fill="#00E5FF" />
          <circle cx="930" cy="550" r="1" fill="#FFFFFF" />
          <circle cx="810" cy="680" r="1.2" fill="#38BDF8" />
          <circle cx="630" cy="600" r="1" fill="#A855F7" />
          <circle cx="450" cy="190" r="1.2" fill="#FFFFFF" />
          <circle cx="380" cy="420" r="1" fill="#00E5FF" />
          <circle cx="270" cy="470" r="1.2" fill="#EC4899" />
        </g>
      </svg>
    </div>
  );
}
