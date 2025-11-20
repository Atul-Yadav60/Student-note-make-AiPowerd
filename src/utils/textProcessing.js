/**
 * Text preprocessing and chunking utilities
 */

/**
 * Normalize whitespace and headings in text
 */
export function normalizeText(text) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

/**
 * Split text into chunks with overlap
 * @param {string} text - The text to chunk
 * @param {number} maxWords - Maximum words per chunk (default: 1500)
 * @param {number} overlapPercent - Overlap percentage (default: 25)
 * @returns {Array<string>} Array of text chunks
 */
export function chunkText(text, maxWords = 1500, overlapPercent = 25) {
  const normalized = normalizeText(text);
  const words = normalized.split(/\s+/);

  // If text is short enough, return as single chunk
  if (words.length <= maxWords) {
    return [normalized];
  }

  const chunks = [];
  const overlapWords = Math.floor(maxWords * (overlapPercent / 100));
  let startIdx = 0;

  while (startIdx < words.length) {
    const endIdx = Math.min(startIdx + maxWords, words.length);
    const chunk = words.slice(startIdx, endIdx).join(" ");
    chunks.push(chunk);

    // Move forward, accounting for overlap
    if (endIdx >= words.length) break;
    startIdx = endIdx - overlapWords;
  }

  return chunks;
}

/**
 * Extract text from different file types
 * @param {File} file - The uploaded file
 * @returns {Promise<string>} Extracted text
 */
export async function extractTextFromFile(file) {
  const fileType = file.type;

  if (fileType === "text/plain") {
    return await file.text();
  }

  if (fileType === "application/pdf") {
    return await extractTextFromPDF(file);
  }

  if (
    fileType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return await extractTextFromDocx(file);
  }

  throw new Error(
    "Unsupported file type. Please upload PDF, DOCX, or TXT files."
  );
}

/**
 * Extract text from PDF using pdf.js
 */
async function extractTextFromPDF(file) {
  try {
    // Dynamically import pdfjs-dist
    const pdfjsLib = await import("pdfjs-dist");

    // Set worker path
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item) => item.str).join(" ");
      fullText += pageText + "\n\n";
    }

    return fullText.trim();
  } catch (error) {
    console.error("PDF extraction error:", error);
    throw new Error(
      "Failed to extract text from PDF. Please ensure the PDF contains selectable text."
    );
  }
}

/**
 * Extract text from DOCX using mammoth
 */
async function extractTextFromDocx(file) {
  try {
    const mammoth = await import("mammoth");
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  } catch (error) {
    console.error("DOCX extraction error:", error);
    throw new Error("Failed to extract text from DOCX file.");
  }
}

/**
 * Count words in text
 */
export function countWords(text) {
  return text.trim().split(/\s+/).length;
}

/**
 * Estimate reading time in minutes
 */
export function estimateReadingTime(text) {
  const words = countWords(text);
  const wordsPerMinute = 200;
  return Math.ceil(words / wordsPerMinute);
}
