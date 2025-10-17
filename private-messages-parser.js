console.time('Execution Time');

const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const { DateTime } = require("luxon");
const fs = require('fs');
var Iconv = require('iconv').Iconv;
const path = require('path');
const { program } = require('commander');

program
  .requiredOption('-s, --source <path>', 'source HTML file')
  .option('-t, --target <path>', 'target JSON file');

program.parse(process.argv);

const options = program.opts();
if (!options.source) {
  console.log('--source is required');
  process.exit(1);
}

let sourcePath = options.source;
let targetPath = options.target || path.join(path.dirname(sourcePath), `${path.basename(sourcePath, '.html')}.json`);

// console.log(sourcePath);
// console.log(targetPath);

// Try to read and decode the file with error handling
let decoded;
try {
  const encoded = fs.readFileSync(sourcePath);

  // Try cp1251 first (VK's default encoding)
  try {
    var iconv = new Iconv('cp1251', 'utf-8');
    decoded = iconv.convert(encoded).toString();
  } catch (encodingError) {
    if (encodingError.code === 'EILSEQ') {
      // If cp1251 fails, try UTF-8 directly
      console.warn('Warning: cp1251 decoding failed, trying UTF-8...');
      decoded = encoded.toString('utf-8');
    } else {
      throw encodingError;
    }
  }
} catch (error) {
  console.error(`Error reading file ${sourcePath}:`, error.message);
  process.exit(1);
}

const dom = new JSDOM(decoded);
const $ = require("jquery")(dom.window);
let result = [];
$(".item").each(function() {
  let $msg = $(".message__header", this);
  let $text = $($("div", this)[3]);
  
  let match = $msg.text().match(/^([^,]+), (at \d+:\d+:\d+ [pa]m on \d+ \w+ \d+)\s*(\(edited\))?/);
  let date = DateTime.fromFormat(match[2], "'at' h:mm:ss a 'on' d MMM yyyy");

  let message = {
    id: $(this).find('.message').attr('data-id'),
    author: match[1],
    date,
    isEdited: !!match[3]
  }
  
  let hasAttachment = $text.has('.attachment').length; // todo process multiple attachments
  if (hasAttachment) {
    message.attachment = {
      description: $('.attachment__description', this).text().trim(),
      link: $('.attachment__link', this).attr('href')
    }
  }

  $('.kludges', this).remove();
  message.text = $text.html().replace(/<br\s*[\/]?>/gi, "\n").trim();

  result.push(message);
});

fs.writeFileSync(targetPath, JSON.stringify(result, null, 2));

console.log(`${result.length} messages saved to ${targetPath}`);
console.timeEnd('Execution Time');