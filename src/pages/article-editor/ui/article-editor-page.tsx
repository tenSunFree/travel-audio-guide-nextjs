import { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ExternalLink, Eye, Save } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Link, useLoaderData, useNavigate, useParams } from "react-router-dom";
import { articleFormSchema, type Article, type ArticleFormValues } from "@/shared/api/article.schema";
import { articleRepository } from "@/shared/api/article.repository";
import { articleToForm } from "@/shared/api/article.mapper";
import { articleKeys } from "@/shared/api/article.queries";
import { renderMarkdown } from "@/shared/lib/markdown";
import { slugify } from "@/shared/lib/slugify";
import { PageHeader } from "@/shared/ui/page-header";

const emptyValues: ArticleFormValues = {
  title: "", slug: "", author: "Sun", excerpt: "",
  content: "# 新文章\n\n請在這裡輸入 Markdown 內容。",
  tagsText: "", status: "draft", seoTitle: "", seoDescription: ""
};

export function ArticleEditorPage() {
  const article = useLoaderData() as Article | null;
  const { articleId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = Boolean(articleId);
  const slugTouched = useRef(Boolean(article));
  const [activePanel, setActivePanel] = useState<"content" | "seo">("content");

  const form = useForm<ArticleFormValues>({ resolver: zodResolver(articleFormSchema), defaultValues: article ? articleToForm(article) : emptyValues });
  useEffect(() => { if (article) form.reset(articleToForm(article)); }, [article, form]);

  const saveMutation = useMutation({
    mutationFn: (values: ArticleFormValues) => isEditing && articleId ? articleRepository.update(articleId, values) : articleRepository.create(values),
    onSuccess: async (saved) => {
      await queryClient.invalidateQueries({ queryKey: articleKeys.all });
      queryClient.setQueryData(articleKeys.detail(saved.id), saved);
      navigate(`/admin/articles/${saved.id}/edit`, { replace: true });
      form.reset(articleToForm(saved));
    }
  });

  const content = form.watch("content");
  const status = form.watch("status");
  const slug = form.watch("slug");

  return <section>
    <PageHeader title={isEditing ? "編輯文章" : "新增文章"} description="儲存後即可透過公開路由產生文章網頁。" actions={<>
      {articleId && <Link className="button" to={`/admin/articles/${articleId}/preview`}><Eye size={16}/>預覽</Link>}
      {articleId && status === "published" && <Link className="button" target="_blank" to={`/articles/${slug}`}><ExternalLink size={16}/>公開頁</Link>}
      <Link className="button" to="/admin/articles">返回列表</Link>
    </>}/>

    <form onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}>
      <div className="editor-grid">
        <div className="card form-card">
          <div className="tab-row"><button type="button" className={activePanel === "content" ? "active" : ""} onClick={() => setActivePanel("content")}>文章內容</button><button type="button" className={activePanel === "seo" ? "active" : ""} onClick={() => setActivePanel("seo")}>SEO 設定</button></div>
          {activePanel === "content" ? <>
            <Field label="文章標題" error={form.formState.errors.title?.message}><input {...form.register("title", { onChange: (event) => { if (!slugTouched.current) form.setValue("slug", slugify(event.target.value), { shouldValidate: true }); } })} placeholder="例如：台北咖啡廳指南"/></Field>
            <Field label="公開網址" hint={`/articles/${slug || "your-article-slug"}`} error={form.formState.errors.slug?.message}><input {...form.register("slug", { onChange: () => { slugTouched.current = true; } })} placeholder="taipei-cafe-guide"/></Field>
            <div className="two-columns"><Field label="作者" error={form.formState.errors.author?.message}><input {...form.register("author")}/></Field><Field label="狀態"><select {...form.register("status")}><option value="draft">草稿</option><option value="published">發布</option></select></Field></div>
            <Field label="標籤" hint="使用逗號分隔" error={form.formState.errors.tagsText?.message}><input {...form.register("tagsText")} placeholder="react, cms, architecture"/></Field>
            <Field label="摘要" hint={`${form.watch("excerpt").length}/200`} error={form.formState.errors.excerpt?.message}><textarea rows={3} {...form.register("excerpt")}/></Field>
            <Field label="文章內容（Markdown）" error={form.formState.errors.content?.message}><textarea className="content-editor" rows={22} {...form.register("content")}/></Field>
          </> : <>
            <Field label="SEO 標題" hint={`${form.watch("seoTitle").length}/70；留空則使用文章標題`} error={form.formState.errors.seoTitle?.message}><input {...form.register("seoTitle")}/></Field>
            <Field label="SEO 描述" hint={`${form.watch("seoDescription").length}/160；留空則使用摘要`} error={form.formState.errors.seoDescription?.message}><textarea rows={4} {...form.register("seoDescription")}/></Field>
            <div className="seo-preview"><small>搜尋結果預覽</small><h3>{form.watch("seoTitle") || form.watch("title") || "文章標題"}</h3><span>example.com/articles/{slug || "article-slug"}</span><p>{form.watch("seoDescription") || form.watch("excerpt") || "文章說明會顯示在這裡。"}</p></div>
          </>}
          {saveMutation.error && <div className="alert error">{saveMutation.error.message}</div>}
          {saveMutation.isSuccess && !form.formState.isDirty && <div className="alert success">文章已儲存。</div>}
          <div className="form-actions"><span>{form.formState.isDirty ? "有尚未儲存的變更" : "內容已同步"}</span><button className="button primary" disabled={saveMutation.isPending} type="submit"><Save size={16}/>{saveMutation.isPending ? "儲存中…" : "儲存文章"}</button></div>
        </div>
        <aside className="card preview-card"><div className="preview-label">LIVE PREVIEW</div><h1>{form.watch("title") || "未命名文章"}</h1>{form.watch("excerpt") && <p className="lead">{form.watch("excerpt")}</p>}<div className="article-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}/></aside>
      </div>
    </form>
  </section>;
}

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return <label className="field"><span className="field-heading"><b>{label}</b>{hint && <small>{hint}</small>}</span>{children}{error && <span className="field-error">{error}</span>}</label>;
}
