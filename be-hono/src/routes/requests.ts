import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq, and, desc, sql } from 'drizzle-orm';
import { getDb } from '../db';
import { requests, users, tags, requestTags, responses, personalizedResponses, REQUEST_TYPES, REQUEST_STATUS, USER_ROLES } from '../db/schema';
import { createRequestSchema, filterRequestsSchema } from '../schemas/validation';
import { authMiddleware, requireMinistryOrAdmin, type Env, type Variables } from '../middleware/auth';
import { AIService } from '../utils/ai';
import { generateId } from '../utils/id';

const requestsRouter = new Hono<{ Bindings: Env; Variables: Variables }>();

// Create a new request
requestsRouter.post(
  '/',
  authMiddleware,
  zValidator('json', createRequestSchema),
  async (c) => {
    try {
      const { title, content, type } = c.req.valid('json');
      const userId = c.get('userId');
      const userRole = c.get('userRole');
      const db = getDb(c.env.DB);

      // Validate request type based on user role
      const requestType = type || REQUEST_TYPES.PUBLIC;
      
      if (requestType === REQUEST_TYPES.DIRECT && userRole !== USER_ROLES.YOUTH_LEADER && userRole !== USER_ROLES.ADMIN) {
        return c.json({ error: 'Only youth leaders can send direct requests' }, 403);
      }

      // Create request
      const newRequest = await db
        .insert(requests)
        .values({
          id: generateId(),
          userId,
          type: requestType,
          title,
          content,
          status: REQUEST_STATUS.PENDING,
        })
        .returning()
        .get();

      // Trigger AI analysis asynchronously (in production, use queue)
      c.executionCtx.waitUntil(
        (async () => {
          try {
            const aiService = new AIService(c.env.DEEPSEEK_API_KEY);
            const existingTags = await db.select().from(tags).all();
            const suggestedTags = await aiService.analyzeRequest(newRequest, existingTags);

            // Create or find tags and link them
            for (const tagName of suggestedTags) {
              let tag = existingTags.find(t => t.name.toLowerCase() === tagName.toLowerCase());
              
              if (!tag) {
                // Create new tag
                const arabicName = await aiService.generateTagTranslation(tagName);
                tag = await db
                  .insert(tags)
                  .values({
                    id: generateId(),
                    name: tagName,
                    nameAr: arabicName,
                    createdBy: 'ai',
                  })
                  .returning()
                  .get();
              }

              // Link tag to request
              await db
                .insert(requestTags)
                .values({
                  id: generateId(),
                  requestId: newRequest.id,
                  tagId: tag.id,
                  confidence: 80,
                })
                .run();
            }

            // Update request status
            await db
              .update(requests)
              .set({ status: REQUEST_STATUS.ANALYZING })
              .where(eq(requests.id, newRequest.id))
              .run();
          } catch (error) {
            console.error('AI analysis error:', error);
          }
        })()
      );

      return c.json({
        message: 'Request created successfully',
        request: newRequest,
      }, 201);
    } catch (error) {
      console.error('Create request error:', error);
      return c.json({ error: 'Failed to create request' }, 500);
    }
  }
);

// Get all requests (with filters) - Ministry staff and admin only
// This endpoint returns only DIRECT requests (type = direct_request)
// Public requests are grouped and accessed via /api/groups endpoint
requestsRouter.get(
  '/',
  authMiddleware,
  requireMinistryOrAdmin,
  zValidator('query', filterRequestsSchema),
  async (c) => {
    try {
      const { status, tagId, userId: filterUserId, type, page = '1', limit = '20' } = c.req.valid('query');
      const db = getDb(c.env.DB);

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const offset = (pageNum - 1) * limitNum;

      // Build query with filters - ONLY show direct requests
      let query = db
        .select({
          id: requests.id,
          userId: requests.userId,
          type: requests.type,
          title: requests.title,
          content: requests.content,
          status: requests.status,
          groupId: requests.groupId,
          createdAt: requests.createdAt,
          userName: users.name,
          userEmail: users.email,
        })
        .from(requests)
        .leftJoin(users, eq(requests.userId, users.id))
        .orderBy(desc(requests.createdAt))
        .limit(limitNum)
        .offset(offset);

      // Apply filters - always filter to show only direct requests
      const conditions = [eq(requests.type, REQUEST_TYPES.DIRECT)];
      if (status) conditions.push(eq(requests.status, status));
      if (type) conditions.push(eq(requests.type, type));
      if (filterUserId) conditions.push(eq(requests.userId, filterUserId));

      query = query.where(and(...conditions)) as any;

      const results = await query.all();

      // Get tags for each request
      const requestsWithTags = await Promise.all(
        results.map(async (request) => {
          const requestTagsData = await db
            .select({
              tagId: tags.id,
              tagName: tags.name,
              tagNameAr: tags.nameAr,
            })
            .from(requestTags)
            .leftJoin(tags, eq(requestTags.tagId, tags.id))
            .where(eq(requestTags.requestId, request.id))
            .all();

          return {
            ...request,
            tags: requestTagsData,
          };
        })
      );

      return c.json({
        requests: requestsWithTags,
        pagination: {
          page: pageNum,
          limit: limitNum,
        },
      });
    } catch (error) {
      console.error('Get requests error:', error);
      return c.json({ error: 'Failed to get requests' }, 500);
    }
  }
);

