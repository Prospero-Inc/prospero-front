import { expect, test } from '@playwright/test'

import { merchantKind } from '../src/components/design/merchantKind'

// Movement icons by merchant: the name decides the icon, the category
// keeps deciding the color. Unknown names fall back to the category icon.

test('recognizes gas stations, restaurants, coffee, groceries and rides', () => {
  expect(merchantKind('Gasolina Puma')).toBe('fuel')
  expect(merchantKind('TEXACO LAS CASCADAS')).toBe('fuel')
  expect(merchantKind('Estación Uno Escalón')).toBe('fuel')
  expect(merchantKind('Pizza Hut')).toBe('food')
  expect(merchantKind('POLLO CAMPERO MULTIPLAZA')).toBe('food')
  expect(merchantKind('Pupusería La Ceiba')).toBe('food')
  expect(merchantKind('Uber Eats')).toBe('food')
  expect(merchantKind('Starbucks')).toBe('coffee')
  expect(merchantKind('Café Ben’s')).toBe('coffee')
  expect(merchantKind('Súper Selectos')).toBe('grocery')
  expect(merchantKind('WALMART SAN SALVADOR')).toBe('grocery')
  expect(merchantKind('Uber')).toBe('ride')
  expect(merchantKind('inDrive')).toBe('ride')
})

test('does not match a keyword inside another word', () => {
  // "uno" in "Desayuno", "uber" in "Cuberto", "shell" in "Seashells".
  expect(merchantKind('Desayuno')).not.toBe('fuel')
  expect(merchantKind('Cuberto')).toBeNull()
  expect(merchantKind('Seashells')).toBeNull()
})

test('returns null for names it does not know', () => {
  expect(merchantKind('Cinemark')).toBeNull()
  expect(merchantKind('')).toBeNull()
})
