import {
  articleFormSchema,
  articleImportResultSchema,
  articleSchema,
} from "./article.schema";

function validForm() {
  return {
    title: "測試標題",
    slug: "test-slug",
    author: "Sun",
    excerpt: "這是摘要",
    content: "這是一篇至少超過十個字的測試文章內容",
    tagsText: "react, nextjs",
    status: "draft" as const,
    seoTitle: "",
    seoDescription: "",
  };
}

function validArticle() {
  const now = new Date().toISOString();

  return {
    id: "96784776-469d-4c9b-b70e-f760a9fe1513",
    title: "文章標題",
    slug: "article-slug",
    author: "Sun",
    excerpt: "excerpt",
    content: "content",
    tags: ["react"],
    status: "draft" as const,
    seoTitle: "SEO title",
    seoDescription: "SEO description",
    createdAt: now,
    updatedAt: now,
    publishedAt: null,
  };
}

describe("articleFormSchema", () => {
  it("accepts a valid payload", () => {
    expect(articleFormSchema.safeParse(validForm()).success).toBe(true);
  });

  it.each([
    ["title", "a"],
    ["title", "a".repeat(121)],
    ["slug", "a"],
    ["author", ""],
    ["excerpt", "a".repeat(201)],
    ["content", "short"],
    ["tagsText", "a".repeat(201)],
    ["seoTitle", "a".repeat(71)],
    ["seoDescription", "a".repeat(161)],
  ])("rejects invalid %s", (field, value) => {
    const result = articleFormSchema.safeParse({
      ...validForm(),
      [field]: value,
    });

    expect(result.success).toBe(false);
  });

  it.each([
    "Has-Upper",
    "has_underscore",
    "has space",
    "trailing-",
    "-leading",
    "special!",
  ])("rejects invalid slug: %s", (slug) => {
    expect(
      articleFormSchema.safeParse({
        ...validForm(),
        slug,
      }).success,
    ).toBe(false);
  });

  it("accepts lowercase letters, numbers and hyphens in slug", () => {
    expect(
      articleFormSchema.safeParse({
        ...validForm(),
        slug: "react-19-nextjs-16",
      }).success,
    ).toBe(true);
  });

  it("rejects invalid status", () => {
    expect(
      articleFormSchema.safeParse({
        ...validForm(),
        status: "archived",
      }).success,
    ).toBe(false);
  });

  it("trims string fields", () => {
    const result = articleFormSchema.parse({
      ...validForm(),
      title: "  測試標題  ",
      slug: "  test-slug  ",
      author: "  Sun  ",
      excerpt: "  摘要  ",
    });

    expect(result.title).toBe("測試標題");
    expect(result.slug).toBe("test-slug");
    expect(result.author).toBe("Sun");
    expect(result.excerpt).toBe("摘要");
  });
});

describe("articleSchema", () => {
  it("accepts a valid article", () => {
    expect(articleSchema.safeParse(validArticle()).success).toBe(true);
  });

  it("rejects an invalid UUID", () => {
    expect(
      articleSchema.safeParse({
        ...validArticle(),
        id: "not-a-uuid",
      }).success,
    ).toBe(false);
  });

  it("rejects invalid datetime values", () => {
    expect(
      articleSchema.safeParse({
        ...validArticle(),
        createdAt: "2026-01-01",
      }).success,
    ).toBe(false);
  });

  it("accepts null publishedAt", () => {
    expect(
      articleSchema.safeParse({
        ...validArticle(),
        publishedAt: null,
      }).success,
    ).toBe(true);
  });

  it("accepts valid publishedAt", () => {
    expect(
      articleSchema.safeParse({
        ...validArticle(),
        status: "published",
        publishedAt: new Date().toISOString(),
      }).success,
    ).toBe(true);
  });

  it("rejects invalid tags", () => {
    expect(
      articleSchema.safeParse({
        ...validArticle(),
        tags: [1, 2],
      }).success,
    ).toBe(false);
  });

  it("rejects a missing required field", () => {
    const { title: _title, ...withoutTitle } = validArticle();

    expect(articleSchema.safeParse(withoutTitle).success).toBe(false);
  });
});

describe("articleImportResultSchema", () => {
  it.each([0, 1, 10])("accepts non-negative integer %s", (count) => {
    expect(articleImportResultSchema.safeParse({ count }).success).toBe(true);
  });

  it.each([-1, 1.5, "1"])("rejects invalid count %s", (count) => {
    expect(articleImportResultSchema.safeParse({ count }).success).toBe(false);
  });
});
