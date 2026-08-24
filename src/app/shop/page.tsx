import type { Metadata } from "next";
import { ShopPage } from "@/features/shop/components/shop-page";
import { pageMetadata } from "@/shared/lib/page-metadata";

export const metadata: Metadata = pageMetadata({
  title: "Shop",
  description: "Merch and prints from Àlabí Raphael, coming soon.",
  path: "/shop",
  robots: { index: false, follow: false },
});

export default function Shop() {
  return <ShopPage />;
}
