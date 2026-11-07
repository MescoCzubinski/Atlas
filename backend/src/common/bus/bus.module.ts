import { Global, Module } from "@nestjs/common";
import { Bus } from "./bus";

@Global()
@Module({ providers: [Bus], exports: [Bus] })
export class BusModule {}
