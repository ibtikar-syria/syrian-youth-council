import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq, desc } from 'drizzle-orm';
import { getDb } from '../db';
import { users } from '../db/schema';
import { createUserSchema, updateUserSchema } from '../schemas/validation';
import { authMiddleware, requireAdmin, type Env, type Variables } from '../middleware/auth';
import { hashPassword } from '../utils/auth';
import { generateId } from '../utils/id';

const usersRouter = new Hono<{ Bindings: Env; Variables: Variables }>();

// Get all users (admin only)
usersRouter.get('/', authMiddleware, requireAdmin, async (c) => {
  try {
    const db = getDb(c.env.DB);

    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        isVerified: users.isVerified,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .all();

    return c.json({ users: allUsers });
  } catch (error) {
    console.error('Get users error:', error);
    return c.json({ error: 'Failed to get users' }, 500);
  }
});

// Create a new user (admin only - for creating ministry staff, youth leaders, etc.)
usersRouter.post(
  '/',
  authMiddleware,
  requireAdmin,
  zValidator('json', createUserSchema),
  async (c) => {
    try {
      const { email, password, name, role } = c.req.valid('json');
      const db = getDb(c.env.DB);

      // Check if user exists
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
          role,
          isVerified: true, // Admin-created users are verified
        })
        .returning({
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
          isVerified: users.isVerified,
          createdAt: users.createdAt,
        })
        .get();

      return c.json({
        message: 'User created successfully',
        user: newUser,
      }, 201);
    } catch (error) {
      console.error('Create user error:', error);
      return c.json({ error: 'Failed to create user' }, 500);
    }
  }
);

// Update user (admin only)
usersRouter.put(
  '/:id',
  authMiddleware,
  requireAdmin,
  zValidator('json', updateUserSchema),
  async (c) => {
    try {
      const userId = c.req.param('id');
      const updates = c.req.valid('json');
      const db = getDb(c.env.DB);

      const updatedUser = await db
        .update(users)
        .set(updates)
        .where(eq(users.id, userId))
        .returning({
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
          isVerified: users.isVerified,
        })
        .get();

      if (!updatedUser) {
        return c.json({ error: 'User not found' }, 404);
      }

      return c.json({
        message: 'User updated successfully',
        user: updatedUser,
      });
    } catch (error) {
      console.error('Update user error:', error);
      return c.json({ error: 'Failed to update user' }, 500);
    }
  }
);

// Delete user (admin only)
usersRouter.delete('/:id', authMiddleware, requireAdmin, async (c) => {
  try {
    const userId = c.req.param('id');
    const currentUserId = c.get('userId');
    const db = getDb(c.env.DB);

    // Prevent self-deletion
    if (userId === currentUserId) {
      return c.json({ error: 'Cannot delete your own account' }, 400);
    }

    await db.delete(users).where(eq(users.id, userId)).run();

    return c.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    return c.json({ error: 'Failed to delete user' }, 500);
  }
});

export default usersRouter;
