import { z } from 'zod';
export declare const syncEntityChangesSchema: <TSchema extends z.ZodTypeAny>(entitySchema: TSchema) => z.ZodObject<{
    created: z.ZodArray<TSchema, "many">;
    updated: z.ZodArray<TSchema, "many">;
    deleted: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    created: TSchema["_output"][];
    updated: TSchema["_output"][];
    deleted: string[];
}, {
    created: TSchema["_input"][];
    updated: TSchema["_input"][];
    deleted: string[];
}>;
export declare const syncChangesSchema: z.ZodObject<{
    tickets: z.ZodObject<{
        created: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            locationId: z.ZodString;
            createdByUserId: z.ZodString;
            assignedToUserId: z.ZodNullable<z.ZodString>;
            title: z.ZodString;
            description: z.ZodNullable<z.ZodString>;
            status: z.ZodEnum<["New", "Scheduled", "InProgress", "Done", "Invoiced", "Paid", "Canceled"]>;
            scheduledStartAt: z.ZodNullable<z.ZodString>;
            scheduledEndAt: z.ZodNullable<z.ZodString>;
            priority: z.ZodNullable<z.ZodString>;
            totalAmountCents: z.ZodNullable<z.ZodNumber>;
            currency: z.ZodDefault<z.ZodString>;
            createdAt: z.ZodString;
            updatedAt: z.ZodString;
            deletedAt: z.ZodNullable<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
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
        }, {
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
            deletedAt: string | null;
            currency?: string | undefined;
        }>, "many">;
        updated: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            locationId: z.ZodString;
            createdByUserId: z.ZodString;
            assignedToUserId: z.ZodNullable<z.ZodString>;
            title: z.ZodString;
            description: z.ZodNullable<z.ZodString>;
            status: z.ZodEnum<["New", "Scheduled", "InProgress", "Done", "Invoiced", "Paid", "Canceled"]>;
            scheduledStartAt: z.ZodNullable<z.ZodString>;
            scheduledEndAt: z.ZodNullable<z.ZodString>;
            priority: z.ZodNullable<z.ZodString>;
            totalAmountCents: z.ZodNullable<z.ZodNumber>;
            currency: z.ZodDefault<z.ZodString>;
            createdAt: z.ZodString;
            updatedAt: z.ZodString;
            deletedAt: z.ZodNullable<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
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
        }, {
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
            deletedAt: string | null;
            currency?: string | undefined;
        }>, "many">;
        deleted: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
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
    }, {
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
            deletedAt: string | null;
            currency?: string | undefined;
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
            deletedAt: string | null;
            currency?: string | undefined;
        }[];
        deleted: string[];
    }>;
    ticketComments: z.ZodObject<{
        created: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            ticketId: z.ZodString;
            locationId: z.ZodString;
            authorUserId: z.ZodString;
            body: z.ZodString;
            createdAt: z.ZodString;
            updatedAt: z.ZodString;
            deletedAt: z.ZodNullable<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            createdAt: string;
            updatedAt: string;
            locationId: string;
            deletedAt: string | null;
            ticketId: string;
            authorUserId: string;
            body: string;
        }, {
            id: string;
            createdAt: string;
            updatedAt: string;
            locationId: string;
            deletedAt: string | null;
            ticketId: string;
            authorUserId: string;
            body: string;
        }>, "many">;
        updated: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            ticketId: z.ZodString;
            locationId: z.ZodString;
            authorUserId: z.ZodString;
            body: z.ZodString;
            createdAt: z.ZodString;
            updatedAt: z.ZodString;
            deletedAt: z.ZodNullable<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            createdAt: string;
            updatedAt: string;
            locationId: string;
            deletedAt: string | null;
            ticketId: string;
            authorUserId: string;
            body: string;
        }, {
            id: string;
            createdAt: string;
            updatedAt: string;
            locationId: string;
            deletedAt: string | null;
            ticketId: string;
            authorUserId: string;
            body: string;
        }>, "many">;
        deleted: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
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
    }, {
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
    }>;
    ticketAttachments: z.ZodObject<{
        created: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            ticketId: z.ZodString;
            locationId: z.ZodString;
            uploadedByUserId: z.ZodString;
            kind: z.ZodEnum<["Photo", "File"]>;
            storageKey: z.ZodString;
            url: z.ZodString;
            mimeType: z.ZodString;
            size: z.ZodNumber;
            width: z.ZodNullable<z.ZodNumber>;
            height: z.ZodNullable<z.ZodNumber>;
            createdAt: z.ZodString;
            updatedAt: z.ZodString;
            deletedAt: z.ZodNullable<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
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
        }, {
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
        }>, "many">;
        updated: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            ticketId: z.ZodString;
            locationId: z.ZodString;
            uploadedByUserId: z.ZodString;
            kind: z.ZodEnum<["Photo", "File"]>;
            storageKey: z.ZodString;
            url: z.ZodString;
            mimeType: z.ZodString;
            size: z.ZodNumber;
            width: z.ZodNullable<z.ZodNumber>;
            height: z.ZodNullable<z.ZodNumber>;
            createdAt: z.ZodString;
            updatedAt: z.ZodString;
            deletedAt: z.ZodNullable<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
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
        }, {
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
        }>, "many">;
        deleted: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
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
    }, {
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
    }>;
    paymentRecords: z.ZodObject<{
        created: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            ticketId: z.ZodString;
            locationId: z.ZodString;
            provider: z.ZodEnum<["manual", "stripe"]>;
            amountCents: z.ZodNumber;
            currency: z.ZodString;
            status: z.ZodEnum<["Pending", "Succeeded", "Failed", "Refunded"]>;
            createdAt: z.ZodString;
            updatedAt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            id: string;
            createdAt: string;
            updatedAt: string;
            status: "Pending" | "Succeeded" | "Failed" | "Refunded";
            locationId: string;
            currency: string;
            ticketId: string;
            provider: "manual" | "stripe";
            amountCents: number;
        }, {
            id: string;
            createdAt: string;
            updatedAt: string;
            status: "Pending" | "Succeeded" | "Failed" | "Refunded";
            locationId: string;
            currency: string;
            ticketId: string;
            provider: "manual" | "stripe";
            amountCents: number;
        }>, "many">;
        updated: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            ticketId: z.ZodString;
            locationId: z.ZodString;
            provider: z.ZodEnum<["manual", "stripe"]>;
            amountCents: z.ZodNumber;
            currency: z.ZodString;
            status: z.ZodEnum<["Pending", "Succeeded", "Failed", "Refunded"]>;
            createdAt: z.ZodString;
            updatedAt: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            id: string;
            createdAt: string;
            updatedAt: string;
            status: "Pending" | "Succeeded" | "Failed" | "Refunded";
            locationId: string;
            currency: string;
            ticketId: string;
            provider: "manual" | "stripe";
            amountCents: number;
        }, {
            id: string;
            createdAt: string;
            updatedAt: string;
            status: "Pending" | "Succeeded" | "Failed" | "Refunded";
            locationId: string;
            currency: string;
            ticketId: string;
            provider: "manual" | "stripe";
            amountCents: number;
        }>, "many">;
        deleted: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
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
    }, {
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
    }>;
}, "strip", z.ZodTypeAny, {
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
}, {
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
            deletedAt: string | null;
            currency?: string | undefined;
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
            deletedAt: string | null;
            currency?: string | undefined;
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
}>;
export declare const syncPullCursorSchema: z.ZodObject<{
    snapshotAt: z.ZodNumber;
    ticketsOffset: z.ZodNumber;
    ticketCommentsOffset: z.ZodNumber;
    ticketAttachmentsOffset: z.ZodNumber;
    paymentRecordsOffset: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    snapshotAt: number;
    ticketsOffset: number;
    ticketCommentsOffset: number;
    ticketAttachmentsOffset: number;
    paymentRecordsOffset: number;
}, {
    snapshotAt: number;
    ticketsOffset: number;
    ticketCommentsOffset: number;
    ticketAttachmentsOffset: number;
    paymentRecordsOffset: number;
}>;
export declare const syncPullRequestSchema: z.ZodObject<{
    locationId: z.ZodString;
    lastPulledAt: z.ZodNullable<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    cursor: z.ZodDefault<z.ZodOptional<z.ZodNullable<z.ZodObject<{
        snapshotAt: z.ZodNumber;
        ticketsOffset: z.ZodNumber;
        ticketCommentsOffset: z.ZodNumber;
        ticketAttachmentsOffset: z.ZodNumber;
        paymentRecordsOffset: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        snapshotAt: number;
        ticketsOffset: number;
        ticketCommentsOffset: number;
        ticketAttachmentsOffset: number;
        paymentRecordsOffset: number;
    }, {
        snapshotAt: number;
        ticketsOffset: number;
        ticketCommentsOffset: number;
        ticketAttachmentsOffset: number;
        paymentRecordsOffset: number;
    }>>>>;
}, "strip", z.ZodTypeAny, {
    locationId: string;
    limit: number;
    lastPulledAt: number | null;
    cursor: {
        snapshotAt: number;
        ticketsOffset: number;
        ticketCommentsOffset: number;
        ticketAttachmentsOffset: number;
        paymentRecordsOffset: number;
    } | null;
}, {
    locationId: string;
    lastPulledAt: number | null;
    limit?: number | undefined;
    cursor?: {
        snapshotAt: number;
        ticketsOffset: number;
        ticketCommentsOffset: number;
        ticketAttachmentsOffset: number;
        paymentRecordsOffset: number;
    } | null | undefined;
}>;
export declare const syncPullResponseSchema: z.ZodObject<{
    changes: z.ZodObject<{
        tickets: z.ZodObject<{
            created: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                locationId: z.ZodString;
                createdByUserId: z.ZodString;
                assignedToUserId: z.ZodNullable<z.ZodString>;
                title: z.ZodString;
                description: z.ZodNullable<z.ZodString>;
                status: z.ZodEnum<["New", "Scheduled", "InProgress", "Done", "Invoiced", "Paid", "Canceled"]>;
                scheduledStartAt: z.ZodNullable<z.ZodString>;
                scheduledEndAt: z.ZodNullable<z.ZodString>;
                priority: z.ZodNullable<z.ZodString>;
                totalAmountCents: z.ZodNullable<z.ZodNumber>;
                currency: z.ZodDefault<z.ZodString>;
                createdAt: z.ZodString;
                updatedAt: z.ZodString;
                deletedAt: z.ZodNullable<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
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
            }, {
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
                deletedAt: string | null;
                currency?: string | undefined;
            }>, "many">;
            updated: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                locationId: z.ZodString;
                createdByUserId: z.ZodString;
                assignedToUserId: z.ZodNullable<z.ZodString>;
                title: z.ZodString;
                description: z.ZodNullable<z.ZodString>;
                status: z.ZodEnum<["New", "Scheduled", "InProgress", "Done", "Invoiced", "Paid", "Canceled"]>;
                scheduledStartAt: z.ZodNullable<z.ZodString>;
                scheduledEndAt: z.ZodNullable<z.ZodString>;
                priority: z.ZodNullable<z.ZodString>;
                totalAmountCents: z.ZodNullable<z.ZodNumber>;
                currency: z.ZodDefault<z.ZodString>;
                createdAt: z.ZodString;
                updatedAt: z.ZodString;
                deletedAt: z.ZodNullable<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
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
            }, {
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
                deletedAt: string | null;
                currency?: string | undefined;
            }>, "many">;
            deleted: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
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
        }, {
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
                deletedAt: string | null;
                currency?: string | undefined;
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
                deletedAt: string | null;
                currency?: string | undefined;
            }[];
            deleted: string[];
        }>;
        ticketComments: z.ZodObject<{
            created: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                ticketId: z.ZodString;
                locationId: z.ZodString;
                authorUserId: z.ZodString;
                body: z.ZodString;
                createdAt: z.ZodString;
                updatedAt: z.ZodString;
                deletedAt: z.ZodNullable<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                id: string;
                createdAt: string;
                updatedAt: string;
                locationId: string;
                deletedAt: string | null;
                ticketId: string;
                authorUserId: string;
                body: string;
            }, {
                id: string;
                createdAt: string;
                updatedAt: string;
                locationId: string;
                deletedAt: string | null;
                ticketId: string;
                authorUserId: string;
                body: string;
            }>, "many">;
            updated: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                ticketId: z.ZodString;
                locationId: z.ZodString;
                authorUserId: z.ZodString;
                body: z.ZodString;
                createdAt: z.ZodString;
                updatedAt: z.ZodString;
                deletedAt: z.ZodNullable<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                id: string;
                createdAt: string;
                updatedAt: string;
                locationId: string;
                deletedAt: string | null;
                ticketId: string;
                authorUserId: string;
                body: string;
            }, {
                id: string;
                createdAt: string;
                updatedAt: string;
                locationId: string;
                deletedAt: string | null;
                ticketId: string;
                authorUserId: string;
                body: string;
            }>, "many">;
            deleted: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
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
        }, {
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
        }>;
        ticketAttachments: z.ZodObject<{
            created: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                ticketId: z.ZodString;
                locationId: z.ZodString;
                uploadedByUserId: z.ZodString;
                kind: z.ZodEnum<["Photo", "File"]>;
                storageKey: z.ZodString;
                url: z.ZodString;
                mimeType: z.ZodString;
                size: z.ZodNumber;
                width: z.ZodNullable<z.ZodNumber>;
                height: z.ZodNullable<z.ZodNumber>;
                createdAt: z.ZodString;
                updatedAt: z.ZodString;
                deletedAt: z.ZodNullable<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
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
            }, {
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
            }>, "many">;
            updated: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                ticketId: z.ZodString;
                locationId: z.ZodString;
                uploadedByUserId: z.ZodString;
                kind: z.ZodEnum<["Photo", "File"]>;
                storageKey: z.ZodString;
                url: z.ZodString;
                mimeType: z.ZodString;
                size: z.ZodNumber;
                width: z.ZodNullable<z.ZodNumber>;
                height: z.ZodNullable<z.ZodNumber>;
                createdAt: z.ZodString;
                updatedAt: z.ZodString;
                deletedAt: z.ZodNullable<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
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
            }, {
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
            }>, "many">;
            deleted: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
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
        }, {
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
        }>;
        paymentRecords: z.ZodObject<{
            created: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                ticketId: z.ZodString;
                locationId: z.ZodString;
                provider: z.ZodEnum<["manual", "stripe"]>;
                amountCents: z.ZodNumber;
                currency: z.ZodString;
                status: z.ZodEnum<["Pending", "Succeeded", "Failed", "Refunded"]>;
                createdAt: z.ZodString;
                updatedAt: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                id: string;
                createdAt: string;
                updatedAt: string;
                status: "Pending" | "Succeeded" | "Failed" | "Refunded";
                locationId: string;
                currency: string;
                ticketId: string;
                provider: "manual" | "stripe";
                amountCents: number;
            }, {
                id: string;
                createdAt: string;
                updatedAt: string;
                status: "Pending" | "Succeeded" | "Failed" | "Refunded";
                locationId: string;
                currency: string;
                ticketId: string;
                provider: "manual" | "stripe";
                amountCents: number;
            }>, "many">;
            updated: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                ticketId: z.ZodString;
                locationId: z.ZodString;
                provider: z.ZodEnum<["manual", "stripe"]>;
                amountCents: z.ZodNumber;
                currency: z.ZodString;
                status: z.ZodEnum<["Pending", "Succeeded", "Failed", "Refunded"]>;
                createdAt: z.ZodString;
                updatedAt: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                id: string;
                createdAt: string;
                updatedAt: string;
                status: "Pending" | "Succeeded" | "Failed" | "Refunded";
                locationId: string;
                currency: string;
                ticketId: string;
                provider: "manual" | "stripe";
                amountCents: number;
            }, {
                id: string;
                createdAt: string;
                updatedAt: string;
                status: "Pending" | "Succeeded" | "Failed" | "Refunded";
                locationId: string;
                currency: string;
                ticketId: string;
                provider: "manual" | "stripe";
                amountCents: number;
            }>, "many">;
            deleted: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
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
        }, {
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
        }>;
    }, "strip", z.ZodTypeAny, {
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
    }, {
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
                deletedAt: string | null;
                currency?: string | undefined;
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
                deletedAt: string | null;
                currency?: string | undefined;
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
    }>;
    timestamp: z.ZodNumber;
    hasMore: z.ZodDefault<z.ZodBoolean>;
    nextCursor: z.ZodDefault<z.ZodOptional<z.ZodNullable<z.ZodObject<{
        snapshotAt: z.ZodNumber;
        ticketsOffset: z.ZodNumber;
        ticketCommentsOffset: z.ZodNumber;
        ticketAttachmentsOffset: z.ZodNumber;
        paymentRecordsOffset: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        snapshotAt: number;
        ticketsOffset: number;
        ticketCommentsOffset: number;
        ticketAttachmentsOffset: number;
        paymentRecordsOffset: number;
    }, {
        snapshotAt: number;
        ticketsOffset: number;
        ticketCommentsOffset: number;
        ticketAttachmentsOffset: number;
        paymentRecordsOffset: number;
    }>>>>;
}, "strip", z.ZodTypeAny, {
    hasMore: boolean;
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
    nextCursor: {
        snapshotAt: number;
        ticketsOffset: number;
        ticketCommentsOffset: number;
        ticketAttachmentsOffset: number;
        paymentRecordsOffset: number;
    } | null;
}, {
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
                deletedAt: string | null;
                currency?: string | undefined;
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
                deletedAt: string | null;
                currency?: string | undefined;
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
    hasMore?: boolean | undefined;
    nextCursor?: {
        snapshotAt: number;
        ticketsOffset: number;
        ticketCommentsOffset: number;
        ticketAttachmentsOffset: number;
        paymentRecordsOffset: number;
    } | null | undefined;
}>;
export declare const syncPushRequestSchema: z.ZodObject<{
    locationId: z.ZodString;
    lastPulledAt: z.ZodNullable<z.ZodNumber>;
    changes: z.ZodObject<{
        tickets: z.ZodObject<{
            created: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                locationId: z.ZodString;
                createdByUserId: z.ZodString;
                assignedToUserId: z.ZodNullable<z.ZodString>;
                title: z.ZodString;
                description: z.ZodNullable<z.ZodString>;
                status: z.ZodEnum<["New", "Scheduled", "InProgress", "Done", "Invoiced", "Paid", "Canceled"]>;
                scheduledStartAt: z.ZodNullable<z.ZodString>;
                scheduledEndAt: z.ZodNullable<z.ZodString>;
                priority: z.ZodNullable<z.ZodString>;
                totalAmountCents: z.ZodNullable<z.ZodNumber>;
                currency: z.ZodDefault<z.ZodString>;
                createdAt: z.ZodString;
                updatedAt: z.ZodString;
                deletedAt: z.ZodNullable<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
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
            }, {
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
                deletedAt: string | null;
                currency?: string | undefined;
            }>, "many">;
            updated: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                locationId: z.ZodString;
                createdByUserId: z.ZodString;
                assignedToUserId: z.ZodNullable<z.ZodString>;
                title: z.ZodString;
                description: z.ZodNullable<z.ZodString>;
                status: z.ZodEnum<["New", "Scheduled", "InProgress", "Done", "Invoiced", "Paid", "Canceled"]>;
                scheduledStartAt: z.ZodNullable<z.ZodString>;
                scheduledEndAt: z.ZodNullable<z.ZodString>;
                priority: z.ZodNullable<z.ZodString>;
                totalAmountCents: z.ZodNullable<z.ZodNumber>;
                currency: z.ZodDefault<z.ZodString>;
                createdAt: z.ZodString;
                updatedAt: z.ZodString;
                deletedAt: z.ZodNullable<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
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
            }, {
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
                deletedAt: string | null;
                currency?: string | undefined;
            }>, "many">;
            deleted: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
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
        }, {
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
                deletedAt: string | null;
                currency?: string | undefined;
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
                deletedAt: string | null;
                currency?: string | undefined;
            }[];
            deleted: string[];
        }>;
        ticketComments: z.ZodObject<{
            created: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                ticketId: z.ZodString;
                locationId: z.ZodString;
                authorUserId: z.ZodString;
                body: z.ZodString;
                createdAt: z.ZodString;
                updatedAt: z.ZodString;
                deletedAt: z.ZodNullable<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                id: string;
                createdAt: string;
                updatedAt: string;
                locationId: string;
                deletedAt: string | null;
                ticketId: string;
                authorUserId: string;
                body: string;
            }, {
                id: string;
                createdAt: string;
                updatedAt: string;
                locationId: string;
                deletedAt: string | null;
                ticketId: string;
                authorUserId: string;
                body: string;
            }>, "many">;
            updated: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                ticketId: z.ZodString;
                locationId: z.ZodString;
                authorUserId: z.ZodString;
                body: z.ZodString;
                createdAt: z.ZodString;
                updatedAt: z.ZodString;
                deletedAt: z.ZodNullable<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                id: string;
                createdAt: string;
                updatedAt: string;
                locationId: string;
                deletedAt: string | null;
                ticketId: string;
                authorUserId: string;
                body: string;
            }, {
                id: string;
                createdAt: string;
                updatedAt: string;
                locationId: string;
                deletedAt: string | null;
                ticketId: string;
                authorUserId: string;
                body: string;
            }>, "many">;
            deleted: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
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
        }, {
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
        }>;
        ticketAttachments: z.ZodObject<{
            created: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                ticketId: z.ZodString;
                locationId: z.ZodString;
                uploadedByUserId: z.ZodString;
                kind: z.ZodEnum<["Photo", "File"]>;
                storageKey: z.ZodString;
                url: z.ZodString;
                mimeType: z.ZodString;
                size: z.ZodNumber;
                width: z.ZodNullable<z.ZodNumber>;
                height: z.ZodNullable<z.ZodNumber>;
                createdAt: z.ZodString;
                updatedAt: z.ZodString;
                deletedAt: z.ZodNullable<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
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
            }, {
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
            }>, "many">;
            updated: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                ticketId: z.ZodString;
                locationId: z.ZodString;
                uploadedByUserId: z.ZodString;
                kind: z.ZodEnum<["Photo", "File"]>;
                storageKey: z.ZodString;
                url: z.ZodString;
                mimeType: z.ZodString;
                size: z.ZodNumber;
                width: z.ZodNullable<z.ZodNumber>;
                height: z.ZodNullable<z.ZodNumber>;
                createdAt: z.ZodString;
                updatedAt: z.ZodString;
                deletedAt: z.ZodNullable<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
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
            }, {
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
            }>, "many">;
            deleted: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
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
        }, {
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
        }>;
        paymentRecords: z.ZodObject<{
            created: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                ticketId: z.ZodString;
                locationId: z.ZodString;
                provider: z.ZodEnum<["manual", "stripe"]>;
                amountCents: z.ZodNumber;
                currency: z.ZodString;
                status: z.ZodEnum<["Pending", "Succeeded", "Failed", "Refunded"]>;
                createdAt: z.ZodString;
                updatedAt: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                id: string;
                createdAt: string;
                updatedAt: string;
                status: "Pending" | "Succeeded" | "Failed" | "Refunded";
                locationId: string;
                currency: string;
                ticketId: string;
                provider: "manual" | "stripe";
                amountCents: number;
            }, {
                id: string;
                createdAt: string;
                updatedAt: string;
                status: "Pending" | "Succeeded" | "Failed" | "Refunded";
                locationId: string;
                currency: string;
                ticketId: string;
                provider: "manual" | "stripe";
                amountCents: number;
            }>, "many">;
            updated: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                ticketId: z.ZodString;
                locationId: z.ZodString;
                provider: z.ZodEnum<["manual", "stripe"]>;
                amountCents: z.ZodNumber;
                currency: z.ZodString;
                status: z.ZodEnum<["Pending", "Succeeded", "Failed", "Refunded"]>;
                createdAt: z.ZodString;
                updatedAt: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                id: string;
                createdAt: string;
                updatedAt: string;
                status: "Pending" | "Succeeded" | "Failed" | "Refunded";
                locationId: string;
                currency: string;
                ticketId: string;
                provider: "manual" | "stripe";
                amountCents: number;
            }, {
                id: string;
                createdAt: string;
                updatedAt: string;
                status: "Pending" | "Succeeded" | "Failed" | "Refunded";
                locationId: string;
                currency: string;
                ticketId: string;
                provider: "manual" | "stripe";
                amountCents: number;
            }>, "many">;
            deleted: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
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
        }, {
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
        }>;
    }, "strip", z.ZodTypeAny, {
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
    }, {
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
                deletedAt: string | null;
                currency?: string | undefined;
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
                deletedAt: string | null;
                currency?: string | undefined;
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
    }>;
    clientId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    locationId: string;
    lastPulledAt: number | null;
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
    clientId: string;
}, {
    locationId: string;
    lastPulledAt: number | null;
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
                deletedAt: string | null;
                currency?: string | undefined;
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
                deletedAt: string | null;
                currency?: string | undefined;
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
    clientId: string;
}>;
export declare const syncPushResponseSchema: z.ZodObject<{
    ok: z.ZodLiteral<true>;
    newTimestamp: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    ok: true;
    newTimestamp: number;
}, {
    ok: true;
    newTimestamp: number;
}>;
export type SyncChanges = z.infer<typeof syncChangesSchema>;
export type SyncPullCursor = z.infer<typeof syncPullCursorSchema>;
export type SyncPullRequest = z.infer<typeof syncPullRequestSchema>;
export type SyncPullResponse = z.infer<typeof syncPullResponseSchema>;
export type SyncPushRequest = z.infer<typeof syncPushRequestSchema>;
export type SyncPushResponse = z.infer<typeof syncPushResponseSchema>;
//# sourceMappingURL=sync.d.ts.map