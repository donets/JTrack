-- JTrack PostgreSQL schema (documentation version)
-- Mirrors apps/api/prisma/schema.prisma.
-- Single-file DDL — drop and re-create for prototype resets.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "RoleKey" AS ENUM ('Owner', 'Manager', 'Technician');
CREATE TYPE "MembershipStatus" AS ENUM ('invited', 'active', 'suspended');
CREATE TYPE "TicketStatus" AS ENUM ('New', 'Scheduled', 'InProgress', 'Done', 'Invoiced', 'Paid', 'Canceled');
CREATE TYPE "TicketActivityType" AS ENUM ('status_change', 'assignment', 'comment', 'attachment', 'payment', 'created');
CREATE TYPE "AttachmentKind" AS ENUM ('Photo', 'File');
CREATE TYPE "PaymentProvider" AS ENUM ('manual', 'stripe');
CREATE TYPE "PaymentStatus" AS ENUM ('Pending', 'Succeeded', 'Failed', 'Refunded');
CREATE TYPE "AuthTokenType" AS ENUM ('EmailVerification', 'PasswordReset', 'InviteAccept');

-- ── Users ──────────────────────────────────────────────────────────

CREATE TABLE "User" (
  "id" UUID NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "isAdmin" BOOLEAN NOT NULL DEFAULT FALSE,
  "tokenVersion" INTEGER NOT NULL DEFAULT 0,
  "emailVerifiedAt" TIMESTAMP(3),
  "passwordChangedAt" TIMESTAMP(3),
  "lastLoginAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- ── Auth Tokens (verification / reset OTPs) ────────────────────────

CREATE TABLE "AuthToken" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "type" "AuthTokenType" NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdByIp" TEXT,
  "userAgent" TEXT,
  CONSTRAINT "AuthToken_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AuthToken_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "AuthToken_tokenHash_idx" ON "AuthToken"("tokenHash");
CREATE INDEX "AuthToken_userId_type_idx" ON "AuthToken"("userId", "type");

-- ── Sessions (refresh tokens) ──────────────────────────────────────

CREATE TABLE "Session" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "refreshTokenHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revokedAt" TIMESTAMP(3),
  "ip" TEXT,
  "userAgent" TEXT,
  CONSTRAINT "Session_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Session_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Session_refreshTokenHash_idx" ON "Session"("refreshTokenHash");

-- ── Locations ──────────────────────────────────────────────────────

CREATE TABLE "Location" (
  "id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "timezone" TEXT NOT NULL,
  "address" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Location_name_idx" ON "Location"("name");

-- ── User ↔ Location membership ─────────────────────────────────────

CREATE TABLE "UserLocation" (
  "userId" UUID NOT NULL,
  "locationId" UUID NOT NULL,
  "role" "RoleKey" NOT NULL,
  "status" "MembershipStatus" NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserLocation_pkey" PRIMARY KEY ("userId", "locationId"),
  CONSTRAINT "UserLocation_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "UserLocation_locationId_fkey"
    FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "UserLocation_locationId_idx" ON "UserLocation"("locationId");
CREATE INDEX "UserLocation_userId_idx" ON "UserLocation"("userId");

-- ── RBAC ───────────────────────────────────────────────────────────

CREATE TABLE "Role" (
  "key" "RoleKey" NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Role_pkey" PRIMARY KEY ("key")
);

CREATE TABLE "Privilege" (
  "key" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Privilege_pkey" PRIMARY KEY ("key")
);

CREATE TABLE "RolePrivilege" (
  "roleKey" "RoleKey" NOT NULL,
  "privilegeKey" TEXT NOT NULL,
  CONSTRAINT "RolePrivilege_pkey" PRIMARY KEY ("roleKey", "privilegeKey"),
  CONSTRAINT "RolePrivilege_roleKey_fkey"
    FOREIGN KEY ("roleKey") REFERENCES "Role"("key") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "RolePrivilege_privilegeKey_fkey"
    FOREIGN KEY ("privilegeKey") REFERENCES "Privilege"("key") ON DELETE CASCADE ON UPDATE CASCADE
);

-- ── Tickets ────────────────────────────────────────────────────────

CREATE TABLE "Ticket" (
  "id" UUID NOT NULL,
  "locationId" UUID NOT NULL,
  "ticketNumber" INTEGER NOT NULL,
  "createdByUserId" UUID NOT NULL,
  "assignedToUserId" UUID,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "checklist" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "status" "TicketStatus" NOT NULL DEFAULT 'New',
  "scheduledStartAt" TIMESTAMP(3),
  "scheduledEndAt" TIMESTAMP(3),
  "priority" TEXT,
  "totalAmountCents" INTEGER,
  "currency" TEXT NOT NULL DEFAULT 'EUR',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Ticket_locationId_fkey"
    FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Ticket_createdByUserId_fkey"
    FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Ticket_assignedToUserId_fkey"
    FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "Ticket_locationId_updatedAt_idx" ON "Ticket"("locationId", "updatedAt");
CREATE UNIQUE INDEX "Ticket_locationId_ticketNumber_key" ON "Ticket"("locationId", "ticketNumber");
CREATE INDEX "Ticket_locationId_status_idx" ON "Ticket"("locationId", "status");
CREATE INDEX "Ticket_locationId_assignedToUserId_idx" ON "Ticket"("locationId", "assignedToUserId");
CREATE INDEX "Ticket_deletedAt_idx" ON "Ticket"("deletedAt");

-- ── Ticket Activity ────────────────────────────────────────────────

CREATE TABLE "TicketActivity" (
  "id" UUID NOT NULL,
  "ticketId" UUID NOT NULL,
  "locationId" UUID NOT NULL,
  "userId" UUID,
  "type" "TicketActivityType" NOT NULL,
  "metadata" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TicketActivity_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TicketActivity_ticketId_fkey"
    FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "TicketActivity_locationId_fkey"
    FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "TicketActivity_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "TicketActivity_locationId_updatedAt_idx" ON "TicketActivity"("locationId", "updatedAt");
CREATE INDEX "TicketActivity_ticketId_createdAt_idx" ON "TicketActivity"("ticketId", "createdAt");

-- ── Comments ───────────────────────────────────────────────────────

CREATE TABLE "TicketComment" (
  "id" UUID NOT NULL,
  "ticketId" UUID NOT NULL,
  "locationId" UUID NOT NULL,
  "authorUserId" UUID NOT NULL,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "TicketComment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TicketComment_ticketId_fkey"
    FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "TicketComment_locationId_fkey"
    FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "TicketComment_authorUserId_fkey"
    FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "TicketComment_locationId_updatedAt_idx" ON "TicketComment"("locationId", "updatedAt");
CREATE INDEX "TicketComment_ticketId_idx" ON "TicketComment"("ticketId");
CREATE INDEX "TicketComment_deletedAt_idx" ON "TicketComment"("deletedAt");

-- ── Attachments ────────────────────────────────────────────────────

CREATE TABLE "TicketAttachment" (
  "id" UUID NOT NULL,
  "ticketId" UUID NOT NULL,
  "locationId" UUID NOT NULL,
  "uploadedByUserId" UUID NOT NULL,
  "kind" "AttachmentKind" NOT NULL,
  "storageKey" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "width" INTEGER,
  "height" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "TicketAttachment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TicketAttachment_ticketId_fkey"
    FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "TicketAttachment_locationId_fkey"
    FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "TicketAttachment_uploadedByUserId_fkey"
    FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "TicketAttachment_locationId_updatedAt_idx" ON "TicketAttachment"("locationId", "updatedAt");
CREATE INDEX "TicketAttachment_ticketId_idx" ON "TicketAttachment"("ticketId");
CREATE INDEX "TicketAttachment_deletedAt_idx" ON "TicketAttachment"("deletedAt");

-- ── Payments ───────────────────────────────────────────────────────

CREATE TABLE "PaymentRecord" (
  "id" UUID NOT NULL,
  "ticketId" UUID NOT NULL,
  "locationId" UUID NOT NULL,
  "provider" "PaymentProvider" NOT NULL,
  "amountCents" INTEGER NOT NULL,
  "currency" TEXT NOT NULL,
  "status" "PaymentStatus" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PaymentRecord_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PaymentRecord_ticketId_fkey"
    FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "PaymentRecord_locationId_fkey"
    FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "PaymentRecord_locationId_updatedAt_idx" ON "PaymentRecord"("locationId", "updatedAt");
CREATE INDEX "PaymentRecord_ticketId_idx" ON "PaymentRecord"("ticketId");

-- Notes:
-- 1) Soft-delete is used via deletedAt on Ticket/TicketComment/TicketAttachment.
-- 2) updatedAt is maintained by application layer (Prisma @updatedAt behavior).
-- 3) Location delete is restricted at application layer when dependent location-scoped business rows exist.
-- 4) User deletion flow revokes all sessions (Session.revokedAt), then reassigns historical Ticket/TicketComment/TicketAttachment user FKs (including Ticket.assignedToUserId) to reserved non-admin system account before hard-delete.
-- 5) Invite onboarding is token-based at application layer; invited memberships move to active after password setup.
-- 6) AuthToken stores hashed OTP codes for email verification and password reset flows; tokens are single-use (consumedAt) and time-bounded (expiresAt).
-- 7) Session stores refresh token hashes; refresh token rotation updates the hash in place; reuse detection compares hash mismatches on the same session row.
