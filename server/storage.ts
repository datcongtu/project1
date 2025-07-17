import {
  users,
  exerciseSessions,
  moodEntries,
  chatConversations,
  userProgress,
  appointments,
  type User,
  type InsertUser,
  type InsertExerciseSession,
  type ExerciseSession,
  type InsertMoodEntry,
  type MoodEntry,
  type InsertChatConversation,
  type ChatConversation,
  type InsertUserProgress,
  type UserProgress,
  type InsertAppointment,
  type Appointment,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, sql } from "drizzle-orm";

export interface IStorage {
  // User operations for JWT authentication
  getUserById(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Exercise session operations
  createExerciseSession(session: InsertExerciseSession): Promise<ExerciseSession>;
  getUserExerciseSessions(userId: number, limit?: number): Promise<ExerciseSession[]>;
  getExerciseSessionById(id: number): Promise<ExerciseSession | undefined>;
  
  // Mood tracking operations
  createMoodEntry(entry: InsertMoodEntry): Promise<MoodEntry>;
  getUserMoodEntries(userId: number, limit?: number): Promise<MoodEntry[]>;
  getLatestMoodEntry(userId: number): Promise<MoodEntry | undefined>;
  
  // Chat operations
  createChatConversation(conversation: InsertChatConversation): Promise<ChatConversation>;
  updateChatConversation(id: number, messages: any): Promise<ChatConversation>;
  getUserChatConversations(userId: number): Promise<ChatConversation[]>;
  getLatestChatConversation(userId: number): Promise<ChatConversation | undefined>;
  
  // Progress tracking operations
  getUserProgress(userId: number): Promise<UserProgress | undefined>;
  updateUserProgress(userId: number, progress: Partial<InsertUserProgress>): Promise<UserProgress>;
  
  // Appointment operations
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  getUserAppointments(userId: number): Promise<Appointment[]>;
  updateAppointmentStatus(id: number, status: string): Promise<Appointment>;
}

export class DatabaseStorage implements IStorage {
  // User operations for JWT authentication
  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  // Exercise session operations
  async createExerciseSession(session: InsertExerciseSession): Promise<ExerciseSession> {
    const [exerciseSession] = await db
      .insert(exerciseSessions)
      .values(session)
      .returning();
    
    // Update user progress
    await this.incrementUserProgress(session.userId);
    
    return exerciseSession;
  }

  async getUserExerciseSessions(userId: number, limit = 50): Promise<ExerciseSession[]> {
    return await db
      .select()
      .from(exerciseSessions)
      .where(eq(exerciseSessions.userId, userId))
      .orderBy(desc(exerciseSessions.createdAt))
      .limit(limit);
  }

  async getExerciseSessionById(id: number): Promise<ExerciseSession | undefined> {
    const [session] = await db
      .select()
      .from(exerciseSessions)
      .where(eq(exerciseSessions.id, id));
    return session;
  }

  // Mood tracking operations
  async createMoodEntry(entry: InsertMoodEntry): Promise<MoodEntry> {
    const [moodEntry] = await db
      .insert(moodEntries)
      .values(entry)
      .returning();
    return moodEntry;
  }

  async getUserMoodEntries(userId: number, limit = 30): Promise<MoodEntry[]> {
    return await db
      .select()
      .from(moodEntries)
      .where(eq(moodEntries.userId, userId))
      .orderBy(desc(moodEntries.createdAt))
      .limit(limit);
  }

  async getLatestMoodEntry(userId: number): Promise<MoodEntry | undefined> {
    const [entry] = await db
      .select()
      .from(moodEntries)
      .where(eq(moodEntries.userId, userId))
      .orderBy(desc(moodEntries.createdAt))
      .limit(1);
    return entry;
  }

  // Chat operations
  async createChatConversation(conversation: InsertChatConversation): Promise<ChatConversation> {
    const [chatConversation] = await db
      .insert(chatConversations)
      .values(conversation)
      .returning();
    return chatConversation;
  }

  async updateChatConversation(id: number, messages: any): Promise<ChatConversation> {
    const [conversation] = await db
      .update(chatConversations)
      .set({ messages, updatedAt: new Date() })
      .where(eq(chatConversations.id, id))
      .returning();
    return conversation;
  }

  async getUserChatConversations(userId: number): Promise<ChatConversation[]> {
    return await db
      .select()
      .from(chatConversations)
      .where(eq(chatConversations.userId, userId))
      .orderBy(desc(chatConversations.updatedAt));
  }

  async getLatestChatConversation(userId: number): Promise<ChatConversation | undefined> {
    const [conversation] = await db
      .select()
      .from(chatConversations)
      .where(eq(chatConversations.userId, userId))
      .orderBy(desc(chatConversations.updatedAt))
      .limit(1);
    return conversation;
  }

  // Progress tracking operations
  async getUserProgress(userId: number): Promise<UserProgress | undefined> {
    const [progress] = await db
      .select()
      .from(userProgress)
      .where(eq(userProgress.userId, userId));
    return progress;
  }

  async updateUserProgress(userId: number, progressData: Partial<InsertUserProgress>): Promise<UserProgress> {
    const [progress] = await db
      .insert(userProgress)
      .values({ userId, ...progressData })
      .onConflictDoUpdate({
        target: userProgress.userId,
        set: {
          ...progressData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return progress;
  }

  // Helper method to increment user progress after exercise
  private async incrementUserProgress(userId: number): Promise<void> {
    const currentProgress = await this.getUserProgress(userId);
    
    if (currentProgress) {
      await this.updateUserProgress(userId, {
        currentWeekSessions: (currentProgress.currentWeekSessions || 0) + 1,
        totalSessions: (currentProgress.totalSessions || 0) + 1,
      });
    } else {
      await this.updateUserProgress(userId, {
        currentWeekSessions: 1,
        totalSessions: 1,
        weeklyExerciseGoal: 5,
        averageAccuracy: 0,
        streakDays: 0,
      });
    }
  }

  // Appointment operations
  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const [newAppointment] = await db
      .insert(appointments)
      .values(appointment)
      .returning();
    return newAppointment;
  }

  async getUserAppointments(userId: number): Promise<Appointment[]> {
    return await db
      .select()
      .from(appointments)
      .where(eq(appointments.userId, userId))
      .orderBy(desc(appointments.scheduledAt));
  }

  async updateAppointmentStatus(id: number, status: string): Promise<Appointment> {
    const [appointment] = await db
      .update(appointments)
      .set({ status })
      .where(eq(appointments.id, id))
      .returning();
    return appointment;
  }
}

export const storage = new DatabaseStorage();
