import { Migration } from '@mikro-orm/migrations';

export class Migration20250730163025 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "categories" ("id" serial primary key, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, "name" varchar(100) not null, "description" text not null, "sort_order" int not null default 0);`);
    this.addSql(`comment on column "categories"."name" is '分类名称';`);
    this.addSql(`comment on column "categories"."description" is '分类描述';`);
    this.addSql(`comment on column "categories"."sort_order" is '排序';`);
    this.addSql(`create index "categories_name_index" on "categories" ("name");`);
    this.addSql(`create index "categories_sort_order_index" on "categories" ("sort_order");`);

    this.addSql(`create table "tags" ("id" serial primary key, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, "name" varchar(50) not null, "usage_count" int not null default 0);`);
    this.addSql(`comment on column "tags"."name" is '标签名称';`);
    this.addSql(`comment on column "tags"."usage_count" is '使用次数';`);
    this.addSql(`create index "tags_name_index" on "tags" ("name");`);
    this.addSql(`alter table "tags" add constraint "tags_name_unique" unique ("name");`);

    this.addSql(`create table "users" ("id" serial primary key, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, "username" varchar(50) not null, "email" varchar(100) not null, "phone" varchar(20) null, "password_hash" varchar(100) not null, "nickname" varchar(100) null, "avatar" varchar(255) null, "is_active" boolean not null default true, "last_login_at" timestamptz null, "last_login_ip" varchar(255) null);`);
    this.addSql(`create index "users_username_index" on "users" ("username");`);
    this.addSql(`alter table "users" add constraint "users_username_unique" unique ("username");`);
    this.addSql(`create index "users_email_index" on "users" ("email");`);
    this.addSql(`alter table "users" add constraint "users_email_unique" unique ("email");`);
    this.addSql(`create index "users_phone_index" on "users" ("phone");`);
    this.addSql(`alter table "users" add constraint "users_phone_unique" unique ("phone");`);
    this.addSql(`create index "users_is_active_index" on "users" ("is_active");`);

    this.addSql(`create table "articles" ("id" serial primary key, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, "title" varchar(200) not null, "content" text not null, "summary" text not null, "status" text check ("status" in ('draft', 'published', 'archived')) not null default 'draft', "published_at" timestamptz null, "author_id" int null, "category_id" int null);`);
    this.addSql(`comment on column "articles"."title" is '文章标题';`);
    this.addSql(`comment on column "articles"."content" is '文章内容';`);
    this.addSql(`comment on column "articles"."summary" is '文章摘要';`);
    this.addSql(`comment on column "articles"."published_at" is '发布时间';`);
    this.addSql(`create index "articles_title_index" on "articles" ("title");`);
    this.addSql(`create index "articles_status_index" on "articles" ("status");`);
    this.addSql(`create index "articles_published_at_index" on "articles" ("published_at");`);

    this.addSql(`create table "articles_tags" ("article_entity_id" int not null, "tag_entity_id" int not null, constraint "articles_tags_pkey" primary key ("article_entity_id", "tag_entity_id"));`);

    this.addSql(`alter table "articles" add constraint "articles_author_id_foreign" foreign key ("author_id") references "users" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "articles" add constraint "articles_category_id_foreign" foreign key ("category_id") references "categories" ("id") on update cascade on delete set null;`);

    this.addSql(`alter table "articles_tags" add constraint "articles_tags_article_entity_id_foreign" foreign key ("article_entity_id") references "articles" ("id") on update cascade on delete cascade;`);
    this.addSql(`alter table "articles_tags" add constraint "articles_tags_tag_entity_id_foreign" foreign key ("tag_entity_id") references "tags" ("id") on update cascade on delete cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "articles" drop constraint "articles_category_id_foreign";`);

    this.addSql(`alter table "articles_tags" drop constraint "articles_tags_tag_entity_id_foreign";`);

    this.addSql(`alter table "articles" drop constraint "articles_author_id_foreign";`);

    this.addSql(`alter table "articles_tags" drop constraint "articles_tags_article_entity_id_foreign";`);

    this.addSql(`drop table if exists "categories" cascade;`);

    this.addSql(`drop table if exists "tags" cascade;`);

    this.addSql(`drop table if exists "users" cascade;`);

    this.addSql(`drop table if exists "articles" cascade;`);

    this.addSql(`drop table if exists "articles_tags" cascade;`);
  }

}
