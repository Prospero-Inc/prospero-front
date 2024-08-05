import { ProsperoLayout } from '@/components/layouts'
import { Button } from '@chakra-ui/react'

export default function Home() {
  return (
    <ProsperoLayout
      title={'Home'}
      pageDescription={'Pagina de inicio de Prospero'}
    >
      <Button colorScheme="primary">Button</Button>
    </ProsperoLayout>
  )
}
