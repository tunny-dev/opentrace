import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (!['node_modules', '.next', '.git'].includes(file)) {
        results = results.concat(walk(fullPath));
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.json') || file.endsWith('.css')) {
      results.push(fullPath);
    }
  });
  return results;
}

const files = walk('.');
files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  if (content.includes('Save Configuration')) {
    console.log('Found "Save Configuration" in:', f);
  }
  if (content.includes('Lưu Cấu hình')) {
    console.log('Found "Lưu Cấu hình" in:', f);
  }
});
