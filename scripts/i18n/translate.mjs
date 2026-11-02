#!/usr/bin/env node
/**
 * Translate UI source strings to Saudi Arabic and English using Cloudflare Workers AI.
 * Required for unattended runs (GitHub Actions secrets, never commit tokens):
 * CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID.
 * Uses strict JSON schema output; commits translations only after validation.
 */
import fs from "node:fs";
const source = JSON.parse(fs.readFileSync("messages/source.json","utf8"));
const apiToken = process.env.CLOUDFLARE_API_TOKEN;
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const model = process.env.CLOUDFLARE_TRANSLATION_MODEL || "@cf/openai/gpt-oss-120b";
const max = Math.min(500,Math.max(1,Number(process.env.MAX_TRANSLATIONS_PER_RUN||120)));
if (!apiToken || !accountId) {
  console.warn("Cloudflare AI translation skipped: provide CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID in GitHub Actions Secrets.");
  process.exit(0);
}
const catalogs = {
  "ar-SA": JSON.parse(fs.readFileSync("messages/ar-SA.json","utf8")),
  "en": JSON.parse(fs.readFileSync("messages/en.json","utf8")),
};
const sleep = n => new Promise(resolve=>setTimeout(resolve,n));
async function request(locale,texts){
 const guide = locale==="ar-SA" ?
  "Translate German digital business card SaaS UI into professional Saudi Arabic (Modern Standard Arabic). Karte means a digital BUSINESS CARD, never a map. Use natural localized B2B wording." :
  "Translate German digital business card SaaS UI into fluent concise English for business users.";
 const result = await fetch("https://api.cloudflare.com/client/v4/accounts/"+accountId+
   "/ai/run/"+model,{
   method:"POST",
   headers:{Authorization:"Bearer "+apiToken,"Content-Type":"application/json"},
   body:JSON.stringify({
     messages:[
       {role:"system",content:guide+" Return only a valid JSON object containing translations array in the exact input order and count. Preserve product names, numbers, URLs, Latin technical acronyms, HTML and interpolation tokens. Do not invent legal/compliance/server-location claims. Keep fragments as fragments."},
       {role:"user",content:JSON.stringify({texts})},
     ],
     response_format:{type:"json_schema",json_schema:{
       name:"ui_translations",strict:true,
       schema:{type:"object",properties:{translations:{type:"array",items:{type:"string"}}},required:["translations"],additionalProperties:false},
     }},
     max_tokens:2800,temperature:0,
   }),
   signal:AbortSignal.timeout(90000),
 });
 const body=await result.text();
 if(!result.ok)throw new Error("Cloudflare Workers AI HTTP "+result.status);
 const decoded=JSON.parse(body);
 if(!decoded.success)throw new Error("Cloudflare Workers AI returned an error");
 let translation=decoded.result?.response??decoded.result?.choices?.[0]?.message?.content;
 if(typeof translation==="string")translation=JSON.parse(translation);
 if(!Array.isArray(translation?.translations) || translation.translations.length!==texts.length){
  throw new Error("Translation JSON schema count mismatch; refusing output");
 }
 return translation.translations;
}
function valid(original,text){
 if(typeof text!=="string"||!text.trim())return false;
 if(text.length>Math.max(180,original.length*5))return false;
 if(/[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]/.test(text))return false;
 const placeholders=original.match(/\{\{[^}]+\}\}|\{\w+\}|%[sd]/g)||[];
 return placeholders.every(marker=>text.includes(marker));
}
const missing=source.filter(x=>!catalogs["ar-SA"][x.text] || !catalogs.en[x.text]).slice(0,max);
let complete=0;
for(const locale of ["ar-SA","en"]){
 const dict=catalogs[locale];
 const target=missing.map(x=>x.text).filter(text=>!dict[text]);
 for(let i=0;i<target.length;i+=15){
  const batch=target.slice(i,i+15);
  let values;
  try {values=await request(locale,batch);}
  catch(error){
   console.error(locale+" translation paused: "+String(error));
   // Preserve successful batches. Coverage report identifies missing copy.
   break;
  }
  for(let j=0;j<batch.length;j++){
   if(valid(batch[j],values[j])){dict[batch[j]]=values[j].trim();complete++;}
  }
  fs.writeFileSync("messages/"+locale+".json",JSON.stringify(dict,null,2)+"\n");
  console.log("Completed "+locale+" batch "+Math.min(i+15,target.length)+"/"+target.length);
  await sleep(1000);
 }
}
console.log("New translations in this run: "+complete);
