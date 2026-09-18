export const colors = {
    paper: '#F5F1E6',
    paperSunk: '#EBE5D6',
    ink: '#241C14',
    inkSoft: '#6B5B4A',
    brown: '#4A3726',
    ember: '#C0431C',
    moss: '#5A6B4A',
    line: '#DCD3BE',
    white: '#FFFFFF',
} as const;

export const space = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
} as const;

export const radius = {
    sm: 8,
    md: 14,
    lg: 22,
} as const;

export const type = {
    display: { fontSize: 30, lineHeight: 34, fontWeight: '800' },
    title: { fontSize: 22, lineHeight: 27, fontWeight: '700' },
    heading: { fontSize: 17, lineHeight: 22, fontWeight: '700' },
    body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
    bodyStrong: { fontSize: 16, lineHeight: 24, fontWeight: '600' },
    meta: { fontSize: 13, lineHeight: 18, fontWeight: '500' },
} as const;
