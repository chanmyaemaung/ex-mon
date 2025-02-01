export class CurrencyPriceDto {
  value: string;
  sign: string;
}

export class GetLatestResponseDto {
  id: number;
  code: string;
  unit: string;
  prices: CurrencyPriceDto[];
}
