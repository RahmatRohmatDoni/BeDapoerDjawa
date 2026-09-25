"use client";

import React from "react";
import Link from "next/link";
import { Star, CheckCircle, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStoreSettings } from "@/lib/store-settings-context";

export interface ProductVariant { id: string; ukuran: string; }
export interface ProductDisplay { id: string; variants: ProductVariant[]; }
export interface Review {
  id: string; user_id: string; user_name: string; rating: number;
  comment: string; created_at: string; varian_id: string; reply?: string | null;
}

interface ReviewSectionProps {
  currentUser: { id: string; nama_user: string; email: string; role?: string; } | null;
  product: ProductDisplay;
  reviews: Review[];
  reviewVariantId: string;
  setReviewVariantId: (id: string) => void;
  hasReviewedCurrentVariant: boolean;
  newRating: number;
  setNewRating: (rating: number) => void;
  newComment: string;
  setNewComment: (comment: string) => void;
  isSubmittingReview: boolean;
  handleSubmitReview: (e: React.FormEvent) => void;
  setConfirmDeleteId: (id: string) => void;
  replyingTo: string | null;
  setReplyingTo: (id: string | null) => void;
  replyText: string;
  setReplyText: (text: string) => void;
  handleSubmitReply: (reviewId: string) => void;
  isSubmittingReply: boolean;
}

