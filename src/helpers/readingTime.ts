/**
 * Average words read per minute by an adult reader.
 */
const WORDS_PER_MINUTE = 200;

/**
 * Calculates the estimated reading time in minutes for a given text content.
 * 
 * @param content - The raw content or markdown text of the post.
 * @returns Formatted reading time string such as "5 min read".
 * 
 * @example
 * ```ts
 * const readingTime = calculateReadingTime("A long blog post content...");
 * console.log(readingTime); // "3 min read"
 * ```
 */
export function calculateReadingTime(content: string | undefined): string {
  if (!content || content.trim().length === 0) {
    return "1 min read";
  }

  // Strip markdown formatting symbols and whitespace
  const cleanText = content
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`.*?`/g, "")
    .replace(/[#*_\-\[\]\(\)]/g, " ")
    .trim();

  const words = cleanText.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));

  return `${minutes} min read`;
}

