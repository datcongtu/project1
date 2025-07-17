# MOMazing - Postpartum Health Platform

## Overview

MOMazing is a comprehensive postpartum health platform that supports new mothers through their recovery journey with AI-powered exercise guidance, psychological wellness support, and personalized care. The application uses modern web technologies to deliver real-time computer vision-based exercise correction, mood tracking, AI-powered chatbot support, and progress monitoring.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent UI design
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Components**: Radix UI primitives with custom styling through shadcn/ui
- **Design System**: Custom color palette focused on pink/maternal themes with CSS variables

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ESM modules
- **Database**: PostgreSQL with Neon serverless database
- **ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Replit Auth with OpenID Connect integration
- **Session Management**: Express sessions with PostgreSQL store

### Database Schema
The application uses PostgreSQL with the following core entities:
- **Users**: Profile information and authentication data
- **Exercise Sessions**: Workout tracking with computer vision metrics
- **Mood Entries**: Mental health tracking data
- **Chat Conversations**: AI chatbot interaction history
- **User Progress**: Aggregated progress metrics
- **Appointments**: Healthcare provider scheduling
- **Sessions**: Authentication session storage

## Key Components

### Computer Vision Exercise System
- Real-time pose detection and correction (simulated, ready for MediaPipe integration)
- Exercise form analysis with posture scoring
- Rep counting and accuracy metrics
- Camera integration with fallback constraints for device compatibility

### AI Chatbot Support
- Predefined response system with contextual conversation flow
- Support for exercise guidance, emotional support, and wellness advice
- Conversation history persistence
- Integration with backend chat conversation storage

### Wellness Tracking
- Mood tracking with numerical scoring and notes
- Progress visualization with charts and metrics
- Exercise session logging with detailed performance data
- Dashboard with aggregated health insights

### Authentication & Authorization
- Replit Auth integration with OpenID Connect
- Session-based authentication with PostgreSQL session store
- User profile management with automatic user creation/updates
- Protected routes with authentication middleware

## Data Flow

1. **User Authentication**: OpenID Connect flow through Replit Auth creates/updates user records
2. **Exercise Sessions**: Camera captures video → pose detection analysis → metrics storage → progress updates
3. **Mood Tracking**: User input → validation → database storage → progress aggregation
4. **Chat Interactions**: User messages → predefined response logic → conversation persistence
5. **Progress Monitoring**: Aggregated data from exercises and mood entries → dashboard visualization

## External Dependencies

### Core Technologies
- **@neondatabase/serverless**: Serverless PostgreSQL database connection
- **drizzle-orm**: Type-safe database operations and migrations
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui/***: Headless UI component primitives
- **tailwindcss**: Utility-first CSS framework

### Authentication & Session Management
- **openid-client**: OpenID Connect authentication
- **passport**: Authentication middleware
- **connect-pg-simple**: PostgreSQL session store
- **express-session**: Session management

### Development Tools
- **vite**: Frontend build tool and development server
- **tsx**: TypeScript execution for development
- **esbuild**: Production build bundling

## Deployment Strategy

### Development Environment
- Vite development server for frontend with HMR
- Express server with TypeScript execution via tsx
- Replit-specific plugins for development environment integration

### Production Build
- Frontend: Vite builds static assets to `dist/public`
- Backend: esbuild bundles server code to `dist/index.js`
- Single deployment artifact with both frontend and backend

### Database Management
- Drizzle migrations for schema changes
- Environment-based configuration for database connections
- Session table management for authentication persistence

### Key Architecture Decisions

1. **Monorepo Structure**: Unified codebase with shared TypeScript types between frontend and backend for type safety
2. **Serverless Database**: Neon PostgreSQL for scalability and managed infrastructure
3. **Type-Safe ORM**: Drizzle ORM chosen for excellent TypeScript integration and lightweight footprint
4. **Component Library**: shadcn/ui for consistent, accessible UI components with customization flexibility
5. **State Management**: React Query for server state eliminates need for complex client state management
6. **Authentication Strategy**: Replit Auth integration provides seamless authentication in the Replit environment
7. **Real-time Features**: Prepared for computer vision integration with simulated pose detection framework

The architecture prioritizes type safety, developer experience, and scalability while maintaining simplicity for rapid development and deployment.