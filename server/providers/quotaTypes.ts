/** Durable admission boundary; implementations persist reservations before network attempts. */
export interface ProviderQuota {
  reserve(providerId: string, cost: number): Promise<{ allowed: boolean; reason: string }>;
}
