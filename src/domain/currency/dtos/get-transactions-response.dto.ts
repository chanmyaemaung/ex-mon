import { TransactionItemDto } from './transaction-item.dto';

export class GetTransactionsResponseDto {
  nextStartDate: string | null; // "2024-01-21" or null
  data: Array<{
    date: string; // "31/01/2024"
    transactions: TransactionItemDto[];
  }>;
}
