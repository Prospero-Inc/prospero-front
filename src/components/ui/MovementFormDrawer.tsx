import {
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  Stack,
  useBreakpointValue
} from '@chakra-ui/react'
import { BaseSyntheticEvent, ReactNode, RefObject } from 'react'

interface MovementFormDrawerProps {
  isOpen: boolean
  onClose: () => void
  title: string
  /** Une el `<form>` del cuerpo con el botón de guardar del pie. */
  formId: string
  /** Tal cual lo devuelve `handleSubmit` de react-hook-form. */
  onSubmit: (_event?: BaseSyntheticEvent) => Promise<void> | void
  isSubmitting: boolean
  submitLabel: string
  cancelLabel: string
  /** Campo que recibe el foco al abrir (el monto: es lo primero que se
   * escribe). Al cerrar, Chakra devuelve el foco al botón que lo abrió. */
  initialFocusRef: RefObject<HTMLInputElement>
  children: ReactNode
}

/**
 * Formulario de alta/edición de Gastos e Ingresos en un drawer, en vez de
 * fijo arriba de la página: así la lista (lo que más se consulta) queda
 * primero, y "Editar" en una fila de abajo abre el formulario ahí mismo en
 * lugar de cargarlo arriba fuera de la vista.
 * En mobile sale desde abajo (bottom sheet), al alcance del pulgar.
 */
export const MovementFormDrawer = ({
  isOpen,
  onClose,
  title,
  formId,
  onSubmit,
  isSubmitting,
  submitLabel,
  cancelLabel,
  initialFocusRef,
  children
}: MovementFormDrawerProps) => {
  const placement =
    useBreakpointValue<'bottom' | 'right'>(
      { base: 'bottom', md: 'right' },
      { fallback: 'md' }
    ) ?? 'right'

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      placement={placement}
      size="md"
      initialFocusRef={initialFocusRef}
    >
      <DrawerOverlay />
      <DrawerContent
        borderTopRadius={placement === 'bottom' ? 'xl' : undefined}
        maxH={placement === 'bottom' ? '90dvh' : undefined}
      >
        <DrawerCloseButton />
        <DrawerHeader borderBottomWidth="1px">{title}</DrawerHeader>
        <DrawerBody>
          <Stack as="form" id={formId} onSubmit={onSubmit} spacing={4} py={2}>
            {children}
          </Stack>
        </DrawerBody>
        <DrawerFooter borderTopWidth="1px" gap={3}>
          <Button variant="ghost" onClick={onClose} minH="44px">
            {cancelLabel}
          </Button>
          <Button
            colorScheme="primary"
            type="submit"
            form={formId}
            isLoading={isSubmitting}
            minH="44px"
          >
            {submitLabel}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
