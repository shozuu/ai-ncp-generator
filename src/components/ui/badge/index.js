import { cva } from 'class-variance-authority'

export { default as Badge } from './Badge.vue'

export const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80',
        outline: 'text-foreground',
        // Success variants for "Explained" status
        success:
          'border-transparent bg-green-100 text-green-800 shadow hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30',
        'success-outline':
          'border-green-200 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/20',
        // Warning variants for modified status
        warning:
          'border-transparent bg-amber-100 text-amber-800 shadow hover:bg-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/30',
        'warning-outline':
          'border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-900/20',
        // Info variants for general information
        info: 'border-transparent bg-blue-100 text-blue-800 shadow hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30',
        'info-outline':
          'border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/20',
        // Medical/clinical variants
        clinical:
          'border-transparent bg-teal-100 text-teal-800 shadow hover:bg-teal-200 dark:bg-teal-900/20 dark:text-teal-400 dark:hover:bg-teal-900/30',
        'clinical-outline':
          'border-teal-200 text-teal-700 hover:bg-teal-50 dark:border-teal-800 dark:text-teal-400 dark:hover:bg-teal-900/20',
        // Purple variants for educational content
        educational:
          'border-transparent bg-purple-100 text-purple-800 shadow hover:bg-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:hover:bg-purple-900/30',
        'educational-outline':
          'border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-400 dark:hover:bg-purple-900/20',
        // Neutral variant for subtle emphasis
        muted:
          'border-transparent bg-muted text-muted-foreground hover:bg-muted/80',
        // Format-specific variants
        format:
          'border-transparent bg-slate-100 text-slate-700 shadow hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700',
        // Status variants
        active:
          'border-transparent bg-emerald-100 text-emerald-700 shadow hover:bg-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/30',
        inactive:
          'border-transparent bg-gray-100 text-gray-600 shadow hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700',
      },
      size: {
        default: 'px-2.5 py-0.5 text-xs',
        sm: 'px-2 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)
