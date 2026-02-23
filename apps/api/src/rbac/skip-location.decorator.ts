import { SetMetadata } from '@nestjs/common'

export const SKIP_LOCATION_KEY = 'skipLocation'

export const SkipLocationGuard = () => SetMetadata(SKIP_LOCATION_KEY, true)
