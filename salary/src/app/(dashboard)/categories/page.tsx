import { getCategories } from "@/actions/categories";
import { CategoriesView } from "@/components/categories/categories-view";

export default async function CategoriesPage() {
  const items = await getCategories();
  return <CategoriesView items={items} />;
}
