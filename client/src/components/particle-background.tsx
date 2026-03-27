import { useMemo } from "react";
import { useTheme } from "@/lib/theme";

export function ParticleBackground() {
  const { theme } = useTheme();
  
  const leaves = useMemo(() => {
    const count = 60;
    return Array.from({ length: count }, (_, i) => {
      const size = Math.random() * 20 + 12;
      const left = Math.random() * 100;
      const startTop = Math.random() * 150 + 20;
      const delay = Math.random() * 12;
      const duration = Math.random() * 14 + 10;
      const opacity = Math.random() * 0.4 + 0.1;
      const rotation = Math.random() * 360;
      const swayAmount = Math.random() * 40 + 10;
      
      return {
        id: i,
        size,
        left,
        startTop,
        delay,
        duration,
        opacity,
        rotation,
        swayAmount,
      };
    });
  }, []);

  const leafColor = theme === "dark" ? "rgba(34, 197, 94, " : "rgba(22, 163, 74, ";

  return (
    <>
      <style>{`
        @keyframes leafFloat {
          0% {
            transform: translateY(0) rotate(var(--leaf-rotation)) translateX(0);
          }
          25% {
            transform: translateY(-37vh) rotate(calc(var(--leaf-rotation) + 15deg)) translateX(calc(var(--leaf-sway) * 1px));
          }
          50% {
            transform: translateY(-75vh) rotate(calc(var(--leaf-rotation) - 10deg)) translateX(calc(var(--leaf-sway) * -0.5px));
          }
          75% {
            transform: translateY(-112vh) rotate(calc(var(--leaf-rotation) + 20deg)) translateX(calc(var(--leaf-sway) * 0.8px));
          }
          100% {
            transform: translateY(-150vh) rotate(calc(var(--leaf-rotation) + 30deg)) translateX(0);
          }
        }
      `}</style>
      <div 
        className="fixed inset-0 overflow-hidden pointer-events-none"
        style={{ zIndex: 1 }}
        aria-hidden="true"
      >
        {leaves.map((leaf) => (
          <div
            key={leaf.id}
            className="absolute"
            style={{
              width: `${leaf.size}px`,
              height: `${leaf.size}px`,
              left: `${leaf.left}%`,
              top: `${leaf.startTop}%`,
              // @ts-ignore
              "--leaf-rotation": `${leaf.rotation}deg`,
              "--leaf-sway": leaf.swayAmount,
              animation: `leafFloat ${leaf.duration}s ease-in-out ${leaf.delay}s infinite`,
            } as React.CSSProperties}
          >
            <svg
              viewBox="0 0 100 100"
              width={leaf.size}
              height={leaf.size}
              style={{ opacity: leaf.opacity }}
            >
              <g transform="translate(50,50)">
                <ellipse cx="0" cy="-22" rx="5" ry="20" fill={`${leafColor}${leaf.opacity})`} transform="rotate(0)" />
                <ellipse cx="0" cy="-22" rx="5" ry="20" fill={`${leafColor}${leaf.opacity})`} transform="rotate(51.4)" />
                <ellipse cx="0" cy="-22" rx="5" ry="20" fill={`${leafColor}${leaf.opacity})`} transform="rotate(102.8)" />
                <ellipse cx="0" cy="-22" rx="5" ry="20" fill={`${leafColor}${leaf.opacity})`} transform="rotate(154.3)" />
                <ellipse cx="0" cy="-22" rx="5" ry="20" fill={`${leafColor}${leaf.opacity})`} transform="rotate(205.7)" />
                <ellipse cx="0" cy="-22" rx="5" ry="20" fill={`${leafColor}${leaf.opacity})`} transform="rotate(257.1)" />
                <ellipse cx="0" cy="-22" rx="5" ry="20" fill={`${leafColor}${leaf.opacity})`} transform="rotate(308.6)" />
                <line x1="0" y1="0" x2="0" y2="30" stroke={`${leafColor}${leaf.opacity * 0.8})`} strokeWidth="2.5" />
              </g>
            </svg>
          </div>
        ))}
      </div>
    </>
  );
}
