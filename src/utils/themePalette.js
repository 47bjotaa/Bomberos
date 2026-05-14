export const getThemePalette = (theme) => {
  const isLight = theme === 'light';

  return {
    isLight,
    bg: isLight ? '#F8FAFC' : '#05080F',
    bg2: isLight ? '#F1F5F9' : '#0A0F1E',
    bg3: isLight ? '#E2E8F0' : '#0F1729',
    surface: isLight ? '#FFFFFF' : '#131D35',
    card: isLight ? '#FFFFFF' : '#101827',
    cardSoft: isLight ? '#F8FAFC' : 'rgba(5, 8, 15, 0.5)',
    text: isLight ? '#0F172A' : '#EEF2FF',
    muted: isLight ? '#475569' : '#8EA0D0',
    subtle: isLight ? '#64748B' : '#6B7FA8',
    border: isLight ? 'rgba(15, 23, 42, 0.14)' : 'rgba(148, 163, 184, 0.16)',
    borderStrong: isLight ? 'rgba(15, 23, 42, 0.22)' : '#27324A',
    cyan: '#38BDF8',
    cyanSoft: isLight ? 'rgba(56, 189, 248, 0.12)' : 'rgba(56, 189, 248, 0.10)',
    red: '#E8372A',
    redSoft: isLight ? 'rgba(232, 55, 42, 0.08)' : 'rgba(232, 55, 42, 0.10)',
    disabledBg: isLight ? '#E2E8F0' : '#0F1729',
    overlay: isLight ? 'rgba(15, 23, 42, 0.45)' : 'rgba(0, 0, 0, 0.70)'
  };
};
