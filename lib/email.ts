import { env } from "cloudflare:workers";

// Workers cannot establish an SMTP socket; use Brevo transactional HTTPS API.
// Never log API keys or user content. Sender domain must be verified in Brevo.
const FROM = env.EMAIL_FROM || "noreply@example.invalid";
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "CardNexus";

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
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Logo / brand -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <div style="display:inline-flex;align-items:center;gap:8px;">
                <div style="width:32px;height:32px;background:#0f172a;border-radius:8px;display:inline-block;text-align:center;line-height:32px;color:#fff;font-size:12px;font-weight:700;">${APP_NAME.slice(0, 2).toUpperCase()}</div>
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
              &copy; ${new Date().getFullYear()} ${APP_NAME}. Alle Rechte vorbehalten.<br />
              Diese E-Mail wurde automatisch generiert. Bitte nicht antworten.
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
  return `<a href="${url}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;margin:24px 0;">${text}</a>`;
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
  const apiKey = env.BREVO_API_KEY;
  if (!apiKey || !env.EMAIL_FROM) {
    throw new Error("Transactional email is not configured (BREVO_API_KEY and EMAIL_FROM required)");
  }
  const result = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: { email: FROM, name: env.EMAIL_FROM_NAME || "CardNexus" },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
    signal: AbortSignal.timeout(12000),
  });
  if (!result.ok) {
    console.error("Brevo email failed", result.status);
    throw new Error("Email delivery failed");
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
    company_admin: "Administrator",
    team_leader:   "Team Leader",
    member:        "Mitglied",
  };

  const html = layout(
    esc(`Einladung zu ${orgName}`),
    `
    ${h1(`Du wurdest eingeladen`)}
    ${p(`<strong>${esc(senderName)}</strong> hat dich eingeladen, ${esc(APP_NAME)} als <strong>${esc(roleLabel[role] ?? role)}</strong> der Organisation <strong>${esc(orgName)}</strong> beizutreten.`)}
    ${p("Erstelle deinen kostenlosen Account und gestalte sofort deine digitale Visitenkarte.")}
    <div style="text-align:center;">
      ${btn("Einladung annehmen", esc(inviteUrl))}
    </div>
    ${muted(`Dieser Link ist 7 Tage gültig. Falls du diese E-Mail nicht erwartet hast, kannst du sie ignorieren.<br/>Link: ${esc(inviteUrl)}`)}
    `
  );

  await send(to, `${senderName} lädt dich zu ${orgName} ein`, html);
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
    esc(`Willkommen bei ${APP_NAME}`),
    `
    ${h1(`Hallo ${esc(name.split(" ")[0])} 👋`)}
    ${p(`Schön, dass du dabei bist! Dein ${esc(APP_NAME)}-Account ist bereit.`)}
    ${p("Erstelle jetzt deine digitale Visitenkarte, füge deine Kontaktdaten ein und teile sie per Link, QR-Code oder NFC-Chip.")}
    <div style="text-align:center;">
      ${btn("Zum Dashboard", esc(dashboardUrl))}
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;border-top:1px solid #f3f4f6;padding-top:20px;">
      <tr>
        <td style="font-size:13px;color:#6b7280;line-height:1.8;">
          <strong style="color:#0f172a;">Was du als Nächstes tun kannst:</strong><br/>
          &#10003; Karte gestalten &rarr; Template und Farbe wählen<br/>
          &#10003; QR-Code herunterladen oder NFC-Tag einrichten<br/>
          &#10003; Analytics aktivieren und Aufrufe tracken
        </td>
      </tr>
    </table>
    ${muted("Du erhältst diese E-Mail, weil du dich soeben registriert hast.")}
    `
  );

  await send(to, `Willkommen bei ${APP_NAME}!`, html);
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
    leadEmail ? `<tr><td style="color:#6b7280;padding:4px 0;width:80px;">E-Mail</td><td style="padding:4px 0;"><a href="mailto:${esc(leadEmail)}" style="color:#0f172a;">${esc(leadEmail)}</a></td></tr>` : "",
    leadPhone ? `<tr><td style="color:#6b7280;padding:4px 0;">Telefon</td><td style="padding:4px 0;">${esc(leadPhone)}</td></tr>` : "",
    leadMessage ? `<tr><td style="color:#6b7280;padding:4px 0;vertical-align:top;">Nachricht</td><td style="padding:4px 0;">${esc(leadMessage)}</td></tr>` : "",
  ].filter(Boolean).join("");

  const html = layout(
    `Neuer Lead – ${cardName}`,
    `
    ${h1("Neuer Kontakt auf deiner Karte")}
    ${p(`<strong>${esc(leadName)}</strong> hat auf deiner Karte <strong>${esc(cardName)}</strong> Kontakt hinterlassen.`)}
    <table style="margin:16px 0;font-size:14px;line-height:1.6;width:100%;">
      <tr><td style="color:#6b7280;padding:4px 0;width:80px;">Name</td><td style="padding:4px 0;font-weight:600;">${esc(leadName)}</td></tr>
      ${rows}
    </table>
    <div style="text-align:center;">
      ${btn("Leads ansehen", esc(dashboardUrl))}
    </div>
    ${muted("Du erhältst diese E-Mail, weil du sofortige Lead-Benachrichtigungen aktiviert hast. Du kannst dies in deinen Einstellungen ändern.")}
    `
  );

  await send(to, `Neuer Lead: ${leadName} (${cardName})`, html);
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
    esc(`Organisation eingefroren – ${orgName}`),
    `
    ${h1("Deine Organisation wurde eingefroren")}
    ${p(`Hallo ${esc(adminName.split(" ")[0])}, dein <strong>Business-Plan</strong> für die Organisation <strong>${esc(orgName)}</strong> ist ausgelaufen oder wurde gekündigt.`)}
    ${p("Deine Organisation und alle Mitglieder-Daten bleiben erhalten. Die Mitglieder können ${APP_NAME} weiterhin mit ihren eigenen Free-Accounts nutzen – jedoch ohne Organisations-Features.")}
    <table style="margin:16px 0;border-radius:8px;background:#fef3c7;padding:16px;width:100%;border-left:4px solid #f59e0b;">
      <tr><td style="font-size:14px;color:#92400e;line-height:1.6;">
        <strong>Was eingefroren ist:</strong><br/>
        &bull; Mitgliederverwaltung &amp; Einladungen<br/>
        &bull; Org-Design-Vorgaben für Karten<br/>
        &bull; Bulk-Import<br/>
        &bull; Team-Verzeichnis<br/><br/>
        <strong>Was erhalten bleibt:</strong><br/>
        &bull; Alle Karten und Kontaktdaten<br/>
        &bull; Alle Analytics-Daten<br/>
        &bull; Org-Zuordnung aller Mitglieder
      </td></tr>
    </table>
    ${p("Buche erneut den Business-Plan um die Organisation sofort wieder zu aktivieren.")}
    <div style="text-align:center;">
      ${btn("Business-Plan buchen", esc(upgradeUrl))}
    </div>
    ${muted("Du erhältst diese E-Mail als Administrator der Organisation.")}
    `
  );
  await send(to, `Organisation eingefroren: ${orgName}`, html);
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
    esc(`Organisation wieder aktiv – ${orgName}`),
    `
    ${h1("Deine Organisation ist wieder aktiv")}
    ${p(`Hallo ${esc(adminName.split(" ")[0])}, dein Business-Plan ist wieder aktiv – die Organisation <strong>${esc(orgName)}</strong> und alle Features stehen sofort wieder zur Verfügung.`)}
    ${p("Alle Mitglieder, Karten und Einstellungen sind unverändert erhalten.")}
    <div style="text-align:center;">
      ${btn("Zum Team-Bereich", esc(dashboardUrl))}
    </div>
    ${muted("Du erhältst diese E-Mail als Administrator der Organisation.")}
    `
  );
  await send(to, `Organisation wieder aktiv: ${orgName}`, html);
}

