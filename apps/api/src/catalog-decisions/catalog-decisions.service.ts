import { Injectable, NotFoundException } from "@nestjs/common";
import { CatalogDecisionType } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { deriveStatus, buildEvidenceSummary } from "@atlas/domain";
import {
  CreateCatalogDecisionDto,
  CatalogDecisionQueryDto,
} from "./dto";

@Injectable()
export class CatalogDecisionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: CatalogDecisionQueryDto) {
    const { offset = 0, limit = 20, softwareTitleId, decision } = query;

    const where: any = {};

    if (softwareTitleId) {
      where.softwareTitleId = softwareTitleId;
    }

    if (decision) {
      where.decision = decision;
    }

    const [data, total] = await Promise.all([
      this.prisma.catalogDecision.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { decidedAt: "desc" },
        include: {
          softwareTitle: {
            select: { id: true, canonicalName: true, vendor: true },
          },
        },
      }),
      this.prisma.catalogDecision.count({ where }),
    ]);

    return { data, total, offset, limit };
  }

  async findOne(id: string) {
    const decision = await this.prisma.catalogDecision.findUnique({
      where: { id },
      include: {
        softwareTitle: {
          select: { id: true, canonicalName: true, vendor: true },
        },
      },
    });

    if (!decision) {
      throw new NotFoundException(`Catalog decision ${id} not found`);
    }

    return decision;
  }

  /**
   * Create a new catalog decision (append-only).
   * Also updates the SoftwareTitle.isSanctioned field as a denormalized cache.
   */
  async create(dto: CreateCatalogDecisionDto) {
    const title = await this.prisma.softwareTitle.findUnique({
      where: { id: dto.softwareTitleId },
    });

    if (!title) {
      throw new NotFoundException(`Software title ${dto.softwareTitleId} not found`);
    }

    const decision = await this.prisma.catalogDecision.create({
      data: {
        ...dto,
        decision: dto.decision as CatalogDecisionType,
        isManualOverride: dto.isManualOverride ?? false,
      },
      include: {
        softwareTitle: {
          select: { id: true, canonicalName: true, vendor: true },
        },
      },
    });

    // Update denormalized isSanctioned flag
    await this.prisma.softwareTitle.update({
      where: { id: dto.softwareTitleId },
      data: { isSanctioned: dto.decision === "SANCTIONED" },
    });

    return decision;
  }

  /**
   * Derive status for a software title using the rules engine.
   * Creates a new CatalogDecision record with the computed result.
   */
  async deriveStatusForTitle(softwareTitleId: string) {
    const title = await this.prisma.softwareTitle.findUnique({
      where: { id: softwareTitleId },
      include: {
        evidence: true,
        decisions: { orderBy: { decidedAt: "desc" }, take: 1 },
        matches: true,
      },
    });

    if (!title) {
      throw new NotFoundException(`Software title ${softwareTitleId} not found`);
    }

    const evidenceSummary = buildEvidenceSummary(
      title.evidence.map((e) => ({
        evidenceType: e.evidenceType as any,
        status: e.status as any,
      })),
    );

    const hasObservations = title.matches.length > 0;
    const latestDecision = title.decisions[0] || null;

    const result = deriveStatus({
      title: {
        ...title,
        status: title.status as any,
        isBusinessCritical: title.isBusinessCritical as any,
        isQualityImpacting: title.isQualityImpacting as any,
      },
      evidence: evidenceSummary,
      hasObservations,
      latestDecision: latestDecision
        ? {
            ...latestDecision,
            decision: latestDecision.decision as any,
          }
        : null,
    });

    // Create new decision record (append-only)
    const newDecision = await this.prisma.catalogDecision.create({
      data: {
        softwareTitleId,
        decision: result.decision as CatalogDecisionType,
        reason: result.reason,
        decidedBy: "system:rules-engine",
        isManualOverride: false,
      },
      include: {
        softwareTitle: {
          select: { id: true, canonicalName: true, vendor: true },
        },
      },
    });

    // Update denormalized isSanctioned flag
    await this.prisma.softwareTitle.update({
      where: { id: softwareTitleId },
      data: { isSanctioned: result.decision === "SANCTIONED" },
    });

    return newDecision;
  }
}
