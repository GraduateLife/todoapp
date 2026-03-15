import type { Variants } from 'framer-motion'

/** 长按抖动动画 */
export const shakeVariants: Variants = {
  idle: {
    x: 0,
    rotate: 0,
    transition: { duration: 0.2 },
  },
  shake: {
    x: [0, -4, 4, -3, 3, -2, 2, 0],
    transition: { duration: 0.4, repeat: Infinity, repeatDelay: 0.1 },
  },
}

/** 粉碎粒子出场（用于删除/完成时的视觉反馈） */
export const shatterVariants: Variants = {
  initial: {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
  },
  exit: {
    opacity: 0,
    scale: 1.5,
    filter: 'blur(4px)',
    transition: { duration: 0.25 },
  },
}
