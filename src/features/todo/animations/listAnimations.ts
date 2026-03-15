import type { Variants } from 'framer-motion'

/** 列表项进场/离场 */
export const listItemVariants: Variants = {
  initial: {
    opacity: 0,
    y: 12,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2 },
  },
  exit: {
    opacity: 0,
    x: -24,
    transition: { duration: 0.15 },
  },
}

/** 列表容器（stagger 子项） */
export const listContainerVariants: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.02,
    },
  },
}
