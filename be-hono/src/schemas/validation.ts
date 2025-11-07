import { z } from 'zod';
import { USER_ROLES, REQUEST_TYPES } from '../db/schema';

// Auth schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// User schemas
export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  role: z.enum([USER_ROLES.ADMIN, USER_ROLES.BASIC_USER, USER_ROLES.YOUTH_LEADER, USER_ROLES.MINISTRY_STAFF]),
});

export const updateUserSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(2).optional(),
  role: z.enum([USER_ROLES.ADMIN, USER_ROLES.BASIC_USER, USER_ROLES.YOUTH_LEADER, USER_ROLES.MINISTRY_STAFF]).optional(),
  isVerified: z.boolean().optional(),
});

// Request schemas
export const createRequestSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  content: z.string().min(20, 'Content must be at least 20 characters'),
  type: z.enum([REQUEST_TYPES.PUBLIC, REQUEST_TYPES.DIRECT]).optional(),
});

export const filterRequestsSchema = z.object({
  status: z.string().optional(),
  tagId: z.string().optional(),
  userId: z.string().optional(),
  type: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

// Response schemas
export const createResponseSchema = z.object({
  content: z.string().min(10, 'Response must be at least 10 characters'),
  requestId: z.string().uuid().optional(),
  groupId: z.string().uuid().optional(),
}).refine(data => data.requestId || data.groupId, {
  message: 'Either requestId or groupId must be provided',
});

// Tag schemas
export const createTagSchema = z.object({
  name: z.string().min(2),
  nameAr: z.string().min(2),
  description: z.string().optional(),
});

export const updateTagSchema = z.object({
  name: z.string().min(2).optional(),
  nameAr: z.string().min(2).optional(),
  description: z.string().optional(),
});
