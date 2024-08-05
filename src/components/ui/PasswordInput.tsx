import {
  IconButton,
  Input,
  InputGroup,
  InputProps,
  InputRightElement
} from '@chakra-ui/react'
import React, { forwardRef, useState } from 'react'
import { PiEyeLight, PiEyeSlash } from 'react-icons/pi'

type PasswordInputProps = InputProps

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  (props, ref) => {
    const [showPassword, setShowPassword] = useState(false)
    const handleClick = () => setShowPassword(!showPassword)

    return (
      <InputGroup>
        <Input
          type={showPassword ? 'text' : 'password'}
          {...props}
          ref={ref} // Pasa el ref al componente Input
        />
        <InputRightElement h="full">
          <IconButton
            aria-label="Toggle password visibility"
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
