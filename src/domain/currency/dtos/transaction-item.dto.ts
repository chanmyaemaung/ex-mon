export class TransactionPriceDto {
  value: string;
  sign: string;
}

export class TransactionItemDto {
  time: string;
  unit: string;
  prices: TransactionPriceDto[];
}
