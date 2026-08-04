import { slugify } from "./slugify";
describe("slugify", () => {
  it("normalizes English titles", () =>
    expect(slugify("  React CMS Guide  ")).toBe("react-cms-guide"));
  it("removes unsupported characters", () =>
    expect(slugify("React & CMS!!!")).toBe("react-cms"));
});
