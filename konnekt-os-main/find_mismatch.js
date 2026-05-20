import fs from 'fs';
import { execSync } from 'child_process';

try {
  const output = execSync('npx tsc src/App.tsx --noEmit', { encoding: 'utf8' });
  console.log("SUCCESS:", output);
} catch (e) {
  console.log("TypeScript compiler output on stdout:");
  console.log(e.stdout);
  console.log("TypeScript compiler output on stderr:");
  console.log(e.stderr);
}
