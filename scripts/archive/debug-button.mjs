import { cn } from 'cn';
import { cva } from 'class-variance-authority';

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
      },
      size: {
        default: "h-8 gap-1.5 px-2.5",
        sm: "h-7 gap-1 px-2.5 text-[0.8rem]",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    }
  }
);

const customClass = "flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow transition-all disabled:opacity-50 cursor-pointer";

console.log('--- Raw cva output ---');
const raw = buttonVariants({ variant: 'default', size: 'sm', className: customClass });
console.log(raw);

console.log('--- cn(raw) output ---');
console.log(cn(raw));
