import { useMemo } from "react";
import { useTheme } from "@/lib/theme";

const LEAF_PATH = "M50 95 L50 55 M50 50 C48 40 30 35 20 15 C22 12 28 14 35 20 C38 25 42 32 45 40 L50 50 M50 50 C45 42 35 25 15 25 C15 21 22 20 30 24 C36 27 42 35 47 43 L50 50 M50 50 C52 40 70 35 80 15 C78 12 72 14 65 20 C62 25 58 32 55 40 L50 50 M50 50 C55 42 65 25 85 25 C85 21 78 20 70 24 C64 27 58 35 53 43 L50 50 M50 50 C49 38 40 18 50 2 C60 18 51 38 50 50 M50 50 C46 44 28 42 8 48 C10 44 18 40 28 40 C36 40 44 44 48 48 L50 50 M50 50 C54 44 72 42 92 48 C90 44 82 40 72 40 C64 40 56 44 52 48 L50 50";

export function ParticleBackground() {
  const { theme } = useTheme();
  
  const leaves = useMemo(() => {
    const count = 35;
    return Array.from({ length: count }, (_, i) => {
      const size = Math.random() * 28 + 18;
      const left = Math.random() * 100;
      const startTop = Math.random() * 140 + 30;
      const delay = Math.random() * 15;
      const duration = Math.random() * 16 + 12;
      const opacity = Math.random() * 0.25 + 0.05;
      const rotation = Math.random() * 360;
      const swayAmount = Math.random() * 60 + 15;
      
      return { id: i, size, left, startTop, delay, duration, opacity, rotation, swayAmount };
    });
  }, []);

  const strokeColor = theme === "dark" ? "rgba(34,197,94," : "rgba(22,163,74,";

  return (
    <>
      <style>{`
        @keyframes leafDrift {
          0% {
            transform: translateY(0) rotate(var(--lr)) translateX(0);
            opacity: var(--lo);
          }
          20% {
            transform: translateY(-30vh) rotate(calc(var(--lr) + 25deg)) translateX(calc(var(--ls) * 1px));
          }
          50% {
            transform: translateY(-75vh) rotate(calc(var(--lr) - 15deg)) translateX(calc(var(--ls) * -0.7px));
            opacity: var(--lo);
          }
          80% {
            transform: translateY(-120vh) rotate(calc(var(--lr) + 35deg)) translateX(calc(var(--ls) * 0.5px));
          }
          100% {
            transform: translateY(-155vh) rotate(calc(var(--lr) + 50deg)) translateX(0);
            opacity: 0;
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
              "--lr": `${leaf.rotation}deg`,
              "--ls": leaf.swayAmount,
              "--lo": leaf.opacity,
              animation: `leafDrift ${leaf.duration}s ease-in-out ${leaf.delay}s infinite`,
            } as React.CSSProperties}
          >
            <svg viewBox="0 0 100 100" width={leaf.size} height={leaf.size}>
              <path
                d={LEAF_PATH}
                fill="none"
                stroke={`${strokeColor}${leaf.opacity + 0.15})`}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        ))}
      </div>
    </>
  );
}
