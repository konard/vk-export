// Test script specifically for EILSEQ error
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Testing EILSEQ error handling...\n');

// Create test directory
const testDir = path.join(__dirname, 'test-data');
if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir, { recursive: true });
}

// Create a file that will definitely trigger EILSEQ with cp1251
// This simulates the exact error from the issue
const eilseqFile = path.join(testDir, 'test-eilseq.html');
const htmlContent = `<!DOCTYPE html>
<html>
<body>
<div class="item">
  <div class="message__header">User Name, at 10:30:45 pm on 15 Jan 2024</div>
  <div></div>
  <div></div>
  <div>Test message with special chars</div>
</div>
</body>
</html>`;

// Create a buffer with intentionally invalid cp1251 sequences
const buffer = Buffer.from(htmlContent, 'utf-8');
// Insert bytes that are invalid in cp1251 encoding
const problematicBytes = Buffer.from([0x98, 0x90, 0x81, 0x8D, 0x8F, 0x9D]);
const modifiedBuffer = Buffer.concat([
  buffer.slice(0, 100),
  problematicBytes,
  buffer.slice(100)
]);

fs.writeFileSync(eilseqFile, modifiedBuffer);
console.log('✓ Created file with invalid cp1251 byte sequences');
console.log(`  File location: ${eilseqFile}`);
console.log(`  File size: ${modifiedBuffer.length} bytes\n`);

console.log('Testing parser with EILSEQ-triggering file...\n');

try {
  const result = execSync(`node private-messages-parser.js -s "${eilseqFile}"`, {
    encoding: 'utf-8',
    cwd: path.join(__dirname, '..'),
    stdio: 'pipe'
  });
  console.log('✓ SUCCESS: Parser handled the file gracefully!');
  console.log(`  Output: ${result.trim()}\n`);

  // Check if the output file was created
  const outputFile = eilseqFile.replace('.html', '.json');
  if (fs.existsSync(outputFile)) {
    console.log('✓ Output JSON file was created successfully');
    const jsonContent = fs.readFileSync(outputFile, 'utf-8');
    const parsed = JSON.parse(jsonContent);
    console.log(`  Messages parsed: ${parsed.length}`);
  }
} catch (error) {
  console.log('✗ FAILED: Parser crashed with error:');
  console.log(`  ${error.message}\n`);
  if (error.stderr) {
    console.log('stderr output:');
    console.log(error.stderr.toString());
  }
  if (error.stdout) {
    console.log('stdout output:');
    console.log(error.stdout.toString());
  }
}

console.log('\n✅ EILSEQ error handling test complete!');
