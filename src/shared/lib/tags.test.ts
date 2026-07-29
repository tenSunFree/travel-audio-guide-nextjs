import { parseTags } from "./tags";
it("trims and removes duplicated tags", () => expect(parseTags("react, cms, react, ")).toEqual(["react", "cms"]));
