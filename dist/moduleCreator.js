import*as t from'path';import {getOracleConnection,getTablesByStructure,getTableSchema,getPrimaryKeys,getFieldsForParameters,getFieldsForFrontendSchema,getFieldsWithSql}from'./database.js';import {generateUnifiedModel,generateDatabaseConfig}from'./generators/modelGenerator.js';import {generateParameterSchema,generateUnifiedSchemas}from'./generators/schemaGenerator.js';import {generateUnifiedService}from'./generators/serviceGenerator.js';import {generateUnifiedRoutes,generateInitFile}from'./generators/routeGenerator.js';import {generateDCSchemas,generateUnifiedFrontendSchemas,generateApiClient,generateConstants,generateRouter,generatePageComponent,generateDCComponents,generateFormComponent,generateComponentsIndex}from'./generators/frontendGenerator.js';import {createDir,writeFile,fileExists}from'./fileUtils.js';import {toClassName}from'./typeMapping.js';async function we(f,e,w){try{const p=await getFieldsWithSql(f,e),y={};let C="";for(const s of p){const n=s[0],j=s[1],d=s[2];let a=s[3];if(a&&(a=String(a)),!a||!a.trim())continue;a=a.replace(/\r\n/g," ").replace(/\r/g," ").replace(/\n/g," ");const c=d&&d.trim().toLowerCase()==="select",T=c?"List[Any]":"Any";y[n.toLowerCase()]={sql:a,returnType:T,isSelect:c};const v=`get_${n.toLowerCase()}_data`,S=c?"List[Any]":"Any";C+=`
    def ${v}(self, db: Session, params: dict = None) -> ${S}:
        """
        Fetch data for field ${n}
        
        Args:
            db: Database session
            params: Dictionary of parameters to bind to the query
            
        Returns:
            ${S}
        """
        sql_query = ${JSON.stringify(a)}
        
        try:
            if params:
                result = db.execute(text(sql_query), params)
            else:
                result = db.execute(text(sql_query))
            
            rows = result.fetchall()
            
            if not rows:
                return [] if ${c} else None
            
            if ${c}:
                return [row[0] for row in rows]
            else:
                return rows[0][0] if rows else None
        except Exception as e:
            print(f"Error executing query for field ${n}: {e}")
            raise e
`;}if(Object.keys(y).length===0)return console.log("   \u26A0\uFE0F  No fields with fldsql found"),null;let r=`{
`;for(const s of Object.keys(y))r+=`            '${s}': self.get_${s}_data,
`;return r+="        }",`"""
Data Service - Execute SQL queries for dynamic data loading

This service provides individual functions for each field with a factory function dispatcher.
"""

from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Any, Optional, Union


class ${w}DataService:
    """Service for fetching data via fldsql expressions"""
    
    def __init__(self):
        """Initialize field handlers mapping"""
        self.field_handlers = ${r}
${C}
    def get_field_data(self, db: Session, field_name: str, params: dict = None) -> Union[List[Any], Any]:
        """
        Factory function to dispatch to the appropriate field method.
        
        Args:
            db: Database session
            field_name: Name of the field to fetch data for
            params: Dictionary of parameters to bind to the query
            
        Returns:
            Result from the field's method
            
        Raises:
            ValueError: If field_name is not found
        """
        field_name_lower = field_name.lower()
        
        if field_name_lower not in self.field_handlers:
            raise ValueError(f"Field '{field_name}' not found or has no SQL query defined")
        
        # Get the handler function and call it
        handler = self.field_handlers[field_name_lower]
        return handler(db, params)
`}catch(p){return console.log(`   \u274C Error generating data service: ${p}`),null}}async function Ge(f,e=null,w=".",p=null,y="",C=""){const r=await getOracleConnection(),{master:$,details:s}=await getTablesByStructure(r,f);$.length===0&&s.length===0&&(console.error(`\u274C No tables found for structure: ${f}`),await r.close(),process.exit(1)),$.length===0&&(console.error(`\u274C No master table found for structure: ${f}`),await r.close(),process.exit(1)),$.length>1&&console.log(`
\u26A0\uFE0F  Warning: Multiple master tables found. Using the first one: ${$[0]}`);const n=$[0];e?e=e.toLowerCase():e=f;const j=toClassName(n),d=t.join(w,e);createDir(d),console.log(`Created module directory: ${d}/`),console.log(`
${"=".repeat(80)}`),console.log(`Creating Unified Module from Structure: ${f}`),console.log("=".repeat(80)),console.log(`
\u{1F4E6} Module: ${e}`),console.log(`   Master Table: ${n}`),s.length>0&&console.log(`   Detail Tables: ${s.join(", ")}`),console.log(`
Connecting to Oracle database...`);const a={},c={};console.log(`
Retrieving schema for MASTER table: ${n}`),a[n]=await getTableSchema(r,n),c[n]=await getPrimaryKeys(r,n);for(const o of s)console.log(`Retrieving schema for DETAIL table: ${o}`),a[o]=await getTableSchema(r,o),c[o]=await getPrimaryKeys(r,o);console.log(`
1. Generating unified SQLAlchemy model...`);const T=generateUnifiedModel(n,s,a,c),v=t.join(d,"model.py");await writeFile(v,T),console.log(`   \u2713 Saved to: ${v}`),console.log(`
2a. Generating parameter schema from axflds...`);const S=await getFieldsForParameters(r,f);let D=null;if(S&&S.length>0){const o=S.map(g=>({fname:g[0],datatype:g[1],modeofentry:g[2],fielddecimal:g[3],fldsql:g[4],asgrid:g[5],tablename:g[6],dcname:g[7]}));D=generateParameterSchema(f,o),D&&console.log("   \u2713 Parameter schema generated");}else console.log("   \u26A0\uFE0F  No parameter schema generated (axflds table not found)");console.log(`
2. Generating unified Pydantic schemas...`);const K=generateUnifiedSchemas(n,s,a,c,D),E=t.join(d,"schema.py");await writeFile(E,K),console.log(`   \u2713 Saved to: ${E}`),console.log(`
3. Generating unified service...`);const N=generateUnifiedService(n,s,a,c),M=t.join(d,"service.py");await writeFile(M,N),console.log(`   \u2713 Saved to: ${M}`),console.log(`
3a. Generating data service...`);const G=await we(r,f,j);if(G){const o=t.join(d,"data_service.py");await writeFile(o,G),console.log(`   \u2713 Saved to: ${o}`);}else console.log("   \u26A0\uFE0F  No data service generated (no fields with fldsql)");console.log(`
4. Generating unified routes...`);const V=generateUnifiedRoutes(e,n,s,a,c),L=t.join(d,"routes.py");await writeFile(L,V),console.log(`   \u2713 Saved to: ${L}`),G&&console.log("   \u2713 Included data routes for dynamic SQL queries"),console.log(`
5. Generating __init__.py...`);const W=generateInitFile(e),R=t.join(d,"__init__.py");await writeFile(R,W),console.log(`   \u2713 Saved to: ${R}`);const _=t.join(w,"database.py");if(fileExists(_))console.log(`
6. Database config already exists, skipping...`);else {console.log(`
6. Generating database config...`);const o=generateDatabaseConfig();await writeFile(_,o),console.log(`   \u2713 Saved to: ${_}`);}if(p){console.log(`
${"=".repeat(80)}`),console.log("GENERATING FRONTEND"),console.log("=".repeat(80));const o=t.join(p,e);createDir(o);const g=t.join(o,"schema"),F=t.join(o,"components");createDir(g),createDir(F),console.log(`
Created frontend directory: ${o}/`),console.log(`
1. Generating DC-based TypeScript schemas...`);const b=await getFieldsForFrontendSchema(r,f);let q=[];const A=new Map;if(b&&b.length>0){console.log(`   \u2713 Found ${b.length} fields with SQL in axpflds`);for(const i of b){const m=i.dcname?i.dcname.trim():"dc1";A.has(m)||A.set(m,{name:m,isGrid:i.asgrid==="T"});}const h=generateDCSchemas(y,b);q=Object.keys(h).filter(i=>i!=="index"&&i!=="createField");for(const[i,m]of Object.entries(h)){const u=t.join(g,`${i}.ts`);await writeFile(u,m),console.log(`   \u2713 Saved to: ${u}`);}}else {console.log("   \u26A0\uFE0F  No fields with SQL found in axpflds, generating table-based schemas...");const h=generateUnifiedFrontendSchemas(n,s,a,c);for(const[i,m]of Object.entries(h)){const u=t.join(g,`${i}.ts`);await writeFile(u,m),console.log(`   \u2713 Saved to: ${u}`);}}console.log(`
2. Generating API client...`);const H=generateApiClient(e,n,s,c[n]),P=t.join(o,"api.ts");await writeFile(P,H),console.log(`   \u2713 Saved to: ${P}`),console.log(`
3. Generating constants...`);const J=generateConstants(e,n),O=t.join(o,"constant.ts");await writeFile(O,J),console.log(`   \u2713 Saved to: ${O}`),console.log(`
4. Generating router...`);const B=generateRouter(e,j),I=t.join(o,"router.tsx");await writeFile(I,B),console.log(`   \u2713 Saved to: ${I}`),console.log(`
5. Generating page component...`);const X=generatePageComponent(e,n,a[n],c[n],y,C),U=t.join(o,"page.tsx");if(await writeFile(U,X),console.log(`   \u2713 Saved to: ${U}`),q.length>0){console.log(`
6. Generating DC components...`);const h=generateDCComponents({dcnames:Array.from(A.values())});for(const[m,u]of Object.entries(h)){const Q=t.join(F,`${m}.tsx`);await writeFile(Q,u),console.log(`   \u2713 Saved to: ${Q}`);}const i=t.join(F,`${e}Form.tsx`);await writeFile(i,generateFormComponent(e,q)),console.log(`   \u2713 Saved to: ${i}`);}else {console.log(`
6. Generating components index...`);const h=generateComponentsIndex(),i=t.join(F,"index.ts");await writeFile(i,h),console.log(`   \u2713 Saved to: ${i}`);}}if(console.log(`
${"=".repeat(80)}`),console.log("GENERATION COMPLETE"),console.log("=".repeat(80)),console.log(`
Backend Module structure:`),console.log(`   ${d}/`),console.log("   - __init__.py       - Module initialization"),console.log("   - model.py          - SQLAlchemy ORM models (master + details with relationships)"),console.log("   - schema.py         - Pydantic validation schemas (all tables)"),console.log("   - service.py        - Business logic layer (all operations)"),console.log("   - routes.py         - FastAPI CRUD endpoints (single router)"),console.log(`   ${_}    - Database configuration`),p){const o=t.join(p,e);console.log(`
Frontend Module structure:`),console.log(`   ${o}/`),console.log("   - schema/           - TypeScript interfaces"),console.log("     - index.ts        - All schemas"),console.log("   - components/       - React components"),console.log("     - index.ts        - Components barrel export"),console.log("   - api.ts            - API client methods"),console.log("   - constant.ts       - Constants and routes"),console.log("   - router.tsx        - Route configuration"),console.log("   - page.tsx          - Main page component");}if(console.log(`
Module Contents:`),console.log(`   Master: ${n}`),s.length>0)for(const o of s)console.log(`   Detail: ${o}`);console.log(`
API Endpoints (prefix: /${e}):`),console.log(`   GET    /${e}/                    - List all master records`),console.log(`   POST   /${e}/                    - Create new master record`),console.log(`   GET    /${e}/{id}                - Get single master record`),console.log(`   PUT    /${e}/{id}                - Update master record`),console.log(`   DELETE /${e}/{id}                - Delete master record`),console.log(`   POST   /${e}/data/{field_name}  - Get dynamic data for a field (fldsql)`),await r.close(),console.log(`
\u2705 Module generation complete!
`);}export{Ge as createUnifiedModuleFromStructure};