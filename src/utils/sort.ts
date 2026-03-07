export function getCharType(char: string): number {
  if (!char) return 4;
  if (/[\u4e00-\u9fa5]/.test(char)) return 1; // Chinese
  if (/[0-9]/.test(char)) return 2; // Number
  if (/[a-zA-Z]/.test(char)) return 3; // Letter
  return 4; // Other
}

export function customStringCompare(a: string, b: string): number {
  const typeA = getCharType(a.charAt(0));
  const typeB = getCharType(b.charAt(0));
  
  if (typeA !== typeB) {
    return typeA - typeB;
  }
  
  // If same type, use localeCompare for proper alphabetical/pinyin sorting
  return a.localeCompare(b, 'zh-CN');
}
