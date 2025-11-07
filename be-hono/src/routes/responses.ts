import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq } from 'drizzle-orm';
import { getDb } from '../db';
import { responses, personalizedResponses, requests, requestGroups, REQUEST_STATUS } from '../db/schema';
import { createResponseSchema } from '../schemas/validation';
import { authMiddleware, requireMinistryOrAdmin, type Env, type Variables } from '../middleware/auth';
import { AIService } from '../utils/ai';
import { generateId } from '../utils/id';

const responsesRouter = new Hono<{ Bindings: Env; Variables: Variables }>();

// Create a response (ministry staff only)
responsesRouter.post(
  '/',
  authMiddleware,
  requireMinistryOrAdmin,
  zValidator('json', createResponseSchema),
  async (c) => {
    try {
      const { content, requestId, groupId } = c.req.valid('json');
      const responderId = c.get('userId');
      const db = getDb(c.env.DB);

      const isGroupResponse = !!groupId;

      // Create response
      const newResponse = await db
        .insert(responses)
        .values({
          id: generateId(),
          requestId: requestId || null,
          groupId: groupId || null,
          responderId,
          content,
          isGroupResponse,
        })
        .returning()
        .get();

      // If it's a group response, generate personalized responses for all requests in the group
      if (isGroupResponse && groupId) {
        c.executionCtx.waitUntil(
          (async () => {
            try {
              const aiService = new AIService(c.env.DEEPSEEK_API_KEY);

              // Get all requests in the group
              const groupRequests = await db
                .select()
                .from(requests)
                .where(eq(requests.groupId, groupId))
                .all();

              // Generate and save personalized responses
              for (const request of groupRequests) {
                const personalizedContent = await aiService.generatePersonalizedResponse(
                  request,
                  content
                );

                await db
                  .insert(personalizedResponses)
                  .values({
                    id: generateId(),
                    requestId: request.id,
                    responseId: newResponse.id,
                    content: personalizedContent,
                    sentAt: new Date(),
                  })
                  .run();

                // Update request status
                await db
                  .update(requests)
                  .set({ status: REQUEST_STATUS.RESPONDED })
                  .where(eq(requests.id, request.id))
                  .run();
              }
            } catch (error) {
              console.error('Generate personalized responses error:', error);
            }
          })()
        );
      } else if (requestId) {
        // Single request response - update status
        await db
          .update(requests)
          .set({ status: REQUEST_STATUS.RESPONDED })
          .where(eq(requests.id, requestId))
          .run();
      }

      return c.json({
        message: 'Response created successfully',
        response: newResponse,
      }, 201);
    } catch (error) {
      console.error('Create response error:', error);
      return c.json({ error: 'Failed to create response' }, 500);
    }
  }
);

// Get responses for a request
responsesRouter.get('/request/:requestId', authMiddleware, async (c) => {
  try {
    const requestId = c.req.param('requestId');
    const db = getDb(c.env.DB);

    // Get direct response
    const directResponse = await db
      .select()
      .from(responses)
      .where(eq(responses.requestId, requestId))
      .get();

    // Get personalized response
    const personalizedResponse = await db
      .select()
      .from(personalizedResponses)
      .where(eq(personalizedResponses.requestId, requestId))
      .get();

    return c.json({
      directResponse,
      personalizedResponse,
    });
  } catch (error) {
    console.error('Get responses error:', error);
    return c.json({ error: 'Failed to get responses' }, 500);
  }
});

export default responsesRouter;
