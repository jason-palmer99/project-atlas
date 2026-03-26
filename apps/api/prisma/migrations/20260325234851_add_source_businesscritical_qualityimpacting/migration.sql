-- CreateEnum
CREATE TYPE "Tristate" AS ENUM ('YES', 'NO', 'UNKNOWN');

-- AlterTable
ALTER TABLE "SoftwareTitle" ADD COLUMN     "isBusinessCritical" "Tristate" NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN     "isQualityImpacting" "Tristate" NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN     "sourceSystem" TEXT;
