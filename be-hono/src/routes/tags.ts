import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq, desc } from 'drizzle-orm';
import { getDb } from '../db';
import { tags } from '../db/schema';
import { createTagSchema, updateTagSchema } from '../schemas/validation';
import { authMiddleware, requireAdmin, requireMinistryOrAdmin, type Env, type Variables } from '../middleware/auth';
import { generateId } from '../utils/id';

const tagsRouter = new Hono<{ Bindings: Env; Variables: Variables }>();

// Get all tags
tagsRouter.get('/', authMiddleware, async (c) => {
  try {
    const db = getDb(c.env.DB);

    const allTags = await db
      .select()
      .from(tags)
      .orderBy(desc(tags.createdAt))
      .all();

    return c.json({ tags: allTags });
  } catch (error) {
    console.error('Get tags error:', error);
    return c.json({ error: 'Failed to get tags' }, 500);
  }
});

// Create a new tag (admin only)
tagsRouter.post(
  '/',
  authMiddleware,
  requireAdmin,
  zValidator('json', createTagSchema),
  async (c) => {
    try {
      const { name, nameAr, description } = c.req.valid('json');
      const db = getDb(c.env.DB);

      // Check if tag exists
      const existingTag = await db
        .select()
        .from(tags)
        .where(eq(tags.name, name))
        .get();

      if (existingTag) {
        return c.json({ error: 'Tag already exists' }, 400);
      }

      const newTag = await db
        .insert(tags)
        .values({
          id: generateId(),
          name,
          nameAr,
          description: description || null,
          createdBy: 'admin',
        })
        .returning()
        .get();

      return c.json({
        message: 'Tag created successfully',
        tag: newTag,
      }, 201);
    } catch (error) {
      console.error('Create tag error:', error);
      return c.json({ error: 'Failed to create tag' }, 500);
    }
  }
);

// Update a tag (admin only)
tagsRouter.put(
  '/:id',
  authMiddleware,
  requireAdmin,
  zValidator('json', updateTagSchema),
  async (c) => {
    try {
      const tagId = c.req.param('id');
      const updates = c.req.valid('json');
      const db = getDb(c.env.DB);

      const updatedTag = await db
        .update(tags)
        .set(updates)
        .where(eq(tags.id, tagId))
        .returning()
        .get();

      if (!updatedTag) {
        return c.json({ error: 'Tag not found' }, 404);
      }

      return c.json({
        message: 'Tag updated successfully',
        tag: updatedTag,
      });
    } catch (error) {
      console.error('Update tag error:', error);
      return c.json({ error: 'Failed to update tag' }, 500);
    }
  }
);

// Delete a tag (admin only)
tagsRouter.delete('/:id', authMiddleware, requireAdmin, async (c) => {
  try {
    const tagId = c.req.param('id');
    const db = getDb(c.env.DB);

    await db.delete(tags).where(eq(tags.id, tagId)).run();

    return c.json({ message: 'Tag deleted successfully' });
  } catch (error) {
    console.error('Delete tag error:', error);
    return c.json({ error: 'Failed to delete tag' }, 500);
  }
});

export default tagsRouter;
