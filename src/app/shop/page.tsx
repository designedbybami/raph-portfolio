import type { Metadata } from "next";
import { ShopPage } from "@/features/shop/components/shop-page";

export const metadata: Metadata = {
  title: "Shop",
  description: "The Raph Merch Shop.",
  robots: { index: false, follow: false },
};

export default function Shop() {
  return <ShopPage />;
}
