import { cn } from '@/lib/utils';

const variants = {
  default:   'bg-[#1B3A4B] text-white hover:bg-[#1B3A4B]/90',
  outline:   'border border-[#111111] text-[#111111] bg-transparent hover:bg-[#111111] hover:text-white',
  ghost:     'hover:bg-gray-100',
  destructive: 'bg-red-600 text-white hover:bg-red-700',
};

const sizes = {
  default: 'px-4 py-2 text-sm',
  sm:      'px-3 py-1.5 text-xs',
  lg:      'px-6 py-3 text-base',
  icon:    'p-2',
};

export function Button({ className, variant = 'default', size = 'default', children, ...props }) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
