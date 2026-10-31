import { Box, Button } from '@chakra-ui/react'

/**
 * Segmented choice: big, one tap. Selected = 2 px border and dot in the
 * option's color with dark text — readable on every color (white text on
 * the Deseo yellow wouldn't pass AA).
 */
export const ChoiceButton = ({
  label,
  isSelected,
  color,
  onClick
}: {
  label: string
  isSelected: boolean
  color: string
  onClick: () => void
}) => (
  <Button
    onClick={onClick}
    aria-pressed={isSelected}
    minH="48px"
    h="auto"
    py={2}
    px={2}
    iconSpacing={1.5}
    whiteSpace="normal"
    fontSize={{ base: 'sm', sm: 'md' }}
    variant="outline"
    borderWidth="2px"
    borderColor={isSelected ? color : 'border.subtle'}
    bg={isSelected ? 'bg.subtle' : 'transparent'}
    color="text.primary"
    fontWeight={isSelected ? 'bold' : 'semibold'}
    leftIcon={
      <Box
        aria-hidden
        w={2.5}
        h={2.5}
        borderRadius="full"
        bg={color}
        opacity={isSelected ? 1 : 0.5}
      />
    }
    // Hover feedback only with a real pointer: on phones :hover sticks to
    // whatever ends up under the finger after a tap.
    _hover={{}}
    sx={{ '@media (hover: hover)': { '&:hover': { borderColor: color } } }}
    _active={{ bg: 'bg.subtle' }}
  >
    {label}
  </Button>
)
