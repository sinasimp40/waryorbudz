export const MIN_ORDER_AMOUNT = 100;

export function isBelowMinOrder(amount: number): boolean {
  return amount < MIN_ORDER_AMOUNT;
}

export function minOrderShortfall(amount: number): number {
  return Math.max(0, MIN_ORDER_AMOUNT - amount);
}
