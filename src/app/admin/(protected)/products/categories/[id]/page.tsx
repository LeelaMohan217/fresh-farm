import { redirect } from "next/navigation";

export default function LegacySubCategoryPage() {
  redirect("/admin/products/categories/subcategories");
}