// ── Email change notification ──────────────────────────────────────────────
export async function sendEmailChangeNotification({
  to, newEmail,
}: {
  to: string;
  newEmail: string;
}) {
  const html = layout(
    esc(`E-Mail-Adresse geändert – ${APP_NAME}`),
    `
    ${h1("E-Mail-Adresse geändert")}
    ${p(`Die E-Mail-Adresse für deinen ${esc(APP_NAME)}-Account wurde soeben geändert.`)}
    ${p(`Neue Adresse: <strong>${esc(newEmail)}</strong>`)}
    ${p("Falls du diese Änderung <strong>nicht</strong> selbst vorgenommen hast, kontaktiere uns sofort und ändere dein Passwort.")}
    ${muted("Du erhältst diese Sicherheits-E-Mail an deine bisherige Adresse.")}
    `
  );
  await send(to, `E-Mail-Adresse geändert – ${APP_NAME}`, html);
}

// ── Password reset email ───────────────────────────────────────────────────
export async function sendPasswordResetEmail({
  to, url,
}: {
  to: string;
  url: string;
}) {
  const html = layout(
    esc(`Passwort zurücksetzen – ${APP_NAME}`),
    `
    ${h1("Passwort zurücksetzen")}
    ${p(`Du hast einen Passwort-Reset für deinen ${esc(APP_NAME)}-Account angefordert. Klicke auf den Button, um ein neues Passwort zu setzen.`)}
    <div style="text-align:center;">
      ${btn("Passwort zurücksetzen", esc(url))}
    </div>
    ${muted(`Dieser Link ist 1 Stunde gültig. Falls du diese Anfrage nicht gestellt hast, kannst du diese E-Mail ignorieren.<br/>Link: ${esc(url)}`)}
    `
  );
  await send(to, `Passwort zurücksetzen – ${APP_NAME}`, html);
}
