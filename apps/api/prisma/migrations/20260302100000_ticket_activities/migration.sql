CREATE TYPE "TicketActivityType" AS ENUM (
  'status_change',
  'assignment',
  'comment',
  'attachment',
  'payment',
  'created'
);

CREATE TABLE "TicketActivity" (
  "id" UUID NOT NULL,
  "ticketId" UUID NOT NULL,
  "locationId" UUID NOT NULL,
  "userId" UUID,
  "type" "TicketActivityType" NOT NULL,
  "metadata" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TicketActivity_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TicketActivity_locationId_updatedAt_idx" ON "TicketActivity"("locationId", "updatedAt");
CREATE INDEX "TicketActivity_ticketId_createdAt_idx" ON "TicketActivity"("ticketId", "createdAt");

ALTER TABLE "TicketActivity"
  ADD CONSTRAINT "TicketActivity_ticketId_fkey"
  FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "TicketActivity"
  ADD CONSTRAINT "TicketActivity_locationId_fkey"
  FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "TicketActivity"
  ADD CONSTRAINT "TicketActivity_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
