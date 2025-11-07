import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq } from 'drizzle-orm';
import { getDb } from '../db';
import { users, USER_ROLES } from '../db/schema';
import { registerSchema, loginSchema } from '../schemas/validation';
import { hashPassword, comparePassword, generateToken } from '../utils/auth';
import { generateId } from '../utils/id';
import { rateLimit } from '../middleware/rateLimit';
import type { Env } from '../middleware/auth';

const auth = new Hono<{ Bindings: Env }>();

// Rate limit: 5 attempts per 15 minutes
auth.use('/login', rateLimit(5, 15 * 60 * 1000));
auth.use('/register', rateLimit(5, 15 * 60 * 1000));

// Register (only basic users can register)
auth.post('/register', zValidator('json', registerSchema), async (c) => {
  try {
    const { email, password, name } = c.req.valid('json');
    const db = getDb(c.env.DB);

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .get();

    if (existingUser) {
      return c.json({ error: 'User already exists' }, 400);
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const newUser = await db
      .insert(users)
      .values({
        id: generateId(),
        email,
        password: hashedPassword,
        name,
        role: USER_ROLES.BASIC_USER,
      })
      .returning()
      .get();

    // Generate token
    const token = generateToken(
      { userId: newUser.id, role: newUser.role },
      c.env.JWT_SECRET
    );

    return c.json({
      message: 'Registration successful',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
    }, 201);
  } catch (error) {
    console.error('Registration error:', error);
    return c.json({ error: 'Registration failed' }, 500);
  }
});

// Login
auth.post('/login', zValidator('json', loginSchema), async (c) => {
  try {
    const { email, password } = c.req.valid('json');
    const db = getDb(c.env.DB);

    // Find user
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .get();

    if (!user) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Verify password
    const isValid = await comparePassword(password, user.password);

    if (!isValid) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Generate token
    const token = generateToken(
      { userId: user.id, role: user.role },
      c.env.JWT_SECRET
    );

    return c.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Login failed' }, 500);
  }
});

// Get current user info
auth.get('/me', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const token = authHeader.substring(7);
    const { verifyToken } = await import('../utils/auth');
    const decoded = verifyToken(token, c.env.JWT_SECRET);

    if (!decoded) {
      return c.json({ error: 'Invalid token' }, 401);
    }

    const db = getDb(c.env.DB);
    const user = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        isVerified: users.isVerified,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, decoded.userId))
      .get();

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    return c.json({ error: 'Failed to get user info' }, 500);
  }
});

export default auth;
