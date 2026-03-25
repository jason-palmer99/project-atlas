import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
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

  async importCsv(buffer: Buffer): Promise<{ created: number; updated: number; skipped: number; errors: string[] }> {
    const lines = parseCsv(buffer.toString("utf-8"));

    if (lines.length < 2) {
      throw new BadRequestException("CSV must have a header row and at least one data row");
    }

    const headers = lines[0].map((h) => h.trim().toLowerCase());

    const colIndex = (...candidates: string[]): number => {
      for (const c of candidates) {
        const idx = headers.indexOf(c.toLowerCase());
        if (idx !== -1) return idx;
      }
      return -1;
    };

    const nameIdx = colIndex("title", "software title", "name", "product", "application", "canonical name");
    const vendorIdx = colIndex("vendor", "manufacturer", "publisher", "software vendor");

    if (nameIdx === -1 || vendorIdx === -1) {
      throw new BadRequestException(
        "CSV must include a name column (Title / Name / Product) and a vendor column (Vendor / Manufacturer)",
      );
    }

    const categoryIdx = colIndex("category", "software category", "app category");
    const familyIdx = colIndex("product family", "family", "product line");
    const descIdx = colIndex("description");
    const statusIdx = colIndex("status", "software status");
    const sanctionedIdx = colIndex("sanctioned", "is sanctioned", "approved", "approved?");

    let created = 0;
    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i];
      if (row.every((c) => !c.trim())) continue;

      try {
        const canonicalName = row[nameIdx]?.trim();
        const vendor = row[vendorIdx]?.trim();

        if (!canonicalName || !vendor) {
          skipped++;
          continue;
        }

        const data: Record<string, unknown> = { canonicalName, vendor, isSanctioned: true };

        if (categoryIdx !== -1 && row[categoryIdx]?.trim()) {
          data.category = row[categoryIdx].trim();
        }
        if (familyIdx !== -1 && row[familyIdx]?.trim()) {
          data.productFamily = row[familyIdx].trim();
        }
        if (descIdx !== -1 && row[descIdx]?.trim()) {
          data.description = row[descIdx].trim();
        }
        if (statusIdx !== -1 && row[statusIdx]?.trim()) {
          data.status = normalizeTitleStatus(row[statusIdx].trim());
        }
        if (sanctionedIdx !== -1 && row[sanctionedIdx]?.trim()) {
          data.isSanctioned = normalizeBoolean(row[sanctionedIdx].trim());
        }

        const existing = await this.prisma.softwareTitle.findFirst({
          where: { canonicalName, vendor },
        });

        if (existing) {
          await this.prisma.softwareTitle.update({
            where: { id: existing.id },
            data: data as any,
          });
          updated++;
        } else {
          await this.prisma.softwareTitle.create({ data: data as any });
          created++;
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Row ${i + 1}: ${msg}`);
      }
    }

    return { created, updated, skipped, errors };
  }
}

// ── CSV helpers ──────────────────────────────────────────────────────────────

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields;
}

function parseCsv(content: string): string[][] {
  return content
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((line) => line.trim())
    .map(parseCsvLine);
}

function normalizeTitleStatus(value: string): string {
  const v = value.toUpperCase().replace(/[\s\-]+/g, "_");
  if (["RETIRED", "DEPRECATED", "DECOMMISSIONED", "END_OF_LIFE", "EOL"].includes(v)) return "RETIRED";
  if (["UNDER_REVIEW", "IN_REVIEW", "REVIEW", "PENDING_REVIEW"].includes(v)) return "UNDER_REVIEW";
  return "ACTIVE";
}

function normalizeBoolean(value: string): boolean {
  const v = value.toLowerCase().trim();
  return v === "yes" || v === "true" || v === "1" || v === "y" || v === "x";
}
