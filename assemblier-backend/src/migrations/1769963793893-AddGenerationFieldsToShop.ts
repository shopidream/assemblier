import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGenerationFieldsToShop1769963793893 implements MigrationInterface {
    name = 'AddGenerationFieldsToShop1769963793893'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "shops" ADD "adminToken" text`);
        await queryRunner.query(`CREATE TYPE "public"."shops_generationstep_enum" AS ENUM('GENERATING', 'COMPLETED', 'FAILED')`);
        await queryRunner.query(`ALTER TABLE "shops" ADD "generationStep" "public"."shops_generationstep_enum" NOT NULL DEFAULT 'GENERATING'`);
        await queryRunner.query(`ALTER TABLE "shops" ADD "generationProgress" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "shops" ADD "generationError" text`);
        await queryRunner.query(`ALTER TABLE "shops" ADD "currentStep" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "shops" DROP COLUMN "currentStep"`);
        await queryRunner.query(`ALTER TABLE "shops" DROP COLUMN "generationError"`);
        await queryRunner.query(`ALTER TABLE "shops" DROP COLUMN "generationProgress"`);
        await queryRunner.query(`ALTER TABLE "shops" DROP COLUMN "generationStep"`);
        await queryRunner.query(`DROP TYPE "public"."shops_generationstep_enum"`);
        await queryRunner.query(`ALTER TABLE "shops" DROP COLUMN "adminToken"`);
    }

}
