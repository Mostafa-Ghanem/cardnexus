// Apple Wallet and Google Wallet integration
// Required env vars:
//   Apple:  APPLE_WALLET_CERT (base64 PEM), APPLE_WALLET_KEY (base64 PEM),
//           APPLE_WALLET_WWDR (base64 WWDR PEM), APPLE_TEAM_ID, APPLE_PASS_TYPE_ID
//   Google: GOOGLE_WALLET_ISSUER_ID, GOOGLE_WALLET_SERVICE_ACCOUNT (base64 JSON)

export class WalletFeatureDisabledError extends Error {
  constructor(provider: "apple" | "google") {
    const missing = provider === "apple"
      ? "APPLE_WALLET_CERT, APPLE_WALLET_KEY, APPLE_WALLET_WWDR, APPLE_TEAM_ID, APPLE_PASS_TYPE_ID"
      : "GOOGLE_WALLET_ISSUER_ID, GOOGLE_WALLET_SERVICE_ACCOUNT";
    super(`${provider === "apple" ? "Apple" : "Google"} Wallet غير مُعدّة. متغيرات ناقصة: ${missing}`);
    this.name = "WalletFeatureDisabledError";
  }
}

export interface WalletCardData {
  slug: string;
  firstName: string;
  lastName: string;
  title?: string | null;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  primaryColor: string;
  avatarUrl?: string | null;
  cardUrl: string;
}

function isAppleConfigured() {
  return !!(
    process.env.APPLE_WALLET_CERT &&
    process.env.APPLE_WALLET_KEY &&
    process.env.APPLE_WALLET_WWDR &&
    process.env.APPLE_TEAM_ID &&
    process.env.APPLE_PASS_TYPE_ID
  );
}

function isGoogleConfigured() {
  return !!(
    process.env.GOOGLE_WALLET_ISSUER_ID &&
    process.env.GOOGLE_WALLET_SERVICE_ACCOUNT
  );
}

export function appleWalletEnabled() { return isAppleConfigured(); }
export function googleWalletEnabled() { return isGoogleConfigured(); }

// ─── Apple Wallet (.pkpass) ───────────────────────────────────────────────────

