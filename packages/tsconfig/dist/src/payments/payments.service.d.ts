import { PrismaService } from '@/prisma/prisma.service';
export declare class PaymentsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(locationId: string, ticketId?: string): Promise<{
        createdAt: string;
        updatedAt: string;
        id: string;
        status: import("@prisma/client").$Enums.PaymentStatus;
        locationId: string;
        currency: string;
        ticketId: string;
        provider: import("@prisma/client").$Enums.PaymentProvider;
        amountCents: number;
    }[]>;
    create(locationId: string, data: unknown): Promise<{
        createdAt: string;
        updatedAt: string;
        id: string;
        status: import("@prisma/client").$Enums.PaymentStatus;
        locationId: string;
        currency: string;
        ticketId: string;
        provider: import("@prisma/client").$Enums.PaymentProvider;
        amountCents: number;
    }>;
    updateStatus(locationId: string, paymentId: string, status: string): Promise<{
        createdAt: string;
        updatedAt: string;
        id: string;
        status: import("@prisma/client").$Enums.PaymentStatus;
        locationId: string;
        currency: string;
        ticketId: string;
        provider: import("@prisma/client").$Enums.PaymentProvider;
        amountCents: number;
    }>;
}
