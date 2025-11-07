import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq, desc, sql } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '../db';
import { requestGroups, requests, tags, users, responses, personalizedResponses } from '../db/schema';
import { authMiddleware, requireMinistryOrAdmin, type Env, type Variables } from '../middleware/auth';
import { generateId } from '../utils/id';

const groupsRouter = new Hono<{ Bindings: Env; Variables: Variables }>();

// Get all request groups with their requests
groupsRouter.get('/', authMiddleware, requireMinistryOrAdmin, async (c) => {
  try {
    const db = getDb(c.env.DB);

    // Get all groups
    const allGroups = await db
      .select({
        id: requestGroups.id,
        title: requestGroups.title,
        description: requestGroups.description,
        primaryTagId: requestGroups.primaryTagId,
        createdAt: requestGroups.createdAt,
        tagName: tags.name,
        tagNameAr: tags.nameAr,
      })
      .from(requestGroups)
      .leftJoin(tags, eq(requestGroups.primaryTagId, tags.id))
      .orderBy(desc(requestGroups.createdAt))
      .all();

    // Get request count and status for each group
    const groupsWithDetails = await Promise.all(
      allGroups.map(async (group) => {
        const groupRequests = await db
          .select({
            id: requests.id,
            status: requests.status,
          })
          .from(requests)
          .where(eq(requests.groupId, group.id))
          .all();

        const hasResponse = await db
          .select()
          .from(responses)
          .where(eq(responses.groupId, group.id))
          .get();

        return {
          ...group,
          requestCount: groupRequests.length,
          pendingCount: groupRequests.filter(r => r.status === 'pending' || r.status === 'analyzing').length,
          respondedCount: groupRequests.filter(r => r.status === 'responded').length,
          hasResponse: !!hasResponse,
        };
      })
    );

    return c.json({ groups: groupsWithDetails });
  } catch (error) {
    console.error('Get groups error:', error);
    return c.json({ error: 'Failed to get groups' }, 500);
  }
});

// Get single group with all its requests
groupsRouter.get('/:id', authMiddleware, requireMinistryOrAdmin, async (c) => {
  try {
    const groupId = c.req.param('id');
    const db = getDb(c.env.DB);

    // Get group info
    const group = await db
      .select({
        id: requestGroups.id,
        title: requestGroups.title,
        description: requestGroups.description,
        primaryTagId: requestGroups.primaryTagId,
        createdAt: requestGroups.createdAt,
        tagName: tags.name,
        tagNameAr: tags.nameAr,
      })
      .from(requestGroups)
      .leftJoin(tags, eq(requestGroups.primaryTagId, tags.id))
      .where(eq(requestGroups.id, groupId))
      .get();

    if (!group) {
      return c.json({ error: 'Group not found' }, 404);
    }

    // Get all requests in the group
    const groupRequests = await db
      .select({
        id: requests.id,
        userId: requests.userId,
        title: requests.title,
        content: requests.content,
        status: requests.status,
        type: requests.type,
        createdAt: requests.createdAt,
        userName: users.name,
        userEmail: users.email,
      })
      .from(requests)
      .leftJoin(users, eq(requests.userId, users.id))
      .where(eq(requests.groupId, groupId))
      .orderBy(desc(requests.createdAt))
      .all();

    // Get group response if exists
    const groupResponse = await db
      .select({
        id: responses.id,
        content: responses.content,
        createdAt: responses.createdAt,
        responderName: users.name,
      })
      .from(responses)
      .leftJoin(users, eq(responses.responderId, users.id))
      .where(eq(responses.groupId, groupId))
      .get();

    return c.json({
      group: {
        ...group,
        requests: groupRequests,
        response: groupResponse,
      },
    });
  } catch (error) {
    console.error('Get group error:', error);
    return c.json({ error: 'Failed to get group' }, 500);
  }
});

// Create a new group manually
groupsRouter.post(
  '/',
  authMiddleware,
  requireMinistryOrAdmin,
  zValidator('json', z.object({
    title: z.string().min(5),
    description: z.string().optional(),
    primaryTagId: z.string().uuid().optional(),
    requestIds: z.array(z.string().uuid()),
  })),
  async (c) => {
    try {
      const { title, description, primaryTagId, requestIds } = c.req.valid('json');
      const db = getDb(c.env.DB);

      // Create group
      const newGroup = await db
        .insert(requestGroups)
        .values({
          id: generateId(),
          title,
          description,
          primaryTagId: primaryTagId || null,
        })
        .returning()
        .get();

      // Update requests to belong to this group
      for (const requestId of requestIds) {
        await db
          .update(requests)
          .set({ groupId: newGroup.id, status: 'grouped' })
          .where(eq(requests.id, requestId))
          .run();
      }

      return c.json({
        message: 'Group created successfully',
        group: newGroup,
      }, 201);
    } catch (error) {
      console.error('Create group error:', error);
      return c.json({ error: 'Failed to create group' }, 500);
    }
  }
);

// Update group
groupsRouter.put(
  '/:id',
  authMiddleware,
  requireMinistryOrAdmin,
  zValidator('json', z.object({
    title: z.string().min(5).optional(),
    description: z.string().optional(),
    primaryTagId: z.string().uuid().optional().nullable(),
  })),
  async (c) => {
    try {
      const groupId = c.req.param('id');
      const updates = c.req.valid('json');
      const db = getDb(c.env.DB);

      const updatedGroup = await db
        .update(requestGroups)
        .set(updates)
        .where(eq(requestGroups.id, groupId))
        .returning()
        .get();

      if (!updatedGroup) {
        return c.json({ error: 'Group not found' }, 404);
      }

      return c.json({
        message: 'Group updated successfully',
        group: updatedGroup,
      });
    } catch (error) {
      console.error('Update group error:', error);
      return c.json({ error: 'Failed to update group' }, 500);
    }
  }
);

// Delete group (doesn't delete requests, just ungroups them)
groupsRouter.delete('/:id', authMiddleware, requireMinistryOrAdmin, async (c) => {
  try {
    const groupId = c.req.param('id');
    const db = getDb(c.env.DB);

    // Ungroup all requests
    await db
      .update(requests)
      .set({ groupId: null, status: 'pending' })
      .where(eq(requests.groupId, groupId))
      .run();

    // Delete group
    await db.delete(requestGroups).where(eq(requestGroups.id, groupId)).run();

    return c.json({ message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Delete group error:', error);
    return c.json({ error: 'Failed to delete group' }, 500);
  }
});

export default groupsRouter;
