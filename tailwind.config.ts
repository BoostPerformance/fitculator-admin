import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
    './src/fonts/**/*.{js,ts,jsx,tsx,mdx}',
    './src/types/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
  	container: {
  		center: true,
  		padding: '2rem'
  	},
  	extend: {
  		fontFamily: {
  			pretendard: [
  				'Pretendard',
  				'sans-serif'
  			],
  			theJamsil: [
  				'TheJamsil',
  				'sans-serif'
  			]
  		},
  		colors: {
  			brand: {
  				'50':  '#EFF6FF',
  				'100': '#DBEAFE',
  				'200': '#BFDBFE',
  				'300': '#93C5FD',
  				'400': '#60A5FA',
  				'500': '#3B82F6',
  				'600': '#0066FF',
  				'700': '#0052CC',
  				'800': '#003D99',
  				'900': '#002966',
  				'950': '#001A40',
  				DEFAULT: '#0066FF',
  			},
  			neutral: {
  				'50':  '#F8F9FB',
  				'100': '#F1F2F6',
  				'200': '#DFE1E6',
  				'300': '#C1C7D0',
  				'400': '#A5ADBA',
  				'500': '#8993A4',
  				'600': '#6B778C',
  				'700': '#505F79',
  				'800': '#344563',
  				'900': '#1B2638',
  				'950': '#0D1117',
  				DEFAULT: '#F1F2F6',
  			},
  			surface: {
  				app:     'var(--bg-app)',
  				DEFAULT: 'var(--bg-surface)',
  				raised:  'var(--bg-surface-raised)',
  				sunken:  'var(--bg-surface-sunken)',
  			},
  			content: {
  				primary:   'var(--text-primary)',
  				secondary: 'var(--text-secondary)',
  				tertiary:  'var(--text-tertiary)',
  				disabled:  'var(--text-disabled)',
  			},
  			line: {
  				DEFAULT:  'var(--border-default)',
  				strong:   'var(--border-strong)',
  				subtle:   'var(--border-subtle)',
  				focus:    'var(--border-focus)',
  			},
  			accent: {
  				DEFAULT:  'var(--primary-color)',
  				hover:    'var(--primary-hover)',
  				subtle:   'var(--primary-subtle)',
  			},
  			status: {
  				success:        'var(--status-success)',
  				'success-subtle': 'var(--status-success-subtle)',
  				'success-text': 'var(--status-success-text)',
  				warning:        'var(--status-warning)',
  				'warning-subtle': 'var(--status-warning-subtle)',
  				'warning-text': 'var(--status-warning-text)',
  				error:          'var(--status-error)',
  				'error-subtle': 'var(--status-error-subtle)',
  				'error-text':   'var(--status-error-text)',
  				info:           'var(--status-info)',
  				'info-subtle':  'var(--status-info-subtle)',
  				'info-text':    'var(--status-info-text)',
  			},
  		},
  		borderRadius: {
  			sm:  'var(--radius-sm)',
  			md:  'var(--radius-md)',
  			lg:  'var(--radius-lg)',
  			xl:  'var(--radius-xl)',
  		},
  		boxShadow: {
  			'elevation-1': '0 1px 3px 0 rgba(0,0,0,0.08)',
  			'elevation-2': '0 4px 12px 0 rgba(0,0,0,0.08)',
  			'elevation-3': '0 8px 24px 0 rgba(0,0,0,0.12)',
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			},
  			'slide-up': {
  				from: {
  					transform: 'translateY(100%)',
  					opacity: '0'
  				},
  				to: {
  					transform: 'translateY(0)',
  					opacity: '1'
  				}
  			},
  			'slide-down': {
  				from: {
  					transform: 'translateY(0)',
  					opacity: '1'
  				},
  				to: {
  					transform: 'translateY(100%)',
  					opacity: '0'
  				}
  			},
  			'fade-in': {
  				from: {
  					opacity: '0'
  				},
  				to: {
  					opacity: '1'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'slide-up': 'slide-up 0.3s ease-out',
  			'slide-down': 'slide-down 0.3s ease-out',
  			'fade-in': 'fade-in 0.2s ease-out'
  		}
  	},
  	fontSize: {
  		'display-lg': ['2.25rem',  { lineHeight: '1.2', letterSpacing: '-0.02em' }],
  		'display':    ['1.875rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
  		'headline-lg':['1.5rem',   { lineHeight: '1.3' }],
  		'headline':   ['1.25rem',  { lineHeight: '1.3' }],
  		'title-lg':   ['1.125rem', { lineHeight: '1.4' }],
  		'title':      ['1rem',     { lineHeight: '1.5' }],
  		'body-lg':    ['0.9375rem',{ lineHeight: '1.5' }],
  		'body':       ['0.875rem', { lineHeight: '1.5' }],
  		'body-sm':    ['0.8125rem',{ lineHeight: '1.5' }],
  		'label-lg':   ['0.8125rem',{ lineHeight: '1.4', letterSpacing: '0.01em' }],
  		'label':      ['0.75rem',  { lineHeight: '1.4', letterSpacing: '0.02em' }],
  		'label-sm':   ['0.6875rem',{ lineHeight: '1.4', letterSpacing: '0.02em' }],
  		'label-xs':   ['0.625rem', { lineHeight: '1.4', letterSpacing: '0.03em' }],
  	},
  	screens: {
  		lg: {
  			min: '1025px'
  		},
  		md: {
  			min: '641px',
  			max: '1024px'
  		},
  		sm: {
  			max: '640px'
  		}
  	}
  },
};
export default config;
