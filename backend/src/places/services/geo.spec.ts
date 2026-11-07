import { walkMinutes } from "./geo";

describe("walkMinutes", () => {
  it("is zero for the same point", () => {
    expect(walkMinutes({ lat: 51.1, lng: 17 }, { lat: 51.1, lng: 17 })).toBe(0);
  });

  it("estimates a kilometre north at about 17 minutes with the detour factor", () => {
    const minutes = walkMinutes(
      { lat: 51.1, lng: 17 },
      { lat: 51.109, lng: 17 },
    );
    expect(minutes).toBeGreaterThan(17);
    expect(minutes).toBeLessThan(18);
  });

  it("is symmetric", () => {
    const a = { lat: 51.1, lng: 17 };
    const b = { lat: 51.12, lng: 17.05 };
    expect(walkMinutes(a, b)).toBeCloseTo(walkMinutes(b, a));
  });
});
