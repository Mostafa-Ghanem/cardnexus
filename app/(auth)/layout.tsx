import Link from "next/link";
import { getPlatformSettings } from "@/lib/platform";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const s = await getPlatformSettings();
  const initials = s.appName.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <Link href="/" className="flex items-center gap-2 mb-8">
        {s.logoUrl ? (
          <img src={s.logoUrl} alt={s.appName} className="h-9 w-9 rounded-xl object-cover" />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl " style={{ backgroundColor: s.primaryColor }}>
            <span className="text-sm font-bold text-white">{initials}</span>
          </div>
        )}
        <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">{s.appName}</span>
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
