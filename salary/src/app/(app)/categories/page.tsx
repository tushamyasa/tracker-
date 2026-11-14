import type { Metadata } from "next";
import { Suspense } from "react";
import { CategoriesView } from "@/components/categories/categories-view";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/db/client";
import { listCategories } from "@/server/categories";
import { requireUserId } from "@/server/session";

export const metadata: Metadata = { title: "Категории — Salary" };

export default function CategoriesPage() {
  return (
    <Suspense fallback={<CategoriesSkeleton />}>
      <CategoriesContent />
    </Suspense>
  );
}

async function CategoriesContent() {
  const userId = await requireUserId();
  const categories = await listCategories(db, userId);
  return <CategoriesView categories={categories} />;
}

function CategoriesSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-48" />
      <div className="space-y-2">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    </div>
  );
}
