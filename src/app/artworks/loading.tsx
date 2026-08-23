import { SiteHeader } from "@/shared/ui/site-header";

// Mirrors the loaded page's shell so the nav stays put while the route resolves.
export default function Loading() {
  return (
    <div className="relative h-dvh w-full overflow-hidden bg-black text-white">
      <div className="relative z-20 px-5 sm:px-8 lg:px-12">
        <SiteHeader />
      </div>
    </div>
  );
}
