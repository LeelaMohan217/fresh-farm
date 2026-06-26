"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";

export type CartItem = {
  id: number;
  name: string;
  price: number;
  unit: string;
  quantity: number;
};

type CartContextType = {
  items: CartItem[];
  add: (item: Omit<CartItem, "quantity">) => Promise<void>;
  remove: (id: number) => Promise<void>;
  update: (id: number, quantity: number) => Promise<void>;
  clear: () => Promise<void>;
  total: number;
  count: number;
};

const CartContext = createContext<CartContextType>({
  items: [], add: async () => {}, remove: async () => {}, update: async () => {}, clear: async () => {},
  total: 0, count: 0,
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);

  const fetchCart = useCallback(async () => {
    try {
      const res = await fetch("/api/cart");
      if (res.ok) setItems(await res.json());
      else setItems([]);
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    if (loading) return;
    if (user) fetchCart();
    else setItems([]);
  }, [user, loading, fetchCart]);

  const add = async (item: Omit<CartItem, "quantity">) => {
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: item.id }),
    });
    if (res.ok) {
      const updated: CartItem = await res.json();
      setItems((prev) => {
        const exists = prev.find((i) => i.id === updated.id);
        if (exists) return prev.map((i) => i.id === updated.id ? updated : i);
        return [...prev, updated];
      });
    }
  };

  const remove = async (id: number) => {
    const res = await fetch(`/api/cart/${id}`, { method: "DELETE" });
    if (res.ok) setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const update = async (id: number, quantity: number) => {
    if (quantity < 1) return remove(id);
    const res = await fetch(`/api/cart/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity }),
    });
    if (res.ok) setItems((prev) => prev.map((i) => i.id === id ? { ...i, quantity } : i));
  };

  const clear = async () => {
    const res = await fetch("/api/cart", { method: "DELETE" });
    if (res.ok) setItems([]);
  };

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const count = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, add, remove, update, clear, total, count }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
