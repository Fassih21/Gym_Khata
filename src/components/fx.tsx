import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { useEffect } from "react";

/** Number count-up (0.7s). Reduced-motion par seedha final value. */
export function CountUp({ value, format, className }: { value: number; format: (n: number) => string; className?: string }) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(reduce ? value : 0);
  const text = useTransform(mv, (v) => format(v));
  useEffect(() => {
    if (reduce) {
      mv.set(value);
      return;
    }
    const c = animate(mv, value, { duration: 0.7, ease: "easeOut" });
    return () => c.stop();
  }, [value, reduce, mv]);
  return <motion.span className={className}>{text}</motion.span>;
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } } };

/** Children ko halka stagger fade/slide-in. */
export function Stagger({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className={className}>
      {children}
    </motion.div>
  );
}

/** Stagger ka item; hover par halka upar uthta hai. */
export function StaggerItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div variants={item} whileHover={{ y: -3 }} transition={{ duration: 0.2 }} className={className}>
      {children}
    </motion.div>
  );
}
