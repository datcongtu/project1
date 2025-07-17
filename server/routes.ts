import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertExerciseSessionSchema,
  insertMoodEntrySchema,
  insertChatConversationSchema,
  insertAppointmentSchema,
} from "@shared/schema";
import { z } from "zod";

// Default user for non-authenticated access
const DEFAULT_USER_ID = "default_user";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create default user if it doesn't exist
  try {
    await storage.upsertUser({
      id: DEFAULT_USER_ID,
      email: "user@example.com",
      firstName: "Demo",
      lastName: "User",
      profileImageUrl: null,
    });
  } catch (error) {
    console.error("Error creating default user:", error);
  }

  // Auth routes
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      const user = await storage.getUser(DEFAULT_USER_ID);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Exercise session routes
  app.post('/api/exercise-sessions', async (req: any, res) => {
    try {
      const sessionData = insertExerciseSessionSchema.parse({
        ...req.body,
        userId: DEFAULT_USER_ID,
      });
      
      const session = await storage.createExerciseSession(sessionData);
      res.json(session);
    } catch (error) {
      console.error("Error creating exercise session:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid exercise session data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create exercise session" });
    }
  });

  app.get('/api/exercise-sessions', async (req: any, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const sessions = await storage.getUserExerciseSessions(DEFAULT_USER_ID, limit);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching exercise sessions:", error);
      res.status(500).json({ message: "Failed to fetch exercise sessions" });
    }
  });

  // Mood tracking routes
  app.post('/api/mood-entries', async (req: any, res) => {
    try {
      const moodData = insertMoodEntrySchema.parse({
        ...req.body,
        userId: DEFAULT_USER_ID,
      });
      
      const moodEntry = await storage.createMoodEntry(moodData);
      res.json(moodEntry);
    } catch (error) {
      console.error("Error creating mood entry:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid mood entry data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create mood entry" });
    }
  });

  app.get('/api/mood-entries', async (req: any, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const entries = await storage.getUserMoodEntries(DEFAULT_USER_ID, limit);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching mood entries:", error);
      res.status(500).json({ message: "Failed to fetch mood entries" });
    }
  });

  app.get('/api/mood-entries/latest', async (req: any, res) => {
    try {
      const entry = await storage.getLatestMoodEntry(DEFAULT_USER_ID);
      res.json(entry || null);
    } catch (error) {
      console.error("Error fetching latest mood entry:", error);
      res.status(500).json({ message: "Failed to fetch latest mood entry" });
    }
  });

  // Chat conversation routes
  app.post('/api/chat/conversations', async (req: any, res) => {
    try {
      const conversationData = insertChatConversationSchema.parse({
        ...req.body,
        userId: DEFAULT_USER_ID,
      });
      
      const conversation = await storage.createChatConversation(conversationData);
      res.json(conversation);
    } catch (error) {
      console.error("Error creating chat conversation:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid conversation data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create conversation" });
    }
  });

  app.put('/api/chat/conversations/:id', async (req: any, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const { messages } = req.body;
      
      const conversation = await storage.updateChatConversation(conversationId, messages);
      res.json(conversation);
    } catch (error) {
      console.error("Error updating chat conversation:", error);
      res.status(500).json({ message: "Failed to update conversation" });
    }
  });

  app.get('/api/chat/conversations', async (req: any, res) => {
    try {
      const conversations = await storage.getUserChatConversations(DEFAULT_USER_ID);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching chat conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.get('/api/chat/conversations/latest', async (req: any, res) => {
    try {
      const conversation = await storage.getLatestChatConversation(DEFAULT_USER_ID);
      res.json(conversation || null);
    } catch (error) {
      console.error("Error fetching latest conversation:", error);
      res.status(500).json({ message: "Failed to fetch latest conversation" });
    }
  });

  // Progress tracking routes
  app.get('/api/progress', async (req: any, res) => {
    try {
      const progress = await storage.getUserProgress(DEFAULT_USER_ID);
      res.json(progress || null);
    } catch (error) {
      console.error("Error fetching user progress:", error);
      res.status(500).json({ message: "Failed to fetch progress" });
    }
  });

  app.put('/api/progress', async (req: any, res) => {
    try {
      const progressData = req.body;
      
      const progress = await storage.updateUserProgress(DEFAULT_USER_ID, progressData);
      res.json(progress);
    } catch (error) {
      console.error("Error updating user progress:", error);
      res.status(500).json({ message: "Failed to update progress" });
    }
  });

  // Appointment routes
  app.post('/api/appointments', async (req: any, res) => {
    try {
      const appointmentData = insertAppointmentSchema.parse({
        ...req.body,
        userId: DEFAULT_USER_ID,
      });
      
      const appointment = await storage.createAppointment(appointmentData);
      res.json(appointment);
    } catch (error) {
      console.error("Error creating appointment:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid appointment data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create appointment" });
    }
  });

  app.get('/api/appointments', async (req: any, res) => {
    try {
      const appointments = await storage.getUserAppointments(DEFAULT_USER_ID);
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  app.put('/api/appointments/:id/status', async (req: any, res) => {
    try {
      const appointmentId = parseInt(req.params.id);
      const { status } = req.body;
      
      const appointment = await storage.updateAppointmentStatus(appointmentId, status);
      res.json(appointment);
    } catch (error) {
      console.error("Error updating appointment status:", error);
      res.status(500).json({ message: "Failed to update appointment status" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
