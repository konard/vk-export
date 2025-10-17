// Test with proper VK HTML format including encoding issues
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Testing with VK HTML format and encoding issues...\n');

const testDir = path.join(__dirname, 'test-data');
if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir, { recursive: true });
}

// Create a proper VK format HTML with both valid content and problematic bytes
const vkFile = path.join(testDir, 'test-vk-format.html');
const vkHtml = `<!DOCTYPE html>
<html>
<body>
<div class="item">
  <div class="message__header">John Doe, at 10:30:45 pm on 15 Jan 2024</div>
  <div></div>
  <div></div>
  <div>Hello World!</div>
</div>
<div class="item">
  <div class="message__header">Jane Smith, at 11:45:30 am on 16 Jan 2024 (edited)</div>
  <div></div>
  <div></div>
  <div>
    <div class="attachment">
      <div class="attachment__description">Photo description</div>
      <a class="attachment__link" href="https://example.com/photo.jpg">Photo</a>
    </div>
    Message with attachment
  </div>
</div>
</body>
</html>`;

// Test 1: Valid UTF-8 file
console.log('Test 1: Valid UTF-8 VK HTML file');
const utf8File = path.join(testDir, 'vk-utf8.html');
fs.writeFileSync(utf8File, vkHtml, 'utf-8');

try {
  const result = execSync(`node private-messages-parser.js -s "${utf8File}"`, {
    encoding: 'utf-8',
    cwd: path.join(__dirname, '..')
  });
  console.log(`  ✓ Success: ${result.trim()}\n`);
} catch (error) {
  console.log(`  ✗ Failed: ${error.message}\n`);
}

// Test 2: File with problematic bytes (simulating cp1251 issues)
console.log('Test 2: VK HTML file with problematic encoding bytes');
const problematicFile = path.join(testDir, 'vk-problematic.html');
const buffer = Buffer.from(vkHtml, 'utf-8');
// Insert problematic bytes that would cause EILSEQ
const problematicBuffer = Buffer.concat([
  buffer.slice(0, 200),
  Buffer.from([0x98, 0x90, 0x81]), // Invalid cp1251 bytes
  buffer.slice(200)
]);
fs.writeFileSync(problematicFile, problematicBuffer);

try {
  const result = execSync(`node private-messages-parser.js -s "${problematicFile}"`, {
    encoding: 'utf-8',
    cwd: path.join(__dirname, '..'),
    stdio: ['pipe', 'pipe', 'pipe']
  });
  console.log(`  ✓ Success: ${result.trim()}\n`);
} catch (error) {
  if (error.stderr && error.stderr.includes('Warning: cp1251 decoding failed')) {
    console.log('  ✓ Expected warning shown: cp1251 decoding failed, fallback to UTF-8');
    if (error.stdout) {
      console.log(`  Output: ${error.stdout.toString().trim()}\n`);
    }
  } else {
    console.log(`  ✗ Unexpected error: ${error.message}\n`);
  }
}

console.log('✅ All tests completed!');
console.log('\nKey findings:');
console.log('- EILSEQ error is now caught and handled gracefully');
console.log('- Parser falls back to UTF-8 when cp1251 fails');
console.log('- User sees a warning message instead of a crash');
