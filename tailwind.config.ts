import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
    },
    extend: {
      fontFamily: {
        pretendard: ['var(--pretendard)'],
        theJamsil: ['TheJamsil', 'sans-serif'],
      },
      colors: {
        black: {
          DEFAULT: '#131313',
          1: '#111212',
        },
        blue: {
          DEFAULT: '#EBF8FF',
          1: '#0066FF',
          2: '#00BBF5',
          3: '#EDF4F8',
          4: '#181C32',
          5: '#219DF6',
        },
        green: {
          DEFAULT: '#48BA5D',
        },
        yellow: {
          DEFAULT: '#FDB810',
        },
        gray: {
          DEFAULT: '#F2F2F2',
          1: '#625C5C',
          2: '#8D8D8D',
          3: '#D9D9D9',
          4: '#A3AAAD;',
          5: '#5E5A5A',
          6: '#686868',
          7: '#9E9E9E',
          8: '#F6F6F6',
          9: '#E0E0E0',
          10: '#BDBDBD',
          11: '#A1A1A1',
          12: '#767676',
          13: '#E1E1E1',
        },
        red: {
          DEFAULT: '#DD204E',
        },
        white: {
          DEFAULT: '#FFFFFF',
          1: '#F9FAFF;',
        },
      },
    },
    fontSize: {
      '0.625-500': [' 0.625rem', { fontWeight: 500 }],
      '0.7-700': ['0.7rem', { fontWeight: 700 }],
      '0.75-500': ['0.75rem', { fontWeight: 500 }],
      '0.875-400': [' 0.875rem', { fontWeight: 400 }],
      '0.875-500': [' 0.875rem', { fontWeight: 500 }],
      '0.875-700': [' 0.875rem', { fontWeight: 700 }],
      '1-500': ['1rem', { fontWeight: 500 }],
      '1-600': ['1rem', { fontWeight: 600 }],
      '1-700': ['1rem', { fontWeight: 700 }],
      '1-900': ['1rem', { fontWeight: 900 }],
      '1.125-500': ['1.125rem', { fontWeight: 500 }],
      '1.125-700': ['1.125rem', { fontWeight: 700 }],
      '1.25-500': ['1.25rem', { fontWeight: 500 }],
      '1.25-700': ['1.25rem', { fontWeight: 700 }],
      '1.25-900': ['1.25rem', { fontWeight: 900 }],
      '1.375-700': ['1.375rem', { fontWeight: 700 }],
      '1.5-400': ['1.5rem', { fontWeight: 400 }],
      '1.5-500': ['1.5rem', { fontWeight: 500 }],
      '1.5-700': ['1.5rem', { fontWeight: 700 }],
      '1.5-900': ['1.5rem', { fontWeight: 900 }],
      '1.6-700': ['1.6rem', { fontWeight: 700 }],
      '1.75-400': ['1.75rem', { fontWeight: 400 }],
      '1.75-500': ['1.75rem', { fontWeight: 500 }],
      '1.75-700': ['1.75rem', { fontWeight: 700 }],
      '1.75-900': ['1.75rem', { fontWeight: 900 }],
      '1.875-300': ['1.87rem', { fontWeight: 300 }],
      '1.875-400': ['1.87rem', { fontWeight: 400 }],
      '1.875-500': ['1.875rem', { fontWeight: 500 }],
      '2-700': ['2rem', { fontWeight: 700 }],
      '2-900': ['2rem', { fontWeight: 900 }],
      '2.25-700': ['2.25rem', { fontWeight: 700 }],
      '2.5-700': ['2.5rem', { fontWeight: 700 }],
      '2.5-900': ['2.5rem', { fontWeight: 900 }],
      '3-700': ['3rem', { fontWeight: 700 }],
      '3.7-900': ['3.7rem', { fontWeight: 900 }],
      '4.25-500': ['4.25rem', { fontWeight: 500 }],
    },
    screens: {
      lg: { min: '1026px' },
      md: { min: '768px', max: '1025px' },
      sm: { max: '767px' },
    },
  },
};
export default config;
