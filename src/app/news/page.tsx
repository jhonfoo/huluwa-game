"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface NewsItem {
  id: string;
  title: string;
  views: number;
  createdAt: string;
}

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);

  const fetchNews = (p: number) => {
    setLoading(true);
    fetch(`/api/news?page=${p}&limit=10`)
      .then((r) => r.json())
      .then((d) => {
        const list = d.news || [];
        setNews((prev) => (p === 1 ? list : [...prev, ...list]));
        setHasMore(list.length === 10);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchNews(1);
  }, []);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchNews(next);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white p-4 text-center font-bold border-b border-gray-100">
        行业资讯
      </div>

      <div className="bg-white mt-2 divide-y divide-gray-100">
        {news.map((item) => (
          <Link
            key={item.id}
            href={`/news/${item.id}`}
            className="block p-4 active:bg-gray-50"
          >
            <p className="text-sm font-medium line-clamp-2">{item.title}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
              <span>浏览 {item.views}</span>
              <span>{new Date(item.createdAt).toLocaleDateString("zh-CN")}</span>
            </div>
          </Link>
        ))}
      </div>

      {news.length === 0 && !loading && (
        <div className="p-10 text-center text-gray-400 text-sm">暂无资讯</div>
      )}

      {loading && (
        <div className="p-6 text-center text-gray-400 text-sm">加载中...</div>
      )}

      {!loading && hasMore && news.length > 0 && (
        <div className="p-4 text-center">
          <button
            onClick={loadMore}
            className="text-sm text-[#07C160] border border-[#07C160] rounded px-6 py-2 active:bg-orange-50"
          >
            加载更多
          </button>
        </div>
      )}
    </div>
  );
}
