import { getPlatformSettings } from "@/lib/platform";
import { telegramConfigured } from "@/lib/telegram";
import { AdminSettingsClient } from "./client";
import { TelegramSetup } from "./TelegramSetup";

export const metadata = { title: "إعدادات المنصة" };

export default async function AdminSettingsPage() {
  const settings = await getPlatformSettings();
  return (
    <div className="space-y-6">
      <AdminSettingsClient settings={settings} />
      <div className="max-w-2xl">
        <TelegramSetup configured={telegramConfigured()} />
      </div>
    </div>
  );
}
