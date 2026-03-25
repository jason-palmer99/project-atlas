import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  findBestMatch,
  CandidateTitle,
  MATCH_AUTO_APPROVE_THRESHOLD,
} from "@atlas/domain";
import { ReviewStatus } from "@prisma/client";
import { ObservationQueryDto } from "./dto";

@Injectable()
export class ObservationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: ObservationQueryDto) {
    const { offset = 0, limit = 20, search, sourceSystem, vendor, unmatched } = query;

    const where: any = {};

    if (search) {
      where.OR = [
        { rawTitle: { contains: search, mode: "insensitive" } },
        { normalizedTitle: { contains: search, mode: "insensitive" } },
      ];
    }

    if (sourceSystem) {
      where.sourceSystem = sourceSystem;
    }

    if (vendor) {
      where.vendor = { contains: vendor, mode: "insensitive" };
    }

    if (unmatched) {
      where.matches = { none: {} };
    }

    const [data, total] = await Promise.all([
      this.prisma.softwareObservation.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { lastSeenAt: "desc" },
        include: {
          matches: {
            select: {
              id: true,
              softwareTitleId: true,
              matchMethod: true,
              confidenceScore: true,
              reviewStatus: true,
              softwareTitle: {
                select: { id: true, canonicalName: true, vendor: true },
              },
            },
          },
        },
      }),
      this.prisma.softwareObservation.count({ where }),
    ]);

    return { data, total, offset, limit };
  }

  async findOne(id: string) {
    const observation = await this.prisma.softwareObservation.findUnique({
      where: { id },
      include: {
        matches: {
          include: {
            softwareTitle: {
              select: { id: true, canonicalName: true, vendor: true },
            },
          },
        },
      },
    });

    if (!observation) {
      throw new NotFoundException(`Observation ${id} not found`);
    }

    return observation;
  }

  /** Get distinct source systems for filtering */
  async getSourceSystems(): Promise<string[]> {
    const result = await this.prisma.softwareObservation.findMany({
      select: { sourceSystem: true },
      distinct: ["sourceSystem"],
      orderBy: { sourceSystem: "asc" },
    });
    return result.map((r) => r.sourceSystem);
  }

  /**
   * Run matching for a single observation against all software titles.
   * Creates a MatchRecord if a match is found.
   */
  async matchObservation(observationId: string) {
    const observation = await this.prisma.softwareObservation.findUnique({
      where: { id: observationId },
    });

    if (!observation) {
      throw new NotFoundException(`Observation ${observationId} not found`);
    }

    if (!observation.normalizedTitle) {
      return { matched: false, reason: "Observation has no normalized title" };
    }

    // Get all active software titles as candidates
    const titles = await this.prisma.softwareTitle.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, canonicalName: true, vendor: true, productFamily: true },
    });

    const candidates: CandidateTitle[] = titles;

    const match = findBestMatch(
      {
        normalizedTitle: observation.normalizedTitle,
        vendor: observation.vendor,
      },
      candidates,
    );

    if (!match) {
      return { matched: false, reason: "No matching title found above threshold" };
    }

    // Create match record
    const matchRecord = await this.prisma.matchRecord.create({
      data: {
        observationId: observation.id,
        softwareTitleId: match.titleId,
        matchMethod: match.matchMethod,
        confidenceScore: match.confidenceScore,
        reviewStatus: match.reviewStatus as ReviewStatus,
      },
      include: {
        softwareTitle: {
          select: { id: true, canonicalName: true, vendor: true },
        },
      },
    });

    return { matched: true, matchRecord };
  }

  /**
   * Run matching for all unmatched observations.
   * Returns summary of match results.
   */
  async matchAllUnmatched() {
    const unmatched = await this.prisma.softwareObservation.findMany({
      where: {
        matches: { none: {} },
        normalizedTitle: { not: null },
      },
      select: { id: true, normalizedTitle: true, vendor: true },
    });

    // Get candidates once
    const titles = await this.prisma.softwareTitle.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, canonicalName: true, vendor: true, productFamily: true },
    });

    let matched = 0;
    let unMatchedCount = 0;
    let errors = 0;

    for (const obs of unmatched) {
      try {
        const match = findBestMatch(
          { normalizedTitle: obs.normalizedTitle!, vendor: obs.vendor },
          titles,
        );

        if (match) {
          await this.prisma.matchRecord.create({
            data: {
              observationId: obs.id,
              softwareTitleId: match.titleId,
              matchMethod: match.matchMethod,
              confidenceScore: match.confidenceScore,
              reviewStatus: match.reviewStatus as ReviewStatus,
            },
          });
          matched++;
        } else {
          unMatchedCount++;
        }
      } catch {
        errors++;
      }
    }

    return {
      total: unmatched.length,
      matched,
      unmatched: unMatchedCount,
      errors,
    };
  }
}
