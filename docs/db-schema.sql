-- JTrack PostgreSQL schema (documentation version)
-- Mirrors apps/api/prisma/schema.prisma.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE "RoleKey" AS ENUM ('Owner', 'Manager', 'Technician');
CREATE TYPE "MembershipStatus" AS ENUM ('invited', 'active', 'suspended');
CREATE TYPE "TicketStatus" AS ENUM ('New', 'Scheduled', 'InProgress', 'Done', 'Invoiced', 'Paid', 'Canceled');
CREATE TYPE "AttachmentKind" AS ENUM ('Photo', 'File');
CREATE TYPE "PaymentProvider" AS ENUM ('manual', 'stripe');
CREATE TYPE "PaymentStatus" AS ENUM ('Pending', 'Succeeded', 'Failed', 'Refunded');

CREATE TABLE "User" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  "refreshTokenHash" TEXT NULL,
  name TEXT NOT NULL,
  "isAdmin" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Location" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  timezone TEXT NOT NULL,
  address TEXT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "UserLocation" (
  "userId" UUID NOT NULL,
  "locationId" UUID NOT NULL,
  role "RoleKey" NOT NULL,
  status "MembershipStatus" NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserLocation_pkey" PRIMARY KEY ("userId", "locationId"),
  CONSTRAINT "UserLocation_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "UserLocation_locationId_fkey"
    FOREIGN KEY ("locationId") REFERENCES "Location"(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Role" (
  key "RoleKey" PRIMARY KEY,
  name TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Privilege" (
  key TEXT PRIMARY KEY,
  description TEXT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "RolePrivilege" (
  "roleKey" "RoleKey" NOT NULL,
  "privilegeKey" TEXT NOT NULL,
  CONSTRAINT "RolePrivilege_pkey" PRIMARY KEY ("roleKey", "privilegeKey"),
  CONSTRAINT "RolePrivilege_roleKey_fkey"
    FOREIGN KEY ("roleKey") REFERENCES "Role"(key) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "RolePrivilege_privilegeKey_fkey"
    FOREIGN KEY ("privilegeKey") REFERENCES "Privilege"(key) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Ticket" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "locationId" UUID NOT NULL,
  "createdByUserId" UUID NOT NULL,
  "assignedToUserId" UUID NULL,
  title TEXT NOT NULL,
  description TEXT NULL,
  status "TicketStatus" NOT NULL DEFAULT 'New',
  "scheduledStartAt" TIMESTAMP(3) NULL,
  "scheduledEndAt" TIMESTAMP(3) NULL,
  priority TEXT NULL,
  "totalAmountCents" INTEGER NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3) NULL,
  CONSTRAINT "Ticket_locationId_fkey"
    FOREIGN KEY ("locationId") REFERENCES "Location"(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Ticket_createdByUserId_fkey"
    FOREIGN KEY ("createdByUserId") REFERENCES "User"(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Ticket_assignedToUserId_fkey"
    FOREIGN KEY ("assignedToUserId") REFERENCES "User"(id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "TicketComment" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "ticketId" UUID NOT NULL,
  "locationId" UUID NOT NULL,
  "authorUserId" UUID NOT NULL,
  body TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3) NULL,
  CONSTRAINT "TicketComment_ticketId_fkey"
    FOREIGN KEY ("ticketId") REFERENCES "Ticket"(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "TicketComment_locationId_fkey"
    FOREIGN KEY ("locationId") REFERENCES "Location"(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "TicketComment_authorUserId_fkey"
    FOREIGN KEY ("authorUserId") REFERENCES "User"(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "TicketAttachment" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "ticketId" UUID NOT NULL,
  "locationId" UUID NOT NULL,
  "uploadedByUserId" UUID NOT NULL,
  kind "AttachmentKind" NOT NULL,
  "storageKey" TEXT NOT NULL,
  url TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  size INTEGER NOT NULL,
  width INTEGER NULL,
  height INTEGER NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3) NULL,
  CONSTRAINT "TicketAttachment_ticketId_fkey"
    FOREIGN KEY ("ticketId") REFERENCES "Ticket"(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "TicketAttachment_locationId_fkey"
    FOREIGN KEY ("locationId") REFERENCES "Location"(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "TicketAttachment_uploadedByUserId_fkey"
    FOREIGN KEY ("uploadedByUserId") REFERENCES "User"(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "PaymentRecord" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "ticketId" UUID NOT NULL,
  "locationId" UUID NOT NULL,
  provider "PaymentProvider" NOT NULL,
  "amountCents" INTEGER NOT NULL,
  currency TEXT NOT NULL,
  status "PaymentStatus" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PaymentRecord_ticketId_fkey"
    FOREIGN KEY ("ticketId") REFERENCES "Ticket"(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "PaymentRecord_locationId_fkey"
    FOREIGN KEY ("locationId") REFERENCES "Location"(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");
CREATE INDEX "Location_name_idx" ON "Location"(name);

CREATE INDEX "UserLocation_locationId_idx" ON "UserLocation"("locationId");
CREATE INDEX "UserLocation_userId_idx" ON "UserLocation"("userId");

CREATE INDEX "Ticket_locationId_updatedAt_idx" ON "Ticket"("locationId", "updatedAt");
CREATE INDEX "Ticket_locationId_status_idx" ON "Ticket"("locationId", status);
CREATE INDEX "Ticket_locationId_assignedToUserId_idx" ON "Ticket"("locationId", "assignedToUserId");
CREATE INDEX "Ticket_deletedAt_idx" ON "Ticket"("deletedAt");

CREATE INDEX "TicketComment_locationId_updatedAt_idx" ON "TicketComment"("locationId", "updatedAt");
CREATE INDEX "TicketComment_ticketId_idx" ON "TicketComment"("ticketId");
CREATE INDEX "TicketComment_deletedAt_idx" ON "TicketComment"("deletedAt");

CREATE INDEX "TicketAttachment_locationId_updatedAt_idx" ON "TicketAttachment"("locationId", "updatedAt");
CREATE INDEX "TicketAttachment_ticketId_idx" ON "TicketAttachment"("ticketId");
CREATE INDEX "TicketAttachment_deletedAt_idx" ON "TicketAttachment"("deletedAt");

CREATE INDEX "PaymentRecord_locationId_updatedAt_idx" ON "PaymentRecord"("locationId", "updatedAt");
CREATE INDEX "PaymentRecord_ticketId_idx" ON "PaymentRecord"("ticketId");

-- Notes:
-- 1) Soft-delete is used via deletedAt on Ticket/TicketComment/TicketAttachment.
-- 2) updatedAt is maintained by application layer (Prisma @updatedAt behavior).
-- 3) User deletion flow first clears User.refreshTokenHash, then reassigns historical Ticket/TicketComment/TicketAttachment user FKs (including Ticket.assignedToUserId) to reserved non-admin system account before hard-delete.
-- 3) Location delete is restricted at application layer when dependent location-scoped business rows exist.
-- 4) User deletion flow first clears User.refreshTokenHash, then reassigns historical Ticket/TicketComment/TicketAttachment user FKs (including Ticket.assignedToUserId) to reserved non-admin system account before hard-delete.
