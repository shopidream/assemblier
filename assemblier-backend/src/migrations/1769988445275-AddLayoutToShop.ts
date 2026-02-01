import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLayoutToShop1769988445275 implements MigrationInterface {
    name = 'AddLayoutToShop1769988445275'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "shops" ADD "layout" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "shops" DROP COLUMN "layout"`);
    }

}
