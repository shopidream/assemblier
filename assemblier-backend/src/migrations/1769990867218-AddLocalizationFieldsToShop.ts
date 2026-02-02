import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLocalizationFieldsToShop1769990867218 implements MigrationInterface {
    name = 'AddLocalizationFieldsToShop1769990867218'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "shops" ADD "language" character varying`);
        await queryRunner.query(`ALTER TABLE "shops" ADD "currency" character varying`);
        await queryRunner.query(`ALTER TABLE "shops" ADD "targetMarket" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "shops" DROP COLUMN "targetMarket"`);
        await queryRunner.query(`ALTER TABLE "shops" DROP COLUMN "currency"`);
        await queryRunner.query(`ALTER TABLE "shops" DROP COLUMN "language"`);
    }

}
