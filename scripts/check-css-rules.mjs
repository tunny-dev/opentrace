import fs from 'fs';

const css = fs.readFileSync('.next/static/chunks/2ft2tik08zdwe.css', 'utf8');

// Search for rules defining text-white
const match1 = css.match(/([^{}]*text-white[^{}]*\{[^}]*\})/g);
console.log('text-white rules:', match1);

// Search for any rule matching button or data-slot="button" that sets color
const match2 = css.match(/([^{}]*(?:button|data-slot="button")[^{}]*\{[^}]*color:[^}]*\})/g);
console.log('button color rules count:', match2?.length);
if (match2) {
  match2.slice(0, 10).forEach(r => console.log(' -> ', r));
}
