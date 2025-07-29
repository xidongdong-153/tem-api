import { Migration } from '@mikro-orm/migrations';

export class Migration20250728163706_AddDeletedAtIndexes extends Migration {

  override async up(): Promise<void> {
    // 为 deleted_at 字段创建索引，优化软删除查询性能
    this.addSql(`create index "categories_deleted_at_index" on "categories" ("deleted_at");`);
    this.addSql(`create index "tags_deleted_at_index" on "tags" ("deleted_at");`);
    this.addSql(`create index "users_deleted_at_index" on "users" ("deleted_at");`);
    this.addSql(`create index "articles_deleted_at_index" on "articles" ("deleted_at");`);

    // 删除原有的唯一约束，因为软删除后需要允许同名记录
    this.addSql(`alter table "categories" drop constraint "categories_name_unique";`);
    this.addSql(`alter table "tags" drop constraint "tags_name_unique";`);
    this.addSql(`alter table "users" drop constraint "users_username_unique";`);
    this.addSql(`alter table "users" drop constraint "users_email_unique";`);
    this.addSql(`alter table "users" drop constraint "users_phone_unique";`);

    // 创建部分唯一索引，只对未删除的记录（deleted_at IS NULL）应用唯一约束
    this.addSql(`create unique index "categories_name_unique_not_deleted" on "categories" ("name") where "deleted_at" is null;`);
    this.addSql(`create unique index "tags_name_unique_not_deleted" on "tags" ("name") where "deleted_at" is null;`);
    this.addSql(`create unique index "users_username_unique_not_deleted" on "users" ("username") where "deleted_at" is null;`);
    this.addSql(`create unique index "users_email_unique_not_deleted" on "users" ("email") where "deleted_at" is null;`);
    this.addSql(`create unique index "users_phone_unique_not_deleted" on "users" ("phone") where "deleted_at" is null and "phone" is not null;`);
  }

  override async down(): Promise<void> {
    // 删除部分唯一索引
    this.addSql(`drop index "categories_name_unique_not_deleted";`);
    this.addSql(`drop index "tags_name_unique_not_deleted";`);
    this.addSql(`drop index "users_username_unique_not_deleted";`);
    this.addSql(`drop index "users_email_unique_not_deleted";`);
    this.addSql(`drop index "users_phone_unique_not_deleted";`);

    // 恢复原有的唯一约束
    this.addSql(`alter table "categories" add constraint "categories_name_unique" unique ("name");`);
    this.addSql(`alter table "tags" add constraint "tags_name_unique" unique ("name");`);
    this.addSql(`alter table "users" add constraint "users_username_unique" unique ("username");`);
    this.addSql(`alter table "users" add constraint "users_email_unique" unique ("email");`);
    this.addSql(`alter table "users" add constraint "users_phone_unique" unique ("phone");`);

    // 删除 deleted_at 索引
    this.addSql(`drop index "categories_deleted_at_index";`);
    this.addSql(`drop index "tags_deleted_at_index";`);
    this.addSql(`drop index "users_deleted_at_index";`);
    this.addSql(`drop index "articles_deleted_at_index";`);
  }

}
