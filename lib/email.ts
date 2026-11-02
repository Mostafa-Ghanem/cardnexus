import nodemailer from "nodemailer";
import { whatsappDigits } from "@/lib/utils";

// ── Transport ──────────────────────────────────────────────────────────────
function createTransport() {
  const host = process.env.SMTP_HOST;
  if (!host) return null; // Email disabled if not configured

  return nodemailer.createTransport({
    host,
    port: parseInt(process.env.SMTP_PORT ?? "587"),
    secure: process.env.SMTP_SECURE === "true", // true = TLS on port 465
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS ?? "" }
      : undefined,
  });
}

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "كارت نكسس";
const FROM = process.env.SMTP_FROM ?? `${APP_NAME} <noreply@example.com>`;
const BRAND = "#0F766E";

/**
 * HTML-escape user-supplied strings so they can't break out of attribute or
 * tag context in our email templates. Closes the XSS / HTML-injection vector
 * in invitation, welcome and similar templates.
 */
function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ── Base layout ────────────────────────────────────────────────────────────
function layout(title: string, body: string) {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Tahoma,'Segoe UI',Arial,sans-serif;direction:rtl;text-align:right;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Logo / brand -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <div style="display:inline-flex;align-items:center;gap:8px;">
                <div style="width:32px;height:32px;background:${BRAND};border-radius:8px;display:inline-block;text-align:center;line-height:32px;color:#fff;font-size:14px;font-weight:700;">${Array.from(APP_NAME)[0] ?? ""}</div>
                <span style="font-size:16px;font-weight:600;color:#0f172a;">${APP_NAME}</span>
              </div>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border-radius:16px;padding:40px 36px;box-shadow:0 1px 3px rgba(0,0,0,.08);">
              ${body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:24px 0 0;color:#9ca3af;font-size:12px;line-height:1.6;">
              &copy; ${new Date().getFullYear()} ${APP_NAME}. جميع الحقوق محفوظة.<br />
              هذه رسالة آلية، من فضلك لا ترد عليها.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function btn(text: string, url: string) {
  return `<a href="${url}" style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;margin:24px 0;">${text}</a>`;
}

function h1(text: string) {
  return `<h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;">${text}</h1>`;
}

function p(text: string) {
  return `<p style="margin:12px 0;font-size:15px;line-height:1.6;color:#374151;">${text}</p>`;
}

function muted(text: string) {
  return `<p style="margin:20px 0 0;font-size:12px;color:#9ca3af;line-height:1.5;">${text}</p>`;
}

// ── Send helper ────────────────────────────────────────────────────────────
async function send(to: string, subject: string, html: string) {
  const transport = createTransport();
  if (!transport) {
    console.warn(`[email] SMTP not configured — skipping email to ${to}: ${subject}`);
    return;
  }
  try {
    await transport.sendMail({ from: FROM, to, subject, html });
  } catch (err) {
    console.error(`[email] Failed to send "${subject}" to ${to}:`, err);
  }
}

// ── Invitation email ───────────────────────────────────────────────────────
export async function sendInvitationEmail({
  to, senderName, orgName, role, inviteUrl,
}: {
  to: string;
  senderName: string;
  orgName: string;
  role: string;
  inviteUrl: string;
}) {
  const roleLabel: Record<string, string> = {
    company_admin: "مدير",
    team_leader:   "قائد فريق",
    member:        "عضو",
  };

  const html = layout(
    esc(`دعوة للانضمام إلى ${orgName}`),
    `
    ${h1(`تمت دعوتك`)}
    ${p(`دعاك <strong>${esc(senderName)}</strong> للانضمام إلى ${esc(APP_NAME)} بصفة <strong>${esc(roleLabel[role] ?? role)}</strong> في مؤسسة <strong>${esc(orgName)}</strong>.`)}
    ${p("أنشئ حسابك المجاني وصمّم بطاقتك الرقمية فورًا.")}
    <div style="text-align:center;">
      ${btn("قبول الدعوة", esc(inviteUrl))}
    </div>
    ${muted(`هذا الرابط صالح لمدة 7 أيام. إذا لم تكن تتوقع هذه الرسالة يمكنك تجاهلها.<br/>الرابط: <span dir="ltr">${esc(inviteUrl)}</span>`)}
    `
  );

  await send(to, `${senderName} يدعوك للانضمام إلى ${orgName}`, html);
}

// ── Welcome email ──────────────────────────────────────────────────────────
export async function sendWelcomeEmail({
  to, name, dashboardUrl,
}: {
  to: string;
  name: string;
  dashboardUrl: string;
}) {
  const html = layout(
    esc(`مرحبًا بك في ${APP_NAME}`),
    `
    ${h1(`أهلًا ${esc(name.split(" ")[0])} 👋`)}
    ${p(`سعداء بانضمامك! حسابك في ${esc(APP_NAME)} جاهز.`)}
    ${p("أنشئ بطاقتك الرقمية الآن، أضف بيانات تواصلك وشاركها عبر رابط أو رمز QR أو شريحة NFC.")}
    <div style="text-align:center;">
      ${btn("الذهاب للوحة التحكم", esc(dashboardUrl))}
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;border-top:1px solid #f3f4f6;padding-top:20px;">
      <tr>
        <td style="font-size:13px;color:#6b7280;line-height:1.8;">
          <strong style="color:#0f172a;">خطواتك التالية:</strong><br/>
          &#10003; صمّم بطاقتك واختر القالب واللون<br/>
          &#10003; نزّل رمز QR أو جهّز شريحة NFC<br/>
          &#10003; تابع الزيارات وبيانات العملاء المحتملين
        </td>
      </tr>
    </table>
    ${muted("وصلتك هذه الرسالة لأنك أنشأت حسابًا للتو.")}
    `
  );

  await send(to, `مرحبًا بك في ${APP_NAME}!`, html);
}

// ── Lead notification email ────────────────────────────────────────────────
export async function sendLeadNotificationEmail({
  to, ownerName, leadName, leadEmail, leadPhone, leadMessage, cardName, dashboardUrl,
}: {
  to: string;
  ownerName: string;
  leadName: string;
  leadEmail?: string | null;
  leadPhone?: string | null;
  leadMessage?: string | null;
  cardName: string;
  dashboardUrl: string;
}) {
  const rows = [
    leadEmail ? `<tr><td style="color:#6b7280;padding:4px 0;width:80px;">البريد الإلكتروني</td><td style="padding:4px 0;"><a href="mailto:${esc(leadEmail)}" style="color:#0f172a;">${esc(leadEmail)}</a></td></tr>` : "",
    leadPhone ? `<tr><td style="color:#6b7280;padding:4px 0;">الجوال</td><td style="padding:4px 0;" dir="ltr"><a href="tel:${esc(leadPhone)}" style="color:#0f172a;">${esc(leadPhone)}</a>${whatsappDigits(leadPhone) ? ` · <a href="https://wa.me/${whatsappDigits(leadPhone)}" style="color:#16a34a;">WhatsApp</a>` : ""}</td></tr>` : "",
    leadMessage ? `<tr><td style="color:#6b7280;padding:4px 0;vertical-align:top;">الرسالة</td><td style="padding:4px 0;">${esc(leadMessage)}</td></tr>` : "",
  ].filter(Boolean).join("");

  const html = layout(
    `عميل محتمل جديد – ${cardName}`,
    `
    ${h1("عميل محتمل جديد على بطاقتك")}
    ${p(`ترك <strong>${esc(leadName)}</strong> بياناته على بطاقتك <strong>${esc(cardName)}</strong>.`)}
    <table style="margin:16px 0;font-size:14px;line-height:1.6;width:100%;">
      <tr><td style="color:#6b7280;padding:4px 0;width:80px;">الاسم</td><td style="padding:4px 0;font-weight:600;">${esc(leadName)}</td></tr>
      ${rows}
    </table>
    <div style="text-align:center;">
      ${btn("عرض العملاء المحتملين", esc(dashboardUrl))}
    </div>
    ${muted("وصلتك هذه الرسالة لأنك فعّلت التنبيهات الفورية. يمكنك تغيير ذلك من الإعدادات.")}
    `
  );

  await send(to, `عميل محتمل جديد: ${leadName} (${cardName})`, html);
}

// ── Org frozen email ──────────────────────────────────────────────────────
export async function sendOrgFrozenEmail({
  to, adminName, orgName, upgradeUrl,
}: {
  to: string;
  adminName: string;
  orgName: string;
  upgradeUrl: string;
}) {
  const html = layout(
    esc(`تم تجميد المؤسسة – ${orgName}`),
    `
    ${h1("تم تجميد مؤسستك")}
    ${p(`أهلًا ${esc(adminName.split(" ")[0])}، انتهت أو أُلغيت باقة <strong>Business</strong> لمؤسسة <strong>${esc(orgName)}</strong>.`)}
    ${p(`مؤسستك وكل بيانات الأعضاء محفوظة. يمكن للأعضاء متابعة استخدام ${esc(APP_NAME)} بحساباتهم المجانية، لكن بدون مزايا المؤسسة.`)}
    <table style="margin:16px 0;border-radius:8px;background:#fef3c7;padding:16px;width:100%;border-right:4px solid #f59e0b;">
      <tr><td style="font-size:14px;color:#92400e;line-height:1.6;">
        <strong>ما تم تجميده:</strong><br/>
        &bull; إدارة الأعضاء والدعوات<br/>
        &bull; قواعد تصميم البطاقات للمؤسسة<br/>
        &bull; الاستيراد الجماعي<br/>
        &bull; دليل الفريق<br/><br/>
        <strong>ما يبقى محفوظًا:</strong><br/>
        &bull; كل البطاقات وبيانات التواصل<br/>
        &bull; كل بيانات الإحصائيات<br/>
        &bull; ارتباط كل الأعضاء بالمؤسسة
      </td></tr>
    </table>
    ${p("جدّد باقة Business لإعادة تفعيل المؤسسة فورًا.")}
    <div style="text-align:center;">
      ${btn("تجديد باقة Business", esc(upgradeUrl))}
    </div>
    ${muted("وصلتك هذه الرسالة بصفتك مدير المؤسسة.")}
    `
  );
  await send(to, `تم تجميد المؤسسة: ${orgName}`, html);
}

// ── Org restored email ─────────────────────────────────────────────────────
export async function sendOrgRestoredEmail({
  to, adminName, orgName, dashboardUrl,
}: {
  to: string;
  adminName: string;
  orgName: string;
  dashboardUrl: string;
}) {
  const html = layout(
    esc(`عادت المؤسسة للعمل – ${orgName}`),
    `
    ${h1("مؤسستك تعمل من جديد")}
    ${p(`أهلًا ${esc(adminName.split(" ")[0])}، تم تفعيل باقة Business من جديد، ومؤسسة <strong>${esc(orgName)}</strong> وكل مزاياها متاحة الآن.`)}
    ${p("كل الأعضاء والبطاقات والإعدادات كما هي.")}
    <div style="text-align:center;">
      ${btn("الذهاب لصفحة الفريق", esc(dashboardUrl))}
    </div>
    ${muted("وصلتك هذه الرسالة بصفتك مدير المؤسسة.")}
    `
  );
  await send(to, `عادت المؤسسة للعمل: ${orgName}`, html);
}

// ── Email change notification ──────────────────────────────────────────────
export async function sendEmailChangeNotification({
  to, newEmail,
}: {
  to: string;
  newEmail: string;
}) {
  const html = layout(
    esc(`تم تغيير البريد الإلكتروني – ${APP_NAME}`),
    `
    ${h1("تم تغيير البريد الإلكتروني")}
    ${p(`تم للتو تغيير البريد الإلكتروني لحسابك في ${esc(APP_NAME)}.`)}
    ${p(`البريد الجديد: <strong dir="ltr">${esc(newEmail)}</strong>`)}
    ${p("إذا <strong>لم</strong> تقم بهذا التغيير بنفسك، تواصل معنا فورًا وغيّر كلمة المرور.")}
    ${muted("أرسلنا تنبيه الأمان هذا إلى بريدك السابق.")}
    `
  );
  await send(to, `تم تغيير البريد الإلكتروني – ${APP_NAME}`, html);
}

// ── Password reset email ───────────────────────────────────────────────────
export async function sendPasswordResetEmail({
  to, url,
}: {
  to: string;
  url: string;
}) {
  const html = layout(
    esc(`إعادة تعيين كلمة المرور – ${APP_NAME}`),
    `
    ${h1("إعادة تعيين كلمة المرور")}
    ${p(`طلبت إعادة تعيين كلمة المرور لحسابك في ${esc(APP_NAME)}. اضغط الزر لتعيين كلمة مرور جديدة.`)}
    <div style="text-align:center;">
      ${btn("تعيين كلمة مرور جديدة", esc(url))}
    </div>
    ${muted(`الرابط صالح لمدة ساعة واحدة. إذا لم تطلب ذلك يمكنك تجاهل الرسالة.<br/>الرابط: <span dir="ltr">${esc(url)}</span>`)}
    `
  );
  await send(to, `إعادة تعيين كلمة المرور – ${APP_NAME}`, html);
}
