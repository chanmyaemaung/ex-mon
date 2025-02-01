import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCurrencyRelationTable1738398775075
  implements MigrationInterface
{
  name = 'CreateCurrencyRelationTable1738398775075';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "public"."currency_price_type_enum" AS ENUM('buy', 'sell')
        `);
    await queryRunner.query(`
            CREATE TABLE "currency_price" (
                "id" SERIAL NOT NULL,
                "value" character varying NOT NULL,
                "sign" character varying NOT NULL,
                "type" "public"."currency_price_type_enum" NOT NULL,
                "currencyId" integer,
                CONSTRAINT "PK_1b0186eb043540ba4636d4c4dc8" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."currency_transaction_buysign_enum" AS ENUM('up', 'down', 'none')
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."currency_transaction_sellsign_enum" AS ENUM('up', 'down', 'none')
        `);
    await queryRunner.query(`
            CREATE TABLE "currency_transaction" (
                "id" SERIAL NOT NULL,
                "date" character varying(255) NOT NULL,
                "time" character varying(255) NOT NULL,
                "buyValue" character varying(255) NOT NULL,
                "buySign" "public"."currency_transaction_buysign_enum" NOT NULL DEFAULT 'none',
                "sellValue" character varying(255) NOT NULL,
                "sellSign" "public"."currency_transaction_sellsign_enum" NOT NULL DEFAULT 'none',
                "currencyId" integer,
                CONSTRAINT "PK_4f401c38ffc2d08c6ba68bd2fd9" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "currency" (
                "id" SERIAL NOT NULL,
                "code" character varying(10) NOT NULL,
                "unit" character varying(10) NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_723472e41cae44beb0763f4039c" UNIQUE ("code"),
                CONSTRAINT "PK_3cda65c731a6264f0e444cc9b91" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "currency_price"
            ADD CONSTRAINT "FK_0542fe8178f646f9afbe2ae09c2" FOREIGN KEY ("currencyId") REFERENCES "currency"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "currency_transaction"
            ADD CONSTRAINT "FK_19827de7f85b06cd05a1d9a6ac2" FOREIGN KEY ("currencyId") REFERENCES "currency"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "currency_transaction" DROP CONSTRAINT "FK_19827de7f85b06cd05a1d9a6ac2"
        `);
    await queryRunner.query(`
            ALTER TABLE "currency_price" DROP CONSTRAINT "FK_0542fe8178f646f9afbe2ae09c2"
        `);
    await queryRunner.query(`
            DROP TABLE "currency"
        `);
    await queryRunner.query(`
            DROP TABLE "currency_transaction"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."currency_transaction_sellsign_enum"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."currency_transaction_buysign_enum"
        `);
    await queryRunner.query(`
            DROP TABLE "currency_price"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."currency_price_type_enum"
        `);
  }
}
