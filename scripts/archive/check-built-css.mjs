import fs from 'fs';
import path from 'path';

const cssDir = '.next/static/chunks';
function findCss(dir) {
  let files = [];
  const list = fs.readdirSync(dir);
  for (const item of list) {
    const p = path.join(dir, item);
    const s = fs.statSync(p);
    if (s.isDirectory()) files.push(...findCss(p));
    else if (p.endsWith('.css')) files.push(p);
  }
  return files;
}

const cssFiles = findCss('.next/static');
console.log('Found CSS files:', cssFiles);

cssFiles.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  console.log(`=== File: ${f} (${content.length} bytes) ===`);
  // search for emerald-600 or text-white
  if (content.includes('emerald-600') || content.includes('text-white')) {
    console.log('Has emerald-600 and text-white');
  }
});
