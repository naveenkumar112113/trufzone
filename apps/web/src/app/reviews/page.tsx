'use client';

import React, { useState, useEffect } from 'react';
import { 
  Star, MessageSquare, ThumbsUp, ShieldCheck, 
  MapPin, CheckCircle2, CornerDownRight, Send,
  Filter, Sparkles, Database, RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { getOwnerReviews, addReviewReply } from '@/services/api';
import { useUserRole } from '@/context/UserRoleContext';
import { cn } from '@/lib/utils';

export interface ReviewItem {
  id: string;
  customerName: string;
  turfId: string;
  turfName: string;
  rating: number;
  date: string;
  comment: string;
  categories?: {
    ground?: number;
    lighting?: number;
    cleanliness?: number;
    staff?: number;
  };
  verifiedBooking?: boolean;
  reply?: {
    author: string;
    date: string;
    text: string;
  };
}

export default function ReviewsPage() {
  const { isAuthenticated, isOwner, isAdmin } = useUserRole();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [filterRating, setFilterRating] = useState<number | 'ALL'>('ALL');
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchLiveReviews = async () => {
    if (!isAuthenticated || (!isOwner && !isAdmin)) return;
    setLoading(true);
    try {
      const res = await getOwnerReviews();
      if (res.data?.success && Array.isArray(res.data?.data) && res.data.data.length > 0) {
        const mapped: ReviewItem[] = res.data.data.map((r: any) => ({
          id: r._id || r.id,
          turfId: r.turfId?._id || r.turfId || '',
          turfName: r.turfId?.name || r.turfName || 'Sports Arena',
          customerName: r.authorName || r.userId?.name || 'Verified Player',
          rating: r.rating || 5,
          date: r.date || (r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'Recently'),
          comment: r.comment || '',
          categories: r.categories,
          verifiedBooking: r.verifiedBooking !== undefined ? r.verifiedBooking : true,
          reply: r.reply
        }));
        setReviews(mapped);
      } else {
        setReviews([]);
      }
    } catch (err) {
      console.error('fetchLiveReviews error:', err);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveReviews();
  }, [isAuthenticated, isOwner, isAdmin]);

  const filteredReviews = reviews.filter(r => {
    if (filterRating === 'ALL') return true;
    return Math.floor(r.rating) === filterRating;
  });

  const handleSendReply = async (reviewId: string) => {
    const text = replyTextMap[reviewId];
    if (!text) return;

    try {
      await addReviewReply(reviewId, text);
    } catch (err) {
      console.error('addReviewReply error:', err);
    }

    setReviews(prev => prev.map(r => {
      if (r.id === reviewId) {
        return {
          ...r,
          reply: {
            author: 'John (TurfHub Owner)',
            date: 'Just now',
            text
          }
        };
      }
      return r;
    }));

    setReplyTextMap(prev => ({ ...prev, [reviewId]: '' }));
    setActiveReplyId(null);
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              Player Ratings & Reviews
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-bold">
              {reviews.length} {reviews.length === 1 ? 'Review' : 'Reviews'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Monitor player feedback, ground quality ratings, and respond to match reviews.
          </p>
        </div>

        <button
          onClick={fetchLiveReviews}
          disabled={loading}
          title="Refresh from MongoDB"
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted font-bold text-xs text-foreground transition-colors shadow-xs"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
          Refresh
        </button>
      </div>


      {/* Ratings Overview Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Overall Score & Star Breakdown */}
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-8">
              
              {/* Score Box */}
              <div className="flex flex-col items-center justify-center p-6 rounded-3xl bg-muted/30 border border-border min-w-[180px] text-center">
                <span className="text-5xl font-black text-foreground font-mono">4.8</span>
                <div className="flex text-amber-400 my-1.5 text-lg">
                  {'★'.repeat(5)}
                </div>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  142 Player Reviews
                </span>
                <span className="text-[10px] text-emerald-500 font-extrabold mt-1">
                  ● 96% Recommended
                </span>
              </div>

              {/* Star Breakdown Bars */}
              <div className="flex-1 space-y-2 text-xs">
                {[
                  { star: '5 ★', pct: 82, count: 116 },
                  { star: '4 ★', pct: 12, count: 18 },
                  { star: '3 ★', pct: 4, count: 5 },
                  { star: '2 ★', pct: 1, count: 2 },
                  { star: '1 ★', pct: 1, count: 1 },
                ].map(b => (
                  <div key={b.star} className="flex items-center gap-3">
                    <span className="w-8 font-bold text-muted-foreground shrink-0">{b.star}</span>
                    <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
                      <div 
                        className="h-full bg-amber-400 rounded-full"
                        style={{ width: `${b.pct}%` }}
                      />
                    </div>
                    <span className="w-8 font-mono font-bold text-right text-muted-foreground shrink-0">
                      {b.count}
                    </span>
                  </div>
                ))}
              </div>

            </div>
          </CardContent>
        </Card>

        {/* Category Ratings Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">Category Scores</CardTitle>
            <p className="text-xs text-muted-foreground">Player satisfaction benchmarks</p>
          </CardHeader>
          <CardContent className="space-y-3.5 pt-1 text-xs">
            {[
              { category: 'Pitch & Turf Quality', score: '4.9 ★', sub: 'FIFA Grade grass' },
              { category: 'Night Floodlights', score: '4.8 ★', sub: '400W LED anti-glare' },
              { category: 'Changing Rooms & Hygiene', score: '4.8 ★', sub: 'Filtered drinking water' },
              { category: 'Staff Cooperation', score: '4.9 ★', sub: 'Courteous court marshals' },
            ].map((cat, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30 border border-border">
                <div>
                  <p className="font-bold text-foreground">{cat.category}</p>
                  <p className="text-[10px] text-muted-foreground">{cat.sub}</p>
                </div>
                <span className="font-mono font-black text-amber-400 text-sm">{cat.score}</span>
              </div>
            ))}
          </CardContent>
        </Card>

      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3 overflow-x-auto">
        {(['ALL', 5, 4, 3] as const).map((r) => (
          <button
            key={String(r)}
            onClick={() => setFilterRating(r)}
            className={cn(
              'px-4 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0',
              filterRating === r 
                ? 'bg-primary text-primary-foreground shadow-xs' 
                : 'bg-muted/60 text-muted-foreground hover:text-foreground'
            )}
          >
            {r === 'ALL' ? 'All Reviews' : `${r} Stars Only`}
          </button>
        ))}
      </div>

      {/* Reviews Cards List */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <div className="max-w-md mx-auto space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto text-muted-foreground">
                <Star className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-foreground text-base">No Customer Reviews Yet</h3>
              <p className="text-xs text-muted-foreground">
                Verified players can leave ratings and feedback after completing match bookings at your venues.
              </p>
            </div>
          </Card>
        ) : (
          filteredReviews.map(review => (
            <Card key={review.id} className="border-border hover:border-border/80 transition-colors">
            <CardContent className="p-5 sm:p-6 space-y-4">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 text-primary font-black flex items-center justify-center text-sm">
                    {review.customerName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-foreground">{review.customerName}</h3>
                      {review.verifiedBooking && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.2 rounded-full border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" /> Verified Match
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{review.turfName} · {review.date}</p>
                  </div>
                </div>

                <div className="flex text-amber-400 text-sm">
                  {'★'.repeat(Math.floor(review.rating))}
                </div>
              </div>

              {/* Comment Content */}
              <p className="text-sm text-foreground/90 leading-relaxed">
                "{review.comment}"
              </p>

              {/* Existing Owner Reply */}
              {review.reply && (
                <div className="p-4 rounded-2xl bg-muted/40 border border-border text-xs space-y-1 ml-4 sm:ml-8">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary flex items-center gap-1">
                      <CornerDownRight className="w-3.5 h-3.5" />
                      {review.reply.author}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{review.reply.date}</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed pl-4">
                    {review.reply.text}
                  </p>
                </div>
              )}

              {/* Reply Form Trigger */}
              {!review.reply && (
                <div className="pt-2">
                  {activeReplyId === review.id ? (
                    <div className="space-y-2 pt-2 border-t border-border">
                      <textarea
                        rows={2}
                        value={replyTextMap[review.id] || ''}
                        onChange={(e) => setReplyTextMap(prev => ({ ...prev, [review.id]: e.target.value }))}
                        placeholder="Write a courteous owner response..."
                        className="w-full p-3 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:border-primary resize-none"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setActiveReplyId(null)}
                          className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:bg-muted"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSendReply(review.id)}
                          className="px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:bg-primary-hover flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" /> Send Reply
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setActiveReplyId(review.id)}
                      className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Reply as Turf Owner
                    </button>
                  )}
                </div>
              )}

            </CardContent>
          </Card>
        )))}
      </div>

    </div>
  );
}