// Get my requests (current user)
requestsRouter.get('/my-requests', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const db = getDb(c.env.DB);

    const myRequests = await db
      .select()
      .from(requests)
      .where(eq(requests.userId, userId))
      .orderBy(desc(requests.createdAt))
      .all();

    // Get tags and responses for each request
    const requestsWithDetails = await Promise.all(
      myRequests.map(async (request) => {
        // Get tags
        const requestTagsData = await db
          .select({
            tagId: tags.id,
            tagName: tags.name,
            tagNameAr: tags.nameAr,
          })
          .from(requestTags)
          .leftJoin(tags, eq(requestTags.tagId, tags.id))
          .where(eq(requestTags.requestId, request.id))
          .all();

        // Get response - check for personalized response first, then direct response
        let response = null;
        
        // Check for personalized response (from group)
        const personalizedResponseData = await db
          .select({
            id: sql<string>`${personalizedResponses.id}`,
            content: sql<string>`${personalizedResponses.content}`,
            createdAt: sql<number>`${personalizedResponses.createdAt}`,
            isPersonalized: sql<number>`1`,
          })
          .from(personalizedResponses)
          .where(eq(personalizedResponses.requestId, request.id))
          .get();

        if (personalizedResponseData) {
          response = personalizedResponseData;
        } else {
          // Check for direct response
          const directResponseData = await db
            .select({
              id: sql<string>`${responses.id}`,
              content: sql<string>`${responses.content}`,
              createdAt: sql<number>`${responses.createdAt}`,
              isPersonalized: sql<number>`0`,
            })
            .from(responses)
            .where(eq(responses.requestId, request.id))
            .get();

          if (directResponseData) {
            response = directResponseData;
          }
        }

        return {
          ...request,
          tags: requestTagsData,
          response: response,
        };
      })
    );

    return c.json({ requests: requestsWithDetails });
  } catch (error) {
    console.error('Get my requests error:', error);
    return c.json({ error: 'Failed to get requests' }, 500);
  }
});

// Get single request by ID
requestsRouter.get('/:id', authMiddleware, async (c) => {
  try {
    const requestId = c.req.param('id');
    const userId = c.get('userId');
    const userRole = c.get('userRole');
    const db = getDb(c.env.DB);

    const request = await db
      .select({
        id: requests.id,
        userId: requests.userId,
        type: requests.type,
        title: requests.title,
        content: requests.content,
        status: requests.status,
        groupId: requests.groupId,
        createdAt: requests.createdAt,
        userName: users.name,
        userEmail: users.email,
      })
      .from(requests)
      .leftJoin(users, eq(requests.userId, users.id))
      .where(eq(requests.id, requestId))
      .get();

    if (!request) {
      return c.json({ error: 'Request not found' }, 404);
    }

    // Check permissions
    if (
      request.userId !== userId &&
      userRole !== USER_ROLES.ADMIN &&
      userRole !== USER_ROLES.MINISTRY_STAFF
    ) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    // Get tags
    const requestTagsData = await db
      .select({
        tagId: tags.id,
        tagName: tags.name,
        tagNameAr: tags.nameAr,
      })
      .from(requestTags)
      .leftJoin(tags, eq(requestTags.tagId, tags.id))
      .where(eq(requestTags.requestId, request.id))
      .all();

    return c.json({
      request: {
        ...request,
        tags: requestTagsData,
      },
    });
  } catch (error) {
    console.error('Get request error:', error);
    return c.json({ error: 'Failed to get request' }, 500);
  }
});

export default requestsRouter;
