import { articleToForm, formToArticleData } from "./article.mapper";
import type { Article, ArticleFormValues } from "./article.schema";

function makeArticle(overrides: Partial<Article> = {}): Article {
  const now = new Date().toISOString();
  return {
    id: "96784776-469d-4c9b-b70e-f760a9fe1513",
    title: "文章標題",
    slug: "article-slug",
    author: "Sun",
    excerpt: "文章摘要",
    content: "文章內容",
    tags: ["react", "nextjs"],
    status: "draft",
    seoTitle: "SEO title",
    seoDescription: "SEO description",
    createdAt: now,
    updatedAt: now,
    publishedAt: null,
    ...overrides,
  };
}

function makeFormValues(
  overrides: Partial<ArticleFormValues> = {},
): ArticleFormValues {
  return {
    title: "文章標題",
    slug: "article-slug",
    author: "Sun",
    excerpt: "文章摘要",
    content: "文章內容",
    tagsText: "react, nextjs",
    status: "draft",
    seoTitle: "",
    seoDescription: "",
    ...overrides,
  };
}

describe("articleToForm", () => {
  it("maps an article into form values", () => {
    const article = makeArticle();
    expect(articleToForm(article)).toEqual({
      title: article.title,
      slug: article.slug,
      author: article.author,
      excerpt: article.excerpt,
      content: article.content,
      tagsText: "react, nextjs",
      status: article.status,
      seoTitle: article.seoTitle,
      seoDescription: article.seoDescription,
    });
  });
  it("maps empty tags into an empty string", () => {
    expect(articleToForm(makeArticle({ tags: [] })).tagsText).toBe("");
  });
});

describe("formToArticleData", () => {
  it("converts comma-separated tags into unique trimmed tags", () => {
    const result = formToArticleData(
      makeFormValues({
        tagsText: " react, nextjs, react, , typescript ",
      }),
    );
    expect(result.tags).toEqual(["react", "nextjs", "typescript"]);
  });

  it("uses title as seoTitle when seoTitle is empty", () => {
    const result = formToArticleData(
      makeFormValues({
        title: "文章標題",
        seoTitle: "",
      }),
    );
    expect(result.seoTitle).toBe("文章標題");
  });

  it("preserves custom seoTitle", () => {
    const result = formToArticleData(
      makeFormValues({
        seoTitle: "自訂 SEO",
      }),
    );
    expect(result.seoTitle).toBe("自訂 SEO");
  });

  it("uses excerpt as seoDescription when seoDescription is empty", () => {
    const result = formToArticleData(
      makeFormValues({
        excerpt: "摘要內容",
        seoDescription: "",
      }),
    );
    expect(result.seoDescription).toBe("摘要內容");
  });

  it("preserves custom seoDescription", () => {
    const result = formToArticleData(
      makeFormValues({
        seoDescription: "自訂 SEO 描述",
      }),
    );
    expect(result.seoDescription).toBe("自訂 SEO 描述");
  });

  it("round-trips tags correctly", () => {
    const article = makeArticle({
      tags: ["react", "nextjs", "typescript"],
    });
    const form = articleToForm(article);
    const data = formToArticleData(form);
    expect(data.tags).toEqual(["react", "nextjs", "typescript"]);
  });
});
