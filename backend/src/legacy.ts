import { Injectable, ServiceUnavailableException } from '@nestjs/common';
/** Boundary for a flaky legacy service. Writes are never retried blindly. */
@Injectable()
export class LegacyAvailabilityService {
    private unavailableUntil = 0;
    async execute<T>(operation: () => Promise<T>, safeToRetry = false): Promise<T> {
        if (Date.now() < this.unavailableUntil)
            throw new ServiceUnavailableException('Serviço de chamados temporariamente indisponível');
        const attempts = safeToRetry ? 3 : 1;
        for (let attempt = 0; attempt < attempts; attempt += 1) {
            try {
                if (process.env.SIMULATE_LEGACY_OUTAGE === 'true')
                    throw new Error('Legacy outage simulation');
                return await operation();
            }
            catch (error) {
                if (attempt === attempts - 1) {
                    this.unavailableUntil = Date.now() + 3000;
                    throw new ServiceUnavailableException('Serviço de chamados indisponível. Tente novamente; nenhuma operação foi confirmada.', { cause: error });
                }
                await new Promise((resolve) => setTimeout(resolve, 150 * (attempt + 1)));
            }
        }
        throw new ServiceUnavailableException();
    }
}
