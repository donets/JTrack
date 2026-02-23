import { SyncService } from './sync.service';
export declare class SyncController {
    private readonly syncService;
    constructor(syncService: SyncService);
    pull(locationId: string, body: unknown): Promise<{
        changes: {
            tickets: {
                created: {
                    id: string;
                    createdAt: string;
                    updatedAt: string;
                    status: "New" | "Scheduled" | "InProgress" | "Done" | "Invoiced" | "Paid" | "Canceled";
                    locationId: string;
                    createdByUserId: string;
                    assignedToUserId: string | null;
                    title: string;
                    description: string | null;
                    scheduledStartAt: string | null;
                    scheduledEndAt: string | null;
                    priority: string | null;
                    totalAmountCents: number | null;
                    currency: string;
                    deletedAt: string | null;
                }[];
                updated: {
                    id: string;
                    createdAt: string;
                    updatedAt: string;
                    status: "New" | "Scheduled" | "InProgress" | "Done" | "Invoiced" | "Paid" | "Canceled";
                    locationId: string;
                    createdByUserId: string;
                    assignedToUserId: string | null;
                    title: string;
                    description: string | null;
                    scheduledStartAt: string | null;
                    scheduledEndAt: string | null;
                    priority: string | null;
                    totalAmountCents: number | null;
                    currency: string;
                    deletedAt: string | null;
                }[];
                deleted: string[];
            };
            ticketComments: {
                created: {
                    id: string;
                    createdAt: string;
                    updatedAt: string;
                    locationId: string;
                    deletedAt: string | null;
                    ticketId: string;
                    authorUserId: string;
                    body: string;
                }[];
                updated: {
                    id: string;
                    createdAt: string;
                    updatedAt: string;
                    locationId: string;
                    deletedAt: string | null;
                    ticketId: string;
                    authorUserId: string;
                    body: string;
                }[];
                deleted: string[];
            };
            ticketAttachments: {
                created: {
                    id: string;
                    createdAt: string;
                    updatedAt: string;
                    locationId: string;
                    deletedAt: string | null;
                    ticketId: string;
                    uploadedByUserId: string;
                    kind: "Photo" | "File";
                    storageKey: string;
                    url: string;
                    mimeType: string;
                    size: number;
                    width: number | null;
                    height: number | null;
                }[];
                updated: {
                    id: string;
                    createdAt: string;
                    updatedAt: string;
                    locationId: string;
                    deletedAt: string | null;
                    ticketId: string;
                    uploadedByUserId: string;
                    kind: "Photo" | "File";
                    storageKey: string;
                    url: string;
                    mimeType: string;
                    size: number;
                    width: number | null;
                    height: number | null;
                }[];
                deleted: string[];
            };
            paymentRecords: {
                created: {
                    id: string;
                    createdAt: string;
                    updatedAt: string;
                    status: "Pending" | "Succeeded" | "Failed" | "Refunded";
                    locationId: string;
                    currency: string;
                    ticketId: string;
                    provider: "manual" | "stripe";
                    amountCents: number;
                }[];
                updated: {
                    id: string;
                    createdAt: string;
                    updatedAt: string;
                    status: "Pending" | "Succeeded" | "Failed" | "Refunded";
                    locationId: string;
                    currency: string;
                    ticketId: string;
                    provider: "manual" | "stripe";
                    amountCents: number;
                }[];
                deleted: string[];
            };
        };
        timestamp: number;
    }>;
    push(locationId: string, body: unknown): Promise<{
        ok: true;
        newTimestamp: number;
    }>;
}
