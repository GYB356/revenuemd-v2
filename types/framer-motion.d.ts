import { HTMLMotionProps } from 'framer-motion'

declare module 'framer-motion' {
  export interface AnimationProps extends HTMLMotionProps<'div'> {
    children?: React.ReactNode
  }
}