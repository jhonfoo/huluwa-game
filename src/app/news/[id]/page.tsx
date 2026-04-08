"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface NewsDetail {
  id: string;
  title: string;
  content: string;
  views: number;
  createdAt: string;
}

export default function NewsDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [news, setNews] = useState<NewsDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/news/${id}`)
      .then((r) => r.json())
      .then((d) => setNews(d.news || d))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading)
    return <div className="p-6 text-center text-gray-400">加载中...</div>;

  if (!news)
    return <div className="p-6 text-center text-gray-400">资讯不存在</div>;

  return (
    <div className="min-h-screen bg-white">
      <div className="flex items-center p-4 border-b border-gray-100">
        <button onClick={() => router.back()} className="text-sm text-gray-500">
          ← 返回
        </button>
      </div>

      <article className="p-4">
        <h1 className="text-lg font-bold">{news.title}</h1>
        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
          <span>浏览 {news.views}</span>
          <span>{new Date(news.createdAt).toLocaleDateString("zh-CN")}</span>
        </div>
        <div
          className="mt-4 text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: news.content }}
        />
      </article>
    </div>
  );
}
