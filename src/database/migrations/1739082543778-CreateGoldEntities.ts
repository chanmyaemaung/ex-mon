import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateGoldEntities1739082543778 implements MigrationInterface {
    name = 'CreateGoldEntities1739082543778'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "public"."gold_type_enum" AS ENUM('world', 'pe_15', 'pe_16')
        `);
        await queryRunner.query(`
            CREATE TABLE "gold" (
                "id" SERIAL NOT NULL,
                "type" "public"."gold_type_enum" NOT NULL,
                "unit" character varying(20) NOT NULL,
                "time" TIMESTAMP NOT NULL,
                CONSTRAINT "PK_6c65d7f847dd2b4773f28d4488f" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_d4ee2f433aed864b926ea59012" ON "gold" ("type")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."gold_price_sign_enum" AS ENUM('up', 'down', 'none')
        `);
        await queryRunner.query(`
            CREATE TABLE "gold_price" (
                "id" SERIAL NOT NULL,
                "title" character varying(5) NOT NULL,
                "value" numeric(16, 2) NOT NULL,
                "sign" "public"."gold_price_sign_enum" NOT NULL DEFAULT 'none',
                "goldId" integer,
                "transactionId" integer,
                CONSTRAINT "PK_9e8de92c2ea8472c3acfdbf5f58" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."gold_transaction_type_enum" AS ENUM('world', 'pe_15', 'pe_16')
        `);
        await queryRunner.query(`
            CREATE TABLE "gold_transaction" (
                "id" SERIAL NOT NULL,
                "type" "public"."gold_transaction_type_enum" NOT NULL,
                "date" date NOT NULL,
                "time" character varying(10) NOT NULL,
                "unit" character varying(10) NOT NULL DEFAULT '1',
                CONSTRAINT "PK_e714b3e97ace33441e597ccabb2" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_04dbd660dd879219a7397c4b72" ON "gold_transaction" ("type")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_5b6e9670c4c598565e3d9f336b" ON "gold_transaction" ("date")
        `);
        await queryRunner.query(`
            ALTER TABLE "gold_price"
            ADD CONSTRAINT "FK_b48ad90537ba0a2b99f81681f74" FOREIGN KEY ("goldId") REFERENCES "gold"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "gold_price"
            ADD CONSTRAINT "FK_594dd358aa9db6852bfdbeaab86" FOREIGN KEY ("transactionId") REFERENCES "gold_transaction"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "gold_price" DROP CONSTRAINT "FK_594dd358aa9db6852bfdbeaab86"
        `);
        await queryRunner.query(`
            ALTER TABLE "gold_price" DROP CONSTRAINT "FK_b48ad90537ba0a2b99f81681f74"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_5b6e9670c4c598565e3d9f336b"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_04dbd660dd879219a7397c4b72"
        `);
        await queryRunner.query(`
            DROP TABLE "gold_transaction"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."gold_transaction_type_enum"
        `);
        await queryRunner.query(`
            DROP TABLE "gold_price"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."gold_price_sign_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_d4ee2f433aed864b926ea59012"
        `);
        await queryRunner.query(`
            DROP TABLE "gold"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."gold_type_enum"
        `);
    }

}
