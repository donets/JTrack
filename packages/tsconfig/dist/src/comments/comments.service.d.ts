import { PrismaService } from '@/prisma/prisma.service';
export declare class CommentsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(locationId: string, ticketId: string): Promise<{
        createdAt: string;
        updatedAt: string;
        deletedAt: string | null;
        id: string;
        locationId: string;
        ticketId: string;
        authorUserId: string;
        body: string;
    }[]>;
    create(locationId: string, authorUserId: string, data: unknown): Promise<{
        createdAt: string;
        updatedAt: string;
        deletedAt: string | null;
        id: string;
        locationId: string;
        ticketId: string;
        authorUserId: string;
        body: string;
    }>;
    remove(locationId: string, commentId: string): Promise<{
        ok: boolean;
    }>;
}
