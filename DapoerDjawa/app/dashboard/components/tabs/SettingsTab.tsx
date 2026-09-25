"use client";

import React, {
  useState,
  useEffect,
  useCallback,
} from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  Plus,
  Edit,
  Trash2,
  Image as ImageIcon,
  Ticket,
  Users,
  Loader2,
  X,
  Store,
  Save,
} from "lucide-react";

import { toast } from "sonner";

// =========================================================
// TYPES
// =========================================================

type HeroBanner = {
  id: string;
  image_url: string;
  title: string;
  link_url?: string | null;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
};

type PromoCode = {
  id: string;
  code: string;
  discount_type: "nominal" | "percentage" | string;
  discount_value: number;
  max_discount?: number | null;
  min_order_value?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  usage_limit?: number | null;
  used_count: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

type AdminUser = {
  id_user: string;
  nama_user: string;
  email: string;
  role: string;
  no_hp?: string | null;
  alamat?: string | null;
  created_at?: string;
};

type ModalItem =
  | Partial<HeroBanner>
  | Partial<PromoCode>
  | Partial<AdminUser>;

type AdminApiResult = {
  alreadyAdmin?: boolean;
  error?: string;
  message?: string;
  promoted?: boolean;
  created?: boolean;
};

// =========================================================
// CONFIRMATION TYPES
// =========================================================

type ConfirmAction =
  | "delete-banner"
  | "delete-promo"
  | "demote-admin"
  | null;

type ConfirmDialogState = {
  open: boolean;
  action: ConfirmAction;
  id: string | null;
};

// =========================================================
// COMPONENT
// =========================================================

export default function SettingsTab() {
  const [loading, setLoading] = useState(true);

  // =========================================================
  // DATA STATES
  // =========================================================

  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [productList, setProductList] = useState<{ id: string; nama_produk: string }[]>([]);

  // Store Settings (owner-only)
  const [storeForm, setStoreForm] = useState<Record<string, string>>({});
  const [isSavingStore, setIsSavingStore] = useState(false);

  // =========================================================
  // MODAL STATES
  // =========================================================

  const [activeModal, setActiveModal] = useState<
    "banner" | "promo" | "admin" | null
  >(null);
  const [editingItem, setEditingItem] = useState<ModalItem | null>(null);

  // =========================================================
  // ADMIN SAVING STATE
  // =========================================================

  const [savingAdmin, setSavingAdmin] = useState(false);

  // =========================================================
  // BANNER UPLOAD STATE
  // =========================================================

  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  // =========================================================
  // CONFIRMATION DIALOG STATE
  // =========================================================

  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    open: false,
    action: null,
    id: null,
  });

  // =========================================================
  // FORMS
  // =========================================================

  const [bannerForm, setBannerForm] = useState({
    title: "",
    image_url: "",
    link_url: "",
    sort_order: 0,
    is_active: true,
  });

  const [promoForm, setPromoForm] = useState({
    code: "",
    discount_type: "nominal",
    discount_value: 0,
    max_discount: "",
    min_order_value: "",
    start_date: new Date().toISOString().substring(0, 16),
    end_date: "",
    usage_limit: "",
    is_active: true,
  });

  const [adminForm, setAdminForm] = useState({
    name: "",
    email: "",
    role: "admin",
  });

  // =========================================================
  // FETCH DATA
  // =========================================================

  const fetchData = useCallback(async () => {
    try {
      const [resBanners, resPromos, resAdmins, resProducts] = await Promise.all([
        supabase
          .from("hero_banners")
          .select("*")
          .order("sort_order", { ascending: true }),

        supabase
          .from("promo_codes")
          .select("*")
          .order("created_at", { ascending: false }),

        supabase
          .from("users")
          .select("id_user, nama_user, email, role, no_hp, alamat, created_at")
          .eq("role", "admin")
          .order("created_at", { ascending: false }),

        supabase
          .from("produk")
          .select("id, nama_produk")
          .order("nama_produk", { ascending: true }),
      ]);

      if (resBanners.error) {
        console.error("Gagal mengambil hero banners:", resBanners.error);
      }
      if (resPromos.error) {
        console.error("Gagal mengambil promo codes:", resPromos.error);
      }
      if (resAdmins.error) {
        console.error("Gagal mengambil admin dari users:", resAdmins.error);
      }

      if (resBanners.data) setBanners(resBanners.data);
      if (resPromos.data) setPromos(resPromos.data);
      if (resAdmins.data) setAdmins(resAdmins.data);
      if (resProducts.data) setProductList(resProducts.data);

      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
        const res = await fetch(`${API_URL}/settings/store`);
        const data = await res.json();
        if (data && typeof data === "object" && !data.error) {
          setStoreForm(data);
        }
      } catch (e) {
        console.error("Gagal mengambil store settings:", e);
      }
    } catch (error) {
      console.error("Gagal mengambil data settings:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchData();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [fetchData]);

  // =========================================================
  // SAVE STORE SETTINGS (owner-only)
  // =========================================================

  const saveStoreSettings = async () => {
    setIsSavingStore(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error("Sesi login tidak ditemukan. Silakan login ulang.");
        return;
      }

      const res = await fetch(`${API_URL}/settings/store/bulk`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(storeForm),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Gagal menyimpan pengaturan toko.");
        return;
      }

      toast.success("Pengaturan toko berhasil disimpan!");
    } catch (error) {
      console.error("Error saving store settings:", error);
      toast.error("Terjadi kesalahan saat menyimpan.");
    } finally {
      setIsSavingStore(false);
    }
  };

  // =========================================================
  // OPEN/CLOSE CONFIRM DIALOG
  // =========================================================

  const openConfirmDialog = (
    action: Exclude<ConfirmAction, null>,
    id: string
  ) => {
    setConfirmDialog({ open: true, action, id });
  };

  const closeConfirmDialog = () => {
    setConfirmDialog({ open: false, action: null, id: null });
  };

  const getConfirmDialogContent = () => {
    switch (confirmDialog.action) {
      case "delete-banner":
        return {
          title: "Hapus Banner?",
          description:
            "Banner ini akan dihapus secara permanen. Gambar banner yang tersimpan di storage juga akan dihapus. Tindakan ini tidak dapat dibatalkan.",
          actionText: "Hapus Banner",
        };
      case "delete-promo":
        return {
          title: "Hapus Kode Promo?",
          description:
            "Kode promo ini akan dihapus secara permanen dan tidak dapat digunakan lagi. Tindakan ini tidak dapat dibatalkan.",
          actionText: "Hapus Promo",
        };
      case "demote-admin":
        return {
          title: "Turunkan Hak Akses Admin?",
          description:
            "Akun ini akan dikembalikan menjadi user biasa dan tidak lagi memiliki akses sebagai admin.",
          actionText: "Jadikan User",
        };
      default:
        return {
          title: "Konfirmasi Tindakan",
          description: "Apakah Anda yakin ingin melanjutkan tindakan ini?",
          actionText: "Lanjutkan",
        };
    }
  };

  // =========================================================
  // CRUD HERO BANNER
  // =========================================================

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    let finalImageUrl = bannerForm.image_url;

    try {
      setIsUploadingBanner(true);

      if (bannerFile) {
        const fileExt = bannerFile.name.split(".").pop();
        const fileName = `banner-${new Date().getTime()}.${fileExt}`;

        // Uploading ke Supabase Storage (bisa dari client karena public bucket)
        const { error: uploadError } = await supabase.storage
          .from("banners")
          .upload(fileName, bannerFile);

        if (uploadError) {
          throw new Error(`Gagal upload gambar: ${uploadError.message}`);
        }

        const { data: publicUrlData } = supabase.storage
          .from("banners")
          .getPublicUrl(fileName);

        finalImageUrl = publicUrlData.publicUrl;
      }

      const payload = {
        title: bannerForm.title,
        image_url: finalImageUrl,
        link_url: bannerForm.link_url || null,
        sort_order: Number(bannerForm.sort_order),
        is_active: bannerForm.is_active,
      };

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (editingItem && "id" in editingItem && editingItem.id) {
        // Panggil backend API
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings/banners/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error("Gagal update banner");
        toast.success("Banner berhasil diperbarui!");
      } else {
        if (!finalImageUrl) throw new Error("Gambar banner wajib diisi!");
        // Panggil backend API
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings/banners`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error("Gagal menyimpan banner");
        toast.success("Banner baru berhasil ditambahkan!");
      }

      closeModal();
      await fetchData();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat menyimpan banner."
      );
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const handleDeleteBanner = async (id: string) => {
    openConfirmDialog("delete-banner", id);
  };

  const executeDeleteBanner = async (id: string) => {
    try {
      const bannerToDelete = banners.find((b) => b.id === id);

      // Clean up storage (Client allowed for public bucket if config allows, or ignore error)
      if (bannerToDelete && bannerToDelete.image_url) {
        const fileName = bannerToDelete.image_url.split("/").pop();
        if (fileName) {
          await supabase.storage.from("banners").remove([fileName]);
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings/banners/${id}`, {
        method: 'DELETE',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      });
      if (!res.ok) throw new Error("Gagal menghapus banner dari backend");

      toast.success("Banner berhasil dihapus!");
      await fetchData();
    } catch (error) {
      console.error("Error deleting banner:", error);
      toast.error("Terjadi kesalahan saat menghapus banner.");
    }
  };

  // =========================================================
  // CRUD PROMO
  // =========================================================

  const handleSavePromo = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      code: promoForm.code.toUpperCase(),
      discount_type: promoForm.discount_type,
      discount_value: Number(promoForm.discount_value),
      max_discount: promoForm.max_discount
        ? Number(promoForm.max_discount)
        : null,
      min_order_value: promoForm.min_order_value
        ? Number(promoForm.min_order_value)
        : null,
      start_date: promoForm.start_date
        ? new Date(promoForm.start_date).toISOString()
        : new Date().toISOString(),
      end_date: promoForm.end_date
        ? new Date(promoForm.end_date).toISOString()
        : null,
      usage_limit: promoForm.usage_limit
        ? Number(promoForm.usage_limit)
        : null,
      is_active: promoForm.is_active,
      updated_at: new Date().toISOString(),
    };

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (editingItem && "id" in editingItem && editingItem.id) {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings/promos/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const err = await res.json();
          toast.error(`Gagal update promo: ${err.message || res.status}`);
          return;
        }

        toast.success("Kode promo berhasil diperbarui!");
      } else {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings/promos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const err = await res.json();
          toast.error(`Gagal menambahkan promo: ${err.message || res.status}`);
          return;
        }

        toast.success("Kode promo baru berhasil dibuat!");
      }

      closeModal();
      await fetchData();
    } catch {
      toast.error("Terjadi kesalahan saat menyimpan promo.");
    }
  };

  const handleDeletePromo = async (id: string) => {
    openConfirmDialog("delete-promo", id);
  };

  const executeDeletePromo = async (id: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings/promos/${id}`, {
        method: 'DELETE',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(`Gagal menghapus promo: ${err.message || res.status}`);
        return;
      }

      toast.success("Kode promo berhasil dihapus!");
      await fetchData();
    } catch {
      toast.error("Terjadi kesalahan saat menghapus promo.");
    }
  };

  // =========================================================
  // CRUD ADMIN
  // =========================================================

  const handleSaveAdmin = async (e: React.FormEvent) => {
    e.preventDefault();

    const namaUser = adminForm.name.trim();
    const email = adminForm.email.trim().toLowerCase();

    if (!namaUser) return toast.error("Nama admin wajib diisi.");
    if (!email) return toast.error("Email admin wajib diisi.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return toast.error("Format email tidak valid.");
    }

    if (editingItem && "id_user" in editingItem && editingItem.id_user) {
      try {
        setSavingAdmin(true);

        const { error } = await supabase
          .from("users")
          .update({ nama_user: namaUser })
          .eq("id_user", editingItem.id_user);

        if (error) {
          toast.error(`Gagal memperbarui admin: ${error.message}`);
          return;
        }

        toast.success("Data admin berhasil diperbarui.");
        closeModal();
        await fetchData();
      } catch {
        toast.error("Terjadi kesalahan saat memperbarui admin.");
      } finally {
        setSavingAdmin(false);
      }
      return;
    }

    try {
      setSavingAdmin(true);
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError) {
        return toast.error(`Gagal mengambil sesi login: ${sessionError.message}`);
      }

      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        return toast.error("Sesi login tidak ditemukan. Silakan login ulang.");
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/admin/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ name: namaUser, email }),
      });

      let result: AdminApiResult | null = null;
      try {
        result = await response.json();
      } catch {
        result = null;
      }

      if (!response.ok) {
        if (result?.alreadyAdmin) {
          toast.error("Email tersebut sudah terdaftar sebagai admin.");
        } else {
          toast.error(
            result?.error ||
              result?.message ||
              `Gagal menambahkan admin. Status: ${response.status}`
          );
        }
        return;
      }

      if (result?.promoted) {
        toast.success("User berhasil diubah menjadi admin.");
      } else if (result?.created) {
        toast.success("Admin berhasil dibuat. Email undangan telah dikirim.");
      } else {
        toast.success(result?.message || "Admin berhasil diproses.");
      }

      closeModal();
      await fetchData();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat menambahkan akun admin."
      );
    } finally {
      setSavingAdmin(false);
    }
  };

  const handleDeleteAdmin = async (id: string) => {
    openConfirmDialog("demote-admin", id);
  };

  const executeDemoteAdmin = async (id: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${id}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ role: 'user' })
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(`Gagal mengubah role admin: ${err.message || res.status}`);
        return;
      }

      toast.success("Admin berhasil dikembalikan menjadi user biasa.");
      await fetchData();
    } catch {
      toast.error("Terjadi kesalahan saat mengubah role admin.");
    }
  };

  const handleConfirmAction = async () => {
    const { action, id } = confirmDialog;
    if (!action || !id) {
      closeConfirmDialog();
      return;
    }

    closeConfirmDialog();

    if (action === "delete-banner") await executeDeleteBanner(id);
    if (action === "delete-promo") await executeDeletePromo(id);
    if (action === "demote-admin") await executeDemoteAdmin(id);
  };

  // =========================================================
  // MODAL CONTROL
  // =========================================================

  const openModal = (
    type: "banner" | "promo" | "admin",
    item: ModalItem | null = null
  ) => {
    setActiveModal(type);
    setEditingItem(item);

    if (type === "banner") {
      setBannerFile(null);
      const banner = item as Partial<HeroBanner> | null;
      setBannerForm({
        title: banner?.title || "",
        image_url: banner?.image_url || "",
        link_url: banner?.link_url || "",
        sort_order: banner?.sort_order ?? 0,
        is_active: banner?.is_active ?? true,
      });
    } else if (type === "promo") {
      const promo = item as Partial<PromoCode> | null;
      setPromoForm({
        code: promo?.code || "",
        discount_type: promo?.discount_type || "nominal",
        discount_value: promo?.discount_value || 0,
        max_discount: promo?.max_discount?.toString() || "",
        min_order_value: promo?.min_order_value?.toString() || "",
        start_date: promo?.start_date
          ? new Date(promo.start_date).toISOString().substring(0, 16)
          : new Date().toISOString().substring(0, 16),
        end_date: promo?.end_date
          ? new Date(promo.end_date).toISOString().substring(0, 16)
          : "",
        usage_limit: promo?.usage_limit?.toString() || "",
        is_active: promo?.is_active ?? true,
      });
    } else if (type === "admin") {
      const admin = item as Partial<AdminUser> | null;
      setAdminForm({
        name: admin?.nama_user || "",
        email: admin?.email || "",
        role: "admin",
      });
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    setEditingItem(null);
    setBannerFile(null);
    setAdminForm({ name: "", email: "", role: "admin" });
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin mb-2 text-amber-600" />
        <p className="font-medium">Memuat Pengaturan...</p>
      </div>
    );
  }

  const confirmContent = getConfirmDialogContent();

  return (
    <div className="space-y-8 max-w-5xl pb-10">
      {/* =====================================================
          HEADER
      ===================================================== */}
      <div>
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Pengaturan Sistem
        </h2>
        <p className="text-gray-500 mt-1 font-medium">
          Kelola hero banner, kode promo, dan akun admin toko.
        </p>
      </div>

      {/* =====================================================
          0. PENGATURAN TOKO (owner-only)
      ===================================================== */}
      <Card className="border border-gray-100 shadow-sm rounded-2xl overflow-hidden bg-white">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5 text-amber-600" />
              <CardTitle>Pengaturan Toko</CardTitle>
            </div>
            <Button
              onClick={saveStoreSettings}
              disabled={isSavingStore}
              className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-sm text-sm h-9"
            >
              {isSavingStore ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
              Simpan
            </Button>
          </div>
          <CardDescription>
            Ubah identitas toko, kontak, About Us, dan pengaturan SEO.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">

          {/* Identitas Toko */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider border-b pb-2">Identitas Toko</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Nama Toko</label>
                <input type="text" value={storeForm.store_name || ""} onChange={(e) => setStoreForm((p) => ({ ...p, store_name: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Tagline</label>
                <input type="text" value={storeForm.store_tagline || ""} onChange={(e) => setStoreForm((p) => ({ ...p, store_tagline: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none" placeholder="Toko Kue Kering Premium Balikpapan" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">URL Logo (path)</label>
                <input type="text" value={storeForm.store_logo_url || ""} onChange={(e) => setStoreForm((p) => ({ ...p, store_logo_url: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none" placeholder="/logo.png" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Domain Website</label>
                <input type="text" value={storeForm.store_domain || ""} onChange={(e) => setStoreForm((p) => ({ ...p, store_domain: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none" placeholder="https://dapoerdjawa.com" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Deskripsi Toko (untuk SEO)</label>
              <textarea rows={2} value={storeForm.store_description || ""} onChange={(e) => setStoreForm((p) => ({ ...p, store_description: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none resize-none" />
            </div>
          </div>

          {/* Kontak */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider border-b pb-2">Kontak & Sosial Media</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">WhatsApp (tanpa +)</label>
                <input type="text" value={storeForm.contact_whatsapp || ""} onChange={(e) => setStoreForm((p) => ({ ...p, contact_whatsapp: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none" placeholder="62895383270632" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Telepon</label>
                <input type="text" value={storeForm.contact_phone || ""} onChange={(e) => setStoreForm((p) => ({ ...p, contact_phone: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none" placeholder="+628111222333" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Instagram URL</label>
                <input type="text" value={storeForm.contact_instagram || ""} onChange={(e) => setStoreForm((p) => ({ ...p, contact_instagram: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none" placeholder="https://instagram.com/..." />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">TikTok URL</label>
                <input type="text" value={storeForm.contact_tiktok || ""} onChange={(e) => setStoreForm((p) => ({ ...p, contact_tiktok: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none" placeholder="https://tiktok.com/@..." />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Email</label>
                <input type="text" value={storeForm.contact_email || ""} onChange={(e) => setStoreForm((p) => ({ ...p, contact_email: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none" placeholder="admin@dapoerdjawa.com" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Alamat Lengkap</label>
              <textarea rows={2} value={storeForm.contact_address || ""} onChange={(e) => setStoreForm((p) => ({ ...p, contact_address: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none resize-none" />
            </div>
          </div>

          {/* About Us */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider border-b pb-2">About Us</h3>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Teks About Us (gunakan Enter untuk paragraf baru)</label>
              <textarea rows={5} value={storeForm.about_text || ""} onChange={(e) => setStoreForm((p) => ({ ...p, about_text: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none resize-none" placeholder="Ceritakan tentang toko Anda..." />
            </div>
          </div>

          {/* SEO & Footer */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider border-b pb-2">SEO & Footer</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">SEO Title</label>
                <input type="text" value={storeForm.seo_title || ""} onChange={(e) => setStoreForm((p) => ({ ...p, seo_title: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">SEO Keywords (pisahkan dengan koma)</label>
                <input type="text" value={storeForm.seo_keywords || ""} onChange={(e) => setStoreForm((p) => ({ ...p, seo_keywords: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none" placeholder="kue kering, balikpapan, ..." />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Footer Copyright</label>
              <input type="text" value={storeForm.footer_copyright || ""} onChange={(e) => setStoreForm((p) => ({ ...p, footer_copyright: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none" placeholder="© 2026 NamaToko. All rights reserved." />
            </div>
          </div>

        </CardContent>
      </Card>

      {/* =====================================================
          1. HERO BANNER
      ===================================================== */}
      <Card className="border border-gray-100 shadow-sm rounded-2xl overflow-hidden bg-white">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-amber-600" />
              <CardTitle>Hero Banner Carousel</CardTitle>
            </div>
            <Button
              onClick={() => openModal("banner")}
              className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-sm text-sm h-9"
            >
              <Plus className="w-4 h-4 mr-1" />
              Tambah Banner
            </Button>
          </div>
          <CardDescription>
            Kelola urutan dan tampilan banner di halaman utama toko.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-100">
            {banners.length === 0 ? (
              <p className="p-5 text-sm text-gray-400 italic">
                Belum ada banner.
              </p>
            ) : (
              banners.map((b) => (
                <div
                  key={b.id}
                  className="p-5 flex items-center justify-between hover:bg-gray-50 transition gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <Image
                      src={b.image_url}
                      alt={b.title}
                      width={96}
                      height={48}
                      className="w-24 h-12 object-cover rounded-lg border border-gray-200 shrink-0"
                      unoptimized
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-900 truncate">
                          {b.title}
                        </p>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono shrink-0">
                          Urutan: {b.sort_order}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider inline-block mt-1 ${
                          b.is_active
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {b.is_active ? "Aktif" : "Non-Aktif"}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openModal("banner", b)}
                      className="h-8 w-8 rounded-lg"
                    >
                      <Edit className="w-4 h-4 text-gray-600" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDeleteBanner(b.id)}
                      className="h-8 w-8 rounded-lg border-red-100 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* =====================================================
          2. PROMO
      ===================================================== */}
      <Card className="border border-gray-100 shadow-sm rounded-2xl overflow-hidden bg-white">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Ticket className="w-5 h-5 text-blue-600" />
              <CardTitle>Kode Promo Diskon</CardTitle>
            </div>
            <Button
              onClick={() => openModal("promo")}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm text-sm h-9"
            >
              <Plus className="w-4 h-4 mr-1" />
              Buat Promo
            </Button>
          </div>
          <CardDescription>
            Atur syarat dan potongan diskon untuk transaksi pembeli.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-100">
            {promos.length === 0 ? (
              <p className="p-5 text-sm text-gray-400 italic">
                Belum ada promo.
              </p>
            ) : (
              promos.map((p) => {
                const now = new Date();
                const isExpired = p.end_date
                  ? new Date(p.end_date) < now
                  : false;
                const isFullyUsed =
                  p.usage_limit !== null &&
                  (p.used_count || 0) >= (p.usage_limit || 0);

                return (
                  <div
                    key={p.id}
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-gray-50 transition gap-4"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-bold font-mono bg-gray-100 px-2 py-0.5 rounded text-sm text-gray-900">
                          {p.code}
                        </span>
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {p.discount_type === "nominal"
                            ? `Rp ${Number(p.discount_value).toLocaleString("id-ID")}`
                            : `${p.discount_value}%`}
                        </span>
                        {(() => {
                          if (!p.is_active) {
                            return (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-gray-100 text-gray-500">
                                Non-Aktif
                              </span>
                            );
                          }
                          if (isExpired) {
                            return (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-red-100 text-red-700">
                                Kadaluarsa
                              </span>
                            );
                          }
                          if (isFullyUsed) {
                            return (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-orange-100 text-orange-700">
                                Habis
                              </span>
                            );
                          }
                          return (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-emerald-100 text-emerald-700">
                              Aktif
                            </span>
                          );
                        })()}
                      </div>
                      <div className="text-xs text-gray-500 flex gap-4 mt-1 flex-wrap">
                        <span>
                          Min Order:{" "}
                          {p.min_order_value
                            ? `Rp ${Number(p.min_order_value).toLocaleString("id-ID")}`
                            : "-"}
                        </span>
                        <span>
                          Terpakai: {p.used_count || 0}
                          {p.usage_limit ? `/${p.usage_limit}` : ""}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openModal("promo", p)}
                        className="h-8 w-8 rounded-lg"
                      >
                        <Edit className="w-4 h-4 text-gray-600" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDeletePromo(p.id)}
                        className="h-8 w-8 rounded-lg border-red-100 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* =====================================================
          3. AKUN ADMIN
      ===================================================== */}
      <Card className="border border-gray-100 shadow-sm rounded-2xl overflow-hidden bg-white">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <CardTitle>Akun Admin</CardTitle>
            </div>
            <Button
              onClick={() => openModal("admin")}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm text-sm h-9"
            >
              <Plus className="w-4 h-4 mr-1" />
              Tambah Admin
            </Button>
          </div>
          <CardDescription>
            Manajemen pengguna yang memiliki akses dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-100">
            {admins.length === 0 ? (
              <p className="p-5 text-sm text-gray-400 italic">
                Belum ada akun admin.
              </p>
            ) : (
              admins.map((a) => (
                <div
                  key={a.id_user}
                  // PERBAIKAN: Layout responsif, tambah flex-wrap, & min-w-0
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-gray-50 transition gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold flex shrink-0 items-center justify-center text-sm">
                      {a.nama_user
                        ? a.nama_user.charAt(0).toUpperCase()
                        : "A"}
                    </div>
                    {/* PERBAIKAN: truncate untuk teks yang panjang */}
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 text-sm truncate">
                        {a.nama_user}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {a.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <span className="text-xs font-bold px-2.5 py-1 rounded bg-purple-50 text-purple-700 border border-purple-200">
                      ADMIN
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openModal("admin", a)}
                      className="h-8 w-8 rounded-lg"
                    >
                      <Edit className="w-4 h-4 text-gray-600" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDeleteAdmin(a.id_user)}
                      className="h-8 w-8 rounded-lg border-red-100 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* =====================================================
          MODAL FORM
      ===================================================== */}
      {activeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl relative animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>

            {/* FORM BANNER */}
            {activeModal === "banner" && (
              <form onSubmit={handleSaveBanner} className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900">
                  {editingItem ? "Edit Banner" : "Tambah Banner"}
                </h3>
                <div>
                  <label className="text-xs font-bold text-gray-700">
                    Judul Banner
                  </label>
                  <input
                    type="text"
                    required
                    value={bannerForm.title}
                    onChange={(e) =>
                      setBannerForm({ ...bannerForm, title: e.target.value })
                    }
                    className="w-full mt-1 p-2.5 border rounded-xl text-sm"
                    placeholder="Contoh: Promo Lebaran"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700">
                    Gambar Banner
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setBannerFile(e.target.files[0]);
                      }
                    }}
                    className="w-full mt-1 p-2 border rounded-xl text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-amber-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-amber-700 hover:file:bg-amber-100"
                  />
                  {editingItem && !bannerFile && bannerForm.image_url && (
                    <p className="mt-2 text-xs text-gray-500">
                      *Biarkan kosong jika tidak ingin mengubah gambar.
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700">
                    Link Tujuan (Klik Banner Menuju)
                  </label>
                  <select
                    value={
                      bannerForm.link_url.startsWith("/product/")
                        ? bannerForm.link_url
                        : bannerForm.link_url
                        ? "__custom__"
                        : ""
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "__custom__") {
                        setBannerForm({ ...bannerForm, link_url: "" });
                      } else {
                        setBannerForm({ ...bannerForm, link_url: val });
                      }
                    }}
                    className="w-full mt-1 p-2.5 border rounded-xl text-sm"
                  >
                    <option value="">— Tanpa Link (tidak bisa diklik) —</option>
                    {productList.map((p) => (
                      <option key={p.id} value={`/product/${p.id}`}>
                        🛒 {p.nama_produk}
                      </option>
                    ))}
                    <option value="__custom__">✏️ Custom URL (tulis sendiri)</option>
                  </select>
                  {(bannerForm.link_url && !bannerForm.link_url.startsWith("/product/")) && (
                    <input
                      type="text"
                      value={bannerForm.link_url}
                      onChange={(e) =>
                        setBannerForm({ ...bannerForm, link_url: e.target.value })
                      }
                      className="w-full mt-2 p-2.5 border rounded-xl text-sm"
                      placeholder="Contoh: /products atau https://..."
                    />
                  )}
                  {bannerForm.link_url && (
                    <p className="mt-1 text-[11px] text-gray-500">
                      Link: <code className="bg-gray-100 px-1 rounded">{bannerForm.link_url}</code>
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700">
                    Urutan
                  </label>
                  <input
                    type="number"
                    value={bannerForm.sort_order}
                    onChange={(e) =>
                      setBannerForm({
                        ...bannerForm,
                        sort_order: Number(e.target.value),
                      })
                    }
                    className="w-full mt-1 p-2.5 border rounded-xl text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="banner_is_active"
                    checked={bannerForm.is_active}
                    onChange={(e) =>
                      setBannerForm({
                        ...bannerForm,
                        is_active: e.target.checked,
                      })
                    }
                    className="rounded"
                  />
                  <label
                    htmlFor="banner_is_active"
                    className="text-xs font-semibold text-gray-700"
                  >
                    Aktifkan Banner
                  </label>
                </div>
                <Button
                  type="submit"
                  disabled={isUploadingBanner}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white rounded-xl disabled:opacity-70"
                >
                  {isUploadingBanner ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Mengunggah...
                    </>
                  ) : (
                    "Simpan Banner"
                  )}
                </Button>
              </form>
            )}

            {/* FORM PROMO */}
            {activeModal === "promo" && (
              <form onSubmit={handleSavePromo} className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900">
                  {editingItem ? "Edit Kode Promo" : "Buat Kode Promo"}
                </h3>
                <div>
                  <label className="text-xs font-bold text-gray-700">
                    Kode Promo
                  </label>
                  <input
                    type="text"
                    required
                    value={promoForm.code}
                    onChange={(e) =>
                      setPromoForm({
                        ...promoForm,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full mt-1 p-2.5 border rounded-xl text-sm font-mono uppercase"
                    placeholder="LEBARAN2026"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-700">
                      Tipe Diskon
                    </label>
                    <select
                      value={promoForm.discount_type}
                      onChange={(e) =>
                        setPromoForm({
                          ...promoForm,
                          discount_type: e.target.value,
                        })
                      }
                      className="w-full mt-1 p-2.5 border rounded-xl text-sm"
                    >
                      <option value="nominal">Nominal (Rp)</option>
                      <option value="percentage">Persentase (%)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700">
                      Nilai Diskon
                    </label>
                    <input
                      type="number"
                      required
                      value={promoForm.discount_value}
                      onChange={(e) =>
                        setPromoForm({
                          ...promoForm,
                          discount_value: Number(e.target.value),
                        })
                      }
                      className="w-full mt-1 p-2.5 border rounded-xl text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-700">
                      Min. Belanja
                    </label>
                    <input
                      type="number"
                      value={promoForm.min_order_value}
                      onChange={(e) =>
                        setPromoForm({
                          ...promoForm,
                          min_order_value: e.target.value,
                        })
                      }
                      className="w-full mt-1 p-2.5 border rounded-xl text-sm"
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700">
                      Max Diskon
                    </label>
                    <input
                      type="number"
                      value={promoForm.max_discount}
                      onChange={(e) =>
                        setPromoForm({
                          ...promoForm,
                          max_discount: e.target.value,
                        })
                      }
                      className="w-full mt-1 p-2.5 border rounded-xl text-sm"
                      placeholder="Optional"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-700">
                      Tanggal Mulai
                    </label>
                    <input
                      type="datetime-local"
                      value={promoForm.start_date}
                      onChange={(e) =>
                        setPromoForm({ ...promoForm, start_date: e.target.value })
                      }
                      className="w-full mt-1 p-2 border rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700">
                      Tanggal Selesai
                    </label>
                    <input
                      type="datetime-local"
                      value={promoForm.end_date}
                      onChange={(e) =>
                        setPromoForm({ ...promoForm, end_date: e.target.value })
                      }
                      className="w-full mt-1 p-2 border rounded-xl text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700">
                    Batas Penggunaan
                  </label>
                  <input
                    type="number"
                    value={promoForm.usage_limit}
                    onChange={(e) =>
                      setPromoForm({ ...promoForm, usage_limit: e.target.value })
                    }
                    className="w-full mt-1 p-2.5 border rounded-xl text-sm"
                    placeholder="Kosongkan jika tak terbatas"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="promo_is_active"
                    checked={promoForm.is_active}
                    onChange={(e) =>
                      setPromoForm({
                        ...promoForm,
                        is_active: e.target.checked,
                      })
                    }
                    className="rounded"
                  />
                  <label
                    htmlFor="promo_is_active"
                    className="text-xs font-semibold text-gray-700"
                  >
                    Status Promo Aktif
                  </label>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                >
                  Simpan Promo
                </Button>
              </form>
            )}

            {/* FORM ADMIN */}
            {activeModal === "admin" && (
              <form onSubmit={handleSaveAdmin} className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900">
                  {editingItem ? "Edit Admin" : "Tambah Admin"}
                </h3>
                <div>
                  <label className="text-xs font-bold text-gray-700">Nama</label>
                  <input
                    type="text"
                    required
                    value={adminForm.name}
                    onChange={(e) =>
                      setAdminForm({ ...adminForm, name: e.target.value })
                    }
                    className="w-full mt-1 p-2.5 border rounded-xl text-sm"
                    placeholder="Nama admin"
                    disabled={savingAdmin}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700">Email</label>
                  <input
                    type="email"
                    required
                    value={adminForm.email}
                    onChange={(e) =>
                      setAdminForm({ ...adminForm, email: e.target.value })
                    }
                    className="w-full mt-1 p-2.5 border rounded-xl text-sm disabled:bg-gray-100 disabled:text-gray-500"
                    placeholder="email@example.com"
                    disabled={savingAdmin || Boolean(editingItem)}
                  />
                  {editingItem && (
                    <p className="text-[11px] text-gray-400 mt-1">
                      Email login tidak diubah dari menu ini agar akun Supabase
                      Auth dan profile tetap sinkron.
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700">Role</label>
                  <input
                    type="text"
                    value="admin"
                    disabled
                    className="w-full mt-1 p-2.5 border rounded-xl text-sm bg-gray-100 text-gray-500"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Role otomatis diset sebagai admin.
                  </p>
                </div>
                <Button
                  type="submit"
                  disabled={savingAdmin}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:opacity-60"
                >
                  {savingAdmin ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    "Simpan Admin"
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>
      )}

{/* =====================================================
          SHADCN ALERT DIALOG
      ===================================================== */}
      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            closeConfirmDialog();
          }
        }}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmContent.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmContent.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              className="rounded-xl bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {confirmContent.actionText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}