import type {
  PlaceRepository,
  PlaceRow,
} from "../repositories/place.repository";
import { PlaceService } from "./place.service";
import type { CandidateQuery } from "./types";

const QUERY: CandidateQuery = {
  south: 51,
  west: 16.9,
  north: 51.2,
  east: 17.1,
  tags: ["museum"],
  minPercent: 50,
  limit: 10,
};

const MUSEUM: PlaceRow = {
  id: "p1",
  name: "Muzeum Narodowe",
  latitude: 51.11,
  longitude: 17.047,
  description: "Sztuka",
  mainImageUrl: "https://img/p1.jpg",
  significance: 0,
  tags: { museum: 90 },
};

function setup(found: PlaceRow[] = [MUSEUM]) {
  const findByName = jest.fn().mockResolvedValue(found);
  const findInBoxWithTags = jest.fn().mockResolvedValue(found);
  const service = new PlaceService({
    findByName,
    findInBoxWithTags,
  } as unknown as PlaceRepository);
  return { service, findByName, findInBoxWithTags };
}

describe("PlaceService.search", () => {
  it("looks up the trimmed text with the requested limit", async () => {
    const { service, findByName } = setup([]);
    await service.search("  muzeum ", 5);
    expect(findByName).toHaveBeenCalledWith("muzeum", 5);
  });

  it("describes each match as a stop", async () => {
    const { service } = setup([{ ...MUSEUM, description: null }]);
    expect(await service.search("muzeum")).toEqual([
      {
        id: "p1",
        name: "Muzeum Narodowe",
        description: "",
        lat: 51.11,
        lng: 17.047,
        imageUrl: "https://img/p1.jpg",
      },
    ]);
  });

  it("returns an empty list when nothing matches", async () => {
    expect(await setup([]).service.search("zzz")).toEqual([]);
  });
});

describe("PlaceService.findCandidates", () => {
  it("passes the query through and maps each row to a candidate", async () => {
    const { service, findInBoxWithTags } = setup();
    expect(await service.findCandidates(QUERY)).toEqual([
      {
        id: "p1",
        name: "Muzeum Narodowe",
        latitude: 51.11,
        longitude: 17.047,
        description: "Sztuka",
        mainImageUrl: "https://img/p1.jpg",
        significance: 0,
        tags: { museum: 90 },
      },
    ]);
    expect(findInBoxWithTags).toHaveBeenCalledWith(QUERY);
  });
});
