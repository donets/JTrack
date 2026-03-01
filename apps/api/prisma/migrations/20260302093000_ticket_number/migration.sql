ALTER TABLE "Ticket" ADD COLUMN "ticketNumber" INTEGER;

WITH ranked_tickets AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "locationId"
      ORDER BY "createdAt" ASC, "id" ASC
    ) AS rn
  FROM "Ticket"
)
UPDATE "Ticket" AS t
SET "ticketNumber" = ranked_tickets.rn
FROM ranked_tickets
WHERE t."id" = ranked_tickets."id";

ALTER TABLE "Ticket" ALTER COLUMN "ticketNumber" SET NOT NULL;

CREATE UNIQUE INDEX "Ticket_locationId_ticketNumber_key" ON "Ticket"("locationId", "ticketNumber");
