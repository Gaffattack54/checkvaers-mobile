import { BottomTabs } from "@/components/shared/bottom-tabs";

export default function TabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col pb-24">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-hex-pattern bg-repeat opacity-[0.04]" />
      <main className="flex flex-1 flex-col">{children}</main>
      <BottomTabs />
    </div>
  );
}
