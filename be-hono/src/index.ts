import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import type { Env } from './middleware/auth';

// Import routes
import auth from './routes/auth';
import requestsRouter from './routes/requests';
import responsesRouter from './routes/responses';
import tagsRouter from './routes/tags';
import usersRouter from './routes/users';
import groupsRouter from './routes/groups';

// Import for cron job
import { getDb } from './db';
import { requests, REQUEST_STATUS, REQUEST_TYPES } from './db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { AIService } from './utils/ai';

const app = new Hono<{ Bindings: Env }>();

// Middleware
app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', async (c, next) => {
  const allowedOrigins = c.env.ALLOWED_ORIGINS 
    ? c.env.ALLOWED_ORIGINS.split(',').map((origin: string) => origin.trim())
    : ['http://localhost:5173', 'http://localhost:3000'];
  
  return cors({
    origin: allowedOrigins,
    credentials: true,
  })(c, next);
});

// Routes
app.get('/', (c) => {
  return c.json({
    message: 'Syrian Youth Council API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      requests: '/api/requests',
      responses: '/api/responses',
      tags: '/api/tags',
      users: '/api/users',
      groups: '/api/groups',
    },
  });
});

app.route('/api/auth', auth);
app.route('/api/requests', requestsRouter);
app.route('/api/responses', responsesRouter);
app.route('/api/tags', tagsRouter);
app.route('/api/users', usersRouter);
app.route('/api/groups', groupsRouter);

