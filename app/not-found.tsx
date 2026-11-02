import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
      <p className="text-7xl font-bold text-muted-foreground mb-4">404</p>
      <h1 className="text-2xl font-semibold mb-2">الصفحة غير موجودة</h1>
      <p className="text-muted-foreground mb-8">هذه الصفحة أو البطاقة غير موجودة أو غير عامة.</p>
      <Button asChild>
        <Link href="/">الصفحة الرئيسية</Link>
      </Button>
    </div>
  );
}
