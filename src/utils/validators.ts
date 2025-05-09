/**
 * 验证字符串是否为有效的UUID
 * @param id 要验证的字符串
 * @returns 是否为有效UUID
 */
export function isValidUUID(id: string): boolean {
  if (!id) return false;
  
  // UUID v4格式正则表达式
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
} 