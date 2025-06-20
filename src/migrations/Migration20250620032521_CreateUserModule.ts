import { Migration } from '@mikro-orm/migrations';

export class Migration20250620032521_CreateUserModule extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table \`users\` (\`id\` int unsigned not null auto_increment primary key, \`created_at\` datetime not null, \`updated_at\` datetime not null, \`username\` varchar(50) not null, \`email\` varchar(100) not null, \`phone\` varchar(20) null, \`password_hash\` varchar(100) not null default 'temp_password_hash', \`nickname\` varchar(100) null, \`avatar\` varchar(255) null, \`is_active\` tinyint(1) not null default true, \`is_deleted\` tinyint(1) not null default false, \`last_login_at\` datetime null, \`last_login_ip\` varchar(255) null) default character set utf8mb4 engine = InnoDB;`);
    this.addSql(`alter table \`users\` add unique \`users_username_unique\`(\`username\`);`);
    this.addSql(`alter table \`users\` add unique \`users_email_unique\`(\`email\`);`);
    this.addSql(`alter table \`users\` add unique \`users_phone_unique\`(\`phone\`);`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists \`users\`;`);
  }

}
