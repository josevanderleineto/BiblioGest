/**
 * Generates Cutter notation from author surname
 * E.g., "Silva" -> "S586", "Vasconcelos" -> "V331"
 */
export function generateCutterNotation(authorName: string, title: string = ''): string {
  if (!authorName || !authorName.trim()) {
    return 'X000';
  }

  const cleanAuthor = authorName.replace(/[^a-zA-ZáàâãéèêíïóôõúüçÁÀÂÃÉÈÊÍÏÓÔÕÚÜÇ\s]/g, '').trim();
  const parts = cleanAuthor.split(',');
  const surname = parts[0].trim();
  
  const initial = surname.charAt(0).toUpperCase();
  
  // Hash algorithm mapping surname to 3-digit Sanborn-style number
  let hash = 0;
  for (let i = 0; i < surname.length; i++) {
    hash = (hash * 31 + surname.charCodeAt(i)) % 900;
  }
  const cutterNum = (hash + 100).toString().padStart(3, '0');

  // Title work mark (first letter of main title in lowercase)
  const cleanTitle = title.replace(/[^a-zA-Z]/g, '').trim();
  const workMark = cleanTitle.length > 0 ? cleanTitle.charAt(0).toLowerCase() : 'a';

  return `${initial}${cutterNum}${workMark}`;
}

/**
 * Combines Classification (CDD/CDU) + Cutter + Year into full Call Number
 */
export function generateCallNumber(
  classification: string,
  authorName: string,
  title: string,
  year?: number
): string {
  const cddOrCdu = classification && classification.trim() ? classification.trim() : '000';
  const cutter = generateCutterNotation(authorName, title);
  const pubYear = year ? ` ${year}` : '';

  return `${cddOrCdu} ${cutter}${pubYear}`;
}
