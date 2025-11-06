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

// Import for cron job
import { getDb } from './db';
import { requests, REQUEST_STATUS } from './db/schema';
import { eq } from 'drizzle-orm';
import { AIService } from './utils/ai';

const app = new Hono<{ Bindings: Env }>();

// Middleware
app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));

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
    },
  });
});

app.route('/api/auth', auth);
app.route('/api/requests', requestsRouter);
app.route('/api/responses', responsesRouter);
app.route('/api/tags', tagsRouter);
app.route('/api/users', usersRouter);

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
  
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    console.log('Running scheduled task: Group similar requests');
    
    try {
      const db = getDb(env.DB);
      const aiService = new AIService(env.DEEPSEEK_API_KEY);

      // Get all pending/analyzing requests that haven't been grouped
      const pendingRequests = await db
        .select()
        .from(requests)
        .where(eq(requests.status, REQUEST_STATUS.ANALYZING))
        .all();

      console.log(`Found ${pendingRequests.length} requests to process`);

      // Process each request
      for (const request of pendingRequests) {
        try {
          // Find similar requests
          const otherRequests = pendingRequests.filter(r => r.id !== request.id);
          const similarIds = await aiService.findSimilarRequests(request, otherRequests);

          if (similarIds.length > 0) {
            // Group similar requests
            console.log(`Found ${similarIds.length} similar requests for request ${request.id}`);
            // TODO: Implement grouping logic
            // This would involve creating a request group and updating all related requests
          }

          // Update status to grouped
          await db
            .update(requests)
            .set({ status: REQUEST_STATUS.GROUPED })
            .where(eq(requests.id, request.id))
            .run();
        } catch (error) {
          console.error(`Error processing request ${request.id}:`, error);
        }
      }

      console.log('Scheduled task completed');
    } catch (error) {
      console.error('Scheduled task error:', error);
    }
  },
};

