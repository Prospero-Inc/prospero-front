import { Icon, type IconProps } from '@chakra-ui/react'
import type { ReactNode } from 'react'

// The icon set of docs/diseno-mobile.html, path for path: 24×24, rounded
// 2 px strokes (a few heavier ones, as in the design). Use these in the
// app shell and redesigned screens so they look exactly like the mockups.

const designIcon = (
  displayName: string,
  paths: ReactNode,
  {
    strokeWidth = 2,
    filled = false
  }: { strokeWidth?: number; filled?: boolean } = {}
) => {
  const DesignIcon = (props: IconProps) => (
    <Icon
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {paths}
    </Icon>
  )
  DesignIcon.displayName = displayName
  return DesignIcon
}

export const HomeIcon = designIcon(
  'HomeIcon',
  <>
    <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />
  </>
)

export const ListIcon = designIcon(
  'ListIcon',
  <>
    <path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" />
  </>
)

export const PlusIcon = designIcon(
  'PlusIcon',
  <>
    <path d="M12 5v14M5 12h14" />
  </>,
  { strokeWidth: 2.4 }
)

export const CalendarRepeatIcon = designIcon(
  'CalendarRepeatIcon',
  <>
    <rect x="3" y="4" width="18" height="17" rx="3" />
    <path d="M3 9h18M8 2v4M16 2v4" />
  </>
)

export const MoreIcon = designIcon(
  'MoreIcon',
  <>
    <circle cx="5" cy="12" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="19" cy="12" r="2" />
  </>,
  { filled: true }
)

export const MailIcon = designIcon(
  'MailIcon',
  <>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </>
)

export const CartIcon = designIcon(
  'CartIcon',
  <>
    <path d="M3 4h2l2.4 11h11L21 7H6.2" />
    <circle cx="9" cy="19.5" r="1.4" />
    <circle cx="17" cy="19.5" r="1.4" />
  </>
)

export const CupIcon = designIcon(
  'CupIcon',
  <>
    <path d="M4 8h13v5a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6z" />
    <path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17M8 2v3M12 2v3" />
  </>
)

export const PiggyIcon = designIcon(
  'PiggyIcon',
  <>
    <path d="M19 10c1 .5 2 1.5 2 3h-2a7 7 0 0 1-3 4v3h-3v-2h-3v2H7v-3a7 7 0 0 1 4-12.5h2c2.6 0 4.8 1.4 6 3.5z" />
    <path d="M15.5 10.5h.01" />
  </>
)

export const BusIcon = designIcon(
  'BusIcon',
  <>
    <rect x="4" y="3" width="16" height="15" rx="3" />
    <path d="M4 11h16M8 21v-3M16 21v-3" />
    <path d="M8 15h.01M16 15h.01" />
  </>
)

export const ArrowDownIcon = designIcon(
  'ArrowDownIcon',
  <>
    <path d="M12 19V5M5 12l7 7 7-7" />
  </>,
  { strokeWidth: 2.2 }
)

export const CheckIcon = designIcon(
  'CheckIcon',
  <>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </>,
  { strokeWidth: 2.6 }
)

export const CloseIcon = designIcon(
  'CloseIcon',
  <>
    <path d="M6 6l12 12M18 6 6 18" />
  </>,
  { strokeWidth: 2.4 }
)

export const ChevronRightIcon = designIcon(
  'ChevronRightIcon',
  <>
    <path d="m9 6 6 6-6 6" />
  </>,
  { strokeWidth: 2.2 }
)

export const FilterIcon = designIcon(
  'FilterIcon',
  <>
    <path d="M4 6h16M7 12h10M10 18h4" />
  </>,
  { strokeWidth: 2.2 }
)

export const BellIcon = designIcon(
  'BellIcon',
  <>
    <path d="M6 9a6 6 0 0 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9z" />
    <path d="M10 20a2 2 0 0 0 4 0" />
  </>
)

export const ShieldIcon = designIcon(
  'ShieldIcon',
  <>
    <path d="M12 3 4.5 6v6c0 4.5 3.2 7.8 7.5 9 4.3-1.2 7.5-4.5 7.5-9V6z" />
  </>
)

export const CalculatorIcon = designIcon(
  'CalculatorIcon',
  <>
    <rect x="5" y="3" width="14" height="18" rx="2.5" />
    <path d="M8.5 7.5h7M9 12h.01M12 12h.01M15 12h.01M9 16h.01M12 16h.01M15 16h.01" />
  </>
)

export const MoonIcon = designIcon(
  'MoonIcon',
  <>
    <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" />
  </>
)

export const GlobeIcon = designIcon(
  'GlobeIcon',
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 3 2.5 15 0 18M12 3c-2.5 3-2.5 15 0 18" />
  </>
)

export const BankIcon = designIcon(
  'BankIcon',
  <>
    <path d="M3 10 12 4l9 6M5 10v8M10 10v8M14 10v8M19 10v8M3 20h18" />
  </>
)

export const SignOutIcon = designIcon(
  'SignOutIcon',
  <>
    <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16l4-4-4-4M14 12H4" />
  </>
)

export const CalendarIcon = designIcon(
  'CalendarIcon',
  <>
    <rect x="3" y="5" width="18" height="16" rx="2.5" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </>
)

export const KeyIcon = designIcon(
  'KeyIcon',
  <>
    <circle cx="8" cy="15" r="4" />
    <path d="m11 12 9-9M17 6l2 2" />
  </>
)

export const WifiIcon = designIcon(
  'WifiIcon',
  <>
    <path d="M12 18.5a1.6 1.6 0 1 0 0 .01zM5 11.5a10 10 0 0 1 14 0l-1.5 1.5a8 8 0 0 0-11 0zM8.3 14.8a5.4 5.4 0 0 1 7.4 0l-1.5 1.5a3.3 3.3 0 0 0-4.4 0z" />
  </>,
  { filled: true }
)

export const UserIcon = designIcon(
  'UserIcon',
  <>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
  </>
)

export const PieIcon = designIcon(
  'PieIcon',
  <>
    <path d="M12 3v9h9a9 9 0 1 1-9-9z" />
    <path d="M15 3.5A9 9 0 0 1 20.5 9H15z" />
  </>
)

export const SyncIcon = designIcon(
  'SyncIcon',
  <>
    <path d="M20 11a8 8 0 0 0-14.5-4.5L4 8M4 13a8 8 0 0 0 14.5 4.5L20 16" />
    <path d="M4 4v4h4M20 20v-4h-4" />
  </>
)

export const TrashIcon = designIcon(
  'TrashIcon',
  <>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
  </>
)

export const PhoneIcon = designIcon(
  'PhoneIcon',
  <>
    <rect x="6" y="2" width="12" height="20" rx="3" />
    <path d="M11 18h2" />
  </>
)

export const AlertIcon = designIcon(
  'AlertIcon',
  <>
    <path d="M12 3 2 20h20z" />
    <path d="M12 10v4M12 17h.01" />
  </>
)

export const LockIcon = designIcon(
  'LockIcon',
  <>
    <rect x="4" y="11" width="16" height="10" rx="2.5" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </>
)

export const CloudOffIcon = designIcon(
  'CloudOffIcon',
  <>
    <path d="M3 3l18 18M8.5 7.4A6 6 0 0 1 17.7 11 4 4 0 0 1 20 18M17 19H7a5 5 0 0 1-2.6-9.3" />
  </>
)

export const FlagIcon = designIcon(
  'FlagIcon',
  <>
    <path d="M5 21V4M5 4h11l-2 4 2 4H5" />
  </>
)
