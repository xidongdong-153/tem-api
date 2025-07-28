import { Migration } from '@mikro-orm/migrations';

export class Migration20250728150338_AddSoftDeleteToBaseEntity extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "categories" add column "deleted_at" timestamptz null;`);

    this.addSql(`alter table "tags" add column "deleted_at" timestamptz null;`);

    this.addSql(`alter table "users" drop column "is_deleted";`);

    this.addSql(`alter table "users" add column "deleted_at" timestamptz null;`);

    this.addSql(`alter table "articles" add column "deleted_at" timestamptz null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "categories" drop column "deleted_at";`);

    this.addSql(`alter table "tags" drop column "deleted_at";`);

    this.addSql(`alter table "users" drop column "deleted_at";`);

    this.addSql(`alter table "users" add column "is_deleted" boolean not null default false;`);

    this.addSql(`alter table "articles" drop column "deleted_at";`);
  }

}
