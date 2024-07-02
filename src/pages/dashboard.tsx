import { FlameIcon } from '@/components/icons/FlameIcon'
import { TotalMoneyIcon } from '@/components/icons/TotalMoneyIcon'
import { ProsperoLayout } from '@/components/layouts'
import { GenericSection } from '@/components/layouts/GenericSection'
import { AmountCard } from '@/components/ui/AmountCard'
import CustomProgressBar from '@/components/ui/CustomProgressBar'
import { GoalsSteps } from '@/components/ui/GoalsSteps'
import { entryAsset, expendituresAsset, walletAsset } from '@/config'
import { Flex } from '@chakra-ui/react'
import React from 'react'

const dashboard = () => {
  return (
    <ProsperoLayout
      title={'DashBoard'}
      pageDescription={'Pagina de inicio de Prospero'}
    >
      <Flex gap={10} flexWrap={'wrap'} justifyContent={'space-around'} mb={3}>
        <AmountCard
          bgColor="walletCard"
          title="Total"
          image={walletAsset}
          totalAmount={100}
          comparisonAmount={3}
          icon={TotalMoneyIcon}
          breakpointsImage={{
            base: '6.36em',
            md: '10em',
            lg: '10em',
            xl: '10em'
          }}
          breakpointsLeftImage={{
            base: '12.8em',
            md: '20.5em',
            lg: '20.5em',
            xl: '20.5em'
          }}
          breakpointsTopImage={{
            base: '1.5em',
            md: '1.5em',
            lg: '1.5em',
            xl: '1.5em'
          }}
        />
        <AmountCard
          bgColor="entryCard"
          title="Ingresos Mensuales"
          totalAmount={100}
          comparisonAmount={3}
          icon={TotalMoneyIcon}
          image={entryAsset}
          breakpointsImage={{
            base: '6.36em',
            md: '7.5em',
            lg: '7.5em',
            xl: '7.5em'
          }}
          breakpointsLeftImage={{
            base: '12.8em',
            md: '22.2em',
            lg: '22.2em',
            xl: '22.2em'
          }}
          breakpointsTopImage={{
            base: '0.2em',
            md: '1.5em',
            lg: '1.5em',
            xl: '1.5em'
          }}
        />
        <AmountCard
          bgColor="expenditureCard"
          title="Gastos Mensuales"
          totalAmount={100}
          comparisonAmount={3}
          icon={FlameIcon}
          image={expendituresAsset}
          breakpointsImage={{
            base: '6.36em',
            md: '10em',
            lg: '10em',
            xl: '10em'
          }}
          breakpointsLeftImage={{
            base: '12.8em',
            md: '20.8em',
            lg: '20.8em',
            xl: '20.8em'
          }}
          breakpointsTopImage={{
            base: '3.5em',
            md: '4.5em',
            lg: '4.5em',
            xl: '4.5em'
          }}
        />
      </Flex>
      <GenericSection title="">
        <GoalsSteps />
      </GenericSection>
    </ProsperoLayout>
  )
}

export default dashboard
