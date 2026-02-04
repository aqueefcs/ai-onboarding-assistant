// debug-build.js
try {
  const builtFile = require('./dist/apps/worker/main.js');
  console.log('--------------------------------------------------');
  console.log('Is Handler visible?', builtFile.handler ? 'YES ✅' : 'NO ❌');
  console.log('Exported keys:', Object.keys(builtFile));
  console.log('--------------------------------------------------');
} catch (e) {
  console.error('CRITICAL: Could not load file:', e.message);
}
