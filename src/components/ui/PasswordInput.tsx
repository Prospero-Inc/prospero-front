import {
  IconButton,
  Input,
  InputGroup,
  InputProps,
  InputRightElement
} from '@chakra-ui/react'
import { useTranslation } from 'next-i18next'
import React, { forwardRef, useState } from 'react'
import { PiEyeLight, PiEyeSlash } from 'react-icons/pi'

type PasswordInputProps = InputProps

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  (props, ref) => {
    const { t } = useTranslation('common')
    const [showPassword, setShowPassword] = useState(false)
    const handleClick = () => setShowPassword(!showPassword)

    return (
      <InputGroup>
        <Input
          type={showPassword ? 'text' : 'password'}
          {...props}
          ref={ref} // Pasa el ref al componente Input
        />
        <InputRightElement h="full" w="48px">
          <IconButton
            aria-label={t('passwordInput.toggle')}
            variant="ghost"
            onClick={handleClick}
            icon={showPassword ? <PiEyeSlash /> : <PiEyeLight />}
          />
        </InputRightElement>
      </InputGroup>
    )
  }
)

PasswordInput.displayName = 'PasswordInput' // Establece un displayName para mejor depuración
