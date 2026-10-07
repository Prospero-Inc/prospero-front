import { HttpMethod } from '@/enums'
import { localApiService } from '@/lib'
import { HttpError } from '@/lib/apiService'
import { FinancialInstitution } from '@/services/financialInstitutions'
import {
  Box,
  Button,
  Card,
  CardBody,
  Flex,
  Heading,
  IconButton,
  Input,
  Stack,
  Switch,
  Text,
  useToast
} from '@chakra-ui/react'
import { useSession } from 'next-auth/react'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import { FormEvent, useState } from 'react'
import { MdAdd, MdDelete } from 'react-icons/md'

interface FinancialInstitutionsProps {
  institutions: FinancialInstitution[]
}

export const FinancialInstitutions = ({
  institutions
}: FinancialInstitutionsProps) => {
  const { t } = useTranslation('settings', {
    keyPrefix: 'financialInstitutions'
  })
  const router = useRouter()
  const toast = useToast()
  const { data: session } = useSession()
  const authHeader = { Authorization: `Bearer ${session?.accessToken}` }

  const [newBankName, setNewBankName] = useState('')
  const [newSenderEmail, setNewSenderEmail] = useState<Record<number, string>>(
    {}
  )
  const [isCreating, setIsCreating] = useState(false)
  const [addingSenderFor, setAddingSenderFor] = useState<number | null>(null)
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [deletingInstitutionId, setDeletingInstitutionId] = useState<
    number | null
  >(null)
  const [deletingSenderId, setDeletingSenderId] = useState<number | null>(null)

  const showError = (error: unknown, fallbackKey = 'toast.error') => {
    toast({
      title: t(`${fallbackKey}.title`),
      description:
        error instanceof Error
          ? error.message
          : t(`${fallbackKey}.description`),
      status: 'error',
      isClosable: true
    })
  }

  const onCreateBank = async (event: FormEvent) => {
    event.preventDefault()
    if (!newBankName.trim()) return

    setIsCreating(true)
    try {
      await localApiService.request({
        endPoint: '/proxy/create-financial-institution',
        method: HttpMethod.POST,
        data: { name: newBankName.trim() },
        headers: authHeader
      })
      toast({
        title: t('toast.success.title'),
        description: t('toast.success.description'),
        status: 'success',
        isClosable: true
      })
      setNewBankName('')
      router.replace(router.asPath)
    } catch (error) {
      showError(error)
    } finally {
      setIsCreating(false)
    }
  }

  const onToggleActive = async (institution: FinancialInstitution) => {
    setTogglingId(institution.id)
    try {
      await localApiService.request({
        endPoint: `/proxy/update-financial-institution?id=${institution.id}`,
        method: HttpMethod.PATCH,
        data: { isActive: !institution.isActive },
        headers: authHeader
      })
      router.replace(router.asPath)
    } catch (error) {
      showError(error)
    } finally {
      setTogglingId(null)
    }
  }

  const onDeleteInstitution = async (id: number) => {
    if (!window.confirm(t('list.confirmDelete'))) return

    setDeletingInstitutionId(id)
    try {
      await localApiService.request({
        endPoint: `/proxy/delete-financial-institution?id=${id}`,
        method: HttpMethod.DELETE,
        headers: authHeader
      })
      toast({
        title: t('toast.deleted.title'),
        description: t('toast.deleted.description'),
        status: 'success',
        isClosable: true
      })
      router.replace(router.asPath)
    } catch (error) {
      showError(error)
    } finally {
      setDeletingInstitutionId(null)
    }
  }

  const onAddSender = async (institutionId: number) => {
    const emailAddress = (newSenderEmail[institutionId] || '').trim()
    if (!emailAddress) return

    setAddingSenderFor(institutionId)
    try {
      await localApiService.request({
        endPoint: `/proxy/add-institution-sender?id=${institutionId}`,
        method: HttpMethod.POST,
        data: { emailAddress },
        headers: authHeader
      })
      toast({
        title: t('toast.senderAdded.title'),
        description: t('toast.senderAdded.description'),
        status: 'success',
        isClosable: true
      })
      setNewSenderEmail(prev => ({ ...prev, [institutionId]: '' }))
      router.replace(router.asPath)
    } catch (error) {
      if (error instanceof HttpError && error.status === 409)
        toast({
          title: t('toast.duplicateSender.title'),
          description: t('toast.duplicateSender.description'),
          status: 'warning',
          isClosable: true
        })
      else showError(error)
    } finally {
      setAddingSenderFor(null)
    }
  }

  const onDeleteSender = async (institutionId: number, senderId: number) => {
    setDeletingSenderId(senderId)
    try {
      await localApiService.request({
        endPoint: `/proxy/delete-institution-sender?id=${institutionId}&senderId=${senderId}`,
        method: HttpMethod.DELETE,
        headers: authHeader
      })
      toast({
        title: t('toast.senderDeleted.title'),
        description: t('toast.senderDeleted.description'),
        status: 'success',
        isClosable: true
      })
      router.replace(router.asPath)
    } catch (error) {
      showError(error)
    } finally {
      setDeletingSenderId(null)
    }
  }

  return (
    <Box>
      <Heading size="md" mb={3}>
        {t('title')}
      </Heading>

      <Stack
        as="form"
        onSubmit={onCreateBank}
        direction="row"
        spacing={3}
        mb={4}
        maxW="lg"
      >
        <Input
          value={newBankName}
          onChange={e => setNewBankName(e.target.value)}
          placeholder={t('form.labelName')}
        />
        <Button
          type="submit"
          colorScheme="primary"
          isLoading={isCreating}
          flexShrink={0}
        >
          {t('form.submit')}
        </Button>
      </Stack>

      {institutions.length === 0 ? (
        <Text>{t('list.empty')}</Text>
      ) : (
        <Stack spacing={3}>
          {institutions.map(institution => (
            <Card key={institution.id} variant="outline">
              <CardBody>
                <Stack spacing={3}>
                  <Flex justify="space-between" align="center">
                    <Text fontWeight="bold">{institution.name}</Text>
                    <Flex align="center" gap={3}>
                      <Switch
                        isChecked={institution.isActive}
                        isDisabled={togglingId === institution.id}
                        onChange={() => onToggleActive(institution)}
                      />
                      <IconButton
                        aria-label={t('list.actions.delete')}
                        icon={<MdDelete />}
                        size="sm"
                        variant="ghost"
                        colorScheme="red"
                        isLoading={deletingInstitutionId === institution.id}
                        onClick={() => onDeleteInstitution(institution.id)}
                      />
                    </Flex>
                  </Flex>

                  <Stack spacing={1} pl={2}>
                    {institution.senders.length === 0 ? (
                      <Text fontSize="sm" color="gray.500">
                        {t('senders.empty')}
                      </Text>
                    ) : (
                      institution.senders.map(sender => (
                        <Flex
                          key={sender.id}
                          justify="space-between"
                          align="center"
                        >
                          <Text fontSize="sm">{sender.emailAddress}</Text>
                          <IconButton
                            aria-label={t('senders.actions.delete')}
                            icon={<MdDelete />}
                            size="xs"
                            variant="ghost"
                            colorScheme="red"
                            isLoading={deletingSenderId === sender.id}
                            onClick={() =>
                              onDeleteSender(institution.id, sender.id)
                            }
                          />
                        </Flex>
                      ))
                    )}
                  </Stack>

                  <Stack
                    as="form"
                    direction="row"
                    spacing={2}
                    pl={2}
                    onSubmit={(event: FormEvent) => {
                      event.preventDefault()
                      onAddSender(institution.id)
                    }}
                  >
                    <Input
                      size="sm"
                      type="email"
                      value={newSenderEmail[institution.id] || ''}
                      onChange={e =>
                        setNewSenderEmail(prev => ({
                          ...prev,
                          [institution.id]: e.target.value
                        }))
                      }
                      placeholder={t('senders.labelEmail')}
                    />
                    <IconButton
                      aria-label={t('senders.add')}
                      icon={<MdAdd />}
                      size="sm"
                      type="submit"
                      isLoading={addingSenderFor === institution.id}
                      flexShrink={0}
                    />
                  </Stack>
                </Stack>
              </CardBody>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  )
}
