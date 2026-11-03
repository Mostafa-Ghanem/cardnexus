/**
 * Extract accessible brand colors from a locally selected logo.
 * Client-only: does not upload or persist the file; R2 receives it separately.
 */
function asHex(r: number, g: number, b: number): string {
  return "#" + [r,g,b].map(v => Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,"0")).join("").toUpperCase();
}
function luminance(r: number,g: number,b: number) {
  const c=[r,g,b].map(v=>{const x=v/255;return x<=0.04045?x/12.92:((x+0.055)/1.055)**2.4;});
  return c[0]*0.2126 + c[1]*0.7152 + c[2]*0.0722;
}
export function readableOnWhite(hex: string): string {
  const num=parseInt(hex.slice(1),16);let [r,g,b]=[(num>>16)&255,(num>>8)&255,num&255];
  for(let i=0;i<20&&1.05/(luminance(r,g,b)+0.05)<4.5;i++){r*=0.90;g*=0.90;b*=0.90;}
  return asHex(r,g,b);
}
export async function extractPalette(file: File): Promise<string[]> {
  const url=URL.createObjectURL(file);
  try {
    const image=new Image();
    image.src=url;
    await image.decode();
    const canvas=document.createElement("canvas");canvas.width=64;canvas.height=64;
    const ctx=canvas.getContext("2d",{willReadFrequently:true});if(!ctx)return [];
    ctx.drawImage(image,0,0,64,64);
    const pixels=ctx.getImageData(0,0,64,64).data;
    const groups=new Map<number,{count:number,r:number,g:number,b:number}>();
    for(let i=0;i<pixels.length;i+=4){
      const [r,g,b,a]=[pixels[i],pixels[i+1],pixels[i+2],pixels[i+3]];
      if(a<160)continue;
      const bright=(Math.max(r,g,b)+Math.min(r,g,b))/510;
      const chroma=Math.max(r,g,b)-Math.min(r,g,b);
      if(bright<0.08||bright>0.93||chroma<40)continue;
      const key=((r>>4)<<8)|((g>>4)<<4)|(b>>4);
      const e=groups.get(key)??{count:0,r:0,g:0,b:0};
      e.count++;e.r+=r;e.g+=g;e.b+=b;groups.set(key,e);
    }
    const buckets=[...groups.values()].sort((a,b)=>b.count-a.count);
    const colors:{r:number,g:number,b:number}[]=[];
    for(const c of buckets){
      const x={r:c.r/c.count,g:c.g/c.count,b:c.b/c.count};
      if(colors.every(y=>Math.hypot(x.r-y.r,x.g-y.g,x.b-y.b)>65))colors.push(x);
      if(colors.length===4)break;
    }
    return colors.map(c=>asHex(c.r,c.g,c.b));
  } catch {return [];} finally {URL.revokeObjectURL(url);}
}