export async function generateAppleWalletPass(data: WalletCardData): Promise<Buffer> {
  if (!isAppleConfigured()) throw new WalletFeatureDisabledError("apple");

  // Dynamic import so missing packages don't crash the server on startup
  const JSZip = (await import("jszip")).default;
  const forge = await import("node-forge");

  const passTypeId = process.env.APPLE_PASS_TYPE_ID!;
  const teamId     = process.env.APPLE_TEAM_ID!;
  const serialNo   = `${data.slug}-${Date.now()}`;

  const hex  = data.primaryColor.replace("#", "");
  const r    = parseInt(hex.slice(0, 2), 16);
  const g    = parseInt(hex.slice(2, 4), 16);
  const b    = parseInt(hex.slice(4, 6), 16);
  const fg   = (r * 0.299 + g * 0.587 + b * 0.114) > 128 ? "rgb(0,0,0)" : "rgb(255,255,255)";

  const passJson = {
    formatVersion: 1,
    passTypeIdentifier: passTypeId,
    serialNumber: serialNo,
    teamIdentifier: teamId,
    organizationName: data.company ?? data.firstName + " " + data.lastName,
    description: `${data.firstName} ${data.lastName}`,
    backgroundColor: `rgb(${r},${g},${b})`,
    foregroundColor: fg,
    labelColor: fg,
    logoText: data.company ?? "",
    webServiceURL: data.cardUrl,
    authenticationToken: serialNo,
    generic: {
      primaryFields:   [{ key: "name",  label: "NAME",     value: `${data.firstName} ${data.lastName}` }],
      secondaryFields: [
        ...(data.title   ? [{ key: "title",   label: "FUNKTION", value: data.title }]   : []),
        ...(data.company ? [{ key: "company", label: "FIRMA",    value: data.company }] : []),
      ],
      auxiliaryFields: [
        ...(data.email ? [{ key: "email", label: "E-MAIL", value: data.email }] : []),
        ...(data.phone ? [{ key: "phone", label: "TEL",    value: data.phone }] : []),
      ],
      backFields: [
        { key: "url", label: "البطاقة الرقمية", value: data.cardUrl },
      ],
    },
  };

  const zip = new JSZip();
  const passStr = JSON.stringify(passJson);
  zip.file("pass.json", passStr);

  // Manifest: SHA1 hashes of each file
  const crypto = await import("crypto");
  const manifest: Record<string, string> = {
    "pass.json": crypto.createHash("sha1").update(passStr).digest("hex"),
  };
  const manifestStr = JSON.stringify(manifest);
  zip.file("manifest.json", manifestStr);

  // PKCS7 signature
  const certPem = Buffer.from(process.env.APPLE_WALLET_CERT!, "base64").toString("utf8");
  const keyPem  = Buffer.from(process.env.APPLE_WALLET_KEY!,  "base64").toString("utf8");
  const wwdrPem = Buffer.from(process.env.APPLE_WALLET_WWDR!, "base64").toString("utf8");

  const cert = forge.pki.certificateFromPem(certPem);
  const key  = forge.pki.privateKeyFromPem(keyPem);
  const wwdr = forge.pki.certificateFromPem(wwdrPem);

  const p7 = forge.pkcs7.createSignedData();
  p7.content = forge.util.createBuffer(manifestStr, "utf8");
  p7.addCertificate(cert);
  p7.addCertificate(wwdr);
  p7.addSigner({ key, certificate: cert, digestAlgorithm: forge.pki.oids.sha1, authenticatedAttributes: [] });
  p7.sign({ detached: true });

  const sigDer = forge.asn1.toDer(p7.toAsn1()).getBytes();
  zip.file("signature", Buffer.from(sigDer, "binary"));

  return zip.generateAsync({ type: "nodebuffer" });
}

// ─── Google Wallet ────────────────────────────────────────────────────────────

export async function generateGoogleWalletPassUrl(data: WalletCardData): Promise<string> {
  if (!isGoogleConfigured()) throw new WalletFeatureDisabledError("google");

  const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID!;
  const saJson   = JSON.parse(Buffer.from(process.env.GOOGLE_WALLET_SERVICE_ACCOUNT!, "base64").toString("utf8"));

  const classId  = `${issuerId}.cardnexus_contact`;
  const objectId = `${issuerId}.${data.slug}_${Date.now()}`;

  const genericObject = {
    id: objectId,
    classId,
    genericType: "GENERIC_TYPE_UNSPECIFIED",
    cardTitle:   { defaultValue: { language: "ar", value: data.company ?? (process.env.NEXT_PUBLIC_APP_NAME ?? "كارت نكسس") } },
    subheader:   { defaultValue: { language: "ar", value: data.title ?? "" } },
    header:      { defaultValue: { language: "ar", value: `${data.firstName} ${data.lastName}` } },
    textModulesData: [
      ...(data.email ? [{ header: "البريد الإلكتروني", body: data.email, id: "email" }] : []),
      ...(data.phone ? [{ header: "الهاتف", body: data.phone, id: "phone" }] : []),
    ],
    linksModuleData: {
      uris: [{ uri: data.cardUrl, description: "بطاقة أعمال رقمية", id: "card_url" }],
    },
    hexBackgroundColor: data.primaryColor,
    state: "ACTIVE",
  };

  // Sign JWT with service account
  const { createSign } = await import("crypto");
  const header  = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    iss: saJson.client_email,
    aud: "google",
    typ: "savetowallet",
    iat: Math.floor(Date.now() / 1000),
    payload: { genericObjects: [genericObject] },
  })).toString("base64url");

  const sign = createSign("RSA-SHA256");
  sign.update(`${header}.${payload}`);
  const signature = sign.sign(saJson.private_key, "base64url");

  const jwt = `${header}.${payload}.${signature}`;
  return `https://pay.google.com/gp/v/save/${jwt}`;
}
