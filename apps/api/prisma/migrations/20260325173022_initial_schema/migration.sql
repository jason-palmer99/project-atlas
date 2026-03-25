-- CreateEnum
CREATE TYPE "SoftwareTitleStatus" AS ENUM ('ACTIVE', 'RETIRED', 'UNDER_REVIEW');

-- CreateEnum
CREATE TYPE "CatalogDecisionType" AS ENUM ('SANCTIONED', 'UNSANCTIONED_RUNNING', 'PENDING_GOVERNANCE', 'BLOCKED', 'RETIRED');

-- CreateEnum
CREATE TYPE "EvidenceType" AS ENUM ('QNA', 'VENDOR_RISK_ASSESSMENT', 'SOFTWARE_RISK_ASSESSMENT', 'SECURITY_SCAN');

-- CreateEnum
CREATE TYPE "EvidenceStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'PENDING', 'REVOKED');

-- CreateEnum
CREATE TYPE "MatchMethod" AS ENUM ('EXACT', 'FUZZY', 'VENDOR_PRODUCT', 'MANUAL');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'NOT_REQUIRED');

-- CreateTable
CREATE TABLE "SoftwareTitle" (
    "id" TEXT NOT NULL,
    "canonicalName" TEXT NOT NULL,
    "vendor" TEXT NOT NULL,
    "productFamily" TEXT,
    "category" TEXT,
    "description" TEXT,
    "status" "SoftwareTitleStatus" NOT NULL DEFAULT 'ACTIVE',
    "isSanctioned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SoftwareTitle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SoftwareObservation" (
    "id" TEXT NOT NULL,
    "rawTitle" TEXT NOT NULL,
    "normalizedTitle" TEXT,
    "vendor" TEXT,
    "version" TEXT,
    "sourceSystem" TEXT NOT NULL,
    "deviceId" TEXT,
    "department" TEXT,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confidenceScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SoftwareObservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GovernanceEvidence" (
    "id" TEXT NOT NULL,
    "softwareTitleId" TEXT NOT NULL,
    "evidenceType" "EvidenceType" NOT NULL,
    "referenceId" TEXT,
    "referenceUrl" TEXT,
    "status" "EvidenceStatus" NOT NULL DEFAULT 'PENDING',
    "owner" TEXT,
    "effectiveDate" TIMESTAMP(3),
    "expirationDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GovernanceEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogDecision" (
    "id" TEXT NOT NULL,
    "softwareTitleId" TEXT NOT NULL,
    "decision" "CatalogDecisionType" NOT NULL,
    "reason" TEXT NOT NULL,
    "decidedBy" TEXT NOT NULL,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isManualOverride" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CatalogDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchRecord" (
    "id" TEXT NOT NULL,
    "observationId" TEXT NOT NULL,
    "softwareTitleId" TEXT NOT NULL,
    "matchMethod" "MatchMethod" NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "reviewStatus" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatchRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SoftwareTitle_status_idx" ON "SoftwareTitle"("status");

-- CreateIndex
CREATE INDEX "SoftwareTitle_vendor_idx" ON "SoftwareTitle"("vendor");

-- CreateIndex
CREATE INDEX "SoftwareTitle_canonicalName_idx" ON "SoftwareTitle"("canonicalName");

-- CreateIndex
CREATE INDEX "SoftwareTitle_isSanctioned_idx" ON "SoftwareTitle"("isSanctioned");

-- CreateIndex
CREATE INDEX "SoftwareObservation_sourceSystem_idx" ON "SoftwareObservation"("sourceSystem");

-- CreateIndex
CREATE INDEX "SoftwareObservation_normalizedTitle_idx" ON "SoftwareObservation"("normalizedTitle");

-- CreateIndex
CREATE INDEX "SoftwareObservation_lastSeenAt_idx" ON "SoftwareObservation"("lastSeenAt");

-- CreateIndex
CREATE INDEX "GovernanceEvidence_softwareTitleId_idx" ON "GovernanceEvidence"("softwareTitleId");

-- CreateIndex
CREATE INDEX "GovernanceEvidence_evidenceType_idx" ON "GovernanceEvidence"("evidenceType");

-- CreateIndex
CREATE INDEX "GovernanceEvidence_status_idx" ON "GovernanceEvidence"("status");

-- CreateIndex
CREATE INDEX "CatalogDecision_softwareTitleId_idx" ON "CatalogDecision"("softwareTitleId");

-- CreateIndex
CREATE INDEX "CatalogDecision_decidedAt_idx" ON "CatalogDecision"("decidedAt");

-- CreateIndex
CREATE INDEX "MatchRecord_observationId_idx" ON "MatchRecord"("observationId");

-- CreateIndex
CREATE INDEX "MatchRecord_softwareTitleId_idx" ON "MatchRecord"("softwareTitleId");

-- CreateIndex
CREATE INDEX "MatchRecord_reviewStatus_idx" ON "MatchRecord"("reviewStatus");

-- AddForeignKey
ALTER TABLE "GovernanceEvidence" ADD CONSTRAINT "GovernanceEvidence_softwareTitleId_fkey" FOREIGN KEY ("softwareTitleId") REFERENCES "SoftwareTitle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogDecision" ADD CONSTRAINT "CatalogDecision_softwareTitleId_fkey" FOREIGN KEY ("softwareTitleId") REFERENCES "SoftwareTitle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchRecord" ADD CONSTRAINT "MatchRecord_observationId_fkey" FOREIGN KEY ("observationId") REFERENCES "SoftwareObservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchRecord" ADD CONSTRAINT "MatchRecord_softwareTitleId_fkey" FOREIGN KEY ("softwareTitleId") REFERENCES "SoftwareTitle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
