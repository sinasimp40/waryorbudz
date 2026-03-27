import { useMemo } from "react";
import leafImage from "@assets/image_1774584511685.png";

export function ParticleBackground() {
  const leaves = useMemo(() => {
    const count = 30;
    return Array.from({ length: count }, (_, i) => {
      const size = Math.random() * 30 + 16;
      const left = Math.random() * 100;
      const startTop = Math.random() * 140 + 30;
      const delay = Math.random() * 15;
      const duration = Math.random() * 16 + 12;
      const opacity = Math.random() * 0.3 + 0.05;
      const rotation = Math.random() * 360;
      const swayAmount = Math.random() * 60 + 15;

      return { id: i, size, left, startTop, delay, duration, opacity, rotation, swayAmount };
    });
  }, []);

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
          <img
            key={leaf.id}
            src={leafImage}
            alt=""
            className="absolute"
            style={{
              width: `${leaf.size}px`,
              height: `${leaf.size}px`,
              left: `${leaf.left}%`,
              top: `${leaf.startTop}%`,
              objectFit: "contain",
              "--lr": `${leaf.rotation}deg`,
              "--ls": leaf.swayAmount,
              "--lo": leaf.opacity,
              animation: `leafDrift ${leaf.duration}s ease-in-out ${leaf.delay}s infinite`,
            } as React.CSSProperties}
          />
        ))}
      </div>
    </>
  );
}
