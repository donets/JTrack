import type { JwtUser } from '@/common/types';
import { LocationsService } from './locations.service';
export declare class LocationsController {
    private readonly locationsService;
    constructor(locationsService: LocationsService);
    list(user: JwtUser): Promise<{
        id: string;
        name: string;
        timezone: string;
        address: string | null;
        role: string;
        membershipStatus: string;
        createdAt: string;
        updatedAt: string;
    }[]>;
    create(user: JwtUser, body: unknown): Promise<{
        id: string;
        name: string;
        timezone: string;
        address: string | null;
        createdAt: string;
        updatedAt: string;
    }>;
    update(user: JwtUser, locationId: string, body: unknown): Promise<{
        id: string;
        name: string;
        timezone: string;
        address: string | null;
        createdAt: string;
        updatedAt: string;
    }>;
    remove(user: JwtUser, locationId: string): Promise<{
        ok: boolean;
    }>;
}
