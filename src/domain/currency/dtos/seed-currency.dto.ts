export class SeedCurrencyDto {
  id: number;
  code: string;
  unit: string;
  prices: Array<{
    value: string;
    sign: string;
  }>;
}
