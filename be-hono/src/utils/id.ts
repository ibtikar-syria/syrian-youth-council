// Generate a UUID-like ID using crypto.randomUUID()
// This is available in Cloudflare Workers runtime
export const generateId = (): string => {
  return crypto.randomUUID();
};

// Validate if a string is a valid UUID format
export const isValidId = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

