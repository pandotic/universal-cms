"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Button,
  Badge,
  Select,
  Input,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Card,
  CardContent,
} from "@pandotic/universal-cms/components/ui";
import {
  MessageSquare,
  Search,
  Star,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";

type ReviewStatus = "pending" | "approved" | "rejected";

interface Review {
  id: string;
  author_name: string;
  entity_name: string;
  rating: number;
  content: string;
  status: ReviewStatus;
  created_at: string;
}

const STATUS_VARIANT: Record<ReviewStatus, "secondary" | "success" | "destructive"> = {
  pending: "secondary",
  approved: "success",
  rejected: "destructive",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i < rating
              ? "fill-yellow-400 text-yellow-400"
              : "text-foreground-tertiary"
          }`}
        />
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch("/api/admin/reviews")
      .then((res) => res.json())
      .then((json) => {
        setReviews(json.data ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredReviews = useMemo(() => {
    return reviews.filter((review) => {
      const matchesStatus = statusFilter === "all" || review.status === statusFilter;
      const matchesSearch =
        !searchQuery ||
        review.author_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        review.entity_name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [reviews, statusFilter, searchQuery]);

  function updateStatus(id: string, status: ReviewStatus) {
    fetch(`/api/admin/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
      .then((res) => {
        if (res.ok) {
          setReviews((prev) =>
            prev.map((r) => (r.id === id ? { ...r, status } : r))
          );
        }
      })
      .catch(() => {});
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-sm text-foreground-secondary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reviews</h1>
        <p className="text-foreground-secondary">
          Manage and moderate user reviews.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-tertiary" />
          <Input
            placeholder="Search by author or entity..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearchQuery(e.target.value)
            }
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            setStatusFilter(e.target.value as ReviewStatus | "all")
          }
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </Select>
      </div>

      {/* Table / Empty State */}
      {filteredReviews.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <MessageSquare className="h-12 w-12 text-foreground-tertiary" />
            <h3 className="mt-4 text-lg font-semibold">No reviews found</h3>
            <p className="mt-1 text-sm text-foreground-secondary">
              {reviews.length === 0
                ? "Reviews will appear here once users submit them."
                : "No reviews match your current filters."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Author</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Content</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReviews.map((review) => (
                <TableRow key={review.id}>
                  <TableCell className="font-medium">
                    {review.author_name}
                  </TableCell>
                  <TableCell className="text-foreground-secondary">
                    {review.entity_name}
                  </TableCell>
                  <TableCell>
                    <StarRating rating={review.rating} />
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    <p className="truncate text-foreground-secondary">
                      {review.content}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[review.status]}>
                      {review.status.charAt(0).toUpperCase() +
                        review.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-foreground-secondary">
                    {formatDate(review.created_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {review.status !== "approved" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateStatus(review.id, "approved")}
                          title="Approve"
                        >
                          <ThumbsUp className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                      {review.status !== "rejected" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateStatus(review.id, "rejected")}
                          title="Reject"
                        >
                          <ThumbsDown className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
