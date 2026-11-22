import fs from 'fs';

const css = fs.readFileSync('.next/static/chunks/2ft2tik08zdwe.css', 'utf8');

const match2 = css.match(/([^{}]*(?:button|data-slot="button")[^{}]*\{[^}]*color:[^}]*\})/g);
if (match2) {
  match2.forEach((r, i) => console.log(`${i+1}: ${r}`));
}
