import { MigrationInterface, QueryRunner, TableColumn, TableColumnOptions } from 'typeorm';
import { LinkTableName } from '../../repositories/projectRepository';
import { DefaultLinkOrigin, LinkStatus } from '../../../structs';

export class AddLinkStatus1715305810421 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(LinkTableName, new TableColumn({
      name: 'origin',
      type: 'TEXT',
      default: `'${DefaultLinkOrigin}'`
    } as TableColumnOptions));
    await queryRunner.addColumn(LinkTableName, new TableColumn({
      name: 'status',
      type: 'TEXT',
      default: `'${LinkStatus.CREATED}'`
    }));
    await queryRunner.query(`UPDATE ${LinkTableName} SET origin = '${DefaultLinkOrigin}' WHERE ${LinkTableName}.origin IS NULL`);
    await queryRunner.query(`UPDATE ${LinkTableName} SET status = '${LinkStatus.CREATED}' WHERE ${LinkTableName}.status IS NULL`);
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns(LinkTableName, ['origin', 'status']);
  }
}
