import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  integer,
  boolean,
  real,
  serial,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - mandatory for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - mandatory for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Exercise sessions for tracking workouts
export const exerciseSessions = pgTable("exercise_sessions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  exerciseType: varchar("exercise_type").notNull(),
  duration: integer("duration"), // in seconds
  reps: integer("reps"),
  accuracy: real("accuracy"), // percentage 0-100
  postureScore: real("posture_score"), // percentage 0-100
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Mood tracking for psychological wellness
export const moodEntries = pgTable("mood_entries", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  mood: integer("mood").notNull(), // 1-10 scale
  energy: integer("energy"), // 1-10 scale
  anxiety: integer("anxiety"), // 1-10 scale
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Chat conversations with AI assistant
export const chatConversations = pgTable("chat_conversations", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  messages: jsonb("messages").notNull(), // Array of {role: 'user'|'assistant', content: string, timestamp: string}
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User progress tracking
export const userProgress = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  weeklyExerciseGoal: integer("weekly_exercise_goal").default(5),
  currentWeekSessions: integer("current_week_sessions").default(0),
  totalSessions: integer("total_sessions").default(0),
  averageAccuracy: real("average_accuracy").default(0),
  streakDays: integer("streak_days").default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Appointments scheduling
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  providerName: varchar("provider_name").notNull(),
  appointmentType: varchar("appointment_type").notNull(),
  scheduledAt: timestamp("scheduled_at").notNull(),
  status: varchar("status").notNull().default("scheduled"), // scheduled, completed, cancelled
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Schema types and validation
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export const insertExerciseSessionSchema = createInsertSchema(exerciseSessions).omit({
  id: true,
  createdAt: true,
});
export type InsertExerciseSession = z.infer<typeof insertExerciseSessionSchema>;
export type ExerciseSession = typeof exerciseSessions.$inferSelect;

export const insertMoodEntrySchema = createInsertSchema(moodEntries).omit({
  id: true,
  createdAt: true,
});
export type InsertMoodEntry = z.infer<typeof insertMoodEntrySchema>;
export type MoodEntry = typeof moodEntries.$inferSelect;

export const insertChatConversationSchema = createInsertSchema(chatConversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertChatConversation = z.infer<typeof insertChatConversationSchema>;
export type ChatConversation = typeof chatConversations.$inferSelect;

export const insertUserProgressSchema = createInsertSchema(userProgress).omit({
  id: true,
  updatedAt: true,
});
export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;
export type UserProgress = typeof userProgress.$inferSelect;

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
});
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointments.$inferSelect;
