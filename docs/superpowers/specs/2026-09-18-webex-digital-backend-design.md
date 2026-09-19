# Design Spec: Webex Digital Backend

**Date:** 2026-09-18
**Status:** Draft
**Owner:** Claude Code / Backend Dev

## 1. Project Overview
Webex Digital is a professional agency website showcasing the ability to build authentic, high-quality websites. The backend serves as a technical showcase ("flex"), demonstrating expertise in real-time communication, AI integration, and enterprise-grade architecture.

### Core Goals
- Provide an AI-powered, anonymous FAQ chatbox.
- Enable a professional, authenticated conversational order system.
- Implement a robust, scalable API with high reliability.
- Show a "Professional" UX through rich metadata and real-time feedback.

## 2. Technical Stack
- **Language:** TypeScript
- **Framework:** NestJS (Enterprise-grade modular architecture)
- **Database:** PostgreSQL (Relational integrity for orders)
- **ORM:** Prisma (Type-safe database access)
- **Real-time:** Socket.io (WebSockets for instant communication)
- **AI Integration:** LLM API (Claude/OpenAI) + `pgvector` (for RAG-based FAQ)
- **Authentication:** Passport.js (JWT, Google OAuth2, and Local Strategy)

## 3. System Architecture

### High-Level Components
1. **API Gateway (NestJS):** Handles HTTP requests, authentication, and routing.
2. **WebSocket Gateway:** Manages persistent connections for the professional chat experience.
3. **AI Service:** Orchestrates LLM calls and vector searches for FAQ and order extraction.
4. **Order State Machine:** Tracks the progress of a conversational order from `DRAFT` to `CONFIRMED`.
5. **Database Layer:** Persistent storage for users, orders, and chat history.

### Data Flow
- **FAQ Path:** User $\rightarrow$ WebSocket $\rightarrow$ NestJS $\rightarrow$ Vector Search $\rightarrow$ LLM $\rightarrow$ User.
- **Order Path:** User $\rightarrow$ WebSocket $\rightarrow$ NestJS $\rightarrow$ Order State Machine $\rightarrow$ PostgreSQL $\rightarrow$ Admin Notification.
- **Auth Path:** User $\rightarrow$ REST $\rightarrow$ Google/Passport $\rightarrow$ JWT $\rightarrow$ User.

## 4. Data Model

### Entities
- **User**: `id (UUID)`, `email (unique)`, `passwordHash`, `googleId`, `role (CUSTOMER|ADMIN)`, `createdAt`, `updatedAt`.
- **Conversation**: `id (UUID)`, `userId (FK, opt)`, `status (ACTIVE|ARCHIVED|COMPLETED)`, `createdAt`.
- **Message**: `id (UUID)`, `conversationId (FK)`, `senderId (FK|SYSTEM)`, `type (TEXT|ORDER_CARD|SYSTEM_ALERT|FILE)`, `content (JSON)`, `isRead`, `createdAt`.
- **Order**: `id (UUID)`, `customerId (FK)`, `conversationId (FK)`, `status (DRAFT|PENDING_REVIEW|CONFIRMED|PAID)`, `totalAmount`, `createdAt`, `updatedAt`.
- **OrderItem**: `id (UUID)`, `orderId (FK)`, `serviceName`, `description`, `price`.
- **KnowledgeBase**: `id (UUID)`, `content (Text)`, `embedding (Vector)`, `category`.

## 5. API Contract

### REST Endpoints
- **Auth**:
  - `POST /auth/register`
  - `POST /auth/login`
  - `GET /auth/google`
  - `GET /auth/google/callback`
- **Orders**:
  - `GET /orders`
  - `GET /orders/:id`
  - `PATCH /orders/:id` (Admin)
- **Knowledge**:
  - `POST /knowledge/upload` (Admin)

### WebSocket Events
- **Client $\rightarrow$ Server**:
  - `join_conversation(conversationId)`
  - `send_message(conversationId, content, type)`
  - `typing_start(conversationId)`
  - `typing_stop(conversationId)`
  - `confirm_order(orderId)`
- **Server $\rightarrow$ Client**:
  - `new_message(senderId, content, type, timestamp)`
  - `user_typing(userId, isTyping)`
  - `order_updated(orderId, currentSummary)`
  - `presence_change(userId, status)`

## 6. "Professional" UX Implementation
- **Rich Messaging:** Use `type` field in messages to trigger custom frontend components (e.g., Order Cards).
- **Presence:** Real-time `online`/`offline` status and `typing` indicators via WebSockets.
- **Pagination:** Implement cursor-based pagination for chat history to ensure fast loading.
- **Error Handling:** Global NestJS `ExceptionFilter` to provide structured `404` and `500` responses for custom frontend error pages.
- **Optimistic UI:** Server-sent signals to trigger loading animations during AI processing.

## 7. Success Criteria
- AI FAQ answers based solely on provided company documentation (no hallucinations).
- Conversational orders successfully extract data into structured database tables.
- Real-time chat latency < 200ms.
- Secure authentication for both Google and Local users.
