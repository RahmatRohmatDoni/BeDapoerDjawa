"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle, AlertCircle, X, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";

import ProductInfo, { ProductDisplay, ProductVariant } from "./ProductInfo";
import ReviewSection, { Review } from "./ReviewSection";
import RelatedProducts, { RelatedProduct } from "./RelatedProducts";

interface DetailClientProps {
  product: ProductDisplay;
  initialReviews: Review[];
  relatedProducts: RelatedProduct[];
}

export default function DetailClient({ product, initialReviews, relatedProducts }: DetailClientProps) {
  const queryClient = useQueryClient();

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(product?.variants?.[0] || null);
  const [qty, setQty] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [reviewVariantId, setReviewVariantId] = useState<string>(product?.variants?.[0]?.id || "");
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const [currentUser, setCurrentUser] = useState<{ id: string; nama_user: string; email: string; role?: string } | null>(null);

  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isDeletingReview, setIsDeletingReview] = useState(false);

  const [modalConfig, setModalConfig] = useState({ isOpen: false, isError: false, title: "", message: "" });
  const closeModal = () => setModalConfig((prev) => ({ ...prev, isOpen: false }));

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from("users")
        .select("nama_user, role")
        .eq("id_user", user.id)
        .maybeSingle();

      setCurrentUser({
        id: user.id,
        nama_user: userData?.nama_user || user.email?.split("@")[0] || "Pelanggan",
        email: user.email || "",
        role: userData?.role,
      });
    };
    checkAuth();
  }, []);

  const handleAddToCart = async () => {
    if (qty === 0) return setModalConfig({ isOpen: true, isError: true, title: "Ups, Perhatian!", message: "Tentukan jumlah barang dulu ya." });
    if (!selectedVariant) return setModalConfig({ isOpen: true, isError: true, title: "Varian Kosong", message: "Silakan pilih varian produk." });

    // Validasi Stok
    const batasStok = (selectedVariant as ProductVariant & { stok?: number }).stok || 0;

    if (batasStok === 0) {
      return setModalConfig({ isOpen: true, isError: true, title: "Stok Habis", message: "Mohon maaf, stok untuk ukuran ini sedang kosong." });
    }

    if (qty > batasStok) {
      return setModalConfig({ isOpen: true, isError: true, title: "Stok Tidak Cukup", message: `Stok tersisa hanya ${batasStok} pcs.` });
    }

    if (!currentUser) return setModalConfig({ isOpen: true, isError: true, title: "Belum Login", message: "Silakan login terlebih dahulu." });

    setIsAddingToCart(true);
    try {
      const { data: existingItem, error: existingError } = await supabase
        .from("cart_items")
        .select("id, qty")
        .eq("user_id", currentUser.id)
        .eq("variant_id", selectedVariant.id)
        .maybeSingle();

      if (existingError) throw existingError;

      if (existingItem) {
        const newTotalQty = existingItem.qty + qty;
        
        // Cek jika jumlah barang di keranjang + yang mau ditambah melebihi stok
        if (newTotalQty > batasStok) {
          setIsAddingToCart(false);
          return setModalConfig({ 
            isOpen: true, 
            isError: true, 
            title: "Melebihi Stok", 
            message: `Kamu sudah punya ${existingItem.qty} pcs di keranjang. Sisa stok hanya cukup untuk menambah ${batasStok - existingItem.qty} pcs lagi.` 
          });
        }

        const { error } = await supabase.from("cart_items").update({ qty: newTotalQty }).eq("id", existingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("cart_items").insert([{
          user_id: currentUser.id,
          variant_id: selectedVariant.id,
          qty,
        }]);
        if (error) throw error;
      }

      await queryClient.invalidateQueries({ queryKey: ["cart"] });
      setModalConfig({ isOpen: true, isError: false, title: "Berhasil!", message: "Produk ditambahkan ke keranjang." });
      setQty(0);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Terjadi kesalahan yang tidak diketahui.";
      setModalConfig({ isOpen: true, isError: true, title: "Gagal", message });
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !reviewVariantId || !newComment.trim()) return;

    setIsSubmittingReview(true);
    try {
      const payload = {
        produk_id: product.id,
        varian_id: reviewVariantId,
        user_id: currentUser.id,
        user_name: currentUser.nama_user,
        rating: newRating,
        comment: newComment.trim(),
      };

      const { data, error } = await supabase.from("reviews").insert([payload]).select().single();
      if (error) throw error;
      if (data) {
        setReviews((current) => [data as Review, ...current]);
        setNewComment("");
        setNewRating(5);
        setModalConfig({ isOpen: true, isError: false, title: "Berhasil!", message: "Ulasan berhasil dikirim!" });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Terjadi kesalahan saat mengirim ulasan.";
      setModalConfig({ isOpen: true, isError: true, title: "Gagal", message });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleSubmitReply = async (reviewId: string) => {
    const text = replyText.trim();
    if (!text) return;
    if (!currentUser) return setModalConfig({ isOpen: true, isError: true, title: "Belum Login", message: "Silakan login terlebih dahulu." });
    
    if (currentUser.role !== 'admin' && currentUser.role !== 'owner') {
      return setModalConfig({ isOpen: true, isError: true, title: "Akses Ditolak", message: "Anda tidak memiliki akses." });
    }

    setIsSubmittingReply(true);
    try {
      const { error } = await supabase.from("reviews").update({ reply: text }).eq("id", reviewId);
      if (error) throw error;

      setReviews((current) => current.map((review) => (review.id === reviewId ? { ...review, reply: text } : review)));
      setReplyText("");
      setReplyingTo(null);
      setModalConfig({ isOpen: true, isError: false, title: "Berhasil!", message: "Balasan berhasil disimpan." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal menyimpan balasan.";
      setModalConfig({ isOpen: true, isError: true, title: "Gagal", message });
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const executeDeleteReview = async () => {
    if (!confirmDeleteId) return;
    setIsDeletingReview(true);

    try {
      const { error } = await supabase.from("reviews").delete().eq("id", confirmDeleteId);
      if (error) throw error;

      setReviews((current) => current.filter((review) => review.id !== confirmDeleteId));
      setConfirmDeleteId(null);
      setModalConfig({ isOpen: true, isError: false, title: "Berhasil!", message: "Ulasan dihapus permanen." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal menghapus ulasan.";
      setModalConfig({ isOpen: true, isError: true, title: "Gagal", message });
    } finally {
      setIsDeletingReview(false);
    }
  };

  const averageRating = reviews.length > 0
    ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1)
    : "0";

  const hasReviewedCurrentVariant = reviews.some(
    (review) => review.user_id === currentUser?.id && review.varian_id === reviewVariantId
  );

  return (
    <>
      <ProductInfo
        product={product}
        selectedVariant={selectedVariant}
        setSelectedVariant={setSelectedVariant}
        setReviewVariantId={setReviewVariantId}
        qty={qty}
        setQty={setQty}
        isAddingToCart={isAddingToCart}
        handleAddToCart={handleAddToCart}
        averageRating={averageRating}
        reviewCount={reviews.length}
      />
      <hr className="mb-16 border-gray-100" />
      <ReviewSection
        currentUser={currentUser}
        product={product}
        reviews={reviews}
        reviewVariantId={reviewVariantId}
        setReviewVariantId={setReviewVariantId}
        hasReviewedCurrentVariant={hasReviewedCurrentVariant}
        newRating={newRating}
        setNewRating={setNewRating}
        newComment={newComment}
        setNewComment={setNewComment}
        isSubmittingReview={isSubmittingReview}
        handleSubmitReview={handleSubmitReview}
        setConfirmDeleteId={setConfirmDeleteId}
        replyingTo={replyingTo}
        setReplyingTo={setReplyingTo}
        replyText={replyText}
        setReplyText={setReplyText}
        handleSubmitReply={handleSubmitReply}
        isSubmittingReply={isSubmittingReply}
      />
      <RelatedProducts relatedProducts={relatedProducts} />

      {/* GENERAL MODAL */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={closeModal}>
          <div className="relative w-full max-w-sm rounded-[2rem] bg-white p-6 sm:p-8 text-center shadow-2xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={closeModal} className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-900">
              <X className="h-5 w-5" />
            </button>
            {modalConfig.isError ? (
              <AlertCircle className="mx-auto mt-1 h-14 w-14 text-red-500 sm:h-16 sm:w-16" />
            ) : (
              <CheckCircle className="mx-auto mt-1 h-14 w-14 text-green-500 sm:h-16 sm:w-16" />
            )}
            <h2 className="mt-5 mb-3 text-xl font-extrabold text-gray-900 sm:text-2xl">{modalConfig.title}</h2>
            <p className="mb-7 leading-relaxed text-gray-500 text-sm sm:text-base">{modalConfig.message}</p>
            <Button type="button" onClick={closeModal} className="w-full h-12 sm:h-14 rounded-xl bg-[#111111] font-bold text-white hover:bg-black">
              {modalConfig.isError ? "Mengerti" : "Lanjut"}
            </Button>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => !isDeletingReview && setConfirmDeleteId(null)}>
          <div className="relative w-full max-w-sm overflow-hidden rounded-[2rem] bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200 sm:p-8" onClick={(e) => e.stopPropagation()}>
            <AlertCircle className="mx-auto h-14 w-14 text-red-500 sm:h-16 sm:w-16" />
            <h2 className="mt-5 mb-2 text-center text-xl font-extrabold text-gray-900">Hapus Ulasan?</h2>
            <p className="mx-auto mb-7 max-w-xs text-center text-sm leading-relaxed text-gray-500">Tindakan ini tidak bisa dibatalkan.</p>
            <div className="grid w-full grid-cols-2 gap-3">
              <Button type="button" disabled={isDeletingReview} onClick={() => setConfirmDeleteId(null)} variant="outline" className="h-11 w-full rounded-xl border-2 border-gray-200 bg-white px-3 font-bold text-gray-800 hover:bg-gray-50 disabled:opacity-50">
                Batal
              </Button>
              <Button type="button" disabled={isDeletingReview} onClick={executeDeleteReview} variant="destructive" className="h-11 w-full rounded-xl px-3 font-bold text-white disabled:opacity-50">
                {isDeletingReview ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menghapus...</> : "Hapus"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}