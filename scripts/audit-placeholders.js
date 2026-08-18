const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..', 'src');

let count = 0;

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      // Simple string match for the component usage
      if (content.includes('<Placeholder')) {
        console.error(`Found <Placeholder> in ${path.relative(path.join(__dirname, '..'), fullPath)}`);
        count++;
      }
    }
  }
}

walk(ROOT_DIR);

if (count > 0) {
  console.error(`\nAudit failed: ${count} file(s) contain <Placeholder> components.`);
  console.error('All placeholder content must be replaced with real data before launch.');
  process.exit(1);
} else {
  console.log('Audit passed: No <Placeholder> components found.');
  process.exit(0);
}
