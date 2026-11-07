import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: "postgres",
        url: config.getOrThrow<string>("DATABASE_URL"),
        autoLoadEntities: true,
        // The entities are the schema: TypeORM brings the database in line at boot.
        synchronize: true,
        // gen_random_uuid() is built into Postgres 13+, so no extension is needed.
        uuidExtension: "pgcrypto",
        installExtensions: false,
      }),
    }),
  ],
})
export class DbModule {}
