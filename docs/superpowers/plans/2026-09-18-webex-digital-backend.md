# Webex Digital Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a professional agency backend with an AI-powered FAQ and a conversational ordering system that "flexes" technical expertise.

**Architecture:** Modular NestJS architecture utilizing a WebSocket gateway for real-time interaction, a pgvector-powered RAG system for FAQs, and a state-driven conversational agent for order extraction.

**Tech Stack:** TypeScript, NestJS, PostgreSQL, Prisma, Socket.io, LLM API, Passport.js.

**Spec:** `docs/superpowers/specs/2026-09-18-webex-digital-backend-design.md`

## Global Constraints
- Use UUIDs for all primary keys.
- All API responses must be structured JSON.
- Real-time latency target < 200ms.
- Strict type safety via TypeScript and Prisma.
- All business logic in services, not controllers/gateways.
- Error handling must use a global NestJS Exception Filter.

---

## File Mapping

### Foundation
- `prisma/schema.prisma`: Database schema definition.
- `src/main.ts`: Application entry point.
- `src/app.module.ts`: Root application module.

### Auth Subsystem
- `src/auth/auth.module.ts`: Auth module definition.
- `src/auth/auth.service.ts`: Logic for registration, login, and token issuance.
- `src/auth/auth.controller.ts`: REST endpoints for auth.
- `src/auth/strategies/jwt.strategy.ts`: Passport JWT strategy.
- `src/auth/strategies/google.strategy.ts`: Passport Google OAuth2 strategy.

### Chat & Real-time Subsystem
- `src/chat/chat.module.ts`: Chat module definition.
- `src/chat/chat.gateway.ts`: Socket.io gateway for real-time events.
- `src/chat/chat.service.ts`: Logic for message persistence and conversation management.

### AI & Knowledge Subsystem
- `src/knowledge/knowledge.module.ts`: Knowledge module definition.
- `src/knowledge/knowledge.service.ts`: Logic for vector embeddings and RAG.
- `src/knowledge/vector.store.ts`: PostgreSQL pgvector wrapper.

### Order Subsystem
- `src/orders/order.module.ts`: Order module definition.
- `src/orders/order.service.ts`: Logic for order creation and updates.
- `src/orders/order.controller.ts`: REST endpoints for order management.
- `src/orders/order.state-machine.ts`: Logic for conversational order flow.

### Common
- `src/common/filters/http-exception.filter.ts`: Global 404/500 handler.
- `src/common/constants/index.ts`: App-wide constants and Enums.

---

## Implementation Tasks

### Task 1: Project Scaffolding & Database Foundation

**Files:**
- Create: `prisma/schema.prisma`
- Create: `src/main.ts`
- Create: `src/app.module.ts`

- [ ] **Step 1: Initialize NestJS project and install core dependencies**
  Run: `npm i @prisma/client @nestjs/passport passport passport-jwt passport-google-oauth20 @nestjs/jwt socket.io`
  Run: `npm i -D prisma typescript @types/passport-jwt @types/passport-google-oauth20`

- [ ] **Step 2: Define Prisma Schema**
  Implement `User`, `Conversation`, `Message`, `Order`, `OrderItem`, and `KnowledgeBase` entities in `prisma/schema.prisma` using UUIDs.

- [ ] **Step 3: Setup PostgreSQL with pgvector**
  Ensure Postgres is running and run: `CREATE EXTENSION IF NOT EXISTS vector;`

- [ ] **Step 4: Run initial migration**
  Run: `npx prisma migrate dev --name init`

- [ ] **Step 5: Verify DB connection with a simple health check endpoint in `app.module.ts`**

- [ ] **Step 6: Commit**

### Task 2: Local Authentication System

**Files:**
- Create: `src/auth/auth.module.ts`
- Create: `src/auth/auth.service.ts`
- Create: `src/auth/auth.controller.ts`
- Create: `src/auth/strategies/jwt.strategy.ts`

- [ ] **Step 1: Implement `AuthService.register`**
  Logic: Hash password using `bcrypt`, save user to DB via Prisma.

- [ ] **Step 2: Implement `AuthService.login`**
  Logic: Validate password, issue JWT token with `User` ID and role.

- [ ] **Step 3: Implement `JwtStrategy`**
  Logic: Validate JWT from `Authorization: Bearer <token>` header.

- [ ] **Step 4: Create `AuthController` with POST `/auth/register` and POST `/auth/login`**

- [ ] **Step 5: Write integration test for register $\rightarrow$ login $\rightarrow$ token validation flow**

- [ ] **Step 6: Commit**

### Task 3: Google OAuth2 Integration

**Files:**
- Create: `src/auth/strategies/google.strategy.ts`
- Modify: `src/auth/auth.controller.ts`
- Modify: `src/auth/auth.service.ts`

- [ ] **Step 1: Implement `GoogleStrategy`**
  Logic: Configure client ID/secret, handle profile mapping to `User` entity.

