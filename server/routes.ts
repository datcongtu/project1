import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authMiddleware, hashPassword, comparePassword, generateToken, type AuthRequest } from "./auth";
import { 
  insertExerciseSessionSchema,
  insertMoodEntrySchema,
  insertChatConversationSchema,
  insertAppointmentSchema,
  registerSchema,
  loginSchema,
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post('/api/register', async (req, res) => {
    try {
      const userData = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
      
      // Hash password and create user
      const passwordHash = await hashPassword(userData.password);
      const newUser = await storage.createUser({
        ...userData,
        passwordHash,
      });
      
      // Generate JWT token
      const token = generateToken(newUser);
      
      res.status(201).json({
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
        },
        token,
      });
    } catch (error) {
      console.error("Registration error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post('/api/login', async (req, res) => {
    try {
      const loginData = loginSchema.parse(req.body);
      
      // Find user by email
      const user = await storage.getUserByEmail(loginData.email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Verify password
      const isValidPassword = await comparePassword(loginData.password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Generate JWT token
      const token = generateToken(user);
      
      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        token,
      });
    } catch (error) {
      console.error("Login error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid login data", errors: error.errors });
      }
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.get('/api/auth/user', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const user = req.user!;
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Exercise session routes
  app.post('/api/exercise-sessions', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const sessionData = insertExerciseSessionSchema.parse({
        ...req.body,
        userId: req.user!.id,
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

  app.get('/api/exercise-sessions', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const sessions = await storage.getUserExerciseSessions(req.user!.id, limit);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching exercise sessions:", error);
      res.status(500).json({ message: "Failed to fetch exercise sessions" });
    }
  });

  // Mood tracking routes
  app.post('/api/mood-entries', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const moodData = insertMoodEntrySchema.parse({
        ...req.body,
        userId: req.user!.id,
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

  app.get('/api/mood-entries', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const entries = await storage.getUserMoodEntries(req.user!.id, limit);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching mood entries:", error);
      res.status(500).json({ message: "Failed to fetch mood entries" });
    }
  });

  app.get('/api/mood-entries/latest', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const entry = await storage.getLatestMoodEntry(req.user!.id);
      res.json(entry || null);
    } catch (error) {
      console.error("Error fetching latest mood entry:", error);
      res.status(500).json({ message: "Failed to fetch latest mood entry" });
    }
  });

  // Chat conversation routes
  app.post('/api/chat/conversations', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const conversationData = insertChatConversationSchema.parse({
        ...req.body,
        userId: req.user!.id,
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

  app.put('/api/chat/conversations/:id', authMiddleware, async (req: AuthRequest, res) => {
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

  app.get('/api/chat/conversations', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const conversations = await storage.getUserChatConversations(req.user!.id);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching chat conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.get('/api/chat/conversations/latest', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const conversation = await storage.getLatestChatConversation(req.user!.id);
      res.json(conversation || null);
    } catch (error) {
      console.error("Error fetching latest conversation:", error);
      res.status(500).json({ message: "Failed to fetch latest conversation" });
    }
  });

  // Progress tracking routes
  app.get('/api/progress', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const progress = await storage.getUserProgress(req.user!.id);
      res.json(progress || null);
    } catch (error) {
      console.error("Error fetching user progress:", error);
      res.status(500).json({ message: "Failed to fetch progress" });
    }
  });

  app.put('/api/progress', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const progressData = req.body;
      
      const progress = await storage.updateUserProgress(req.user!.id, progressData);
      res.json(progress);
    } catch (error) {
      console.error("Error updating user progress:", error);
      res.status(500).json({ message: "Failed to update progress" });
    }
  });

  // Appointment routes
  app.post('/api/appointments', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const appointmentData = insertAppointmentSchema.parse({
        ...req.body,
        userId: req.user!.id,
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

  app.get('/api/appointments', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const appointments = await storage.getUserAppointments(req.user!.id);
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  app.put('/api/appointments/:id/status', authMiddleware, async (req: AuthRequest, res) => {
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
