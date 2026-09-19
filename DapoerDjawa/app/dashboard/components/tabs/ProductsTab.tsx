"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Image as ImageIcon,
  Loader2,
  X,
  Upload,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

import { supabase } from "@/lib/supabase";

// ============================================================
// TYPE DATA
// ============================================================

type ProductVariant = {
  id: string;
  produk_id: string;
  raw_name: string; 
  name: string;     
  description: string;
  price: number;
  stock: number;
  weight: number; 
  tinggi: number;   // Tambahan: Kolom tinggi
  diameter: number; // Tambahan: Kolom diameter
  image_url: string | null;
  foto_2: string | null;
  size: string;
};

type SupabaseProductVariant = {
  id: string;
  produk_id: string;
  price: number;
  stok: number;
  berat: number; 
  tinggi: number;   // Tambahan: Kolom tinggi dari database
  diameter: number; // Tambahan: Kolom diameter dari database
  img: string | null;
  foto_2: string | null;
  ukuran: string;
  produk:
    | {
        id: string;
        nama_produk: string;
        deskripsi: string;
      }
    | null;
};

// ============================================================
// HELPER ERROR
// ============================================================

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "object" && error !== null && "message" in error) {
    const possibleError = error as { message?: unknown };
    if (typeof possibleError.message === "string") {
      return possibleError.message;
    }
  }
  return "Terjadi kesalahan yang tidak diketahui.";
};

// ============================================================
// COMPONENT
// ============================================================

