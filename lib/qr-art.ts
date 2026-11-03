import QRCode from "qrcode";

export type QrStyle = "square" | "rounded" | "dots";

export interface QrArtOptions {
  text: string;
  color?: string;
  background?: string; // "transparent" for none
  style?: QrStyle;
  logoHref?: string | null; // Only embedded data:image URLs
  margin?: number;
}
function escapeXml(value: string): string {
  return value.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;");
}
function normalizeColor(value: string | undefined, fallback: string): string {
  return value && /^#[0-9a-fA-F]{6}$/.test(value) ? value : fallback;
}
export function qrArtSvg(options: QrArtOptions): string {
  const color=normalizeColor(options.color,"#000000");
  const bg=options.background==="transparent"?"transparent":normalizeColor(options.background,"#ffffff");
  const style=options.style || "rounded";
  const margin=Math.min(8,Math.max(2,Math.round(options.margin??3)));
  const logoHref=options.logoHref?.startsWith("data:image/")?options.logoHref:null;
  const matrix=QRCode.create(options.text,{errorCorrectionLevel:logoHref?"H":"M"});
  const n=matrix.modules.size;
  const data=matrix.modules.data;
  const filled=(r:number,c:number)=>r>=0&&c>=0&&r<n&&c<n&&Boolean(data[r*n+c]);
  const inFinder=(r:number,c:number)=>
    (r<7&&c<7)||(r<7&&c>=n-7)||(r>=n-7&&c<7);
  const hole=logoHref ? Math.max(5,Math.round(n*0.2)|1) : 0;
  const h0=Math.floor((n-hole)/2);
  const inLogo=(r:number,c:number)=>hole>0&&r>=h0-1&&r<h0+hole+1&&c>=h0-1&&c<h0+hole+1;
  const total=n+2*margin;
  const paths:string[]=[];
  for(let r=0;r<n;r++)for(let c=0;c<n;c++){
    if(!filled(r,c)||inFinder(r,c)||inLogo(r,c))continue;
    const x=c+margin,y=r+margin;
    if(style==="dots"){
      paths.push(`M${x+0.05} ${y+0.5}a0.45 0.45 0 1 0 0.9 0a0.45 0.45 0 1 0 -0.9 0z`);
    }else if(style==="rounded"){
      const u=filled(r-1,c),d=filled(r+1,c),l=filled(r,c-1),rt=filled(r,c+1);
      const k=0.38,tl=!u&&!l?k:0,tr=!u&&!rt?k:0,br=!d&&!rt?k:0,bl=!d&&!l?k:0;
      paths.push(`M${x+tl} ${y}H${x+1-tr}${tr?`Q${x+1} ${y} ${x+1} ${y+tr}`:""}V${y+1-br}${br?`Q${x+1} ${y+1} ${x+1-br} ${y+1}`:""}H${x+bl}${bl?`Q${x} ${y+1} ${x} ${y+1-bl}`:""}V${y+tl}${tl?`Q${x} ${y} ${x+tl} ${y}`:""}Z`);
    }else paths.push(`M${x} ${y}h1v1h-1z`);
  }
  const rr=(x:number,y:number,w:number,h:number,rad:number)=>
    rad===0?`M${x} ${y}h${w}v${h}h${-w}z`:
      `M${x+rad} ${y}h${w-2*rad}a${rad} ${rad} 0 0 1 ${rad} ${rad}v${h-2*rad}a${rad} ${rad} 0 0 1 ${-rad} ${rad}h${-(w-2*rad)}a${rad} ${rad} 0 0 1 ${-rad} ${-rad}v${-(h-2*rad)}a${rad} ${rad} 0 0 1 ${rad} ${-rad}z`;
  const eye=(r:number,c:number)=>{
    const x=c+margin,y=r+margin,sq=style==="square";
    return `<path fill-rule="evenodd" d="${rr(x,y,7,7,sq?0:2)}${rr(x+1,y+1,5,5,sq?0:1.3)}"/><path d="${rr(x+2,y+2,3,3,sq?0:0.8)}"/>`;
  };
  const background=bg==="transparent"?"":`<rect width="${total}" height="${total}" fill="${bg}"/>`;
  const logo=logoHref && hole
    ? `<rect x="${h0+margin-0.7}" y="${h0+margin-0.7}" width="${hole+1.4}" height="${hole+1.4}" rx="1.2" fill="#ffffff"/><image href="${escapeXml(logoHref)}" x="${h0+margin}" y="${h0+margin}" width="${hole}" height="${hole}" preserveAspectRatio="xMidYMid meet"/>`:"";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="600" height="600" shape-rendering="geometricPrecision">${background}<g fill="${color}"><path d="${paths.join("")}"/>${eye(0,0)}${eye(0,n-7)}${eye(n-7,0)}</g>${logo}</svg>`;
}
export function svgToDataUrl(svg: string): string {
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}
