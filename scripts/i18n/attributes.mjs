#!/usr/bin/env node
/**
 * Translate literal JSX attributes in CLIENT components without manipulating
 * the DOM after hydration. The hook is inserted once at the top of each named
 * React component, never in an event handler or map callback.
 * Re-runnable: expressions already localized are skipped.
 */
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
const roots = ["app", "components"];
const skipDirectories = new Set(["api","ui","i18n","dist","generated","node_modules",".next"]);
const skip = /^app\/(datenschutz|impressum|print)\//;
const supported = new Set(["placeholder","aria-label","title","alt","label"]);
let files = 0, count = 0, skipped = 0;
function walk(directory){
 for(const item of fs.readdirSync(directory,{withFileTypes:true})){
  const absolute=path.join(directory,item.name);
  if(item.isDirectory()){if(!skipDirectories.has(item.name))walk(absolute);continue;}
  const name=absolute.replaceAll("\\","/");
  if(!name.endsWith(".tsx") || skip.test(name))continue;
  processFile(name);
 }
}
function findComponent(node){
 let parent=node.parent;
 while(parent){
  if(ts.isFunctionDeclaration(parent)&&parent.name&&/^[A-Z]/.test(parent.name.text)&&parent.body){
   return parent;
  }
  if(ts.isArrowFunction(parent)&&ts.isVariableDeclaration(parent.parent)&&
     /^[A-Z]/.test(parent.parent.name.getText())&&ts.isBlock(parent.body)) {
   return parent;
  }
  parent=parent.parent;
 }
 return null;
}
function processFile(file){
 let source=fs.readFileSync(file,"utf8").replace(/^\uFEFF/,"");
 if(!/^["']use client["'];?/.test(source))return;
 const ast=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 const edits=[],componentHooks=new Set();
 function visit(node){
  if(ts.isJsxAttribute(node) && supported.has(node.name.getText(ast)) &&
     node.initializer && ts.isStringLiteral(node.initializer)){
   const text=node.initializer.text;
   if(!text.trim()||/^(?:https?:|\/|mailto:|tel:|#[0-9a-f]{3,8})/i.test(text))return;
   const component=findComponent(node);
   if(!component || !component.body || !ts.isBlock(component.body)){skipped++;return;}
   const content=source.slice(component.body.getStart(ast),component.body.end);
   if(!content.includes("const tI18n = useI18n().t;"))componentHooks.add(component.body.getStart(ast)+1);
   edits.push({start:node.initializer.getStart(ast),end:node.initializer.end,value:"{tI18n("+JSON.stringify(text)+")}"});
  }
  ts.forEachChild(node,visit);
 }
 visit(ast);
 if(!edits.length)return;
 for(const pos of componentHooks)edits.push({start:pos,end:pos,value:"\n  const tI18n = useI18n().t;"});
 for(const change of edits.sort((a,b)=>b.start-a.start)){
  source=source.slice(0,change.start)+change.value+source.slice(change.end);
 }
 if(!source.includes('import { useI18n } from "@/components/i18n/I18nProvider";')){
  source=source.replace(/^((?:"use client"|'use client');?)/,
   '$1\nimport { useI18n } from "@/components/i18n/I18nProvider";');
 }
 fs.writeFileSync(file,source);
 files++;count+=edits.length-componentHooks.size;
}
for(const directory of roots)if(fs.existsSync(directory))walk(directory);
console.log(JSON.stringify({clientFilesModified:files,attributesLocalized:count,notInNamedComponent:skipped},null,2));
