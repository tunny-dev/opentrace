import fs from 'fs';

const css = fs.readFileSync('app/globals.css', 'utf8');

// Find any CSS rules that set color: or fill: on button, form button, etc.
const lines = css.split('\n');
lines.forEach((l, i) => {
  if (l.includes('color:') && (lines[i-1]?.includes('button') || lines[i-2]?.includes('button') || lines[i-3]?.includes('button') || lines[i-4]?.includes('button'))) {
    console.log(`Line ${i+1}:`);
    console.log(lines.slice(Math.max(0, i-4), i+2).join('\n'));
    console.log('---');
  }
});
