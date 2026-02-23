import { z } from 'zod';
export declare const idSchema: z.ZodString;
export declare const timestampSchema: z.ZodString;
export declare const roleKeySchema: z.ZodEnum<["Owner", "Manager", "Technician"]>;
export declare const privilegeKeySchema: z.ZodEnum<["tickets.read", "tickets.write", "tickets.assign", "tickets.status.update", "dispatch.manage", "users.read", "users.manage", "locations.read", "locations.manage", "comments.read", "comments.write", "attachments.read", "attachments.write", "payments.read", "payments.write", "billing.manage", "sync.run"]>;
export declare const userSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    name: z.ZodString;
    isAdmin: z.ZodBoolean;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    email: string;
    name: string;
    isAdmin: boolean;
    createdAt: string;
    updatedAt: string;
}, {
    id: string;
    email: string;
    name: string;
    isAdmin: boolean;
    createdAt: string;
    updatedAt: string;
}>;
export declare const locationSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    timezone: z.ZodString;
    address: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    timezone: string;
    address: string | null;
}, {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    timezone: string;
    address: string | null;
}>;
export declare const userLocationStatusSchema: z.ZodEnum<["invited", "active", "suspended"]>;
export declare const userLocationSchema: z.ZodObject<{
    userId: z.ZodString;
    locationId: z.ZodString;
    role: z.ZodEnum<["Owner", "Manager", "Technician"]>;
    status: z.ZodEnum<["invited", "active", "suspended"]>;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    createdAt: string;
    status: "invited" | "active" | "suspended";
    userId: string;
    locationId: string;
    role: "Owner" | "Manager" | "Technician";
}, {
    createdAt: string;
    status: "invited" | "active" | "suspended";
    userId: string;
    locationId: string;
    role: "Owner" | "Manager" | "Technician";
}>;
export declare const ticketStatusSchema: z.ZodEnum<["New", "Scheduled", "InProgress", "Done", "Invoiced", "Paid", "Canceled"]>;
export declare const ticketSchema: z.ZodObject<{
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
}>;
export declare const ticketCommentSchema: z.ZodObject<{
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
}>;
export declare const attachmentKindSchema: z.ZodEnum<["Photo", "File"]>;
export declare const ticketAttachmentSchema: z.ZodObject<{
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
}>;
export declare const paymentProviderSchema: z.ZodEnum<["manual", "stripe"]>;
export declare const paymentStatusSchema: z.ZodEnum<["Pending", "Succeeded", "Failed", "Refunded"]>;
export declare const paymentRecordSchema: z.ZodObject<{
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
}>;
export declare const loginInputSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const authResponseSchema: z.ZodObject<{
    accessToken: z.ZodString;
    user: z.ZodObject<{
        id: z.ZodString;
        email: z.ZodString;
        name: z.ZodString;
        isAdmin: z.ZodBoolean;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        email: string;
        name: string;
        isAdmin: boolean;
        createdAt: string;
        updatedAt: string;
    }, {
        id: string;
        email: string;
        name: string;
        isAdmin: boolean;
        createdAt: string;
        updatedAt: string;
    }>;
}, "strip", z.ZodTypeAny, {
    accessToken: string;
    user: {
        id: string;
        email: string;
        name: string;
        isAdmin: boolean;
        createdAt: string;
        updatedAt: string;
    };
}, {
    accessToken: string;
    user: {
        id: string;
        email: string;
        name: string;
        isAdmin: boolean;
        createdAt: string;
        updatedAt: string;
    };
}>;
export declare const createUserSchema: z.ZodObject<{
    email: z.ZodString;
    name: z.ZodString;
    password: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodEnum<["Owner", "Manager", "Technician"]>>;
    locationId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    name: string;
    locationId?: string | undefined;
    role?: "Owner" | "Manager" | "Technician" | undefined;
    password?: string | undefined;
}, {
    email: string;
    name: string;
    locationId?: string | undefined;
    role?: "Owner" | "Manager" | "Technician" | undefined;
    password?: string | undefined;
}>;
export declare const updateUserSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    isAdmin: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    isAdmin?: boolean | undefined;
}, {
    name?: string | undefined;
    isAdmin?: boolean | undefined;
}>;
export declare const createLocationSchema: z.ZodObject<{
    name: z.ZodString;
    timezone: z.ZodString;
    address: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    timezone: string;
    address?: string | undefined;
}, {
    name: string;
    timezone: string;
    address?: string | undefined;
}>;
export declare const updateLocationSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    timezone: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    timezone?: string | undefined;
    address?: string | null | undefined;
}, {
    name?: string | undefined;
    timezone?: string | undefined;
    address?: string | null | undefined;
}>;
export declare const createTicketSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    assignedToUserId: z.ZodOptional<z.ZodString>;
    scheduledStartAt: z.ZodOptional<z.ZodString>;
    scheduledEndAt: z.ZodOptional<z.ZodString>;
    priority: z.ZodOptional<z.ZodString>;
    totalAmountCents: z.ZodOptional<z.ZodNumber>;
    currency: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    title: string;
    currency: string;
    assignedToUserId?: string | undefined;
    description?: string | undefined;
    scheduledStartAt?: string | undefined;
    scheduledEndAt?: string | undefined;
    priority?: string | undefined;
    totalAmountCents?: number | undefined;
}, {
    title: string;
    assignedToUserId?: string | undefined;
    description?: string | undefined;
    scheduledStartAt?: string | undefined;
    scheduledEndAt?: string | undefined;
    priority?: string | undefined;
    totalAmountCents?: number | undefined;
    currency?: string | undefined;
}>;
export declare const updateTicketSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    assignedToUserId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    scheduledStartAt: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    scheduledEndAt: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    priority: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    totalAmountCents: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    currency: z.ZodOptional<z.ZodDefault<z.ZodString>>;
} & {
    status: z.ZodOptional<z.ZodEnum<["New", "Scheduled", "InProgress", "Done", "Invoiced", "Paid", "Canceled"]>>;
}, "strip", z.ZodTypeAny, {
    status?: "New" | "Scheduled" | "InProgress" | "Done" | "Invoiced" | "Paid" | "Canceled" | undefined;
    assignedToUserId?: string | undefined;
    title?: string | undefined;
    description?: string | undefined;
    scheduledStartAt?: string | undefined;
    scheduledEndAt?: string | undefined;
    priority?: string | undefined;
    totalAmountCents?: number | undefined;
    currency?: string | undefined;
}, {
    status?: "New" | "Scheduled" | "InProgress" | "Done" | "Invoiced" | "Paid" | "Canceled" | undefined;
    assignedToUserId?: string | undefined;
    title?: string | undefined;
    description?: string | undefined;
    scheduledStartAt?: string | undefined;
    scheduledEndAt?: string | undefined;
    priority?: string | undefined;
    totalAmountCents?: number | undefined;
    currency?: string | undefined;
}>;
export declare const createCommentSchema: z.ZodObject<{
    ticketId: z.ZodString;
    body: z.ZodString;
}, "strip", z.ZodTypeAny, {
    ticketId: string;
    body: string;
}, {
    ticketId: string;
    body: string;
}>;
export declare const createAttachmentMetadataSchema: z.ZodObject<{
    ticketId: z.ZodString;
    kind: z.ZodEnum<["Photo", "File"]>;
    storageKey: z.ZodString;
    url: z.ZodString;
    mimeType: z.ZodString;
    size: z.ZodNumber;
    width: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    height: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    ticketId: string;
    kind: "Photo" | "File";
    storageKey: string;
    url: string;
    mimeType: string;
    size: number;
    width?: number | null | undefined;
    height?: number | null | undefined;
}, {
    ticketId: string;
    kind: "Photo" | "File";
    storageKey: string;
    url: string;
    mimeType: string;
    size: number;
    width?: number | null | undefined;
    height?: number | null | undefined;
}>;
export declare const createPaymentRecordSchema: z.ZodObject<{
    ticketId: z.ZodString;
    provider: z.ZodEnum<["manual", "stripe"]>;
    amountCents: z.ZodNumber;
    currency: z.ZodDefault<z.ZodString>;
    status: z.ZodDefault<z.ZodEnum<["Pending", "Succeeded", "Failed", "Refunded"]>>;
}, "strip", z.ZodTypeAny, {
    status: "Pending" | "Succeeded" | "Failed" | "Refunded";
    currency: string;
    ticketId: string;
    provider: "manual" | "stripe";
    amountCents: number;
}, {
    ticketId: string;
    provider: "manual" | "stripe";
    amountCents: number;
    status?: "Pending" | "Succeeded" | "Failed" | "Refunded" | undefined;
    currency?: string | undefined;
}>;
export type User = z.infer<typeof userSchema>;
export type Location = z.infer<typeof locationSchema>;
export type UserLocation = z.infer<typeof userLocationSchema>;
export type UserLocationStatus = z.infer<typeof userLocationStatusSchema>;
export type TicketStatus = z.infer<typeof ticketStatusSchema>;
export type Ticket = z.infer<typeof ticketSchema>;
export type TicketComment = z.infer<typeof ticketCommentSchema>;
export type AttachmentKind = z.infer<typeof attachmentKindSchema>;
export type TicketAttachment = z.infer<typeof ticketAttachmentSchema>;
export type PaymentProvider = z.infer<typeof paymentProviderSchema>;
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;
export type PaymentRecord = z.infer<typeof paymentRecordSchema>;
export type LoginInput = z.infer<typeof loginInputSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateLocationInput = z.infer<typeof createLocationSchema>;
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;
export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type CreateAttachmentMetadataInput = z.infer<typeof createAttachmentMetadataSchema>;
export type CreatePaymentRecordInput = z.infer<typeof createPaymentRecordSchema>;
//# sourceMappingURL=schemas.d.ts.map