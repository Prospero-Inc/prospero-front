import { defineStyle } from '@chakra-ui/react'

// The reusable rules of docs/diseno-mobile.html's <style> as theme styles,
// so screens say `layerStyle="card"` / `textStyle="help"` / `variant="line"`
// instead of repeating sizes and colors.

export const layerStyles = {
  // .frm, .list: white card with 14 px sides holding rows.
  card: { bg: 'bg.surface', borderRadius: '18px', px: '14px' },
  // .status-card: the same card with 16 px all around.
  statusCard: { bg: 'bg.surface', borderRadius: '18px', p: '16px' },
  // .inst: one bank.
  bankCard: { bg: 'bg.surface', borderRadius: '18px', p: '14px' },
  // .pill-ok / .pill-off
  pillOn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    h: '26px',
    px: '10px',
    borderRadius: '13px',
    bg: 'tint.income',
    color: 'money.incomeText',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  pillOff: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    h: '26px',
    px: '10px',
    borderRadius: '13px',
    bg: 'button.soft',
    color: 'text.secondary',
    fontSize: '12px',
    fontWeight: 'bold'
  }
}

export const textStyles = {
  // .grp: 12 px uppercase section label.
  group: {
    fontSize: '12px',
    fontWeight: 'bold',
    color: 'text.secondary',
    textTransform: 'uppercase',
    letterSpacing: '.06em'
  },
  // .help: muted note under a card.
  help: { fontSize: '12px', color: 'text.secondary', lineHeight: '1.45' },
  // .sw-row .tx .t / .s
  rowTitle: { fontSize: '15px', fontWeight: 600, color: 'text.primary' },
  rowHint: { fontSize: '12.5px', color: 'text.secondary', lineHeight: '1.4' },
  // .frow .k
  rowLabel: { fontSize: '14px', color: 'text.secondary' },
  // .lfield .k
  fieldLabel: { fontSize: '13px', fontWeight: 600, color: 'field.label' }
}

// .btn and its variants. `size="cta"` is the 54 px button, `size="ctaSm"`
// the 44 px .btn.sm.
export const designButtonSizes = {
  cta: defineStyle({
    h: '54px',
    minW: '54px',
    px: '20px',
    borderRadius: '16px',
    fontSize: '16px',
    fontWeight: 'bold'
  }),
  ctaSm: defineStyle({
    h: '44px',
    minW: '44px',
    px: '16px',
    borderRadius: '13px',
    fontSize: '14px',
    fontWeight: 'bold'
  })
}

const disabled = { opacity: 0.45, cursor: 'not-allowed' }

export const designButtonVariants = {
  // .btn
  brand: defineStyle({
    bg: 'brand.solid',
    color: 'white',
    _hover: { bg: 'brand.solid', opacity: 0.92, _disabled: { opacity: 0.45 } },
    _active: { opacity: 0.85 },
    _disabled: disabled
  }),
  // .btn.ghost
  soft: defineStyle({
    bg: 'button.soft',
    color: 'text.primary',
    _hover: { bg: 'button.soft', opacity: 0.9 },
    _active: { opacity: 0.8 },
    _disabled: disabled
  }),
  // .btn.line
  line: defineStyle({
    bg: 'bg.surface',
    color: 'brand.text',
    boxShadow: 'inset 0 0 0 1.5px var(--chakra-colors-brand-border)',
    _hover: { bg: 'bg.surface', opacity: 0.9 },
    _active: { opacity: 0.8 },
    _disabled: disabled
  }),
  // .btn.danger
  danger: defineStyle({
    bg: 'bg.surface',
    color: 'money.expenseText',
    boxShadow: 'inset 0 0 0 1.5px var(--chakra-colors-danger-border)',
    _hover: { bg: 'bg.surface', opacity: 0.9 },
    _active: { opacity: 0.8 },
    _disabled: disabled
  }),
  // .btn.danger-solid
  dangerSolid: defineStyle({
    bg: 'money.expenseText',
    color: 'bg.surface',
    _hover: { bg: 'money.expenseText', opacity: 0.92 },
    _active: { opacity: 0.85 },
    _disabled: disabled
  })
}
