import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Software Titles
  const titles = await Promise.all([
    prisma.softwareTitle.create({
      data: {
        canonicalName: "Google Chrome",
        vendor: "Google",
        productFamily: "Chrome",
        category: "Browser",
        description: "Web browser by Google",
        status: "ACTIVE",
        isSanctioned: true,
      },
    }),
    prisma.softwareTitle.create({
      data: {
        canonicalName: "Mozilla Firefox",
        vendor: "Mozilla",
        productFamily: "Firefox",
        category: "Browser",
        description: "Open-source web browser",
        status: "ACTIVE",
        isSanctioned: true,
      },
    }),
    prisma.softwareTitle.create({
      data: {
        canonicalName: "Visual Studio Code",
        vendor: "Microsoft",
        productFamily: "Visual Studio",
        category: "IDE",
        description: "Source code editor",
        status: "ACTIVE",
        isSanctioned: true,
      },
    }),
    prisma.softwareTitle.create({
      data: {
        canonicalName: "Slack",
        vendor: "Salesforce",
        productFamily: "Slack",
        category: "Communication",
        description: "Business communication platform",
        status: "ACTIVE",
        isSanctioned: false,
      },
    }),
    prisma.softwareTitle.create({
      data: {
        canonicalName: "Zoom",
        vendor: "Zoom Video Communications",
        productFamily: "Zoom",
        category: "Communication",
        description: "Video conferencing platform",
        status: "UNDER_REVIEW",
        isSanctioned: false,
      },
    }),
    prisma.softwareTitle.create({
      data: {
        canonicalName: "WinRAR",
        vendor: "win.rar GmbH",
        productFamily: "WinRAR",
        category: "Utility",
        description: "File archiver utility",
        status: "ACTIVE",
        isSanctioned: false,
      },
    }),
    prisma.softwareTitle.create({
      data: {
        canonicalName: "Adobe Acrobat Reader",
        vendor: "Adobe",
        productFamily: "Acrobat",
        category: "Document Viewer",
        description: "PDF viewer",
        status: "ACTIVE",
        isSanctioned: true,
      },
    }),
    prisma.softwareTitle.create({
      data: {
        canonicalName: "7-Zip",
        vendor: "Igor Pavlov",
        productFamily: "7-Zip",
        category: "Utility",
        description: "Open-source file archiver",
        status: "RETIRED",
        isSanctioned: false,
      },
    }),
  ]);

  console.log(`Created ${titles.length} software titles`);

  // Governance Evidence
  const evidence = await Promise.all([
    // Chrome: fully governed
    prisma.governanceEvidence.create({
      data: {
        softwareTitleId: titles[0].id,
        evidenceType: "QNA",
        referenceId: "QNA-2024-001",
        referenceUrl: "https://governance.example.com/qna/QNA-2024-001",
        status: "ACTIVE",
        owner: "security-team",
        effectiveDate: new Date("2024-01-15"),
        expirationDate: new Date("2026-01-15"),
      },
    }),
    prisma.governanceEvidence.create({
      data: {
        softwareTitleId: titles[0].id,
        evidenceType: "VENDOR_RISK_ASSESSMENT",
        referenceId: "VRA-2024-001",
        referenceUrl: "https://governance.example.com/vra/VRA-2024-001",
        status: "ACTIVE",
        owner: "risk-team",
        effectiveDate: new Date("2024-02-01"),
        expirationDate: new Date("2026-02-01"),
      },
    }),
    // Firefox: QNA only (missing vendor risk)
    prisma.governanceEvidence.create({
      data: {
        softwareTitleId: titles[1].id,
        evidenceType: "QNA",
        referenceId: "QNA-2024-002",
        referenceUrl: "https://governance.example.com/qna/QNA-2024-002",
        status: "ACTIVE",
        owner: "security-team",
        effectiveDate: new Date("2024-03-01"),
        expirationDate: new Date("2026-03-01"),
      },
    }),
    // VS Code: fully governed
    prisma.governanceEvidence.create({
      data: {
        softwareTitleId: titles[2].id,
        evidenceType: "QNA",
        referenceId: "QNA-2024-003",
        status: "ACTIVE",
        owner: "security-team",
        effectiveDate: new Date("2024-01-01"),
        expirationDate: new Date("2026-01-01"),
      },
    }),
    prisma.governanceEvidence.create({
      data: {
        softwareTitleId: titles[2].id,
        evidenceType: "VENDOR_RISK_ASSESSMENT",
        referenceId: "VRA-2024-002",
        status: "ACTIVE",
        owner: "risk-team",
        effectiveDate: new Date("2024-01-01"),
        expirationDate: new Date("2026-01-01"),
      },
    }),
    // Acrobat: expired QNA
    prisma.governanceEvidence.create({
      data: {
        softwareTitleId: titles[6].id,
        evidenceType: "QNA",
        referenceId: "QNA-2023-010",
        status: "EXPIRED",
        owner: "security-team",
        effectiveDate: new Date("2023-01-01"),
        expirationDate: new Date("2024-12-31"),
      },
    }),
  ]);

  console.log(`Created ${evidence.length} governance evidence records`);

  // Catalog Decisions
  const decisions = await Promise.all([
    prisma.catalogDecision.create({
      data: {
        softwareTitleId: titles[0].id,
        decision: "SANCTIONED",
        reason:
          "All required evidence present: active QNA and vendor risk assessment",
        decidedBy: "system:rules-engine",
        isManualOverride: false,
      },
    }),
    prisma.catalogDecision.create({
      data: {
        softwareTitleId: titles[1].id,
        decision: "PENDING_GOVERNANCE",
        reason: "Missing required evidence: vendor risk assessment",
        decidedBy: "system:rules-engine",
        isManualOverride: false,
      },
    }),
    prisma.catalogDecision.create({
      data: {
        softwareTitleId: titles[2].id,
        decision: "SANCTIONED",
        reason:
          "All required evidence present: active QNA and vendor risk assessment",
        decidedBy: "system:rules-engine",
        isManualOverride: false,
      },
    }),
    prisma.catalogDecision.create({
      data: {
        softwareTitleId: titles[3].id,
        decision: "UNSANCTIONED_RUNNING",
        reason:
          "Telemetry shows usage but no sanctioned decision exists. No governance evidence on file.",
        decidedBy: "system:rules-engine",
        isManualOverride: false,
      },
    }),
    prisma.catalogDecision.create({
      data: {
        softwareTitleId: titles[5].id,
        decision: "BLOCKED",
        reason: "Manually blocked by security review — unlicensed usage concern",
        decidedBy: "admin:jpalmer",
        isManualOverride: true,
      },
    }),
    prisma.catalogDecision.create({
      data: {
        softwareTitleId: titles[7].id,
        decision: "RETIRED",
        reason: "Replaced by organization-standard archiver. No longer supported.",
        decidedBy: "admin:jpalmer",
        isManualOverride: true,
      },
    }),
  ]);

  console.log(`Created ${decisions.length} catalog decisions`);

  // Software Observations
  const observations = await Promise.all([
    prisma.softwareObservation.create({
      data: {
        rawTitle: "Google Chrome 120.0.6099.130",
        normalizedTitle: "google chrome",
        vendor: "Google",
        version: "120.0.6099.130",
        sourceSystem: "endpoint-agent",
        deviceId: "DESKTOP-A1B2C3",
        department: "Engineering",
      },
    }),
    prisma.softwareObservation.create({
      data: {
        rawTitle: "Google Chrome",
        normalizedTitle: "google chrome",
        vendor: "Google LLC",
        version: "119.0.6045.199",
        sourceSystem: "sccm-discovery",
        deviceId: "DESKTOP-D4E5F6",
        department: "Marketing",
      },
    }),
    prisma.softwareObservation.create({
      data: {
        rawTitle: "Slack (64-bit) v4.35.126",
        normalizedTitle: "slack",
        vendor: "Slack Technologies",
        version: "4.35.126",
        sourceSystem: "endpoint-agent",
        deviceId: "DESKTOP-G7H8I9",
        department: "Engineering",
      },
    }),
    prisma.softwareObservation.create({
      data: {
        rawTitle: "WinRAR 6.24",
        normalizedTitle: "winrar",
        vendor: "win.rar GmbH",
        version: "6.24",
        sourceSystem: "endpoint-agent",
        deviceId: "DESKTOP-J0K1L2",
        department: "Finance",
      },
    }),
  ]);

  console.log(`Created ${observations.length} software observations`);

  // Match Records
  const matches = await Promise.all([
    prisma.matchRecord.create({
      data: {
        observationId: observations[0].id,
        softwareTitleId: titles[0].id,
        matchMethod: "EXACT",
        confidenceScore: 0.98,
        reviewStatus: "NOT_REQUIRED",
      },
    }),
    prisma.matchRecord.create({
      data: {
        observationId: observations[1].id,
        softwareTitleId: titles[0].id,
        matchMethod: "VENDOR_PRODUCT",
        confidenceScore: 0.85,
        reviewStatus: "APPROVED",
        reviewedBy: "admin:jpalmer",
        reviewedAt: new Date("2024-06-15"),
      },
    }),
    prisma.matchRecord.create({
      data: {
        observationId: observations[2].id,
        softwareTitleId: titles[3].id,
        matchMethod: "FUZZY",
        confidenceScore: 0.72,
        reviewStatus: "PENDING",
      },
    }),
    prisma.matchRecord.create({
      data: {
        observationId: observations[3].id,
        softwareTitleId: titles[5].id,
        matchMethod: "EXACT",
        confidenceScore: 0.95,
        reviewStatus: "NOT_REQUIRED",
      },
    }),
  ]);

  console.log(`Created ${matches.length} match records`);
  console.log("Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