- [ ] **Step 2: Implement `AuthService.validateGoogleUser`**
  Logic: Find user by `googleId` or create new user if they don't exist.

- [ ] **Step 3: Create `GET /auth/google` (redirect) and `GET /auth/google/callback` (handle response)**

- [ ] **Step 4: Verify Google login flow returns a valid JWT**

- [ ] **Step 5: Commit**

### Task 4: Real-time Chat Infrastructure

**Files:**
- Create: `src/chat/chat.module.ts`
- Create: `src/chat/chat.gateway.ts`
- Create: `src/chat/chat.service.ts`

- [ ] **Step 1: Setup `ChatGateway` using `@WebSocketGateway()`**
  Logic: Configure CORS and basic connection handling.

- [ ] **Step 2: Implement `join_conversation` event**
  Logic: Associate socket ID with a `conversationId` in memory/Redis.

- [ ] **Step 3: Implement `send_message` event**
  Logic: Save message to PostgreSQL via `ChatService` and emit `new_message` to all clients in the room.

- [ ] **Step 4: Implement `Message` type handling**
  Logic: Ensure the `type` field (TEXT, ORDER_CARD, etc.) is correctly saved and emitted.

- [ ] **Step 5: Write test using `socket.io-client` to verify multi-user message exchange**

- [ ] **Step 6: Commit**

### Task 5: AI Knowledge Base & FAQ (RAG)

**Files:**
- Create: `src/knowledge/knowledge.module.ts`
- Create: `src/knowledge/knowledge.service.ts`
- Create: `src/knowledge/vector.store.ts`

- [ ] **Step 1: Implement `VectorStore.saveEmbedding`**
  Logic: Use `prisma.$executeRaw` to insert embeddings into the `KnowledgeBase` table.

- [ ] **Step 2: Implement `VectorStore.searchSimilar`**
  Logic: Use cosine similarity operator `<=>` in pgvector to find top-K relevant documents.

- [ ] **Step 3: Implement `KnowledgeService.askQuestion`**
  Logic: Embed user query $\rightarrow$ Search Vector Store $\rightarrow$ Feed context to LLM $\rightarrow$ Return response.

- [ ] **Step 4: Connect `ChatGateway` to `KnowledgeService` for anonymous FAQ requests**

- [ ] **Step 5: Verify AI answers using a test knowledge set (e.g., "Our pricing is $500")**

- [ ] **Step 6: Commit**

### Task 6: Professional Chat Enhancements

**Files:**
- Modify: `src/chat/chat.gateway.ts`
- Modify: `src/chat/chat.service.ts`

- [ ] **Step 1: Implement `typing_start` and `typing_stop` events**
  Logic: Broadcast `user_typing` event to the conversation room.

- [ ] **Step 2: Implement Presence Logic**
  Logic: Track `online`/`offline` status based on socket connect/disconnect events.

- [ ] **Step 3: Implement Paginated History**
  Logic: Create `GET /chat/history/:id` with `limit` and `cursor` params using Prisma.

- [ ] **Step 4: Verify real-time presence and infinite scroll history via Postman/ThunderClient**

- [ ] **Step 5: Commit**

### Task 7: Conversational Order System (The "Flex")

**Files:**
- Create: `src/orders/order.module.ts`
- Create: `src/orders/order.service.ts`
- Create: `src/orders/order.controller.ts`
- Create: `src/orders/order.state-machine.ts`

- [ ] **Step 1: Implement `OrderStateMachine`**
  Logic: Define states (`GATHERING_INFO`, `REVIEW`, `CONFIRMED`) and valid transitions.

- [ ] **Step 2: Implement LLM Tool-Calling for Order Extraction**
  Logic: Configure LLM to call a `update_order_details` tool when it detects order-related info in chat.

- [ ] **Step 3: Implement `OrderService.updateDraft`**
  Logic: Save extracted data into `Order` and `OrderItem` tables.

- [ ] **Step 4: Implement `confirm_order` WebSocket event**
  Logic: Transition order state to `CONFIRMED` and notify Admin.

- [ ] **Step 5: End-to-End Test: Chat $\rightarrow$ AI extracts data $\rightarrow$ Order created in DB $\rightarrow$ User confirms**

- [ ] **Step 6: Commit**

### Task 8: Professional Polish & Error Handling

**Files:**
- Create: `src/common/filters/http-exception.filter.ts`
- Modify: `src/main.ts`

- [ ] **Step 1: Implement Global `HttpExceptionFilter`**
  Logic: Catch all errors and return a structured JSON: `{ statusCode: number, message: string, timestamp: string, path: string }`.

- [ ] **Step 2: Setup specific 404 handlers for missing resources**

- [ ] **Step 3: Implement server-side "Loading" signals**
  Logic: Emit a `system_alert` type message when AI processing starts and ends.

- [ ] **Step 4: Final stress test of the entire flow (Auth $\rightarrow$ FAQ $\rightarrow$ Order $\rightarrow$ Confirm)**

- [ ] **Step 5: Final Commit**
