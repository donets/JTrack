import type { JwtUser } from '@/common/types';
import { CommentsService } from './comments.service';
export declare class CommentsController {
    private readonly commentsService;
    constructor(commentsService: CommentsService);
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
    create(locationId: string, user: JwtUser, body: unknown): Promise<{
        createdAt: string;
        updatedAt: string;
        deletedAt: string | null;
        id: string;
        locationId: string;
        ticketId: string;
        authorUserId: string;
        body: string;
    }>;
    remove(locationId: string, id: string): Promise<{
        ok: boolean;
    }>;
}
