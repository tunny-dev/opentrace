import fs from 'fs';

const css = fs.readFileSync('app/globals.css', 'utf8');
const lines = css.split('\n');

lines.forEach((l, i) => {
  if (l.includes('color:') && l.includes('!important')) {
    // print selector
    let selector = [];
    for (let j = Math.max(0, i - 15); j <= i; j++) {
      selector.push(lines[j]);
    }
    console.log(`Line ${i+1}:`);
    console.log(selector.join('\n'));
    console.log('===============================');
  }
});
