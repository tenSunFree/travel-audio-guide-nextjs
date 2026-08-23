"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, ImagePlus, Save } from "lucide-react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { productDetailQuery, productKeys } from "@/shared/api/product.queries";
import { productRepository } from "@/shared/api/product.repository";
import {
  productFormSchema,
  type ProductFormInput,
  type ProductFormValues,
} from "@/shared/api/product.schema";
import { imageFileToDataUrl } from "@/shared/lib/image-file-to-data-url";
import { slugify } from "@/shared/lib/slugify";
import { PageHeader } from "@/shared/ui/page-header";

const emptyValues: ProductFormInput = {
  name: "",
  slug: "",
  description: "",
  category: "旅遊小物",
  imageUrl: "",
  minPrice: "",
  maxPrice: "",
  status: "draft",
  featured: false,
};

export function ProductEditorPage({ productId }: { productId?: string }) {
  const isEditing = Boolean(productId);
  const router = useRouter();
  const queryClient = useQueryClient();
  const slugTouched = useRef(isEditing);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: product, isLoading } = useQuery({
    ...productDetailQuery(productId ?? ""),
    enabled: isEditing,
  });

  const form = useForm<ProductFormInput, unknown, ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    // Only apply server data when the form has not been modified by the user
    // (i.e. not dirty). This prevents background polling or refetch-on-focus
    // from overwriting the user's unsaved input.
    if (product && !form.formState.isDirty) {
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
    }
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
  const minPrice = form.watch("minPrice");
  const maxPrice = form.watch("maxPrice");
  const imageFieldError =
    form.formState.errors.imageUrl?.message ?? imageError ?? undefined;

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

            {/*
              This section cannot use the shared Field component because that
              component wraps children in a <label>. Here we have three
              interactive controls at once: the upload button, the hidden file
              input and the URL text input. A label will only associate with
              the first labelable element (the button), so clicking the
              "Product Image" text would incorrectly open the file picker and
              screen readers would announce the wrong control. Use a plain
              <div> and an explicit aria-label on the URL input instead.
            */}
            <div className="field">
              <span className="field-heading">
                <b>商品圖片</b>
                <small>可以直接上傳照片，或貼上圖片網址</small>
              </span>
              <div className="image-upload-row">
                <button
                  type="button"
                  className="button"
                  disabled={isProcessingImage}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImagePlus size={16} />
                  {isProcessingImage ? "處理中…" : "上傳圖片"}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (!file) return;
                    setImageError(null);
                    setIsProcessingImage(true);
                    try {
                      const dataUrl = await imageFileToDataUrl(file);
                      form.setValue("imageUrl", dataUrl, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    } catch (err) {
                      setImageError(
                        err instanceof Error ? err.message : "圖片處理失敗",
                      );
                    } finally {
                      setIsProcessingImage(false);
                    }
                  }}
                />
                <input
                  {...form.register("imageUrl", {
                    onChange: () => setImageError(null),
                  })}
                  aria-label="商品圖片網址"
                  placeholder="或貼上 https://... 圖片網址"
                />
              </div>
              {imageFieldError && (
                <span className="field-error">{imageFieldError}</span>
              )}
            </div>

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
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  placeholder="請輸入最低價格"
                  {...form.register("minPrice")}
                />
              </Field>
              <Field
                label="最高價格"
                error={form.formState.errors.maxPrice?.message}
              >
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  placeholder="請輸入最高價格"
                  {...form.register("maxPrice")}
                />
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
                請上傳圖片或輸入商品圖片網址
              </div>
            )}
            <span className="product-category-chip">
              {form.watch("category")}
            </span>
            <h1>{form.watch("name") || "未命名商品"}</h1>
            <p>{form.watch("description") || "商品說明會顯示在這裡。"}</p>
            <strong className="product-price">
              {minPrice !== "" && maxPrice !== ""
                ? `NT$${minPrice} ～ NT$${maxPrice}`
                : "價格尚未設定"}
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
