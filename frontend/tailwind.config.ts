import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Midnight Operations base palette ──────────────────────
        'brand-base':         '#070a12',  // deep midnight background
        'brand-bg':           '#0a0f1d',  // primary dark background
        'brand-surface':      '#0e1629',  // card/panel surfaces
        'brand-surface-2':    '#141f38',  // elevated cards / inputs
        'brand-surface-3':    '#1a294b',  // hover states / active containers
        'brand-border':       '#1e2d4d',  // primary borders
        'brand-border-light': '#2d4066',  // highlighted borders
        'brand-border-subtle':'#141f36',  // subtle separators

        // ── Brand Accents ──────────────────────────────────────────
        'brand-accent':       '#4f46e5',  // electric indigo primary
        'brand-accent-hover': '#4338ca',  // indigo hover
        'brand-accent-muted': '#1e1b4b',  // muted indigo container
        'brand-accent-glow':  'rgba(99, 102, 241, 0.25)',
        'brand-cyan':         '#06b6d4',  // telemetry cyan highlight
        'brand-cyan-muted':   '#083344',  // muted cyan background
        'brand-cyan-glow':    'rgba(6, 182, 212, 0.25)',

        // ── Severity Semantic Colors ────────────────────────────────
        'severity-p1':        '#ef4444',  // red-500  — CRITICAL
        'severity-p1-bg':     '#450a0a',  // red-950  — CRITICAL background
        'severity-p1-border': '#7f1d1d',  // red-900 border
        'severity-p2':        '#f97316',  // orange-500 — HIGH
        'severity-p2-bg':     '#431407',  // orange-950 — HIGH background
        'severity-p2-border': '#7c2d12',
        'severity-p3':        '#f59e0b',  // amber-500 — MEDIUM
        'severity-p3-bg':     '#451a03',  // amber-950 — MEDIUM background
        'severity-p3-border': '#78350f',
        'severity-p4':        '#38bdf8',  // sky-400 — LOW
        'severity-p4-bg':     '#082f49',  // sky-950 — LOW background
        'severity-p4-border': '#075985',

        // ── Status Colors ───────────────────────────────────────────
        'status-investigating':'#6366f1', // indigo-500
        'status-investigating-bg':'#1e1b4b',
        'status-resolved':    '#10b981',  // emerald-500
        'status-resolved-bg': '#022c22',  // emerald-950
        'status-failed':      '#ef4444',  // red-500
        'status-failed-bg':   '#450a0a',
        'status-pending':     '#64748b',  // slate-500
        'status-pending-bg':  '#0f172a',

        // ── Similarity Tier Colors ──────────────────────────────────
        'sim-high':           '#10b981',  // emerald-500
        'sim-high-bg':        '#022c22',
        'sim-medium':         '#f59e0b',  // amber-500
        'sim-medium-bg':      '#451a03',
        'sim-low':            '#64748b',  // slate-500
        'sim-low-bg':         '#0f172a',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'brand-sm':  '0 1px 3px 0 rgba(0,0,0,0.5)',
        'brand-md':  '0 4px 16px 0 rgba(0,0,0,0.6)',
        'brand-lg':  '0 10px 30px -5px rgba(0,0,0,0.7)',
        'brand-card':'0 4px 20px -2px rgba(2, 6, 23, 0.7)',
        'brand-accent': '0 0 20px -3px rgba(79, 70, 229, 0.35)',
        'brand-cyan':   '0 0 20px -3px rgba(6, 182, 212, 0.35)',
        'brand-glow':   '0 0 25px -5px rgba(99, 102, 241, 0.2)',
      },
      borderRadius: {
        'brand': '0.5rem',
        'brand-lg': '0.75rem',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan':       'scan 2s ease-in-out infinite alternate',
        'shimmer':    'shimmer 2s infinite',
        'spin-slow':  'spin 3s linear infinite',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
