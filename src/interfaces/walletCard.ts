import { IconType } from 'react-icons'
interface CardImageBreakpoints {
  base: string
  md: string
  lg: string
  xl: string
}
export interface WalletCardProps {
  totalAmount: number
  comparisonAmount: number
  image: string
  icon: IconType
  title: string
  bgColor: string
  breakpointsImage: CardImageBreakpoints
  breakpointsLeftImage: CardImageBreakpoints
  breakpointsTopImage: CardImageBreakpoints
}
