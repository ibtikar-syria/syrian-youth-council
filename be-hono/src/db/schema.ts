import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// User roles enum
export const USER_ROLES = {
  ADMIN: 'admin',
  BASIC_USER: 'basic_user',
  YOUTH_LEADER: 'youth_leader',
  MINISTRY_STAFF: 'ministry_staff',
} as const;

// Request types enum
export const REQUEST_TYPES = {
  PUBLIC: 'public_request',
  DIRECT: 'direct_request',
} as const;

// Request status enum
export const REQUEST_STATUS = {
  PENDING: 'pending',
  ANALYZING: 'analyzing',
  GROUPED: 'grouped',
  RESPONDED: 'responded',
} as const;

// Users table
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(), // hashed
  name: text('name').notNull(),
  role: text('role').notNull().default(USER_ROLES.BASIC_USER),
  isVerified: integer('is_verified', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
});

// Requests table
export const requests = sqliteTable('requests', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  type: text('type').notNull().default(REQUEST_TYPES.PUBLIC),
  title: text('title').notNull(),
  content: text('content').notNull(),
  status: text('status').notNull().default(REQUEST_STATUS.PENDING),
  groupId: text('group_id'), // references request_groups
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
});

// Tags table
export const tags = sqliteTable('tags', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  nameAr: text('name_ar').notNull(),
  description: text('description'),
  createdBy: text('created_by').notNull().default('ai'), // 'ai' or 'admin'
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
});

// Request Tags junction table (many-to-many)
export const requestTags = sqliteTable('request_tags', {
  id: text('id').primaryKey(),
  requestId: text('request_id').notNull().references(() => requests.id),
  tagId: text('tag_id').notNull().references(() => tags.id),
  confidence: integer('confidence').notNull().default(100), // AI confidence score 0-100
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
});

// Request Groups table (for similar requests)
export const requestGroups = sqliteTable('request_groups', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  primaryTagId: text('primary_tag_id').references(() => tags.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
});

// Responses table
export const responses = sqliteTable('responses', {
  id: text('id').primaryKey(),
  requestId: text('request_id').references(() => requests.id),
  groupId: text('group_id').references(() => requestGroups.id),
  responderId: text('responder_id').notNull().references(() => users.id),
  content: text('content').notNull(), // ministry staff response
  isGroupResponse: integer('is_group_response', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
});

// Personalized Responses table (AI-generated individual responses)
export const personalizedResponses = sqliteTable('personalized_responses', {
  id: text('id').primaryKey(),
  requestId: text('request_id').notNull().references(() => requests.id),
  responseId: text('response_id').notNull().references(() => responses.id),
  content: text('content').notNull(), // AI-personalized response
  sentAt: integer('sent_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
});

// Export types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Request = typeof requests.$inferSelect;
export type NewRequest = typeof requests.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
export type RequestTag = typeof requestTags.$inferSelect;
export type RequestGroup = typeof requestGroups.$inferSelect;
export type Response = typeof responses.$inferSelect;
export type PersonalizedResponse = typeof personalizedResponses.$inferSelect;
