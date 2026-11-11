import { CheckIcon } from '@/components/icons/app'
import { Box, Flex, Text, VisuallyHidden } from '@chakra-ui/react'
import { useTranslation } from 'next-i18next'
import type { ReactNode } from 'react'

export type StepState = 'done' | 'now' | 'pending'

const NUMBER_STYLES: Record<StepState, { bg: string; color: string }> = {
  done: { bg: 'money.incomeText', color: 'white' },
  now: { bg: 'brand.solid', color: 'white' },
  pending: { bg: 'seg.bg', color: 'text.secondary' }
}

interface StepperItemProps {
  number: number
  state: StepState
  title: string
  isLast?: boolean
  children: ReactNode
}

/** design .sv: numbered circle (✓ when done), the line down to the next
 * step (green once done), title and body. */
export const StepperItem = ({
  number,
  state,
  title,
  isLast = false,
  children
}: StepperItemProps) => {
  const { t } = useTranslation('settings')
  const circle = NUMBER_STYLES[state]
  return (
    <Flex
      as="li"
      gap="12px"
      position="relative"
      pb={isLast ? 0 : '14px'}
      aria-current={state === 'now' ? 'step' : undefined}
      _before={
        isLast
          ? undefined
          : {
              content: '""',
              position: 'absolute',
              left: '13px',
              top: '30px',
              bottom: '2px',
              w: '2px',
              bg: state === 'done' ? 'money.incomeText' : 'border.subtle'
            }
      }
    >
      <Flex
        boxSize="28px"
        flexShrink={0}
        borderRadius="full"
        align="center"
        justify="center"
        fontSize="13px"
        fontWeight={700}
        bg={circle.bg}
        color={circle.color}
        position="relative"
        zIndex={1}
        aria-hidden
      >
        {state === 'done' ? <CheckIcon boxSize="14px" /> : number}
      </Flex>
      <Box flex={1} minW={0}>
        <Text as="h2" fontSize="15px" fontWeight={700} mt="4px">
          <VisuallyHidden>
            {t(`shortcut.stepState.${state}`, { number })}:{' '}
          </VisuallyHidden>
          {title}
        </Text>
        {children}
      </Box>
    </Flex>
  )
}

/** design .sv .b .s */
export const StepText = ({
  children,
  mt = '3px'
}: {
  children: ReactNode
  mt?: string
}) => (
  <Text fontSize="12.5px" color="text.secondary" lineHeight="1.45" mt={mt}>
    {children}
  </Text>
)
