import fs from 'node:fs';
import path from 'node:path';

const sourcePdf = path.resolve('cv', 'cv.pdf');
const targetDir = path.resolve('public', 'cv');
const targetPdf = path.resolve(targetDir, 'cv.pdf');

try {
  if (!fs.existsSync(sourcePdf)) {
    console.warn('CV sync: source PDF not found at cv/cv.pdf; skipping copy.');
    process.exit(0);
  }

  fs.mkdirSync(targetDir, { recursive: true });
  fs.copyFileSync(sourcePdf, targetPdf);
  console.log('CV sync: copied cv/cv.pdf -> public/cv/cv.pdf');
} catch (error) {
  console.error('CV sync failed:', error);
  process.exit(1);
}
