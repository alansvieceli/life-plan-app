const fontWeights = {
  regular: '400',
  medium: '500',
  semibold: '700',
  bold: '800',
} as const;

const serif = 'Fraunces_600SemiBold';

export const typography = {
  screenTitle: {
    fontFamily: serif,
    fontSize: 24,
    fontWeight: fontWeights.regular,
    lineHeight: 30,
  },
  sectionTitle: {
    fontFamily: serif,
    fontSize: 18,
    fontWeight: fontWeights.regular,
    lineHeight: 24,
  },
  cardTitle: { fontSize: 16, fontWeight: fontWeights.semibold, lineHeight: 22 },
  body: { fontSize: 14, fontWeight: fontWeights.medium, lineHeight: 20 },
  bodySmall: { fontSize: 12, fontWeight: fontWeights.medium, lineHeight: 17 },
  label: { fontSize: 11, fontWeight: fontWeights.bold, lineHeight: 15 },
  button: { fontSize: 13, fontWeight: fontWeights.semibold, lineHeight: 18 },
  tab: { fontSize: 12, fontWeight: fontWeights.semibold, lineHeight: 16 },
  input: { fontSize: 16, fontWeight: fontWeights.medium, lineHeight: 22 },
} as const;
