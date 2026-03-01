ALTER TABLE "Ticket"
  ADD COLUMN "checklist" JSONB NOT NULL DEFAULT '[]'::jsonb;
