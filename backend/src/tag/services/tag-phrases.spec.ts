import { STYLE_TAGS } from "../../common/types/style-tag";
import { TAG_PHRASES } from "./tag-phrases";

describe("TAG_PHRASES", () => {
  it("has at least one non-empty phrase for every tag", () => {
    for (const id of STYLE_TAGS) {
      expect(TAG_PHRASES[id].length).toBeGreaterThan(0);
      expect(TAG_PHRASES[id].every((p) => p.trim() === p && p)).toBe(true);
    }
  });
});
