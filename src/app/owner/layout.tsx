import { PortalNav } from "@/components/portal/PortalNav";

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <PortalNav />
      <main className="px-4 sm:px-10 md:px-16 lg:px-24 py-6 sm:py-8">{children}</main>
    </div>
  );
}
