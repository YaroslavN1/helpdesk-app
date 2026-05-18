DO $$ BEGIN
  CREATE TYPE "UserRole" AS ENUM ('admin', 'agent');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "user" ALTER COLUMN "role" DROP DEFAULT;

ALTER TABLE "user"
  ALTER COLUMN "role" TYPE "UserRole" USING "role"::"UserRole";

ALTER TABLE "user"
  ALTER COLUMN "role" SET DEFAULT 'agent'::"UserRole";
