import { PaymentsService } from './payments.service';
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
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
    create(locationId: string, body: unknown): Promise<{
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
    updateStatus(locationId: string, id: string, body: {
        status: string;
    }): Promise<{
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