export default function ReviewSection({
  currentUser, product, reviews, reviewVariantId, setReviewVariantId,
  hasReviewedCurrentVariant, newRating, setNewRating, newComment, setNewComment,
  isSubmittingReview, handleSubmitReview, setConfirmDeleteId,
  replyingTo, setReplyingTo, replyText, setReplyText, handleSubmitReply, isSubmittingReply
}: ReviewSectionProps) {
  const storeSettings = useStoreSettings();
  
  return (
    <div className="mb-12 md:mb-20">
      <h2 className="mb-6 md:mb-8 text-xl md:text-2xl font-bold text-[#111111]">Ulasan Pelanggan</h2>

      <div className="flex flex-col lg:flex-row gap-8 md:gap-12">
        {/* FORM TAMBAH ULASAN */}
        <div className="w-full lg:w-1/3 bg-gray-50 p-5 md:p-8 rounded-2xl md:rounded-[2rem] h-fit border border-gray-100">
          <h3 className="font-bold text-base md:text-lg mb-4 md:mb-6 text-black">Tulis Ulasan Anda</h3>

          {currentUser ? (
            <div className="flex flex-col gap-4 md:gap-5">
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Pilih Varian</label>
                <select
                  value={reviewVariantId}
                  onChange={(e) => setReviewVariantId(e.target.value)}
                  className="w-full p-3 md:p-4 rounded-xl border border-gray-200 text-sm text-black bg-white cursor-pointer focus:ring-2 focus:ring-black outline-none"
                >
                  {product.variants.map((variant) => (
                    <option key={variant.id} value={variant.id}>{variant.ukuran}</option>
                  ))}
                </select>
              </div>

              {hasReviewedCurrentVariant ? (
                <div className="text-center py-5 md:py-6 px-4 border-2 border-dashed border-green-200 rounded-2xl bg-green-50/50 mt-2">
                  <CheckCircle className="w-6 h-6 md:w-8 md:h-8 text-green-500 mx-auto mb-2 md:mb-3" />
                  <p className="text-green-700 text-xs md:text-sm font-semibold">Ulasan Anda untuk varian ini sudah kami terima. Terima kasih!</p>
                </div>
              ) : (
                <form onSubmit={handleSubmitReview} className="flex flex-col gap-4 md:gap-5">
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Penilaian</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} type="button" onClick={() => setNewRating(star)} className={`transition-colors ${star <= newRating ? "text-[#FACC15]" : "text-gray-200 hover:text-gray-300"}`}>
                          <Star className="w-6 h-6 md:w-8 md:h-8 fill-current" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Ceritakan pengalamanmu</label>
                    <textarea
                      required
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={4}
                      className="w-full p-3 md:p-4 rounded-xl border border-gray-200 text-sm text-black focus:ring-2 focus:ring-black outline-none resize-none"
                      placeholder="Bagaimana rasa dan kualitas kuenya?"
                    />
                  </div>

                  <Button type="submit" disabled={isSubmittingReview || !reviewVariantId} className="w-full bg-[#111111] text-white h-12 md:h-14 rounded-xl font-bold hover:bg-black disabled:bg-gray-300 text-sm">
                    {isSubmittingReview ? <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" /> : "Kirim Ulasan"}
                  </Button>
                </form>
              )}
            </div>
          ) : (
            <div className="text-center py-8 md:py-10 px-4 border-2 border-dashed border-gray-200 rounded-2xl bg-white mt-2 md:mt-4">
              <User className="w-8 h-8 md:w-10 md:h-10 text-gray-300 mx-auto mb-3 md:mb-4" />
              <p className="text-gray-500 text-xs md:text-sm mb-5 md:mb-6 font-medium">Anda harus masuk untuk menulis ulasan produk.</p>
              <Link href="/login">
                <Button className="w-full bg-[#111111] font-bold text-white h-10 md:h-12 rounded-xl text-xs md:text-sm">Masuk Sekarang</Button>
              </Link>
            </div>
          )}
        </div>

        {/* DAFTAR ULASAN */}
        <div className="w-full lg:w-2/3 flex flex-col gap-4 md:gap-6 max-h-125 md:max-h-150 overflow-y-auto pr-2 md:pr-4 custom-scrollbar">
          {reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 md:py-20 text-center bg-gray-50 rounded-2xl md:rounded-[2rem] border border-gray-100">
              <Star className="w-10 h-10 md:w-12 md:h-12 text-gray-200 mb-3 md:mb-4" />
              <p className="text-gray-500 font-medium text-sm md:text-base">Belum ada ulasan untuk produk ini.<br />Jadilah yang pertama!</p>
            </div>
          ) : (
            reviews.map((rev) => {
              const isAdmin = !!currentUser && (currentUser.role === 'admin' || currentUser.role === 'owner');
              const isReplying = replyingTo === rev.id;

              return (
                <div key={rev.id} className="border-b border-gray-100 pb-6 md:pb-8 pt-3 md:pt-4 bg-white flex gap-3 md:gap-4 items-start">
                  <div className="shrink-0 bg-gray-100 p-2 md:p-3 rounded-full">
                    <User className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2 md:mb-3 gap-2 md:gap-4">
                      <div>
                        <p className="font-bold text-gray-900 text-xs md:text-sm">{rev.user_name}</p>
                        <p className="text-[10px] md:text-xs text-gray-400 mt-0.5">
                          {new Date(rev.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                      </div>
                      <div className="flex text-[#FACC15]">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3 h-3 md:w-4 md:h-4 ${i < rev.rating ? "fill-current" : "text-gray-200"}`} />
                        ))}
                      </div>
                    </div>

                    <p className="text-gray-700 text-sm md:text-base leading-relaxed">{rev.comment}</p>

                    {rev.reply && (
                      <div className="mt-3 md:mt-4 p-3 md:p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <p className="text-[10px] md:text-xs font-bold text-gray-900 mb-1">{`Balasan dari Admin ${storeSettings.store_name}:`}</p>
                        <p className="text-xs md:text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{rev.reply}</p>
                      </div>
                    )}

                    {isAdmin && (
                      <div className="mt-3 md:mt-4 flex items-center gap-3 md:gap-4">
                        <button type="button" onClick={() => setConfirmDeleteId(rev.id)} className="text-[10px] md:text-xs font-semibold text-red-500 hover:text-red-700 transition">Hapus Ulasan</button>
                        <button
                          type="button"
                          disabled={isSubmittingReply}
                          onClick={() => {
                            if (isReplying) { setReplyingTo(null); setReplyText(""); return; }
                            setReplyingTo(rev.id); setReplyText(rev.reply || "");
                          }}
                          className="text-[10px] md:text-xs font-semibold text-blue-600 hover:text-blue-800 transition disabled:opacity-50"
                        >
                          {isReplying ? "Tutup" : rev.reply ? "Edit Balasan" : "Balas"}
                        </button>
                      </div>
                    )}

                    {isReplying && (
                      <div className="mt-3 md:mt-4 p-3 md:p-4 rounded-xl md:rounded-2xl bg-blue-50 border border-blue-100">
                        <label className="block text-xs md:text-sm font-bold text-gray-800 mb-2">Balasan Admin</label>
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          rows={3}
                          disabled={isSubmittingReply}
                          className="w-full border-2 border-gray-200 rounded-lg md:rounded-xl px-3 py-2 md:px-4 md:py-3 text-xs md:text-sm text-black bg-white outline-none resize-none focus:border-blue-400 disabled:bg-gray-100"
                          placeholder="Tulis balasan admin..."
                        />
                        <div className="mt-2 md:mt-3 flex justify-end gap-2">
                          <Button type="button" disabled={isSubmittingReply} onClick={() => { setReplyingTo(null); setReplyText(""); }} className="h-8 md:h-10 text-xs md:text-sm rounded-lg md:rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-100">Batal</Button>
                          <Button type="button" disabled={isSubmittingReply || !replyText.trim()} onClick={() => handleSubmitReply(rev.id)} className="h-8 md:h-10 text-xs md:text-sm rounded-lg md:rounded-xl bg-blue-600 text-white hover:bg-blue-700 min-w-20 md:min-w-25">
                            {isSubmittingReply ? <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin mr-1 md:mr-2" /> : rev.reply ? "Simpan" : "Kirim"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}