import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { ReviewStatus, MatchMethod } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { MatchQueryDto, ReviewMatchDto, CreateManualMatchDto } from "./dto";

@Injectable()
export class MatchesService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: MatchQueryDto) {
    const { offset = 0, limit = 20, reviewStatus, softwareTitleId, observationId } = query;

    const where: any = {};
    if (reviewStatus) where.reviewStatus = reviewStatus;
    if (softwareTitleId) where.softwareTitleId = softwareTitleId;
    if (observationId) where.observationId = observationId;

    const [data, total] = await Promise.all([
      this.prisma.matchRecord.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          observation: {
            select: { id: true, rawTitle: true, normalizedTitle: true, vendor: true, sourceSystem: true },
          },
          softwareTitle: {
            select: { id: true, canonicalName: true, vendor: true },
          },
        },
      }),
      this.prisma.matchRecord.count({ where }),
    ]);

    return { data, total, offset, limit };
  }

  /** Get the review queue — only PENDING matches, sorted by confidence */
  async getReviewQueue(offset = 0, limit = 20) {
    const where = { reviewStatus: ReviewStatus.PENDING };

    const [data, total] = await Promise.all([
      this.prisma.matchRecord.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { confidenceScore: "asc" }, // lowest confidence first
        include: {
          observation: {
            select: { id: true, rawTitle: true, normalizedTitle: true, vendor: true, sourceSystem: true },
          },
          softwareTitle: {
            select: { id: true, canonicalName: true, vendor: true },
          },
        },
      }),
      this.prisma.matchRecord.count({ where }),
    ]);

    return { data, total, offset, limit };
  }

  async findOne(id: string) {
    const match = await this.prisma.matchRecord.findUnique({
      where: { id },
      include: {
        observation: true,
        softwareTitle: true,
      },
    });

    if (!match) {
      throw new NotFoundException(`Match record ${id} not found`);
    }

    return match;
  }

  /**
   * Review a match — approve or reject.
   * If rejected with reassignToTitleId, creates a new MANUAL match to the correct title.
   */
  async review(id: string, dto: ReviewMatchDto) {
    const match = await this.prisma.matchRecord.findUnique({ where: { id } });

    if (!match) {
      throw new NotFoundException(`Match record ${id} not found`);
    }

    if (match.reviewStatus !== ReviewStatus.PENDING) {
      throw new BadRequestException(
        `Match ${id} has already been reviewed (${match.reviewStatus})`,
      );
    }

    const updated = await this.prisma.matchRecord.update({
      where: { id },
      data: {
        reviewStatus: dto.reviewStatus as ReviewStatus,
        reviewedBy: dto.reviewedBy,
        reviewedAt: new Date(),
      },
      include: {
        observation: {
          select: { id: true, rawTitle: true, normalizedTitle: true },
        },
        softwareTitle: {
          select: { id: true, canonicalName: true },
        },
      },
    });

    // If rejected and reassigning, create a new manual match
    if (dto.reviewStatus === "REJECTED" && dto.reassignToTitleId) {
      const title = await this.prisma.softwareTitle.findUnique({
        where: { id: dto.reassignToTitleId },
      });
      if (!title) {
        throw new NotFoundException(
          `Reassign target title ${dto.reassignToTitleId} not found`,
        );
      }

      await this.prisma.matchRecord.create({
        data: {
          observationId: match.observationId,
          softwareTitleId: dto.reassignToTitleId,
          matchMethod: MatchMethod.MANUAL,
          confidenceScore: 1.0,
          reviewStatus: ReviewStatus.APPROVED,
          reviewedBy: dto.reviewedBy,
          reviewedAt: new Date(),
        },
      });
    }

    return updated;
  }

  /** Create a manual match (human-assigned observation→title mapping) */
  async createManualMatch(dto: CreateManualMatchDto) {
    // Verify both sides exist
    const [observation, title] = await Promise.all([
      this.prisma.softwareObservation.findUnique({
        where: { id: dto.observationId },
      }),
      this.prisma.softwareTitle.findUnique({
        where: { id: dto.softwareTitleId },
      }),
    ]);

    if (!observation) {
      throw new NotFoundException(`Observation ${dto.observationId} not found`);
    }
    if (!title) {
      throw new NotFoundException(`Software title ${dto.softwareTitleId} not found`);
    }

    return this.prisma.matchRecord.create({
      data: {
        observationId: dto.observationId,
        softwareTitleId: dto.softwareTitleId,
        matchMethod: MatchMethod.MANUAL,
        confidenceScore: 1.0,
        reviewStatus: ReviewStatus.APPROVED,
        reviewedBy: dto.reviewedBy,
        reviewedAt: new Date(),
      },
      include: {
        observation: {
          select: { id: true, rawTitle: true, normalizedTitle: true },
        },
        softwareTitle: {
          select: { id: true, canonicalName: true, vendor: true },
        },
      },
    });
  }
}
