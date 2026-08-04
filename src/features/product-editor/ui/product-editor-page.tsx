"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Save } from "lucide-react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { productDetailQuery, productKeys } from "@/shared/api/product.queries";
import { productRepository } from "@/shared/api/product.repository";
import {
  productFormSchema,
  type ProductFormValues,
} from "@/shared/api/product.schema";
import { slugify } from "@/shared/lib/slugify";
import { PageHeader } from "@/shared/ui/page-header";

const emptyValues: ProductFormValues = {
  name: "",
  slug: "",
  description: "",
  category: "旅遊小物",
  imageUrl: "",
  minPrice: 0,
  maxPrice: 0,
  status: "draft",
  featured: false,
};
export function ProductEditorPage({ productId }: { productId?: string }) {
  const isEditing = Boolean(productId);
  const router = useRouter();
  const queryClient = useQueryClient();
  const slugTouched = useRef(isEditing);
  const { data: product, isLoading } = useQuery({
    ...productDetailQuery(productId ?? ""),
    enabled: isEditing,
  });
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: emptyValues,
  });
  useEffect(() => {
    if (product)
      form.reset({
        name: product.name,
        slug: product.slug,
        description: product.description,
        category: product.category,
        imageUrl: product.imageUrl,
        minPrice: product.minPrice,
        maxPrice: product.maxPrice,
        status: product.status,
        featured: product.featured,
      });
  }, [product, form]);
  useEffect(() => {
    if (isEditing && !isLoading && product === null) notFound();
  }, [isEditing, isLoading, product]);
  const mutation = useMutation({
    mutationFn: (values: ProductFormValues) =>
      isEditing && productId
        ? productRepository.update(productId, values)
        : productRepository.create(values),
    onSuccess: async (saved) => {
      await queryClient.invalidateQueries({ queryKey: productKeys.all });
      router.replace(`/admin/products/${saved.id}/edit`);
      form.reset({
        name: saved.name,
        slug: saved.slug,
        description: saved.description,
        category: saved.category,
        imageUrl: saved.imageUrl,
        minPrice: saved.minPrice,
        maxPrice: saved.maxPrice,
        status: saved.status,
        featured: saved.featured,
      });
    },
  });
  if (isEditing && isLoading)
    return (
      <section>
        <PageHeader title="編輯商品" description="載入中…" />
      </section>
    );
  const imageUrl = form.watch("imageUrl");
  return (
    <section>
      <PageHeader
        title={isEditing ? "編輯商品" : "新增商品"}
        description="已發布的商品會自動顯示在前台旅遊小物頁面。"
        actions={
          <>
            <Link className="button" href="/admin/products">
              返回列表
            </Link>
            <Link className="button" target="_blank" href="/travel-items">
              <ExternalLink size={16} />
              前台頁面
            </Link>
          </>
        }
      />
      <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
        <div className="editor-grid">
          <div className="card form-card">
            <Field label="商品名稱" error={form.formState.errors.name?.message}>
              <input
                {...form.register("name", {
                  onChange: (e) => {
                    if (!slugTouched.current)
                      form.setValue("slug", slugify(e.target.value), {
                        shouldValidate: true,
                      });
                  },
                })}
                placeholder="例如：折疊迷你小圓扇"
              />
            </Field>
            <Field
              label="公開網址代稱"
              hint="僅供未來商品詳情頁使用"
              error={form.formState.errors.slug?.message}
            >
              <input
                {...form.register("slug", {
                  onChange: () => {
                    slugTouched.current = true;
                  },
                })}
                placeholder="foldable-mini-fan"
              />
            </Field>
            <Field
              label="商品圖片網址"
              error={form.formState.errors.imageUrl?.message}
            >
              <input {...form.register("imageUrl")} placeholder="https://..." />
            </Field>
            <Field
              label="商品說明"
              hint={`${form.watch("description").length}/300`}
              error={form.formState.errors.description?.message}
            >
              <textarea rows={4} {...form.register("description")} />
            </Field>
            <div className="two-columns">
              <Field label="商品分類">
                <select {...form.register("category")}>
                  <option>旅遊小物</option>
                  <option>生活小物</option>
                  <option>收納用品</option>
                  <option>其他</option>
                </select>
              </Field>
              <Field label="狀態">
                <select {...form.register("status")}>
                  <option value="draft">草稿</option>
                  <option value="published">發布</option>
                </select>
              </Field>
            </div>
            <div className="two-columns">
              <Field
                label="最低價格"
                error={form.formState.errors.minPrice?.message}
              >
                <input type="number" min="0" {...form.register("minPrice")} />
              </Field>
              <Field
                label="最高價格"
                error={form.formState.errors.maxPrice?.message}
              >
                <input type="number" min="0" {...form.register("maxPrice")} />
              </Field>
            </div>
            <label className="checkbox-field">
              <input type="checkbox" {...form.register("featured")} />
              <span>
                <b>熱門優先</b>
                <small>在前台排序時優先顯示</small>
              </span>
            </label>
            {mutation.error && (
              <div className="alert error">{mutation.error.message}</div>
            )}
            {mutation.isSuccess && !form.formState.isDirty && (
              <div className="alert success">商品已儲存。</div>
            )}
            <div className="form-actions">
              <span>
                {form.formState.isDirty ? "有尚未儲存的變更" : "內容已同步"}
              </span>
              <button
                className="button primary"
                disabled={mutation.isPending}
                type="submit"
              >
                <Save size={16} />
                {mutation.isPending ? "儲存中…" : "儲存商品"}
              </button>
            </div>
          </div>
          <aside className="card preview-card product-admin-preview">
            <div className="preview-label">PRODUCT PREVIEW</div>
            {imageUrl ? (
              <img src={imageUrl} alt="商品預覽" />
            ) : (
              <div className="product-image-placeholder">
                請輸入商品圖片網址
              </div>
            )}
            <span className="product-category-chip">
              {form.watch("category")}
            </span>
            <h1>{form.watch("name") || "未命名商品"}</h1>
            <p>{form.watch("description") || "商品說明會顯示在這裡。"}</p>
            <strong className="product-price">
              NT${form.watch("minPrice")} ～ NT${form.watch("maxPrice")}
            </strong>
          </aside>
        </div>
      </form>
    </section>
  );
}
function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span className="field-heading">
        <b>{label}</b>
        {hint && <small>{hint}</small>}
      </span>
      {children}
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}
