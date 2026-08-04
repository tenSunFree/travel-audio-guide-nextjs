import { queryOptions } from "@tanstack/react-query";
import { articleRepository } from "./article.repository";

export const articleKeys = {
  all: ["articles"] as const,
  lists: () => [...articleKeys.all, "list"] as const,
  adminList: () => [...articleKeys.lists(), "admin"] as const,
  publishedList: () => [...articleKeys.lists(), "published"] as const,
  details: () => [...articleKeys.all, "detail"] as const,
  detail: (id: string) => [...articleKeys.details(), id] as const,
  slug: (slug: string) => [...articleKeys.all, "slug", slug] as const,
};

export const articleListQuery = () =>
  queryOptions({
    queryKey: articleKeys.adminList(),
    queryFn: () => articleRepository.list(),
  });
export const publishedArticleListQuery = () =>
  queryOptions({
    queryKey: articleKeys.publishedList(),
    queryFn: () => articleRepository.listPublished(),
  });
export const articleDetailQuery = (id: string) =>
  queryOptions({
    queryKey: articleKeys.detail(id),
    queryFn: () => articleRepository.getById(id),
  });
export const articleBySlugQuery = (slug: string) =>
  queryOptions({
    queryKey: articleKeys.slug(slug),
    queryFn: () => articleRepository.getPublishedBySlug(slug),
  });