// Manual trigger for grouping (for testing - remove in production)
app.post('/api/admin/trigger-grouping', async (c) => {
  try {
    // Add authentication check here if needed
    const db = getDb(c.env.DB);
    const aiService = new AIService(c.env.DEEPSEEK_API_KEY);
    const { requestGroups, requestTags, tags: tagsTable } = await import('./db/schema');

    const ungroupedRequests = await db
      .select()
      .from(requests)
      .where(
        and(
          eq(requests.type, REQUEST_TYPES.PUBLIC),
          eq(requests.status, REQUEST_STATUS.ANALYZING),
          sql`${requests.groupId} IS NULL`
        )
      )
      .all();

    if (ungroupedRequests.length === 0) {
      return c.json({ message: 'No ungrouped requests found', processed: 0 });
    }

    const processed = new Set<number>();

    for (const request of ungroupedRequests) {
      if (processed.has(request.id)) continue;

      try {
        const otherRequests = ungroupedRequests.filter(
          r => r.id !== request.id && !processed.has(r.id)
        );

        if (otherRequests.length === 0) {
          const summary = await aiService.generateGroupSummary([request]);
          const requestTagsData = await db
            .select({ tagId: requestTags.tagId })
            .from(requestTags)
            .where(eq(requestTags.requestId, request.id))
            .limit(1)
            .all();
          
          const primaryTagId = requestTagsData.length > 0 ? requestTagsData[0].tagId : null;

          const group = await db
            .insert(requestGroups)
            .values({
              title: summary.title,
              description: summary.description,
              primaryTagId,
            })
            .returning()
            .get();

          await db
            .update(requests)
            .set({ groupId: group.id, status: REQUEST_STATUS.GROUPED })
            .where(eq(requests.id, request.id))
            .run();

          processed.add(request.id);
          continue;
        }

        const similarIds = await aiService.findSimilarRequests(request, otherRequests);

        if (similarIds.length > 0) {
          const similarRequests = otherRequests.filter(r => similarIds.includes(r.id));
          const allRequestsInGroup = [request, ...similarRequests];
          const summary = await aiService.generateGroupSummary(allRequestsInGroup);

          const allRequestIds = allRequestsInGroup.map(r => r.id);
          const tagCounts = await db
            .select({
              tagId: requestTags.tagId,
              count: sql<number>`count(*)`,
            })
            .from(requestTags)
            .where(sql`${requestTags.requestId} IN (${allRequestIds.join(',')})`)
            .groupBy(requestTags.tagId)
            .orderBy(sql`count(*) DESC`)
            .limit(1)
            .all();

          const primaryTagId = tagCounts.length > 0 ? tagCounts[0].tagId : null;

          const group = await db
            .insert(requestGroups)
            .values({
              title: summary.title,
              description: summary.description,
              primaryTagId,
            })
            .returning()
            .get();

          for (const req of allRequestsInGroup) {
            await db
              .update(requests)
              .set({ groupId: group.id, status: REQUEST_STATUS.GROUPED })
              .where(eq(requests.id, req.id))
              .run();
            processed.add(req.id);
          }
        } else {
          const summary = await aiService.generateGroupSummary([request]);
          const requestTagsData = await db
            .select({ tagId: requestTags.tagId })
            .from(requestTags)
            .where(eq(requestTags.requestId, request.id))
            .limit(1)
            .all();
          
          const primaryTagId = requestTagsData.length > 0 ? requestTagsData[0].tagId : null;

          const group = await db
            .insert(requestGroups)
            .values({
              title: summary.title,
              description: summary.description,
              primaryTagId,
            })
            .returning()
            .get();

          await db
            .update(requests)
            .set({ groupId: group.id, status: REQUEST_STATUS.GROUPED })
            .where(eq(requests.id, request.id))
            .run();
          processed.add(request.id);
        }
      } catch (error) {
        console.error(`Error processing request ${request.id}:`, error);
      }
    }

    return c.json({ 
      message: 'Grouping completed', 
      processed: processed.size,
      total: ungroupedRequests.length 
    });
  } catch (error) {
    console.error('Manual grouping error:', error);
    return c.json({ error: 'Grouping failed', details: String(error) }, 500);
  }
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Server error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

// Scheduled cron job for grouping similar requests (runs hourly)
export default {
  fetch: app.fetch,
  
  async scheduled(event: any, env: Env, ctx: any) {
    console.log('Running scheduled task: Group similar requests');
    
    try {
      const db = getDb(env.DB);
      const aiService = new AIService(env.DEEPSEEK_API_KEY);
      const { requestGroups, requestTags, tags } = await import('./db/schema');

      // Get all public requests that haven't been grouped yet (status: analyzing, no groupId)
      const ungroupedRequests = await db
        .select()
        .from(requests)
        .where(
          and(
            eq(requests.type, REQUEST_TYPES.PUBLIC),
            eq(requests.status, REQUEST_STATUS.ANALYZING),
            sql`${requests.groupId} IS NULL`
          )
        )
        .all();

      console.log(`Found ${ungroupedRequests.length} ungrouped public requests to process`);

      if (ungroupedRequests.length === 0) {
        console.log('No ungrouped requests to process');
        return;
      }

      // Group processing: find similar requests and create groups
      const processed = new Set<number>();

      for (const request of ungroupedRequests) {
        if (processed.has(request.id)) continue;

        try {
          // Find similar requests among unprocessed ones
          const otherRequests = ungroupedRequests.filter(
            r => r.id !== request.id && !processed.has(r.id)
          );

          if (otherRequests.length === 0) {
            // No other requests to compare, create single-item group
            const summary = await aiService.generateGroupSummary([request]);
            
            // Get primary tag for this request
            const requestTagsData = await db
              .select({ tagId: requestTags.tagId })
              .from(requestTags)
              .where(eq(requestTags.requestId, request.id))
              .limit(1)
              .all();
            
            const primaryTagId = requestTagsData.length > 0 ? requestTagsData[0].tagId : null;

            // Create group
            const group = await db
              .insert(requestGroups)
              .values({
                title: summary.title,
                description: summary.description,
                primaryTagId,
              })
              .returning()
              .get();

            // Add request to group
            await db
              .update(requests)
              .set({ groupId: group.id, status: REQUEST_STATUS.GROUPED })
              .where(eq(requests.id, request.id))
              .run();

            processed.add(request.id);
            console.log(`Created single-request group ${group.id} for request ${request.id}`);
            continue;
          }

          // Find similar requests using AI
          const similarIds = await aiService.findSimilarRequests(request, otherRequests);

          if (similarIds.length > 0) {
            // Get the actual similar request objects
            const similarRequests = otherRequests.filter(r => similarIds.includes(r.id));
            const allRequestsInGroup = [request, ...similarRequests];

            // Generate group summary
            const summary = await aiService.generateGroupSummary(allRequestsInGroup);

            // Get primary tag (use the most common tag among all requests)
            const allRequestIds = allRequestsInGroup.map(r => r.id);
            const tagCounts = await db
              .select({
                tagId: requestTags.tagId,
                count: sql<number>`count(*)`,
              })
              .from(requestTags)
              .where(sql`${requestTags.requestId} IN (${allRequestIds.join(',')})`)
              .groupBy(requestTags.tagId)
              .orderBy(sql`count(*) DESC`)
              .limit(1)
              .all();

            const primaryTagId = tagCounts.length > 0 ? tagCounts[0].tagId : null;

            // Create group
            const group = await db
              .insert(requestGroups)
              .values({
                title: summary.title,
                description: summary.description,
                primaryTagId,
              })
              .returning()
              .get();

            console.log(`Created group ${group.id} with ${allRequestsInGroup.length} requests`);

            // Update all requests in the group
            for (const req of allRequestsInGroup) {
              await db
                .update(requests)
                .set({ groupId: group.id, status: REQUEST_STATUS.GROUPED })
                .where(eq(requests.id, req.id))
                .run();

              processed.add(req.id);
            }
          } else {
            // No similar requests found, create single-item group
            const summary = await aiService.generateGroupSummary([request]);
            
            const requestTagsData = await db
              .select({ tagId: requestTags.tagId })
              .from(requestTags)
              .where(eq(requestTags.requestId, request.id))
              .limit(1)
              .all();
            
            const primaryTagId = requestTagsData.length > 0 ? requestTagsData[0].tagId : null;

            const group = await db
              .insert(requestGroups)
              .values({
                title: summary.title,
                description: summary.description,
                primaryTagId,
              })
              .returning()
              .get();

            await db
              .update(requests)
              .set({ groupId: group.id, status: REQUEST_STATUS.GROUPED })
              .where(eq(requests.id, request.id))
              .run();

            processed.add(request.id);
            console.log(`Created single-request group ${group.id} for request ${request.id}`);
          }
        } catch (error) {
          console.error(`Error processing request ${request.id}:`, error);
        }
      }

      console.log(`Scheduled task completed. Processed ${processed.size} requests`);
    } catch (error) {
      console.error('Scheduled task error:', error);
    }
  },
};

