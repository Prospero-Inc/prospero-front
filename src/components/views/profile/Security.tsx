'use client'
import { InfoLayout, InfoSection } from '@/components/layouts'
import { CustomStat } from '@/components/ui'
import { ProfileSecuritySkeleton } from '@/components/ui/PageSkeletons'
import { Profile } from '@/interfaces'
import { localApiService } from '@/lib'
import {
  Button,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  PinInput,
  PinInputField,
  Text,
  useDisclosure,
  useToast
} from '@chakra-ui/react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

export const Security = ({ enable2FA }: Partial<Profile>) => {
  const { t } = useTranslation('profile')
  const router = useRouter()
  const { data } = useSession()
  const toast = useToast()

  const [mounted, setMounted] = useState(false)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [code, setCode] = useState('')
  const [isDisabling, setIsDisabling] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const switchRoute = () => {
    router.push('/profile/2fa')
  }
  const openDisableDialog = () => {
    setCode('')
    onOpen()
  }

  // Desactivar 2FA baja la seguridad de la cuenta: el backend exige un código
  // TOTP vigente, así que un token de sesión robado no alcanza para apagarlo.
  const desactivate2FA = async () => {
    setIsDisabling(true)
    try {
      await localApiService.request({
        method: 'POST',
        endPoint: '/proxy/disable-2fa',
        headers: {
          'x-lang': router.locale ?? 'es',
          Authorization: `Bearer ${data?.accessToken}`
        },
        data: { token: code }
      })
      onClose()
      toast({ title: t('securitySection.toast.disabled'), status: 'success' })
      // Refresca el perfil para que el estado deje de decir "Activado".
      router.replace(router.asPath)
    } catch {
      setCode('')
      toast({ title: t('securitySection.toast.error'), status: 'error' })
    } finally {
      setIsDisabling(false)
    }
  }

  const exectue2FA = () => {
    if (enable2FA) openDisableDialog()
    else switchRoute()
  }

  // Asegurarse de que el contenido solo se renderice en el cliente
  // Hasta montar se muestra la forma de la sección en vez de nada: antes
  // la página aparecía vacía y el contenido "saltaba" al hidratar.
  if (!mounted) return <ProfileSecuritySkeleton />

  return (
    <>
      <CustomStat>
        <InfoLayout
          title={t('securitySection.title')}
          onEdit={exectue2FA}
          buttonLabel={t(
            `securitySection.buttonAction.${enable2FA ? 'disable' : 'enable'}`
          )}
        >
          <InfoSection
            label={t('securitySection.twoFactorAuth')}
            value={t(`securitySection.${enable2FA ? 'enabled' : 'disabled'}`)}
            useBadge={true}
          />
        </InfoLayout>
      </CustomStat>
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent mx={4}>
          <ModalHeader>{t('securitySection.disableTitle')}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={4}>{t('securitySection.disableConfirm')}</Text>
            <HStack justify="center">
              <PinInput
                otp
                type="number"
                autoFocus
                value={code}
                onChange={setCode}
              >
                <PinInputField autoComplete="one-time-code" />
                <PinInputField />
                <PinInputField />
                <PinInputField />
                <PinInputField />
                <PinInputField />
              </PinInput>
            </HStack>
          </ModalBody>
          <ModalFooter gap={3}>
            <Button variant="ghost" onClick={onClose}>
              {t('securitySection.cancel')}
            </Button>
            <Button
              colorScheme="red"
              isDisabled={code.length !== 6}
              isLoading={isDisabling}
              onClick={desactivate2FA}
            >
              {t('securitySection.confirm')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}
