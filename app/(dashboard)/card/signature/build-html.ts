import type { CardData } from "@/types";

export type SigStyle = "standard" | "compact" | "rich" | "modern" | "minimal" | "dark";

export interface SigOptions {
  color: string;
  showAvatar: boolean;
  showSocials: boolean;
  showCardLink: boolean;
  footerText: string;
}

function abs(url: string, base: string) {
  return url.startsWith("http") ? url : base + url;
}

function getSocials(card: CardData): { label: string; url: string }[] {
  const items: { label: string; url: string }[] = [];
  if (card.linkedin)  items.push({ label: "LinkedIn",  url: card.linkedin });
  if (card.xing)      items.push({ label: "Xing",      url: card.xing });
  if (card.twitter)   items.push({ label: "X/Twitter", url: card.twitter });
  if (card.instagram) items.push({ label: "Instagram", url: card.instagram });
  if (card.github)    items.push({ label: "GitHub",    url: card.github });
  return items;
}

function socialLinks(socials: { label: string; url: string }[], color: string) {
  return socials
    .map(s => `<a href="${s.url}" style="font-family:Arial,sans-serif;font-size:11px;color:${color};text-decoration:none;margin-right:10px;">${s.label}</a>`)
    .join("");
}

function footerRow(text: string, cols = 1) {
  if (!text.trim()) return "";
  return `<tr><td colspan="${cols}" style="padding-top:10px;font-size:10px;color:#999999;border-top:1px solid #eeeeee;">${text.replace(/\n/g, "<br>")}</td></tr>`;
}

export function buildPlainText(card: CardData): string {
  const name = `${card.firstName ?? ""} ${card.lastName ?? ""}`.trim();
  const header = [name, [card.title, card.company].filter(Boolean).join(" | ")].filter(Boolean);
  const contact = [
    card.phone   && `هاتف:   ${card.phone}`,
    card.mobile  && `جوال:   ${card.mobile}`,
    card.email   && `بريد:   ${card.email}`,
    card.website && `موقع:   ${card.website}`,
    card.address && `عنوان:  ${card.address}`,
  ].filter(Boolean) as string[];
  return [...header, "", ...contact].join("\n");
}

