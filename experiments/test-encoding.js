// Test script to validate encoding handling
const fs = require('fs');
const path = require('path');

console.log('Testing encoding handling...\n');

// Create test directory
const testDir = path.join(__dirname, 'test-data');
if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir, { recursive: true });
}

// Test 1: Create a valid UTF-8 HTML file
const utf8File = path.join(testDir, 'test-utf8.html');
const utf8Content = `<!DOCTYPE html>
<html>
<body>
<div class="item">
  <div class="message__header">John Doe, at 10:30:45 pm on 15 Jan 2024</div>
  <div></div>
  <div></div>
  <div>Hello World! Тест</div>
</div>
</body>
</html>`;
fs.writeFileSync(utf8File, utf8Content, 'utf-8');
console.log('✓ Created UTF-8 test file');

// Test 2: Create a file with mixed content (simulating potential encoding issues)
const mixedFile = path.join(testDir, 'test-mixed.html');
fs.writeFileSync(mixedFile, utf8Content, 'utf-8');
console.log('✓ Created mixed encoding test file');

// Test 3: Try to create a file with invalid byte sequence (in a buffer)
const invalidFile = path.join(testDir, 'test-invalid.html');
const buffer = Buffer.from(utf8Content, 'utf-8');
// Inject an invalid cp1251 sequence
const modifiedBuffer = Buffer.concat([
  buffer.slice(0, 50),
  Buffer.from([0xFF, 0xFE, 0xFD]), // Invalid sequences
  buffer.slice(50)
]);
fs.writeFileSync(invalidFile, modifiedBuffer);
console.log('✓ Created file with potentially problematic bytes');

console.log('\nTest files created in:', testDir);
console.log('\nNow testing the parser with these files...\n');

// Test the parser
const { execSync } = require('child_process');

const testFiles = [utf8File, mixedFile, invalidFile];

testFiles.forEach((file, index) => {
  console.log(`Test ${index + 1}: Processing ${path.basename(file)}...`);
  try {
    const result = execSync(`node private-messages-parser.js -s "${file}"`, {
      encoding: 'utf-8',
      cwd: path.join(__dirname, '..')
    });
    console.log(`  ✓ Success: ${result.trim()}`);
  } catch (error) {
    console.log(`  ✗ Failed: ${error.message}`);
  }
  console.log();
});

console.log('Testing complete!');
