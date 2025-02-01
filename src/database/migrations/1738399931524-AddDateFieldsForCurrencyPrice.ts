import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDateFieldsForCurrencyPrice1738399931524
  implements MigrationInterface
{
  name = 'AddDateFieldsForCurrencyPrice1738399931524';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "currency_price"
            ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()
        `);
    await queryRunner.query(`
            ALTER TABLE "currency_price"
            ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "currency_price" DROP COLUMN "updatedAt"
        `);
    await queryRunner.query(`
            ALTER TABLE "currency_price" DROP COLUMN "createdAt"
        `);
  }
}
