import { SiteHeader } from "@/shared/ui/site-header";

export function ShopPage() {
  return (
    <div className="relative flex h-dvh w-full flex-col bg-black px-5 text-white sm:px-8 lg:px-12">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center">
        <h1 className="font-heading text-4xl sm:text-6xl">Coming Soon</h1>
      </main>
    </div>
  );
}
