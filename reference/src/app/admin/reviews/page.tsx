"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Badge,
  Button,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/shadcn";
import { cn } from "@/lib/utils";
import {
  Star,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  MessageSquare,
} from "lucide-react";

// ---------- types ----------
type ReviewStatus = "pending" | "approved" | "rejected";

interface Review {
  id: string;
  entity: string;
  rating: number;
  title: string;
  body: string;
  author: string;
  date: string;
  status: ReviewStatus;
}


const STATUS_CONFIG: Record<ReviewStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  approved: { label: "Approved", color: "bg-green-100 text-green-800", icon: CheckCircle },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-800", icon: XCircle },
};

// ---------- star rating ----------
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "h-4 w-4",
            i < rating ? "fill-amber-400 text-amber-400" : "text-gray-200"
          )}
        />
      ))}
    </div>
  );
}

// ---------- component ----------
export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("pending");

  useEffect(() => {
    fetch("/api/admin/reviews")
      .then((res) => res.json())
      .then((json) => { setReviews(json.data ?? []); })
      .catch(() => { /* silently handle - empty list is fine */ })
      .finally(() => setLoading(false));
  }, []);

  const pendingCount = reviews.filter((r) => r.status === "pending").length;
  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : "0";

  const filteredReviews =
    activeTab === "all"
      ? reviews
      : reviews.filter((r) => r.status === activeTab);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const allIds = filteredReviews.map((r) => r.id);
    const allSelected = allIds.every((id) => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allIds));
    }
  };

  const bulkUpdateStatus = (status: ReviewStatus) => {
    setReviews((prev) =>
      prev.map((r) => (selectedIds.has(r.id) ? { ...r, status } : r))
    );
    setSelectedIds(new Set());
  };

  const updateStatus = (id: string, status: ReviewStatus) => {
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    fetch(`/api/admin/reviews/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).catch(() => { /* silently handle */ });
  };

  const statCards = [
    {
      label: "Total Reviews",
      value: reviews.length.toString(),
      icon: MessageSquare,
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "Pending",
      value: pendingCount.toString(),
      icon: Clock,
      color: "text-yellow-600 bg-yellow-50",
    },
    {
      label: "Average Rating",
      value: avgRating,
      icon: Star,
      color: "text-amber-600 bg-amber-50",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
        <p className="mt-1 text-sm text-gray-500">
          Moderate user-submitted reviews and ratings
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className={cn("rounded-lg p-2.5", s.color)}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{s.label}</p>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs + Table */}
      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="pending">
                  Pending
                  {pendingCount > 0 && (
                    <span className="ml-1.5 rounded-full bg-yellow-200 px-1.5 py-0.5 text-xs font-semibold text-yellow-800">
                      {pendingCount}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="rejected">Rejected</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>

              {selectedIds.size > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">
                    {selectedIds.size} selected
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => bulkUpdateStatus("approved")}
                    className="text-green-700 hover:bg-green-50"
                  >
                    <CheckCircle className="mr-1 h-4 w-4" />
                    Approve Selected
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => bulkUpdateStatus("rejected")}
                    className="text-red-700 hover:bg-red-50"
                  >
                    <XCircle className="mr-1 h-4 w-4" />
                    Reject Selected
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>

          {(["pending", "approved", "rejected", "all"] as const).map((tab) => (
            <TabsContent key={tab} value={tab}>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <input
                          type="checkbox"
                          checked={
                            filteredReviews.length > 0 &&
                            filteredReviews.every((r) => selectedIds.has(r.id))
                          }
                          onChange={toggleSelectAll}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-28">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReviews.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="py-12 text-center text-gray-500"
                        >
                          No reviews in this category
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredReviews.map((r) => {
                        const cfg = STATUS_CONFIG[r.status];
                        const isExpanded = expandedId === r.id;
                        return (
                          <TableRow key={r.id} className="group">
                            <TableCell>
                              <input
                                type="checkbox"
                                checked={selectedIds.has(r.id)}
                                onChange={() => toggleSelect(r.id)}
                                className="h-4 w-4 rounded border-gray-300"
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              {r.entity}
                            </TableCell>
                            <TableCell>
                              <StarRating rating={r.rating} />
                            </TableCell>
                            <TableCell>
                              <button
                                onClick={() =>
                                  setExpandedId(isExpanded ? null : r.id)
                                }
                                className="flex items-center gap-1 text-left hover:text-blue-600"
                              >
                                <span className="font-medium">{r.title}</span>
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4 shrink-0 text-gray-400" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
                                )}
                              </button>
                              {isExpanded && (
                                <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                                  {r.body}
                                </p>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {r.author}
                            </TableCell>
                            <TableCell className="text-sm text-gray-500">
                              {new Date(r.date).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
                                  cfg.color
                                )}
                              >
                                <cfg.icon className="h-3 w-3" />
                                {cfg.label}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {r.status !== "approved" && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() =>
                                      updateStatus(r.id, "approved")
                                    }
                                    className="h-7 px-2 text-green-600 hover:bg-green-50 hover:text-green-700"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                )}
                                {r.status !== "rejected" && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() =>
                                      updateStatus(r.id, "rejected")
                                    }
                                    className="h-7 px-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </TabsContent>
          ))}
        </Tabs>
      </Card>
    </div>
  );
}
