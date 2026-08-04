import { PublicArticlePage } from "@/features/public-article/ui/public-article-page";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <PublicArticlePage slug={slug} />;
}
