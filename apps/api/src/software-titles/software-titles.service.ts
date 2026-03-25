import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreateSoftwareTitleDto,
  UpdateSoftwareTitleDto,
  SoftwareTitleQueryDto,
} from "./dto";

@Injectable()
export class SoftwareTitlesService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: SoftwareTitleQueryDto) {
    const { offset = 0, limit = 20, search, vendor, status, isSanctioned } = query;

    const where: any = {};

    if (search) {
      where.OR = [
        { canonicalName: { contains: search, mode: "insensitive" } },
        { vendor: { contains: search, mode: "insensitive" } },
      ];
    }

    if (vendor) {
      where.vendor = { contains: vendor, mode: "insensitive" };
    }

    if (status) {
      where.status = status;
    }

    if (isSanctioned !== undefined) {
      where.isSanctioned = isSanctioned;
    }

    // Filter by latest decision status
    if (query.decisionStatus) {
      where.decisions = {
        some: {
          decision: query.decisionStatus,
        },
      };
    }

    // Filter by missing evidence types
    if (query.missingQna) {
      where.NOT = {
        ...where.NOT,
        evidence: {
          some: {
            evidenceType: "QNA",
            status: "ACTIVE",
          },
        },
      };
    }

    if (query.missingVendorRisk) {
      const existingNot = where.NOT || {};
      where.AND = [
        ...(where.AND || []),
        {
          NOT: {
            evidence: {
              some: {
                evidenceType: "VENDOR_RISK_ASSESSMENT",
                status: "ACTIVE",
              },
            },
          },
        },
      ];
      if (query.missingQna) {
        where.AND.push({
          NOT: {
            evidence: {
              some: {
                evidenceType: "QNA",
                status: "ACTIVE",
              },
            },
          },
        });
        delete where.NOT;
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.softwareTitle.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { canonicalName: "asc" },
        include: {
          _count: {
            select: {
              evidence: true,
              decisions: true,
              matches: true,
            },
          },
        },
      }),
      this.prisma.softwareTitle.count({ where }),
    ]);

    return { data, total, offset, limit };
  }

  async findOne(id: string) {
    const title = await this.prisma.softwareTitle.findUnique({
      where: { id },
      include: {
        evidence: { orderBy: { createdAt: "desc" } },
        decisions: { orderBy: { decidedAt: "desc" } },
        matches: {
          orderBy: { createdAt: "desc" },
          include: { observation: true },
        },
      },
    });

    if (!title) {
      throw new NotFoundException(`Software title ${id} not found`);
    }

    return title;
  }

  async create(dto: CreateSoftwareTitleDto) {
    return this.prisma.softwareTitle.create({
      data: dto,
    });
  }

  async update(id: string, dto: UpdateSoftwareTitleDto) {
    await this.findOne(id); // throws if not found
    return this.prisma.softwareTitle.update({
      where: { id },
      data: dto as any,
    });
  }
}
