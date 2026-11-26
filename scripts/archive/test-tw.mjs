import { twMerge } from 'tailwind-merge';

const s = `group/button bg-primary text-primary-foreground hover:bg-primary/80 flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow transition-all disabled:opacity-50 cursor-pointer`;

console.log(twMerge(s));
