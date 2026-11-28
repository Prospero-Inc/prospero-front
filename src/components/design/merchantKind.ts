export type MerchantKind = 'food' | 'coffee' | 'fuel' | 'grocery' | 'ride'

// shortcut: fixed keyword lists for El Salvador merchants; move to the
// backend's merchant rules if users need to correct or extend them.
// First match wins, so "Uber Eats" is food before "Uber" is a ride.
const KEYWORDS: [MerchantKind, string[]][] = [
  [
    'food',
    [
      'restaurante',
      'restaurant',
      'pizza',
      'pizzeria',
      'pupuseria',
      'pupusas',
      'campero',
      'mcdonald',
      'burger',
      'wendy',
      'kfc',
      'subway',
      'taco bell',
      'sushi',
      'comedor',
      'uber eats',
      'pedidosya',
      'hugo'
    ]
  ],
  ['coffee', ['cafe', 'coffee', 'starbucks', 'juan valdez']],
  [
    'fuel',
    ['gasolina', 'gasolinera', 'puma', 'texaco', 'uno', 'shell', 'alba', 'esso']
  ],
  [
    'grocery',
    ['super', 'supermercado', 'selectos', 'walmart', 'despensa', 'pricesmart']
  ],
  ['ride', ['uber', 'didi', 'indrive', 'indriver', 'taxi']]
]

/** Kind of merchant from a movement's name, matching whole words only
 * (accents and case ignored); null when the name isn't recognized. */
export const merchantKind = (name: string): MerchantKind | null => {
  const words = ` ${name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .join(' ')} `
  const match = KEYWORDS.find(([, keywords]) =>
    keywords.some(keyword => words.includes(` ${keyword} `))
  )
  return match ? match[0] : null
}
