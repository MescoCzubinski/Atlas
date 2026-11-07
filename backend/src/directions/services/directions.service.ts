import { Injectable } from "@nestjs/common";
import type { RoutedPath } from "../../common/bus/contracts";
import { Bus } from "../../common/bus/bus";
import type { LatLng } from "./geo";
import { GraphHopperClient } from "./graphhopper.client";

@Injectable()
export class DirectionsService {
  constructor(
    private readonly bus: Bus,
    private readonly graphHopper: GraphHopperClient,
  ) {}

  async find(points: LatLng[]): Promise<RoutedPath> {
    await this.bus.request("location.ensure-inside", { points });
    return this.graphHopper.route(points);
  }
}
