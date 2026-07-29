import type { Article, ArticleFormValues } from "./article.schema";
import { parseTags, stringifyTags } from "@/shared/lib/tags";

export function articleToForm(article: Article): ArticleFormValues {
  return {
    title: article.title,
    slug: article.slug,
    author: article.author,
    excerpt: article.excerpt,
    content: article.content,
    tagsText: stringifyTags(article.tags),
    status: article.status,
    seoTitle: article.seoTitle,
    seoDescription: article.seoDescription
  };
}

export function formToArticleData(values: ArticleFormValues) {
  return {
    title: values.title,
    slug: values.slug,
    author: values.author,
    excerpt: values.excerpt,
    content: values.content,
    tags: parseTags(values.tagsText),
    status: values.status,
    seoTitle: values.seoTitle || values.title,
    seoDescription: values.seoDescription || values.excerpt
  };
}
