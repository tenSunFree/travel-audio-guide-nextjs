import { queryOptions } from "@tanstack/react-query";
import { productRepository } from "./product.repository";

const PRODUCT_REFRESH_INTERVAL = 5_000;

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
    staleTime: 0,
    refetchInterval: PRODUCT_REFRESH_INTERVAL,
    refetchOnWindowFocus: true,
  });

export const publishedProductListQuery = () =>
  queryOptions({
    queryKey: productKeys.publishedList(),
    queryFn: () => productRepository.listPublished(),
    staleTime: 0,
    refetchInterval: PRODUCT_REFRESH_INTERVAL,
    refetchOnWindowFocus: true,
  });

export const productDetailQuery = (id: string) =>
  queryOptions({
    queryKey: productKeys.detail(id),
    queryFn: () => productRepository.getById(id),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
