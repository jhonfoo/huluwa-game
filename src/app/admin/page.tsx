"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface Product {
  id: string;
  title: string;
  price: number;
  status: string;
  createdAt: string;
  seller?: { nickname: string };
}

interface AdminOrder {
  id: string;
  orderNo: string;
  totalPrice: number;
  status: string;
  paymentMethod: string | null;
  buyerInfo: string | null;
  createdAt: string;
  user: { nickname: string; phone: string };
  items: Array<{ product: { title: string } | null; quantity: number }>;
}

interface AdminUser {
  id: string;
  nickname: string;
  phone: string;
  active: boolean;
  createdAt: string;
}

const tabs = ["商品管理", "订单管理", "用户管理", "资讯管理", "轮播图管理", "账号管理"];

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: "待审核", color: "bg-yellow-100 text-yellow-800" },
  approved: { label: "已上架", color: "bg-green-100 text-green-800" },
  rejected: { label: "已拒绝", color: "bg-red-100 text-red-800" },
  sold: { label: "已售出", color: "bg-blue-100 text-blue-800" },
  offline: { label: "已下架", color: "bg-gray-100 text-gray-800" },
};

export default function AdminPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);

  // Products
  const [products, setProducts] = useState<Product[]>([]);
  const [prodLoading, setProdLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // News form
  const [newsTitle, setNewsTitle] = useState("");
  const [newsContent, setNewsContent] = useState("");
  const [newsMsg, setNewsMsg] = useState("");

  // Banner form
  const [bannerImage, setBannerImage] = useState("");
  const [bannerLink, setBannerLink] = useState("");
  const [bannerSort, setBannerSort] = useState(0);
  const [bannerMsg, setBannerMsg] = useState("");

  // Orders
  const [adminOrders, setAdminOrders] = useState<AdminOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Users
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userActionLoading, setUserActionLoading] = useState<string | null>(null);

  // Account management
  const [accounts, setAccounts] = useState<Array<{id:string;nickname:string;phone:string;active:boolean;createdAt:string}>>([]);
  const [accLoading, setAccLoading] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newNickname, setNewNickname] = useState("");
  const [accMsg, setAccMsg] = useState("");

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

  const fetchProducts = async () => {
    setProdLoading(true);
    try {
      const res = await fetch("/api/products?limit=100");
      const data = await res.json();
      setProducts(data.products || []);
    } finally {
      setProdLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 0 && token) fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, token]);

  const updateProductStatus = async (id: string, status: string) => {
    setActionLoading(id + status);
    try {
      await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      await fetchProducts();
    } finally {
      setActionLoading(null);
    }
  };

  const submitNews = async () => {
    if (!newsTitle.trim() || !newsContent.trim()) return;
    setNewsMsg("");
    try {
      const res = await fetch("/api/news", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: newsTitle, content: newsContent }),
      });
      if (res.ok) {
        setNewsMsg("发布成功");
        setNewsTitle("");
        setNewsContent("");
      } else {
        setNewsMsg("发布失败");
      }
    } catch {
      setNewsMsg("网络错误");
    }
  };

  const submitBanner = async () => {
    if (!bannerImage.trim()) return;
    setBannerMsg("");
    try {
      const res = await fetch("/api/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ imageUrl: bannerImage, linkUrl: bannerLink, sort: bannerSort }),
      });
      if (res.ok) {
        setBannerMsg("添加成功");
        setBannerImage("");
        setBannerLink("");
        setBannerSort(0);
      } else {
        setBannerMsg("添加失败");
      }
    } catch {
      setBannerMsg("网络错误");
    }
  };

  const fetchAdminOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await fetch("/api/admin/orders", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setAdminOrders(data.orders || []);
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchAdminUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await fetch("/api/admin/users", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setAdminUsers(data.users || []);
    } finally {
      setUsersLoading(false);
    }
  };

  const toggleUserActive = async (id: string) => {
    setUserActionLoading(id + "toggle");
    try {
      await fetch(`/api/admin/users/${id}`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` } });
      await fetchAdminUsers();
    } finally {
      setUserActionLoading(null);
    }
  };

  const deleteUser = async (id: string, nickname: string) => {
    if (!confirm(`确定删除用户「${nickname}」？此操作不可撤销。`)) return;
    setUserActionLoading(id + "delete");
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "删除失败"); return; }
      await fetchAdminUsers();
    } finally {
      setUserActionLoading(null);
    }
  };

  useEffect(() => {
    if (activeTab === 1 && token) fetchAdminOrders();
    if (activeTab === 2 && token) fetchAdminUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, token]);

  const fetchAccounts = async () => {
    setAccLoading(true);
    try {
      const res = await fetch("/api/admin/users", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setAccounts(data.users || []);
    } finally {
      setAccLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 5 && token) fetchAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, token]);

  const createAccount = async () => {
    if (!newPhone.trim() || !newPassword.trim()) return;
    setAccMsg("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ phone: newPhone, password: newPassword, nickname: newNickname }),
      });
      if (res.ok) {
        setAccMsg("创建成功");
        setNewPhone("");
        setNewPassword("");
        setNewNickname("");
        await fetchAccounts();
      } else {
        const data = await res.json();
        setAccMsg(data.error || "创建失败");
      }
    } catch {
      setAccMsg("网络错误");
    }
  };

  const toggleActive = async (id: string) => {
    try {
      await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchAccounts();
    } catch {}
  };

  if (authLoading || !user || user.role !== "admin") {
    return <div className="flex items-center justify-center min-h-screen text-gray-500">加载中...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-[#07C160]">管理后台</h1>
          <span className="text-sm text-gray-500">{user.nickname}</span>
        </div>
        <div className="max-w-6xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {tabs.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === i
                  ? "border-[#07C160] text-[#07C160]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* 商品管理 */}
        {activeTab === 0 && (
          <div>
            {prodLoading ? (
              <p className="text-gray-500 text-center py-8">加载中...</p>
            ) : products.length === 0 ? (
              <p className="text-gray-500 text-center py-8">暂无商品</p>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="text-left px-4 py-3">商品名称</th>
                      <th className="text-left px-4 py-3">价格</th>
                      <th className="text-left px-4 py-3">状态</th>
                      <th className="text-left px-4 py-3">卖家</th>
                      <th className="text-left px-4 py-3">创建时间</th>
                      <th className="text-left px-4 py-3">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {products.map((p) => {
                      const s = statusMap[p.status] || { label: p.status, color: "bg-gray-100 text-gray-800" };
                      return (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 max-w-[200px] truncate">{p.title}</td>
                          <td className="px-4 py-3 text-[#07C160] font-medium">¥{p.price}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs ${s.color}`}>{s.label}</span>
                          </td>
                          <td className="px-4 py-3 text-gray-500">{p.seller?.nickname || "-"}</td>
                          <td className="px-4 py-3 text-gray-400">{new Date(p.createdAt).toLocaleDateString()}</td>
                          <td className="px-4 py-3 flex gap-2">
                            {p.status === "pending" && (
                              <>
                                <button
                                  onClick={() => updateProductStatus(p.id, "approved")}
                                  disabled={actionLoading === p.id + "approved"}
                                  className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                                >
                                  审核通过
                                </button>
                                <button
                                  onClick={() => updateProductStatus(p.id, "rejected")}
                                  disabled={actionLoading === p.id + "rejected"}
                                  className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                                >
                                  拒绝
                                </button>
                              </>
                            )}
                            {p.status === "approved" && (
                              <button
                                onClick={() => updateProductStatus(p.id, "offline")}
                                disabled={actionLoading === p.id + "offline"}
                                className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
                              >
                                下架
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 订单管理 */}
        {activeTab === 1 && (
          <div>
            {ordersLoading ? (
              <p className="text-gray-500 text-center py-8">加载中...</p>
            ) : adminOrders.length === 0 ? (
              <p className="text-gray-500 text-center py-8">暂无订单</p>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="text-left px-4 py-3">订单号</th>
                      <th className="text-left px-4 py-3">卖家</th>
                      <th className="text-left px-4 py-3">商品</th>
                      <th className="text-left px-4 py-3">金额</th>
                      <th className="text-left px-4 py-3">付款方式</th>
                      <th className="text-left px-4 py-3">付款人</th>
                      <th className="text-left px-4 py-3">状态</th>
                      <th className="text-left px-4 py-3">时间</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {adminOrders.map((o) => {
                      const s = { pending: { label: "待确认", color: "bg-yellow-100 text-yellow-800" }, completed: { label: "已完成", color: "bg-green-100 text-green-800" }, cancelled: { label: "已取消", color: "bg-gray-100 text-gray-800" } }[o.status] || { label: o.status, color: "bg-gray-100 text-gray-800" };
                      const productTitle = o.items[0]?.product?.title || "-";
                      return (
                        <tr key={o.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-xs text-gray-400 font-mono">{o.orderNo.slice(0, 12)}...</td>
                          <td className="px-4 py-3">{o.user.nickname}<br/><span className="text-xs text-gray-400">{o.user.phone}</span></td>
                          <td className="px-4 py-3 max-w-[150px] truncate">{productTitle}</td>
                          <td className="px-4 py-3 text-[#07C160] font-medium">¥{o.totalPrice}</td>
                          <td className="px-4 py-3 text-gray-500">{o.paymentMethod || "-"}</td>
                          <td className="px-4 py-3 text-gray-500 max-w-[120px] truncate">{o.buyerInfo || "-"}</td>
                          <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs ${s.color}`}>{s.label}</span></td>
                          <td className="px-4 py-3 text-gray-400 text-xs">{new Date(o.createdAt).toLocaleDateString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 用户管理 */}
        {activeTab === 2 && (
          <div>
            {usersLoading ? (
              <p className="text-gray-500 text-center py-8">加载中...</p>
            ) : adminUsers.length === 0 ? (
              <p className="text-gray-500 text-center py-8">暂无用户</p>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="text-left px-4 py-3">昵称</th>
                      <th className="text-left px-4 py-3">账号</th>
                      <th className="text-left px-4 py-3">创建时间</th>
                      <th className="text-left px-4 py-3">状态</th>
                      <th className="text-left px-4 py-3">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {adminUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{u.nickname}</td>
                        <td className="px-4 py-3 text-gray-500">{u.phone}</td>
                        <td className="px-4 py-3 text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${u.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                            {u.active ? "启用" : "禁用"}
                          </span>
                        </td>
                        <td className="px-4 py-3 flex gap-2">
                          <button
                            onClick={() => toggleUserActive(u.id)}
                            disabled={userActionLoading === u.id + "toggle"}
                            className={`px-2 py-1 text-xs text-white rounded disabled:opacity-50 ${u.active ? "bg-yellow-500 hover:bg-yellow-600" : "bg-green-500 hover:bg-green-600"}`}
                          >
                            {u.active ? "停用" : "启用"}
                          </button>
                          <button
                            onClick={() => deleteUser(u.id, u.nickname)}
                            disabled={userActionLoading === u.id + "delete"}
                            className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                          >
                            删除
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 资讯管理 */}
        {activeTab === 3 && (
          <div className="bg-white rounded-lg shadow p-6 max-w-lg">
            <h2 className="text-lg font-bold mb-4">发布资讯</h2>
            <input
              value={newsTitle}
              onChange={(e) => setNewsTitle(e.target.value)}
              placeholder="标题"
              className="w-full border rounded px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-[#07C160]"
            />
            <textarea
              value={newsContent}
              onChange={(e) => setNewsContent(e.target.value)}
              placeholder="内容"
              rows={6}
              className="w-full border rounded px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-[#07C160]"
            />
            <button
              onClick={submitNews}
              className="bg-[#07C160] text-white px-6 py-2 rounded hover:bg-[#06AD56] transition-colors"
            >
              发布
            </button>
            {newsMsg && <p className={`mt-3 text-sm ${newsMsg === "发布成功" ? "text-green-500" : "text-red-500"}`}>{newsMsg}</p>}
          </div>
        )}

        {/* 轮播图管理 */}
        {activeTab === 4 && (
          <div className="bg-white rounded-lg shadow p-6 max-w-lg">
            <h2 className="text-lg font-bold mb-4">添加轮播图</h2>
            <input
              value={bannerImage}
              onChange={(e) => setBannerImage(e.target.value)}
              placeholder="图片 URL"
              className="w-full border rounded px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-[#07C160]"
            />
            <input
              value={bannerLink}
              onChange={(e) => setBannerLink(e.target.value)}
              placeholder="链接 URL"
              className="w-full border rounded px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-[#07C160]"
            />
            <input
              type="number"
              value={bannerSort}
              onChange={(e) => setBannerSort(Number(e.target.value))}
              placeholder="排序"
              className="w-full border rounded px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-[#07C160]"
            />
            <button
              onClick={submitBanner}
              className="bg-[#07C160] text-white px-6 py-2 rounded hover:bg-[#06AD56] transition-colors"
            >
              添加
            </button>
            {bannerMsg && <p className={`mt-3 text-sm ${bannerMsg === "添加成功" ? "text-green-500" : "text-red-500"}`}>{bannerMsg}</p>}
          </div>
        )}

        {/* 账号管理 */}
        {activeTab === 5 && (
          <div>
            <div className="bg-white rounded-lg shadow p-6 max-w-lg mb-6">
              <h2 className="text-lg font-bold mb-4">创建账号</h2>
              <input
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="手机号"
                className="w-full border rounded px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-[#07C160]"
              />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="密码"
                className="w-full border rounded px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-[#07C160]"
              />
              <input
                value={newNickname}
                onChange={(e) => setNewNickname(e.target.value)}
                placeholder="昵称（选填）"
                className="w-full border rounded px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-[#07C160]"
              />
              <button
                onClick={createAccount}
                className="bg-[#07C160] text-white px-6 py-2 rounded hover:bg-[#06AD56] transition-colors"
              >
                创建
              </button>
              {accMsg && <p className={`mt-3 text-sm ${accMsg === "创建成功" ? "text-green-500" : "text-red-500"}`}>{accMsg}</p>}
            </div>

            {accLoading ? (
              <p className="text-gray-500 text-center py-8">加载中...</p>
            ) : accounts.length === 0 ? (
              <p className="text-gray-500 text-center py-8">暂无用户</p>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="text-left px-4 py-3">昵称</th>
                      <th className="text-left px-4 py-3">手机号</th>
                      <th className="text-left px-4 py-3">创建时间</th>
                      <th className="text-left px-4 py-3">状态</th>
                      <th className="text-left px-4 py-3">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {accounts.map((a) => (
                      <tr key={a.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">{a.nickname}</td>
                        <td className="px-4 py-3">{a.phone}</td>
                        <td className="px-4 py-3 text-gray-400">{new Date(a.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${a.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                            {a.active ? "启用" : "禁用"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleActive(a.id)}
                            className={`px-2 py-1 text-xs text-white rounded ${a.active ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"}`}
                          >
                            {a.active ? "禁用" : "启用"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
