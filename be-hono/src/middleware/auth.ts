import { Context, Next } from 'hono';
import { verifyToken } from '../utils/auth';
import { USER_ROLES } from '../db/schema';

export type Env = {
  DB: D1Database;
  JWT_SECRET: string;
  DEEPSEEK_API_KEY: string;
  ALLOWED_ORIGINS?: string;
};

export type Variables = {
  userId: number;
  userRole: string;
};

export const authMiddleware = async (c: Context<{ Bindings: Env; Variables: Variables }>, next: Next) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token, c.env.JWT_SECRET);

  if (!decoded) {
    return c.json({ error: 'Invalid token' }, 401);
  }

  c.set('userId', decoded.userId);
  c.set('userRole', decoded.role);
  
  await next();
};

export const requireRole = (...allowedRoles: string[]) => {
  return async (c: Context<{ Bindings: Env; Variables: Variables }>, next: Next) => {
    const userRole = c.get('userRole');
    
    if (!allowedRoles.includes(userRole)) {
      return c.json({ error: 'Forbidden: Insufficient permissions' }, 403);
    }
    
    await next();
  };
};

export const requireAdmin = requireRole(USER_ROLES.ADMIN);
export const requireMinistryOrAdmin = requireRole(USER_ROLES.ADMIN, USER_ROLES.MINISTRY_STAFF);
export const requireYouthLeaderOrAdmin = requireRole(USER_ROLES.ADMIN, USER_ROLES.YOUTH_LEADER);
