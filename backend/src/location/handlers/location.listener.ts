import { Injectable, type OnModuleInit } from "@nestjs/common";
import { Bus } from "../../common/bus/bus";
import { LocationService } from "../services/location.service";

@Injectable()
export class LocationListener implements OnModuleInit {
  constructor(
    private readonly bus: Bus,
    private readonly locations: LocationService,
  ) {}

  onModuleInit(): void {
    this.bus.respond("location.ensure-inside", ({ points }) =>
      this.locations.assertInsideSupported(points),
    );
  }
}
