console.time('Execution Time');

const fs = require('fs');
const path = require('path');
const { program } = require('commander');

program
  .requiredOption('-s, --source <path>', 'source JSON file with message history')
  .option('-t, --target <path>', 'target JSON file for outgoing messages')
  .requiredOption('-a, --author <name>', 'author name to filter (your name in the chat)');

program.parse(process.argv);

const options = program.opts();
if (!options.source) {
  console.log('--source is required');
  process.exit(1);
}
if (!options.author) {
  console.log('--author is required');
  process.exit(1);
}

let sourcePath = options.source;
let targetPath = options.target || path.join(path.dirname(sourcePath), `${path.basename(sourcePath, '.json')}-outgoing.json`);
let authorName = options.author;

// Read the source JSON file
const sourceData = fs.readFileSync(sourcePath, 'utf-8');
const messages = JSON.parse(sourceData);

// Filter outgoing messages (messages authored by the specified author)
const outgoingMessages = messages.filter(message => message.author === authorName);

// Write the filtered messages to the target file
fs.writeFileSync(targetPath, JSON.stringify(outgoingMessages, null, 2));

console.log(`Filtered ${outgoingMessages.length} outgoing messages from ${messages.length} total messages`);
console.log(`Outgoing messages saved to ${targetPath}`);
console.timeEnd('Execution Time');
