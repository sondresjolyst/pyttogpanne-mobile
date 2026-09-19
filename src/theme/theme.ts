import { Platform } from 'react-native';

export const colors = {
    /** Warm paper, the ground everything sits on. */
    paper: '#FAF6EC',
    paperSunk: '#F0E9D8',
    ink: '#2A2017',
    inkSoft: '#6F6152',
    brown: '#4A3726',
    brownSoft: '#6B513A',
    ember: '#C0431C',
    emberSoft: '#F0D9CE',
    moss: '#5A6B4A',
    line: '#E6DCC6',
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
    sm: 10,
    md: 18,
    lg: 28,
    pill: 999,
} as const;

/**
 * A serif for the things a reader lingers on, the system sans for everything functional.
 * Both are on the device already, so nothing loads before the app can be used offline.
 */
const serif = Platform.select({ ios: 'Georgia', default: 'serif' });

export const type = {
    display: { fontFamily: serif, fontSize: 30, lineHeight: 38, fontWeight: '700' },
    title: { fontFamily: serif, fontSize: 21, lineHeight: 28, fontWeight: '700' },
    heading: { fontSize: 17, lineHeight: 22, fontWeight: '700' },
    body: { fontSize: 16, lineHeight: 25, fontWeight: '400' },
    bodyStrong: { fontSize: 16, lineHeight: 25, fontWeight: '600' },
    meta: { fontSize: 13, lineHeight: 18, fontWeight: '500' },
} as const;

/** Warm shadows rather than grey ones: a grey shadow on warm paper reads as dirt. */
export const shadow = {
    card: {
        shadowColor: '#4A3726',
        shadowOpacity: 0.1,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 },
        elevation: 3,
    },
    float: {
        shadowColor: '#2A2017',
        shadowOpacity: 0.22,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 10 },
        elevation: 12,
    },
} as const;

/** Height the floating tab bar needs, so scrollable content can clear it. */
export const TAB_BAR_CLEARANCE = 96;
