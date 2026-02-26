import "dotenv/config";
import "cheerio";
import { CharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";

const logDocument = new Document({
    pageContent: `[2024-01-15 10:00:00] INFO: Application ApplicationApplicationApplicationApplicationApplicationApplicationApplicationApplicationApplicationApplicationApplicationApplicationApplicationApplicationApplicationApplicationApplicationApplicationApplicationApplicationApplicationApplicationApplication started
[2024-01-15 10:00:05] DEBUG: Loading configuration file
[2024-01-15 10:00:10] INFO: Database connection established
[2024-01-15 10:00:15] WARNING: Rate limit approaching
[2024-01-15 10:00:20] ERROR: Failed to process request
[2024-01-15 10:00:25] INFO: Retrying operation
[2024-01-15 10:00:30] SUCCESS: Operation completed`
});

const logTextSplitter = new CharacterTextSplitter({
    separator: '\n',
    chunkSize: 200,
    chunkOverlap: 20 //here overLap is useless
});

const splitDocuments = await logTextSplitter.splitDocuments([logDocument]);

// which will output `Created a chunk of size 301, +
// which is longer than the specified 200`
// cause CharacterTextSplitter will not split on separator if the chunk is still larger than chunkSize
console.log(splitDocuments);


// here overlap is useful
const longText = "This is a very long sentence without any newlines that exceeds the chunkSize of 20 characters.";
const splitter = new CharacterTextSplitter({
  separator: " ", // Split by spaces (but no guarantee of chunkSize)
  chunkSize: 20,
  chunkOverlap: 9,
});
const chunks = await splitter.splitText(longText);
console.log(chunks);
