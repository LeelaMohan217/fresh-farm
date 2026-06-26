import Image from "next/image";
import Link from "next/link";

type Category = { id: number; name: string; slug: string; imageUrl: string | null };

export default function CategoryGrid({ categories }: { categories: Category[] }) {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
      {categories.map((cat) => (
        <Link
          key={cat.id}
          href={`/shop/category/${cat.slug}`}
          className="group flex flex-col items-center gap-2"
        >
          <div className="w-full aspect-square rounded-2xl overflow-hidden bg-green-50 border border-white shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200 relative">
            {cat.imageUrl ? (
              <Image
                src={cat.imageUrl} alt={cat.name}
                fill className="object-cover"
                sizes="(max-width: 640px) 25vw, (max-width: 1024px) 16vw, 12vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl">🌱</div>
            )}
          </div>
          <p className="text-[11px] sm:text-xs font-semibold text-slate-600 group-hover:text-green-700 text-center leading-tight transition-colors line-clamp-2">
            {cat.name}
          </p>
        </Link>
      ))}
    </div>
  );
}
