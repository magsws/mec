/**
 * Tema do aplicativo MundoemCores.com
 * Contém as cores, fontes e estilos padrão do aplicativo
 */

export const COLORS = {
  primary: '#b72f2f',      // Vermelho
  secondary: '#dec024',    // Amarelo
  tertiary: '#9cac3b',     // Verde Claro
  quaternary: '#367c53',   // Verde Escuro
  dark: '#23364e',         // Azul
  white: '#FFFFFF',
  black: '#000000',
  gray: '#F5F5F5',
  lightGray: '#E0E0E0',
  darkGray: '#757575',
  transparent: 'transparent',
};

export const FONT = {
  regular: 'Nunito-Regular',
  medium: 'Nunito-Medium',
  semiBold: 'Nunito-SemiBold',
  bold: 'Nunito-Bold',
};

export const SIZES = {
  xSmall: 10,
  small: 12,
  medium: 16,
  large: 20,
  xLarge: 24,
  xxLarge: 32,
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 5.84,
    elevation: 5,
  },
};

export default { COLORS, FONT, SIZES, SHADOWS };