export default function ProductsTab() {
  // ==========================================================
  // STATE DATA
  // ==========================================================

  const [products, setProducts] = useState<ProductVariant[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // ==========================================================
  // STATE MODAL & EDIT
  // ==========================================================

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductVariant | null>(null);

  // ==========================================================
  // STATE FORM
  // ==========================================================

  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formSize, setFormSize] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formStock, setFormStock] = useState("");
  const [formWeight, setFormWeight] = useState(""); 
  const [formTinggi, setFormTinggi] = useState("");   // Tambahan: State form tinggi
  const [formDiameter, setFormDiameter] = useState(""); // Tambahan: State form diameter

  // Foto 1 (Utama - img)
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Foto 2 (Detail - foto_2)
  const [imageFile2, setImageFile2] = useState<File | null>(null);
  const [imagePreview2, setImagePreview2] = useState<string | null>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);

  // ==========================================================
  // READ DATA DARI SUPABASE
  // ==========================================================

  useEffect(() => {
    let isMounted = true;

    const loadProducts = async () => {
      setIsLoading(true);

      const { data, error } = await supabase
        .from("produk_varian")
        .select(
          `
            id,
            produk_id,
            price,
            stok,
            berat,
            tinggi,
            diameter,
            img,
            foto_2,
            ukuran,
            produk:produk_id (
              id,
              nama_produk,
              deskripsi
            )
          `,
        )
        .order("created_at", { ascending: false });

      if (!isMounted) return;

      if (error) {
        console.error("Gagal mengambil data produk:", error);
        setProducts([]);
        setIsLoading(false);
        return;
      }

      if (data) {
        const formattedData: ProductVariant[] = (
          data as unknown as SupabaseProductVariant[]
        ).map((item) => ({
          id: item.id,
          produk_id: item.produk?.id || item.produk_id,
          raw_name: item.produk?.nama_produk || "Produk",
          name: item.produk?.nama_produk
            ? `${item.produk.nama_produk} (${item.ukuran})`
            : `Produk (${item.ukuran})`,
          description: item.produk?.deskripsi || "",
          price: Number(item.price),
          stock: Number(item.stok),
          weight: Number(item.berat) || 500, 
          tinggi: Number(item.tinggi) || 5,     // Tambahan: Mapping data tinggi
          diameter: Number(item.diameter) || 12, // Tambahan: Mapping data diameter
          image_url: item.img,
          foto_2: item.foto_2,
          size: item.ukuran,
        }));

        setProducts(formattedData);
      } else {
        setProducts([]);
      }

      setIsLoading(false);
    };

    void loadProducts();

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  // ==========================================================
  // HELPER: HAPUS GAMBAR JIKA TIDAK DIPAKAI
  // ==========================================================

  const deleteImageIfUnused = async (imageUrl: string, column: "img" | "foto_2") => {
    try {
      const { data: sharedImages } = await supabase
        .from("produk_varian")
        .select("id")
        .eq(column, imageUrl);

      if (sharedImages && sharedImages.length === 0) {
        const urlObj = new URL(imageUrl);
        const marker = "/foto-produk/";
        const idx = urlObj.pathname.indexOf(marker);

        if (idx !== -1) {
          const storagePath = decodeURIComponent(urlObj.pathname.substring(idx + marker.length));
          if (storagePath) {
            await supabase.storage.from("foto-produk").remove([storagePath]);
          }
        }
      }
    } catch (err) {
      console.error(`Gagal menghapus gambar usang dari kolom ${column}:`, err);
    }
  };

  // ==========================================================
  // HANDLE IMAGE CHANGE
  // ==========================================================

  const handleImageChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    isSecondImage: boolean = false
  ): void => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("File yang dipilih harus berupa gambar.");
      return;
    }

    const maxFileSize = 5 * 1024 * 1024;
    if (file.size > maxFileSize) {
      toast.error("Ukuran gambar maksimal 5 MB.");
      return;
    }

    if (isSecondImage) {
      setImageFile2(file);
      setImagePreview2((previousPreview) => {
        if (previousPreview && !previousPreview.startsWith("http")) URL.revokeObjectURL(previousPreview);
        return URL.createObjectURL(file);
      });
    } else {
      setImageFile(file);
      setImagePreview((previousPreview) => {
        if (previousPreview && !previousPreview.startsWith("http")) URL.revokeObjectURL(previousPreview);
        return URL.createObjectURL(file);
      });
    }
  };

  // ==========================================================
  // RESET FORM
  // ==========================================================

  const resetForm = (): void => {
    setEditingProduct(null);
    setFormName("");
    setFormDesc("");
    setFormSize("");
    setFormPrice("");
    setFormStock("");
    setFormWeight(""); 
    setFormTinggi("");   // Tambahan: Reset form
    setFormDiameter(""); // Tambahan: Reset form
    
    setImageFile(null);
    setImagePreview((prev) => {
      if (prev && !prev.startsWith("http")) URL.revokeObjectURL(prev);
      return null;
    });
    if (fileInputRef.current) fileInputRef.current.value = "";

    setImageFile2(null);
    setImagePreview2((prev) => {
      if (prev && !prev.startsWith("http")) URL.revokeObjectURL(prev);
      return null;
    });
    if (fileInputRef2.current) fileInputRef2.current.value = "";
  };

  const closeModal = (): void => {
    if (isSubmitting) return;
    setIsModalOpen(false);
    resetForm();
  };

  // ==========================================================
  // BUKA MODAL EDIT
  // ==========================================================

  const handleEditClick = (product: ProductVariant) => {
    setEditingProduct(product);
    setFormName(product.raw_name);
    setFormDesc(product.description);
    setFormSize(product.size);
    setFormPrice(product.price.toString());
    setFormStock(product.stock.toString());
    setFormWeight(product.weight.toString()); 
    setFormTinggi(product.tinggi.toString());     // Tambahan: Set modal edit
    setFormDiameter(product.diameter.toString()); // Tambahan: Set modal edit
    
    setImagePreview(product.image_url);
    setImagePreview2(product.foto_2);
    
    setIsModalOpen(true);
  };

  // ==========================================================
  // CREATE & UPDATE PRODUCT
  // ==========================================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formSize || !formPrice || !formStock || !formWeight || !formTinggi || !formDiameter) {
      toast.error("Mohon lengkapi semua data teks produk!");
      return;
    }

    const price = Number(formPrice);
    const stock = Number(formStock);
    const weight = Number(formWeight);
    const tinggi = Number(formTinggi);
    const diameter = Number(formDiameter);

    if (!Number.isFinite(price) || price <= 0) {
      toast.error("Harga produk tidak valid.");
      return;
    }
    if (!Number.isInteger(stock) || stock < 0) {
      toast.error("Stok produk tidak valid.");
      return;
    }
    if (!Number.isInteger(weight) || weight <= 0) {
      toast.error("Berat produk tidak valid (harus lebih dari 0).");
      return;
    }
    if (!Number.isFinite(tinggi) || tinggi <= 0) {
      toast.error("Tinggi produk tidak valid.");
      return;
    }
    if (!Number.isFinite(diameter) || diameter <= 0) {
      toast.error("Diameter produk tidak valid.");
      return;
    }

    setIsSubmitting(true);

    try {
      let finalImageUrl = imagePreview || "";
      let finalImageUrl2 = imagePreview2 || null;

      // --- UPLOAD FOTO BARU JIKA ADA ---
      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop()?.toLowerCase() || "jpg";
        const safeExt = fileExt.replace(/[^a-z0-9]/g, "");
        const fileName = `main-${crypto.randomUUID()}.${safeExt}`;

        const { error: uploadError } = await supabase.storage
          .from("foto-produk")
          .upload(fileName, imageFile, { cacheControl: "3600", upsert: false, contentType: imageFile.type });

        if (uploadError) throw new Error(`Gagal mengunggah foto utama: ${uploadError.message}`);
        const { data: publicUrlData } = supabase.storage.from("foto-produk").getPublicUrl(fileName);
        finalImageUrl = publicUrlData.publicUrl;
      }

      if (imageFile2) {
        const fileExt = imageFile2.name.split(".").pop()?.toLowerCase() || "jpg";
        const safeExt = fileExt.replace(/[^a-z0-9]/g, "");
        const fileName = `detail-${crypto.randomUUID()}.${safeExt}`;

        const { error: uploadError } = await supabase.storage
          .from("foto-produk")
          .upload(fileName, imageFile2, { cacheControl: "3600", upsert: false, contentType: imageFile2.type });

        if (uploadError) throw new Error(`Gagal mengunggah foto detail: ${uploadError.message}`);
        const { data: publicUrlData } = supabase.storage.from("foto-produk").getPublicUrl(fileName);
        finalImageUrl2 = publicUrlData.publicUrl;
      }

      // --- MODE EDIT ---
      if (editingProduct) {
        const { error: parentError } = await supabase
          .from("produk")
          .update({
            nama_produk: formName.trim(),
            deskripsi: formDesc.trim(),
          })
          .eq("id", editingProduct.produk_id);

        if (parentError) throw new Error(`Gagal memperbarui data induk: ${parentError.message}`);

        const { error: variantError } = await supabase
          .from("produk_varian")
          .update({
            ukuran: formSize.trim(),
            price,
            stok: stock,
            berat: weight,
            tinggi: tinggi,       // Tambahan: Update ke database
            diameter: diameter,   // Tambahan: Update ke database
            img: finalImageUrl,
            foto_2: finalImageUrl2,
          })
          .eq("id", editingProduct.id);

        if (variantError) throw new Error(`Gagal memperbarui varian: ${variantError.message}`);

        if (imageFile && editingProduct.image_url) {
          await deleteImageIfUnused(editingProduct.image_url, "img");
        }
        if (imageFile2 && editingProduct.foto_2) {
          await deleteImageIfUnused(editingProduct.foto_2, "foto_2");
        }

        toast.success("Produk berhasil diperbarui!");

      } else {
        // --- MODE TAMBAH BARU ---
        let productId = "";

        const { data: existingProduct, error: searchError } = await supabase
          .from("produk")
          .select("id")
          .ilike("nama_produk", formName.trim())
          .maybeSingle();

        if (searchError && searchError.code !== "PGRST116") throw new Error(`Gagal mengecek produk: ${searchError.message}`);

        if (existingProduct?.id) {
          productId = existingProduct.id;
        } else {
          const { data: newProduct, error: productError } = await supabase
            .from("produk")
            .insert([{ nama_produk: formName.trim(), deskripsi: formDesc.trim() }])
            .select("id")
            .single();

          if (productError) throw new Error(`Gagal menyimpan produk: ${productError.message}`);
          if (!newProduct?.id) throw new Error("ID produk tidak ditemukan setelah penyimpanan.");
          productId = newProduct.id;
        }

        if (!imageFile || !imageFile2) {
          if (existingProduct?.id) {
            const { data: existingVariant } = await supabase
              .from("produk_varian")
              .select("img, foto_2")
              .eq("produk_id", existingProduct.id)
              .not("img", "is", null)
              .limit(1)
              .single();
            
            if (!imageFile && existingVariant?.img) finalImageUrl = existingVariant.img;
            if (!imageFile2 && existingVariant?.foto_2) finalImageUrl2 = existingVariant.foto_2;
          }
          if (!imageFile && !finalImageUrl) throw new Error("Ini adalah produk baru, kamu WAJIB mengunggah Foto Utama.");
          if (!imageFile2 && !finalImageUrl2 && !existingProduct?.id) throw new Error("Ini adalah produk baru, kamu WAJIB mengunggah Foto Detail.");
        }

        const { error: variantInsertError } = await supabase
          .from("produk_varian")
          .insert([{
            produk_id: productId,
            ukuran: formSize.trim(),
            price,
            stok: stock,
            berat: weight,
            tinggi: tinggi,       // Tambahan: Insert ke database
            diameter: diameter,   // Tambahan: Insert ke database
            img: finalImageUrl,
            foto_2: finalImageUrl2
          }]);

        if (variantInsertError) {
          if (!existingProduct?.id) await supabase.from("produk").delete().eq("id", productId);
          throw new Error(`Gagal menyimpan varian produk: ${variantInsertError.message}`);
        }

        toast.success("Produk berhasil ditambahkan!");
      }

      setIsModalOpen(false);
      resetForm();
      setRefreshKey((current) => current + 1);
    } catch (error: unknown) {
      console.error("Gagal menyimpan produk:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================================
  // DELETE PRODUCT VARIANT
  // ==========================================================

  // Logika utama untuk menghapus (dipanggil oleh toast)
  const executeDelete = async (product: ProductVariant): Promise<void> => {
    const loadingToast = toast.loading("Menghapus produk...");
    
    try {
      // 1. Ambil data gambar sebelum dihapus
      const { data: variantData, error: variantFetchError } = await supabase
        .from("produk_varian")
        .select("id, img, foto_2")
        .eq("id", product.id)
        .single();

      if (variantFetchError) throw new Error(`Gagal menemukan varian produk: ${variantFetchError.message}`);

      // 2. Hapus varian dari tabel produk_varian
      const { error: deleteError } = await supabase
        .from("produk_varian")
        .delete()
        .eq("id", product.id);

      if (deleteError) throw new Error(`Gagal menghapus produk: ${deleteError.message}`);

      // 3. CEK SISA VARIAN: Apakah produk induk ini masih punya varian lain?
      const { count, error: countError } = await supabase
        .from("produk_varian")
        .select("*", { count: 'exact', head: true })
        .eq("produk_id", product.produk_id);

      if (countError) {
        console.error("Gagal mengecek sisa varian:", countError);
      } else if (count === 0) {
        // Jika count === 0 (tidak ada varian tersisa), hapus produk induknya!
        const { error: deleteParentError } = await supabase
          .from("produk")
          .delete()
          .eq("id", product.produk_id);
          
        if (deleteParentError) {
          console.error("Gagal menghapus data induk produk:", deleteParentError);
        }
      }

      // 4. Bersihkan file gambar di storage jika tidak dipakai varian lain
      if (variantData?.img) await deleteImageIfUnused(variantData.img, "img");
      if (variantData?.foto_2) await deleteImageIfUnused(variantData.foto_2, "foto_2");

      toast.success("Produk berhasil dihapus.", { id: loadingToast });
      setRefreshKey((current) => current + 1);
    } catch (error: unknown) {
      console.error("Gagal menghapus produk:", error);
      toast.error(getErrorMessage(error), { id: loadingToast });
    }
  };

  // Fungsi trigger saat tombol tong sampah diklik
  const handleDeleteClick = (product: ProductVariant): void => {
    toast(
      (t) => (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-gray-800">
            Apakah kamu yakin ingin menghapus <span className="font-bold">&quot;{product.name}&quot;</span>?
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-200"
            >
              Batal
            </button>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                void executeDelete(product);
              }}
              className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700"
            >
              Ya, Hapus
            </button>
          </div>
        </div>
      ),
      {
        duration: Infinity, 
      }
    );
  };

  // ==========================================================
  // FORMAT RUPIAH
  // ==========================================================

  const formatRupiah = (value: number): string => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredProducts = products.filter((product) => {
    if (!normalizedSearchTerm) return true;
    return (
      product.name.toLowerCase().includes(normalizedSearchTerm) ||
      product.size.toLowerCase().includes(normalizedSearchTerm)
    );
  });

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="relative space-y-6">
      <Toaster position="top-center" reverseOrder={false} />

      {/* HEADER */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Manajemen Produk</h2>
          <p className="text-sm text-gray-500">Atur katalog kue dan menu Dapoer Djawa di sini.</p>
        </div>
        <button
          type="button"
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 font-medium text-white transition-colors hover:bg-amber-700"
        >
          <Plus className="h-5 w-5" />
          Tambah Produk
        </button>
      </div>

      {/* SEARCH */}
      <div className="flex items-center gap-3 rounded-xl border bg-white p-4 shadow-sm">
        <Search className="h-5 w-5 shrink-0 text-gray-400" aria-hidden="true" />
        <input
          type="text"
          placeholder="Cari nama produk atau ukuran..."
          className="w-full border-none bg-transparent text-sm text-gray-800 outline-none focus:ring-0"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          aria-label="Cari produk"
        />
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50 font-medium text-gray-600">
              <tr>
                <th className="px-6 py-4">Produk & Varian</th>
                <th className="px-6 py-4">Harga</th>
                <th className="px-6 py-4">Stok</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin text-amber-600" />
                    <p className="text-gray-500">Memuat data dari database...</p>
                  </td>
                </tr>
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="transition-colors hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-gray-100">
                          {product.image_url ? (
                            <Image
                              src={product.image_url}
                              alt={product.name}
                              fill
                              sizes="48px"
                              unoptimized
                              className="object-cover"
                            />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-800">{product.name}</p>
                          <p className="text-xs text-gray-500">Ukuran: {product.size}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {formatRupiah(product.price)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          product.stock > 20
                            ? "bg-green-100 text-green-700"
                            : product.stock > 0
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {product.stock > 0 ? `${product.stock} tersisa` : "Stok habis"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditClick(product)}
                          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-amber-50 hover:text-amber-600"
                          title={`Edit ${product.name}`}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(product)}
                          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                          title={`Hapus ${product.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    {searchTerm.trim()
                      ? `Tidak ada produk yang cocok dengan "${searchTerm}".`
                      : "Belum ada produk ditemukan."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL FORM PRODUK */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            {/* MODAL HEADER */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4">
              <h3 className="text-lg font-bold text-gray-800">
                {editingProduct ? "Edit Produk" : "Tambah Produk Baru"}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                disabled={isSubmitting}
                className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* FORM */}
            <form onSubmit={(event) => void handleSubmit(event)} className="space-y-6 p-6">
              
              {/* UPLOAD FOTO (2 KOLOM) */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* FOTO 1 - UTAMA */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Foto Utama (Halaman Depan)
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 p-6 text-center transition-colors hover:border-amber-500 hover:bg-amber-50"
                  >
                    {imagePreview ? (
                      <div className="relative h-28 w-full">
                        <Image src={imagePreview} alt="Preview Utama" fill unoptimized className="rounded-md object-contain" />
                      </div>
                    ) : (
                      <>
                        <Upload className="mb-2 h-8 w-8 text-gray-400" />
                        <p className="text-sm text-gray-500">Klik untuk upload foto</p>
                        <p className="mt-1 text-xs text-gray-400">Kosongkan jika tambah ukuran</p>
                      </>
                    )}
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/jpeg,image/png,image/webp" onChange={(e) => handleImageChange(e, false)} />
                  </div>
                </div>

                {/* FOTO 2 - DETAIL */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Foto Detail (Halaman Produk)
                  </label>
                  <div
                    onClick={() => fileInputRef2.current?.click()}
                    className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 p-6 text-center transition-colors hover:border-amber-500 hover:bg-amber-50"
                  >
                    {imagePreview2 ? (
                      <div className="relative h-28 w-full">
                        <Image src={imagePreview2} alt="Preview Detail" fill unoptimized className="rounded-md object-contain" />
                      </div>
                    ) : (
                      <>
                        <Upload className="mb-2 h-8 w-8 text-gray-400" />
                        <p className="text-sm text-gray-500">Klik untuk upload foto</p>
                        <p className="mt-1 text-xs text-gray-400">Kosongkan jika tambah ukuran</p>
                      </>
                    )}
                    <input type="file" ref={fileInputRef2} className="hidden" accept="image/jpeg,image/png,image/webp" onChange={(e) => handleImageChange(e, true)} />
                  </div>
                </div>
              </div>

              {/* FORM INPUT TEKS */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Nama Produk</label>
                  <input required type="text" value={formName} onChange={(e) => setFormName(e.target.value)} className="w-full rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-amber-500" placeholder="Cth: Kue Semprit" />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Ukuran / Varian</label>
                  <input required type="text" value={formSize} onChange={(e) => setFormSize(e.target.value)} className="w-full rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-amber-500" placeholder="Cth: Toples 500gr" />
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Harga (Rp)</label>
                  <input required type="number" min="1" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} className="w-full rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-amber-500" placeholder="Cth: 45000" />
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Stok Saat Ini</label>
                  <input required type="number" min="0" step="1" value={formStock} onChange={(e) => setFormStock(e.target.value)} className="w-full rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-amber-500" placeholder="Cth: 20" />
                </div>

                {/* FORM INPUT TEKS DIMENSI LOGISTIK */}
                <div className="space-y-1 md:col-span-2 mt-2 pt-4 border-t">
                  <h4 className="font-semibold text-gray-800 text-sm mb-2">Informasi Kemasan (Untuk Pengiriman)</h4>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Berat Keseluruhan (gram)</label>
                  <input required type="number" min="1" value={formWeight} onChange={(e) => setFormWeight(e.target.value)} className="w-full rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-amber-500" placeholder="Cth: 580" />
                  <p className="text-[11px] text-gray-500 leading-tight">
                    *Tolong input berat dilebihkan 80gram dari total produk nya karena sekalian menghitung berat toples, misal produk bersih 500gr, ditambah berat 80gram toples maka jadi 580gr.
                  </p>
                </div>
                
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Diameter Toples (cm)</label>
                  <input required type="number" min="1" step="0.1" value={formDiameter} onChange={(e) => setFormDiameter(e.target.value)} className="w-full rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-amber-500" placeholder="Cth: 14" />
                  <p className="text-[11px] text-gray-500 leading-tight">
                    *Tolong input diameter dari toples.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Tinggi Toples (cm)</label>
                  <input required type="number" min="1" step="0.1" value={formTinggi} onChange={(e) => setFormTinggi(e.target.value)} className="w-full rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-amber-500" placeholder="Cth: 6" />
                  <p className="text-[11px] text-gray-500 leading-tight">
                    *Tolong input tinggi dari toples.
                  </p>
                </div>
              </div>

              {/* DESKRIPSI */}
              <div className="space-y-2 pt-2">
                <label className="block text-sm font-medium text-gray-700">Deskripsi Singkat</label>
                <textarea required value={formDesc} onChange={(e) => setFormDesc(e.target.value)} className="min-h-25 w-full rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-amber-500" placeholder="Deskripsikan kelezatan kue ini..." />
              </div>

              {/* ACTION */}
              <div className="flex justify-end gap-3 border-t pt-4">
                <button type="button" onClick={closeModal} disabled={isSubmitting} className="rounded-lg px-4 py-2 font-medium text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50">
                  Batal
                </button>
                <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 font-medium text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60">
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isSubmitting ? "Menyimpan..." : (editingProduct ? "Perbarui Produk" : "Simpan Produk")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}