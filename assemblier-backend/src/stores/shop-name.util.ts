/**
 * Converts a brand name into a valid Shopify shop domain name
 *
 * Rules:
 * 1. Trim whitespace
 * 2. Keep only alphanumeric characters (a-z, A-Z, 0-9)
 * 3. Convert to lowercase
 * 4. If starts with number, prefix with 'shop'
 * 5. If empty, generate 'shop' + random 6-digit number
 * 6. Truncate to maximum 24 characters
 */
export function generateShopName(brandName: string): string {
  // Step 1: Trim whitespace
  let cleaned = brandName.trim();

  // Step 2: Keep only alphanumeric characters (remove Korean, special chars, spaces)
  cleaned = cleaned.replace(/[^a-zA-Z0-9]/g, '');

  // Step 3: Convert to lowercase
  cleaned = cleaned.toLowerCase();

  // Step 4: If starts with number, prefix with 'shop'
  if (cleaned.length > 0 && /^\d/.test(cleaned)) {
    cleaned = 'shop' + cleaned;
  }

  // Step 5: If empty, generate fallback
  if (cleaned.length === 0) {
    const randomNum = Math.floor(Math.random() * 900000) + 100000; // 6 digits (100000-999999)
    cleaned = 'shop' + randomNum;
  }

  // Step 6: Truncate to maximum 24 characters
  if (cleaned.length > 24) {
    cleaned = cleaned.substring(0, 24);
  }

  return cleaned;
}
