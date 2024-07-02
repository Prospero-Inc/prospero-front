import { ProsperoLayout } from '@/components/layouts'
import { WalletCard } from '@/components/ui/WalletCard'
import React from 'react'

const dashboard = () => {
  return (
    <ProsperoLayout
      title={'DashBoard'}
      pageDescription={'Pagina de inicio de Prospero'}
    >
      <WalletCard totalAmount={100} comparisonAmount={3} />
    </ProsperoLayout>
  )
}

export default dashboard
