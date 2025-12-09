export function safeJsonParse<T>(text: string): T | null {
  if (!text) return null;

  const cleaned = text
    .replace(/^\uFEFF/, '') 
    .replace(/\r\n|\r|\n/g, '')
    .replace(/\t/g, '')    
    .replace(/\u00A0/g, ' ') 
    .replace(/\s+/g, ' ')   
    .trim();         

  try {
    return JSON.parse(cleaned) as T;
  } catch (error) {
    console.error('Invalid JSON after cleaning:', cleaned);
    console.error('Parse error:', error);
    return null;
  }
}