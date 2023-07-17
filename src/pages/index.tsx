import { ProsperoLayout } from '@/components/layouts'
import { Button } from '@chakra-ui/react'
import { Inter } from '@next/font/google'


const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  return (
    <ProsperoLayout title={'Home'} pageDescription={'Pagina de inicio de Prospero'}>
      <Button colorScheme='blue'>Button</Button>
    </ProsperoLayout>

  )
}
