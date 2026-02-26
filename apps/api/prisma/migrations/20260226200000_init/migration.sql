CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "RoleKey" AS ENUM ('Owner', 'Manager', 'Technician');
CREATE TYPE "MembershipStatus" AS ENUM ('invited', 'active', 'suspended');
CREATE TYPE "TicketStatus" AS ENUM ('New', 'Scheduled', 'InProgress', 'Done', 'Invoiced', 'Paid', 'Canceled');
CREATE TYPE "AttachmentKind" AS ENUM ('Photo', 'File');
CREATE TYPE "PaymentProvider" AS ENUM ('manual', 'stripe');
CREATE TYPE "PaymentStatus" AS ENUM ('Pending', 'Succeeded', 'Failed', 'Refunded');
CREATE TYPE "AuthTokenType" AS ENUM ('EmailVerification', 'PasswordReset', 'InviteAccept');

-- ── Users ──────────────────────────────────────────────────────────

CREATE TABLE "User" (
  "id" UUID NOT NULL,
  "email" TEXT NOT NULL,
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

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
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
  CONSTRAINT "AuthToken_pkey" PRIMARY KEY ("id")
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
  CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
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
  CONSTRAINT "UserLocation_pkey" PRIMARY KEY ("userId", "locationId")
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
  CONSTRAINT "RolePrivilege_pkey" PRIMARY KEY ("roleKey", "privilegeKey")
);

-- ── Tickets ────────────────────────────────────────────────────────

CREATE TABLE "Ticket" (
  "id" UUID NOT NULL,
  "locationId" UUID NOT NULL,
  "createdByUserId" UUID NOT NULL,
  "assignedToUserId" UUID,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" "TicketStatus" NOT NULL DEFAULT 'New',
  "scheduledStartAt" TIMESTAMP(3),
  "scheduledEndAt" TIMESTAMP(3),
  "priority" TEXT,
  "totalAmountCents" INTEGER,
  "currency" TEXT NOT NULL DEFAULT 'EUR',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Ticket_locationId_updatedAt_idx" ON "Ticket"("locationId", "updatedAt");
CREATE INDEX "Ticket_locationId_status_idx" ON "Ticket"("locationId", "status");
CREATE INDEX "Ticket_locationId_assignedToUserId_idx" ON "Ticket"("locationId", "assignedToUserId");
CREATE INDEX "Ticket_deletedAt_idx" ON "Ticket"("deletedAt");

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
  CONSTRAINT "TicketComment_pkey" PRIMARY KEY ("id")
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
  CONSTRAINT "TicketAttachment_pkey" PRIMARY KEY ("id")
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
  CONSTRAINT "PaymentRecord_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PaymentRecord_locationId_updatedAt_idx" ON "PaymentRecord"("locationId", "updatedAt");
CREATE INDEX "PaymentRecord_ticketId_idx" ON "PaymentRecord"("ticketId");

-- ── Foreign Keys ───────────────────────────────────────────────────

ALTER TABLE "AuthToken" ADD CONSTRAINT "AuthToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserLocation" ADD CONSTRAINT "UserLocation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserLocation" ADD CONSTRAINT "UserLocation_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RolePrivilege" ADD CONSTRAINT "RolePrivilege_roleKey_fkey" FOREIGN KEY ("roleKey") REFERENCES "Role"("key") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RolePrivilege" ADD CONSTRAINT "RolePrivilege_privilegeKey_fkey" FOREIGN KEY ("privilegeKey") REFERENCES "Privilege"("key") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TicketComment" ADD CONSTRAINT "TicketComment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TicketComment" ADD CONSTRAINT "TicketComment_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TicketComment" ADD CONSTRAINT "TicketComment_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TicketAttachment" ADD CONSTRAINT "TicketAttachment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TicketAttachment" ADD CONSTRAINT "TicketAttachment_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TicketAttachment" ADD CONSTRAINT "TicketAttachment_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PaymentRecord" ADD CONSTRAINT "PaymentRecord_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PaymentRecord" ADD CONSTRAINT "PaymentRecord_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
