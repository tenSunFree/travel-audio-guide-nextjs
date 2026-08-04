import { queryOptions } from "@tanstack/react-query";
import { productRepository } from "./product.repository";

export const productKeys = {
  all: ["products"] as const,
  adminList: () => [...productKeys.all, "admin"] as const,
  publishedList: () => [...productKeys.all, "published"] as const,
  detail: (id: string) => [...productKeys.all, "detail", id] as const,
};
export const productListQuery = () =>
  queryOptions({
    queryKey: productKeys.adminList(),
    queryFn: () => productRepository.list(),
  });
export const publishedProductListQuery = () =>
  queryOptions({
    queryKey: productKeys.publishedList(),
    queryFn: () => productRepository.listPublished(),
  });
export const productDetailQuery = (id: string) =>
  queryOptions({
    queryKey: productKeys.detail(id),
    queryFn: () => productRepository.getById(id),
  });
