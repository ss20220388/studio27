import { motion } from "framer-motion";

const shapes = [
  { size: 160, top: "5%",  left: "10%", duration: 28, delay: 0,   borderRadius: "30%", rotate: 360  },
  { size: 90,  top: "25%", left: "85%", duration: 20, delay: 2,   borderRadius: "50%", rotate: -360 },
  { size: 130, top: "65%", left: "15%", duration: 32, delay: 1,   borderRadius: "40%", rotate: 180  },
  { size: 70,  top: "55%", left: "75%", duration: 22, delay: 3,   borderRadius: "50%", rotate: -180 },
  { size: 50,  top: "15%", left: "50%", duration: 18, delay: 1.5, borderRadius: "50%", rotate: 360  },
  { size: 100, top: "80%", left: "60%", duration: 26, delay: 0.5, borderRadius: "35%", rotate: -360 },
  { size: 40,  top: "40%", left: "40%", duration: 15, delay: 4,   borderRadius: "50%", rotate: 270  },
];

export default function FloatingShapes() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {shapes.map((shape, i) => (
        <motion.div
          key={i}
          className="absolute backdrop-blur-sm"
          style={{
            width: shape.size,
            height: shape.size,
            top: shape.top,
            left: shape.left,
            borderRadius: shape.borderRadius,
            background:
              i % 3 === 0
                ? "radial-gradient(circle, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 70%)"
                : i % 3 === 1
                ? "radial-gradient(circle, rgba(127,29,29,0.25) 0%, rgba(127,29,29,0.04) 70%)"
                : "radial-gradient(circle, rgba(185,28,28,0.2) 0%, rgba(185,28,28,0.04) 70%)",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{
            opacity: [0, 1, 0.6, 1, 0],
            scale: [0.8, 1, 1.1, 1, 0.8],
            rotate: shape.rotate,
            y: [0, -60, -20, -50, 0],
            x: [0, 20, -10, 15, 0],
          }}
          transition={{
            repeat: Infinity,
            duration: shape.duration,
            delay: shape.delay,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Subtle radial glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 rounded-full opacity-35"
        style={{
          background: "radial-gradient(circle, rgba(127,29,29,0.25) 0%, transparent 70%)",
        }}
      />
    </div>
  );
}