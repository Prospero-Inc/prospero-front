import {
  IconButton,
  Input,
  InputGroup,
  InputRightElement
} from '@chakra-ui/react'
import { useState } from 'react'
import { PiEyeLight, PiEyeSlash } from 'react-icons/pi'

export function PasswordInput({ ...rest }) {
  const [showPassword, setShowPassword] = useState(false)
  const handleClick = () => setShowPassword(!showPassword)

  return (
    <InputGroup>
      <Input type={showPassword ? 'text' : 'password'} {...rest} />
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
