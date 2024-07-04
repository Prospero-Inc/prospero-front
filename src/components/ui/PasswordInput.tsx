import { Button, Input, InputGroup, InputRightElement } from '@chakra-ui/react'
import { useState } from 'react'
import { FiEye, FiEyeOff } from 'react-icons/fi'

export function PasswordInput({ ...rest }) {
  const [show, setShow] = useState(false)
  const handleClick = () => setShow(!show)

  return (
    <InputGroup size="md">
      <Input
        {...rest}
        pr="4.5rem"
        type={show ? 'text' : 'password'}
        placeholder="Enter password"
      />
      <InputRightElement width="4.5rem">
        <Button h="1.90rem" top={[0, 0, 1]} size="sm" onClick={handleClick}>
          {show ? <FiEyeOff /> : <FiEye />}
        </Button>
      </InputRightElement>
    </InputGroup>
  )
}