export function buildHtml(card: CardData, style: SigStyle, baseUrl: string, opts: SigOptions): string {
  const { color, showAvatar, showSocials, showCardLink, footerText } = opts;
  const name    = `${card.firstName ?? ""} ${card.lastName ?? ""}`.trim();
  const avatar  = card.avatarUrl && showAvatar ? abs(card.avatarUrl, baseUrl) : null;
  const cardUrl = `${baseUrl}/c/${card.slug}`;
  const socials = showSocials ? getSocials(card) : [];
  const btn     = showCardLink
    ? `<a href="${cardUrl}" style="font-family:Arial,sans-serif;font-size:11px;background-color:${color};color:#ffffff;text-decoration:none;padding:5px 12px;border-radius:4px;display:inline-block;">Digitale Visitenkarte</a>`
    : "";

  const contact555 = [
    card.phone  ? `📞 <a href="tel:${card.phone}" style="color:#555555;text-decoration:none;">${card.phone}</a>`    : "",
    card.mobile ? `📱 <a href="tel:${card.mobile}" style="color:#555555;text-decoration:none;">${card.mobile}</a>`  : "",
    card.email  ? `✉ <a href="mailto:${card.email}" style="color:#555555;text-decoration:none;">${card.email}</a>` : "",
    card.website ? `🌐 <a href="${card.website}" style="color:${color};text-decoration:none;">${card.website.replace(/^https?:\/\//, "")}</a>` : "",
    card.address ? `📍 ${card.address}` : "",
  ].filter(Boolean).join("<br>");

  if (style === "compact") {
    return `<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5;color:#333333;">
  <tr>
    <td style="padding-right:12px;border-right:2px solid ${color};vertical-align:top;">
      <strong style="font-size:15px;color:#111111;">${name}</strong><br>
      ${card.title   ? `<span style="color:${color};font-size:12px;">${card.title}</span><br>` : ""}
      ${card.company ? `<span style="color:#666666;font-size:12px;">${card.company}</span>`    : ""}
    </td>
    <td style="padding-left:12px;vertical-align:top;font-size:12px;color:#555555;">
      ${card.phone   ? `📞 <a href="tel:${card.phone}" style="color:#555555;text-decoration:none;">${card.phone}</a><br>` : ""}
      ${card.email   ? `✉ <a href="mailto:${card.email}" style="color:#555555;text-decoration:none;">${card.email}</a><br>` : ""}
      ${card.website ? `🌐 <a href="${card.website}" style="color:${color};text-decoration:none;">${card.website.replace(/^https?:\/\//, "")}</a><br>` : ""}
      ${socials.length > 0 ? `<div style="margin-top:5px;">${socialLinks(socials, color)}</div>` : ""}
      ${btn ? `<div style="margin-top:8px;">${btn}</div>` : ""}
    </td>
  </tr>
  ${footerRow(footerText, 2)}
</table>`;
  }

  if (style === "rich") {
    return `<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5;color:#333333;">
  <tr>
    ${avatar ? `<td style="padding-right:16px;vertical-align:top;"><a href="${cardUrl}"><img src="${avatar}" alt="${name}" width="72" height="72" style="border-radius:50%;display:block;object-fit:cover;" /></a></td>` : ""}
    <td style="vertical-align:top;border-left:3px solid ${color};padding-left:14px;">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr><td>
          <strong style="font-size:16px;color:#111111;">${name}</strong><br>
          ${card.title   ? `<span style="color:${color};font-size:13px;font-weight:600;">${card.title}</span><br>` : ""}
          ${card.company ? `<span style="color:#666666;font-size:13px;">${card.company}</span><br>` : ""}
        </td></tr>
        <tr><td style="padding-top:8px;font-size:12px;color:#555555;line-height:1.8;">${contact555}</td></tr>
        ${socials.length > 0 ? `<tr><td style="padding-top:8px;">${socialLinks(socials, color)}</td></tr>` : ""}
        ${btn ? `<tr><td style="padding-top:10px;">${btn}</td></tr>` : ""}
        ${footerRow(footerText)}
      </table>
    </td>
  </tr>
</table>`;
  }

  if (style === "modern") {
    return `<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5;color:#333333;">
  <tr><td colspan="2" style="background-color:${color};height:3px;font-size:0;line-height:0;">&nbsp;</td></tr>
  <tr>
    ${avatar ? `<td style="padding:12px 14px 12px 0;vertical-align:top;width:68px;"><img src="${avatar}" alt="${name}" width="60" height="60" style="border-radius:8px;display:block;object-fit:cover;" /></td>` : ""}
    <td style="padding-top:12px;vertical-align:top;">
      <strong style="font-size:16px;color:#111111;">${name}</strong>${card.title ? `<span style="color:${color};font-size:13px;"> · ${card.title}</span>` : ""}
      ${card.company ? `<br><span style="color:#666666;font-size:12px;">${card.company}${card.department ? ` · ${card.department}` : ""}</span>` : ""}
      <table cellpadding="0" cellspacing="0" border="0" style="margin-top:8px;">
        <tr>
          <td style="font-size:11px;color:#555555;padding-right:16px;vertical-align:top;">
            ${card.phone  ? `<a href="tel:${card.phone}" style="color:#555555;text-decoration:none;display:block;">📞 ${card.phone}</a>` : ""}
            ${card.mobile ? `<a href="tel:${card.mobile}" style="color:#555555;text-decoration:none;display:block;">📱 ${card.mobile}</a>` : ""}
          </td>
          <td style="font-size:11px;color:#555555;vertical-align:top;">
            ${card.email   ? `<a href="mailto:${card.email}" style="color:#555555;text-decoration:none;display:block;">✉ ${card.email}</a>` : ""}
            ${card.website ? `<a href="${card.website}" style="color:${color};text-decoration:none;display:block;">🌐 ${card.website.replace(/^https?:\/\//, "")}</a>` : ""}
          </td>
        </tr>
      </table>
      ${socials.length > 0 ? `<div style="margin-top:8px;">${socialLinks(socials, color)}</div>` : ""}
      ${btn ? `<div style="margin-top:8px;">${btn}</div>` : ""}
    </td>
  </tr>
  ${footerRow(footerText, avatar ? 2 : 1)}
</table>`;
  }

  if (style === "minimal") {
    const parts = [name, card.title, card.company].filter(Boolean).join(" — ");
    const contacts = [
      card.phone  ? `<a href="tel:${card.phone}" style="color:#888888;text-decoration:none;">${card.phone}</a>`              : "",
      card.mobile ? `<a href="tel:${card.mobile}" style="color:#888888;text-decoration:none;">${card.mobile}</a>`            : "",
      card.email  ? `<a href="mailto:${card.email}" style="color:#888888;text-decoration:none;">${card.email}</a>`           : "",
      card.website ? `<a href="${card.website}" style="color:${color};text-decoration:none;">${card.website.replace(/^https?:\/\//, "")}</a>` : "",
    ].filter(Boolean).join("&nbsp;&nbsp;·&nbsp;&nbsp;");
    return `<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,sans-serif;font-size:13px;line-height:1.6;color:#444444;">
  <tr>
    <td>
      <span style="font-size:14px;color:#111111;font-weight:600;">${parts}</span><br>
      <span style="font-size:12px;color:#888888;">${contacts}</span>
      ${socials.length > 0 ? `<br><span style="font-size:11px;">${socialLinks(socials, color)}</span>` : ""}
      ${btn ? `<br><span style="font-size:11px;display:inline-block;margin-top:6px;">${btn}</span>` : ""}
    </td>
  </tr>
  ${footerRow(footerText)}
</table>`;
  }

  if (style === "dark") {
    return `<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5;background-color:#1e293b;border-radius:8px;">
  <tr>
    <td style="padding:16px;">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          ${avatar ? `<td style="padding-right:14px;vertical-align:top;"><img src="${avatar}" alt="${name}" width="60" height="60" style="border-radius:50%;display:block;object-fit:cover;border:2px solid ${color};" /></td>` : ""}
          <td style="vertical-align:top;border-left:3px solid ${color};padding-left:14px;">
            <strong style="font-size:16px;color:#f8fafc;">${name}</strong><br>
            ${card.title   ? `<span style="color:${color};font-size:13px;font-weight:600;">${card.title}</span><br>` : ""}
            ${card.company ? `<span style="color:#94a3b8;font-size:13px;">${card.company}</span><br>` : ""}
            <span style="font-size:12px;color:#94a3b8;line-height:1.8;display:block;margin-top:6px;">
              ${card.phone  ? `📞 <a href="tel:${card.phone}" style="color:#94a3b8;text-decoration:none;">${card.phone}</a><br>` : ""}
              ${card.mobile ? `📱 <a href="tel:${card.mobile}" style="color:#94a3b8;text-decoration:none;">${card.mobile}</a><br>` : ""}
              ${card.email  ? `✉ <a href="mailto:${card.email}" style="color:#94a3b8;text-decoration:none;">${card.email}</a><br>` : ""}
              ${card.website ? `🌐 <a href="${card.website}" style="color:${color};text-decoration:none;">${card.website.replace(/^https?:\/\//, "")}</a><br>` : ""}
            </span>
            ${socials.length > 0 ? `<div style="margin-top:8px;">${socialLinks(socials, color)}</div>` : ""}
            ${btn ? `<div style="margin-top:10px;">${btn}</div>` : ""}
          </td>
        </tr>
        ${footerText.trim() ? `<tr><td colspan="2" style="padding-top:10px;font-size:10px;color:#475569;border-top:1px solid #334155;">${footerText.replace(/\n/g, "<br>")}</td></tr>` : ""}
      </table>
    </td>
  </tr>
</table>`;
  }

  // standard (default) — with optional avatar
  return `<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5;color:#333333;">
  <tr>
    ${avatar ? `<td style="padding-right:16px;vertical-align:top;"><img src="${avatar}" alt="${name}" width="64" height="64" style="border-radius:50%;display:block;object-fit:cover;" /></td>` : ""}
    <td style="border-left:3px solid ${color};padding-left:14px;vertical-align:top;">
      <strong style="font-size:16px;color:#111111;">${name}</strong><br>
      ${card.title   ? `<span style="color:${color};font-size:13px;font-weight:600;">${card.title}</span><br>` : ""}
      ${card.company ? `<span style="color:#666666;font-size:13px;">${card.company}</span><br>` : ""}
      <br>
      <span style="font-size:12px;color:#555555;line-height:1.8;">${contact555}</span>
      ${socials.length > 0 ? `<div style="margin-top:8px;">${socialLinks(socials, color)}</div>` : ""}
      ${btn ? `<div style="margin-top:10px;">${btn}</div>` : ""}
    </td>
  </tr>
  ${footerRow(footerText, avatar ? 2 : 1)}
</table>`;
}
