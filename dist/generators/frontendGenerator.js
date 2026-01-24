import {toClassName}from'../typeMapping.js';import {Eta}from'eta';import {readFile}from'../fileUtils.js';import*as d from'path';import {fileURLToPath}from'url';const g=d.dirname(fileURLToPath(import.meta.url)),f=new Eta({views:d.join(g,"../templates")});function F(e,o,r){const t={tableName:e,columns:o.map(s=>({name:s.name,type:s.type,datatype:s.type,nullable:s.nullable,length:s.length,precision:s.precision,scale:s.scale})),primaryKeys:r},a=readFile(d.join(g,"../templates","page/frontend/schema.template.eta"));return f.renderString(a,t)}function O(e,o,r,t){const n=toClassName(o),a={moduleName:e,masterTable:o,className:n,primaryKeys:t.length>0?t:["id"],detailTables:r||[]},s=readFile(d.join(g,"../templates","page/frontend/api.template.eta"));return f.renderString(s,a)}function H(e,o,r=100,t=1e3){const n=toClassName(o),a={moduleName:e,masterTable:o,className:n,pageSize:r,maxPageSize:t},s=readFile(d.join(g,"../templates","page/frontend/constant.template.eta"));return f.renderString(s,a)}function q(e,o){const r=toClassName(o),t={moduleName:e,masterTable:o,className:r},a=readFile(d.join(g,"../templates","page/frontend/router.template.eta"));return f.renderString(a,t)}function V(e,o,r,t,n="",a=""){const i=n||toClassName(o),s=a||i.replace(/([A-Z])/g," $1").trim(),c={moduleName:e,masterTable:o,className:i,pageName:i,pageTitle:s},l=readFile(d.join(g,"../templates","page/frontend/page.template.eta"));return f.renderString(l,c)}function Z(e,o,r,t){const n={};n[e.toLowerCase()]=F(e,r[e],t[e]);for(const p of o)n[p.toLowerCase()]=F(p,r[p],t[p]);const a={tableName:e,detailTables:o},s=readFile(d.join(g,"../templates","page/frontend/schema-index.template.eta")),c=f.renderString(s,a);return n.index=c,n}function z(e,o=[]){const r={moduleName:e,dcNames:o},n=readFile(d.join(g,"../templates","page/frontend/form.template.eta"));return f.renderString(n,r)}function L(e=[]){const o={dcNames:e,tableName:"unknown"},t=readFile(d.join(g,"../templates","page/frontend/components-index.template.eta"));return f.renderString(t,o)}function R(){return `/**
 * Helper function to create field definitions
 */
import type { SchemaType } from "../../../core/shared/SchemaType";

export interface FieldDefinition {
  name: string;
  caption?: string;
  datatype?: string;
  datawidth?: number;
  flddecimal?: number;
  modeofentry?: string;
  expression?: string | boolean;
  valexpr?: string;
  srctf?: string;
  fldsql?: string;
  hidden?: boolean;
  readonly?: boolean;
  savevalue?: boolean;
  dcname?: string;
  asgrid?: string;
  tablename?: string;
  ordno?: number;
}

export type ExpressionActionType {
  compute:(values: any, context: any): Promise<any>;
  deps: string[];
  }

export function createField(name: string, options: Omit<FieldDefinition, 'name'>): SchemaType {
  return {
    name,
    ...options
  };
}
export function createAcceptField(name: string, options: Omit<FieldDefinition, 'name'>): SchemaType {
  return {
    name,
    ...options
  };
}
export function createExpressionField(name: string, expression: ExpressionActionType, options: Omit<FieldDefinition, 'name'>): SchemaType {
  return {
    name,
    expression,
    ...options
  };
}
export function createSelectField(name: string, datasource: any, options: Omit<FieldDefinition, 'name'>): SchemaType {
  return {
    name,
    datasource,
    ...options
  };
}
export function createFillField(name: string, options: Omit<FieldDefinition, 'name'>): SchemaType {
  return {
    name,
    ...options
  };
}
export function createSubgridField(name: string, options: Omit<FieldDefinition, 'name'>): SchemaType {
  return {
    name,
    ...options
  };
}
`}function J(e,o){const r={},t={};for(const s of o){const c=s[12]||"unknown";t[c]||(t[c]=[]),t[c].push(s);}for(const[s,c]of Object.entries(t)){const p={dcName:s,fields:c.map(m=>({name:m[0],caption:m[1],datatype:m[2],flddecimal:m[3],modeofentry:m[4],expression:m[5],valexpr:m[6],srctf:m[7],fldsql:m[8],hidden:m[9],readonly:m[10],savevalue:m[11],dcname:m[12],asgrid:m[13],tablename:m[14],ordno:m[15]}))},C=readFile(d.join(g,"../templates","page/frontend/dcschema.template.eta")),h=f.renderString(C,p);r[s.toLowerCase()]=h;}const n=Object.keys(t);let a=`/**
 * DC Schema exports
 */
import { createField } from './createField';

`,i=`/**
  * Unified schema exporting all DCs
  import { convertArrayToObject } from "@/core/shared/utils/array";
  import { ${n.map(s=>s).join(", ")} } from "./index";

  export const ${e}_All_Schema = convertArrayToObject(
  [
    ${n.map(s=>`...${s}`).join(", ")}
  ],
  "name"
);

  **/ `;r.all_schema=i;for(const s of n)a+=`export * from './${s.toLowerCase()}';
`;return a+=`export * from './all_schema';
`,r.index=a,r.createField=R(),r}function Y({dcnames:e}){const o={};for(let r=0;r<e.length;r++){const t=e[r].name,n={dcName:t},a=e[r].isGrid,i=a?"page/frontend/component-grid.template.eta":"page/frontend/component.template.eta",s=readFile(d.join(g,"../templates",i)),c=f.renderString(s,{...n,isGrid:a});o[t]=c;}return o.index=L(e.map(r=>r.name)),o}export{O as generateApiClient,L as generateComponentsIndex,H as generateConstants,R as generateCreateFieldHelper,Y as generateDCComponents,J as generateDCSchemas,z as generateFormComponent,F as generateFrontendSchema,V as generatePageComponent,q as generateRouter,Z as generateUnifiedFrontendSchemas};