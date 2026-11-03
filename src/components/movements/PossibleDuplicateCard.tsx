import { useConfirm } from '@/components/ui/ConfirmSheet'
import { HttpMethod } from '@/enums'
import { localApiService } from '@/lib'
import { HttpError } from '@/lib/apiService'
import { useRevalidateApi } from '@/lib/useApi'
import type { TransactionListItem } from '@/services/transactions'
import { Box, Button, Flex, Text, useToast } from '@chakra-ui/react'
import { useSession } from 'next-auth/react'
import { useTranslation } from 'next-i18next'
import { useState } from 'react'

/**
 * An email with the same amount and date as a movement already logged: no
 * expense was created for it yet. The user settles it either way: it's the
 * same movement (drops the notice) or a different one (creates the expense
 * from the email's data).
 */
export const PossibleDuplicateCard = ({
  duplicate
}: {
  duplicate: NonNullable<TransactionListItem['possibleGmailDuplicate']>
}) => {
  const { t } = useTranslation('common', {
    keyPrefix: 'movements.possibleDuplicate'
  })
  const { t: tCommon } = useTranslation('common')
  const { data: session } = useSession()
  const toast = useToast()
  const confirm = useConfirm()
  const revalidateApi = useRevalidateApi()
  const [pending, setPending] = useState<'dismiss' | 'create' | null>(null)

  const resolve = async (action: 'dismiss' | 'create') => {
    const isDismiss = action === 'dismiss'
    const confirmed = await confirm(
      isDismiss
        ? {
            title: t('dismissConfirmDialog'),
            confirmLabel: tCommon('confirmSheet.dismiss'),
            destructive: true
          }
        : { title: t('confirmDialog') }
    )
    if (!confirmed) return

    const done = isDismiss ? 'dismissed' : 'created'
    setPending(action)
    try {
      await localApiService.request({
        endPoint: `/proxy/${
          isDismiss
            ? 'dismiss-processed-email'
            : 'create-processed-email-anyway'
        }?id=${duplicate.id}`,
        method: HttpMethod.POST,
        headers: { Authorization: `Bearer ${session?.accessToken}` }
      })
      toast({
        title: t(`toast.${done}.title`),
        description: t(`toast.${done}.description`),
        status: 'success'
      })
      await revalidateApi('periods', 'transactions', 'review-queue')
    } catch (error) {
      const known =
        error instanceof HttpError
          ? error.status === 409
            ? 'alreadyResolved'
            : error.status === 422 && !isDismiss
            ? 'missingSnapshot'
            : null
          : null
      toast(
        known
          ? {
              title: t(`toast.${known}.title`),
              description: t(`toast.${known}.description`),
              status: 'warning'
            }
          : {
              title: t('toast.error.title'),
              description:
                error instanceof Error
                  ? error.message
                  : t('toast.error.description'),
              status: 'error'
            }
      )
    } finally {
      setPending(null)
    }
  }

  return (
    <Box as="article" bg="status.pendingBg" borderRadius="16px" p="14px">
      <Text fontSize="13.5px" fontWeight={650} color="text.primary">
        {t('badge')}
      </Text>
      <Text fontSize="13px" color="text.secondary" mt="4px">
        {t('tooltip', {
          senderEmail: duplicate.senderEmail,
          processedAt: duplicate.processedAt.slice(0, 10)
        })}
      </Text>
      <Flex gap="8px" wrap="wrap" mt="12px">
        <Button
          flex="1 1 0"
          h="44px"
          variant="brand"
          fontSize="13px"
          whiteSpace="normal"
          isLoading={pending === 'dismiss'}
          isDisabled={pending === 'create'}
          onClick={() => resolve('dismiss')}
        >
          {t('dismissAction')}
        </Button>
        <Button
          flex="1 1 0"
          h="44px"
          variant="outline"
          fontSize="13px"
          whiteSpace="normal"
          isLoading={pending === 'create'}
          isDisabled={pending === 'dismiss'}
          onClick={() => resolve('create')}
        >
          {t('notSameAction')}
        </Button>
      </Flex>
    </Box>
  )
}
