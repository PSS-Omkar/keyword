// Utility functions for handling Google Ads micros format
// 1 USD = 1,000,000 micros
// Example: $2.50 = 2,500,000 micros

export function dollarToMicros(dollarAmount: number): number {
  return Math.round(dollarAmount * 1_000_000);
}

export function microsToDollar(micros: number | string): number {
  const microsNum = typeof micros === 'string' ? parseInt(micros) : micros;
  return microsNum / 1_000_000;
}

export function formatMicrosAsCurrency(micros: number | string): string {
  const dollars = microsToDollar(micros);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(dollars);
}

export function formatMicros(micros: number | string): string {
  const microsNum = typeof micros === 'string' ? parseInt(micros) : micros;
  return microsNum.toLocaleString();
}