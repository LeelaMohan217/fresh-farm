"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

type Category = { id: number; name: string; slug: string; imageUrl: string | null };

const COLS = 5;     // per row on mobile/tablet
const ROWS = 2;     // max rows before "see all"
const MAX_VISIBLE = COLS * ROWS; // 10

export default function CategoryGrid({ categories }: { categories: Category[] }) {
  const [expanded, setExpanded] = useState(false);

  const visible = expanded ? categories : categories.slice(0, MAX_VISIBLE);
  const hasMore = categories.length > MAX_VISIBLE;

  return (
    <div>
      <div className="grid grid-cols-5 gap-3">
        {visible.map((cat) => (
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
                  sizes="(max-width: 640px) 20vw, 10vw"
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

      {hasMore && !expanded && (
        <div className="mt-4 text-center">
          <button
            onClick={() => setExpanded(true)}
            className="text-sm font-semibold text-green-600 hover:text-green-700 transition-colors cursor-pointer"
          >
            + {categories.length - MAX_VISIBLE} more categories
          </button>
        </div>
      )}
    </div>
  );
}
