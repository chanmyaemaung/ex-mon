import { MigrationInterface, QueryRunner } from 'typeorm';

export class ConvertAppropriateCurrencyConversion1738399653230
  implements MigrationInterface
{
  name = 'ConvertAppropriateCurrencyConversion1738399653230';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "currency_price" DROP COLUMN "value"
        `);
    await queryRunner.query(`
            ALTER TABLE "currency_price"
            ADD "value" numeric(10, 2) NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "currency_transaction" DROP COLUMN "date"
        `);
    await queryRunner.query(`
            ALTER TABLE "currency_transaction"
            ADD "date" date NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "currency_transaction" DROP COLUMN "buyValue"
        `);
    await queryRunner.query(`
            ALTER TABLE "currency_transaction"
            ADD "buyValue" numeric(10, 2) NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "currency_transaction" DROP COLUMN "sellValue"
        `);
    await queryRunner.query(`
            ALTER TABLE "currency_transaction"
            ADD "sellValue" numeric(10, 2) NOT NULL
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "currency_transaction" DROP COLUMN "sellValue"
        `);
    await queryRunner.query(`
            ALTER TABLE "currency_transaction"
            ADD "sellValue" character varying(255) NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "currency_transaction" DROP COLUMN "buyValue"
        `);
    await queryRunner.query(`
            ALTER TABLE "currency_transaction"
            ADD "buyValue" character varying(255) NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "currency_transaction" DROP COLUMN "date"
        `);
    await queryRunner.query(`
            ALTER TABLE "currency_transaction"
            ADD "date" character varying(255) NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "currency_price" DROP COLUMN "value"
        `);
    await queryRunner.query(`
            ALTER TABLE "currency_price"
            ADD "value" character varying NOT NULL
        `);
  }
}
