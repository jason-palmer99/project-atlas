import { Injectable, NotFoundException } from "@nestjs/common";
import { EvidenceType, EvidenceStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CatalogDecisionsService } from "../catalog-decisions/catalog-decisions.service";
import { computeEvidenceGaps } from "@atlas/domain";
import {
  CreateGovernanceEvidenceDto,
  UpdateGovernanceEvidenceDto,
  GovernanceEvidenceQueryDto,
} from "./dto";

@Injectable()
export class GovernanceEvidenceService {
  constructor(
    private prisma: PrismaService,
    private catalogDecisions: CatalogDecisionsService,
  ) {}

  async findAll(query: GovernanceEvidenceQueryDto) {
    const { offset = 0, limit = 20, softwareTitleId, evidenceType, status } = query;

    const where: any = {};

    if (softwareTitleId) {
      where.softwareTitleId = softwareTitleId;
    }

    if (evidenceType) {
      where.evidenceType = evidenceType;
    }

    if (status) {
      where.status = status;
    }

    const [data, total] = await Promise.all([
      this.prisma.governanceEvidence.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          softwareTitle: {
            select: { id: true, canonicalName: true, vendor: true },
          },
        },
      }),
      this.prisma.governanceEvidence.count({ where }),
    ]);

    return { data, total, offset, limit };
  }

  async findOne(id: string) {
    const evidence = await this.prisma.governanceEvidence.findUnique({
      where: { id },
      include: {
        softwareTitle: {
          select: { id: true, canonicalName: true, vendor: true },
        },
      },
    });

    if (!evidence) {
      throw new NotFoundException(`Governance evidence ${id} not found`);
    }

    return evidence;
  }

  async create(dto: CreateGovernanceEvidenceDto) {
    // Verify the software title exists
    const title = await this.prisma.softwareTitle.findUnique({
      where: { id: dto.softwareTitleId },
    });

    if (!title) {
      throw new NotFoundException(`Software title ${dto.softwareTitleId} not found`);
    }

    const evidence = await this.prisma.governanceEvidence.create({
      data: {
        ...dto,
        evidenceType: dto.evidenceType as EvidenceType,
        status: dto.status as EvidenceStatus | undefined,
        effectiveDate: dto.effectiveDate ? new Date(dto.effectiveDate) : undefined,
        expirationDate: dto.expirationDate ? new Date(dto.expirationDate) : undefined,
      },
      include: {
        softwareTitle: {
          select: { id: true, canonicalName: true, vendor: true },
        },
      },
    });

    // Trigger decision recalculation when evidence changes
    this.catalogDecisions.deriveStatusForTitle(dto.softwareTitleId).catch(() => {
      // Recalculation errors should not fail evidence creation
    });

    return evidence;
  }

  async update(id: string, dto: UpdateGovernanceEvidenceDto) {
    const existing = await this.findOne(id); // throws if not found

    const updated = await this.prisma.governanceEvidence.update({
      where: { id },
      data: {
        ...dto,
        status: dto.status as EvidenceStatus | undefined,
        effectiveDate: dto.effectiveDate ? new Date(dto.effectiveDate) : undefined,
        expirationDate: dto.expirationDate ? new Date(dto.expirationDate) : undefined,
      },
      include: {
        softwareTitle: {
          select: { id: true, canonicalName: true, vendor: true },
        },
      },
    });

    // Trigger decision recalculation when evidence changes
    this.catalogDecisions.deriveStatusForTitle(existing.softwareTitleId).catch(() => {
      // Recalculation errors should not fail evidence update
    });

    return updated;
  }

  /**
   * Compute evidence gaps for a software title.
   * Returns missing evidence, completeness status, and expiring evidence warnings.
   */
  async getEvidenceGaps(softwareTitleId: string) {
    const title = await this.prisma.softwareTitle.findUnique({
      where: { id: softwareTitleId },
      include: {
        evidence: true,
        decisions: { orderBy: { decidedAt: "desc" }, take: 1 },
      },
    });

    if (!title) {
      throw new NotFoundException(`Software title ${softwareTitleId} not found`);
    }

    const latestDecision = title.decisions[0] ?? null;

    // TODO: isQualityImpacting will come from SharePoint import metadata.
    // For now, default to true (stricter — requires QNA + VRA).
    const isQualityImpacting = true;

    const result = computeEvidenceGaps({
      isQualityImpacting,
      evidence: title.evidence.map((e) => ({
        evidenceType: e.evidenceType as any,
        status: e.status as any,
        expirationDate: e.expirationDate,
      })),
      currentDecision: latestDecision?.decision as any ?? null,
    });

    return {
      softwareTitleId,
      canonicalName: title.canonicalName,
      isQualityImpacting,
      ...result,
    };
  }
}
