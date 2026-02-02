import { MigrationInterface, QueryRunner } from "typeorm";

export class AddWeightUnitToShop1769996722205 implements MigrationInterface {
    name = 'AddWeightUnitToShop1769996722205'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "shops" ADD "weightUnit" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "shops" DROP COLUMN "weightUnit"`);
    }

}
