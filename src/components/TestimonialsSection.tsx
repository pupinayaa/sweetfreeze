import React, { useState } from 'react';
import { Star, MessageSquareQuote, CheckCircle, Plus } from 'lucide-react';
import { Testimonial } from '../types';
import { api } from '../lib/api';

interface TestimonialsSectionProps {
  testimonials: Testimonial[];
  onRefresh?: () => void;
}

export const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({ testimonials, onRefresh }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !comment.trim()) return;

    setIsSubmitting(true);
    try {
      await api.createTestimonial({
        customer_name: name.trim(),
        rating,
        comment: comment.trim(),
        avatar_url: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 1000)}?auto=format&fit=crop&w=200&q=80`
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setShowAddModal(false);
        setName('');
        setComment('');
        if (onRefresh) onRefresh();
      }, 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10">
          <div>
            <div className="flex items-center gap-2 text-pink-600 text-xs font-bold uppercase tracking-wider mb-1.5">
              <MessageSquareQuote className="w-4 h-4" />
              <span>Kata Mereka Tentang Delicia</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-stone-900 tracking-tight">
              Testimoni Pecinta Manis
            </h2>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 sm:mt-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 text-xs font-bold border border-pink-200 transition active:scale-95 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Tulis Pengalaman Anda</span>
          </button>
        </div>

        {/* Testimonials Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.id}
              className="p-6 rounded-3xl bg-pink-50/30 border border-pink-100/80 hover:border-pink-300 hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Rating Stars */}
                <div className="flex items-center gap-1 text-amber-400 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < t.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-300'
                      }`}
                    />
                  ))}
                </div>

                {/* Comment Quote */}
                <p className="text-xs sm:text-sm text-stone-700 leading-relaxed italic">
                  "{t.comment}"
                </p>
              </div>

              {/* Customer Author */}
              <div className="flex items-center gap-3 pt-5 mt-4 border-t border-pink-100">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-stone-200 shrink-0 border border-white shadow-2xs">
                  <img
                    src={t.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                    alt={t.customer_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-stone-900 line-clamp-1">
                    {t.customer_name}
                  </h4>
                  <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
                    <CheckCircle className="w-3 h-3" />
                    <span>Verified Customer</span>
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>

        {/* Add Testimonial Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
            <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-pink-100 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <h3 className="font-display font-bold text-lg text-stone-900">
                  Bagikan Cerita Manis Anda
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 rounded-full text-stone-400 hover:text-stone-700"
                >
                  ✕
                </button>
              </div>

              {submitted ? (
                <div className="text-center py-6 text-emerald-600 space-y-2">
                  <CheckCircle className="w-12 h-12 mx-auto" />
                  <p className="font-bold text-sm">Terima kasih atas ulasan manis Anda!</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Nama Anda
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Contoh: Jessica"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm focus:outline-hidden focus:border-pink-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Rating Kepuasan
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="p-1 text-amber-400 hover:scale-110 transition"
                        >
                          <Star
                            className={`w-6 h-6 ${
                              star <= rating ? 'fill-amber-400 text-amber-400' : 'text-stone-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Ulasan & Pengalaman Rasa
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Bagaimana rasa hidangan dan pelayanan toko kami? Ceritakan di sini..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm focus:outline-hidden focus:border-pink-500"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-4 py-2.5 rounded-xl bg-stone-100 text-stone-600 text-xs font-semibold"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold transition"
                    >
                      {isSubmitting ? 'Mengirim...' : 'Kirim Testimoni'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
