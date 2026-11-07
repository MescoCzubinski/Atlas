import { Injectable, type OnModuleInit } from "@nestjs/common";
import { Bus } from "../../common/bus/bus";
import { DirectionsService } from "../services/directions.service";

@Injectable()
export class DirectionsListener implements OnModuleInit {
  constructor(
    private readonly bus: Bus,
    private readonly directions: DirectionsService,
  ) {}

  onModuleInit(): void {
    this.bus.respond("directions.route", ({ points }) =>
      this.directions.find(points),
    );
  }
}
