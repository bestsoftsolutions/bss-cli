import c from'oracledb';import {debug}from'./logger.js';import {loadConfig}from'./configLoader.js';async function S(){try{const r=loadConfig(),t={user:r.db?.user??"",password:r.db?.password??"",connectString:r.db?.connectString??""};return await c.getConnection(t)}catch(r){console.error("Error connecting to Oracle:",r),process.exit(1);}}async function N(r,t){const a=`
        SELECT 
            COLUMN_NAME,
            DATA_TYPE,
            DATA_LENGTH,
            DATA_PRECISION,
            DATA_SCALE,
            NULLABLE
        FROM USER_TAB_COLUMNS
        WHERE TABLE_NAME = :tableName
        ORDER BY COLUMN_ID
    `;try{const e=await r.execute(a,{tableName:t.toUpperCase()},{outFormat:c.OUT_FORMAT_OBJECT});return (!e.rows||e.rows.length===0)&&(console.error(`Error: Table '${t}' not found in USER_TAB_COLUMNS`),process.exit(1)),e.rows.map(s=>({name:s.COLUMN_NAME,type:s.DATA_TYPE,length:s.DATA_LENGTH,precision:s.DATA_PRECISION,scale:s.DATA_SCALE,nullable:s.NULLABLE==="Y"}))}catch(e){console.error("Error querying table schema:",e),process.exit(1);}}async function m(r,t){const a=`
        SELECT COLS.COLUMN_NAME
        FROM USER_CONSTRAINTS CONS
        JOIN USER_CONS_COLUMNS COLS 
            ON CONS.CONSTRAINT_NAME = COLS.CONSTRAINT_NAME
        WHERE CONS.CONSTRAINT_TYPE = 'P'
            AND CONS.TABLE_NAME = :tableName
        ORDER BY COLS.POSITION
    `;try{return (await r.execute(a,{tableName:t.toUpperCase()})).rows?.map(l=>l[0])||[]}catch(e){return console.warn("Warning: Could not retrieve primary keys:",e),[]}}async function p(r,t){const a=`
        SELECT DISTINCT tablename, asgrid
        FROM axpdc
        WHERE tstruct = :tstruct
        ORDER BY asgrid DESC, tablename
    `;console.log(`
${"=".repeat(80)}`),console.log(`Querying Database for Structure: ${t}`),console.log("=".repeat(80));try{console.log(`
Executing query...`);const e=await r.execute(a,{tstruct:t});if(!e.rows||e.rows.length===0)return console.error(`\u274C No tables found for structure: ${t}`),{master:[],details:[]};const l=[],s=[];console.log(`
Tables found for structure '${t}':`);for(const d of e.rows){const E=d[0];d[1]==="T"?(s.push(E),console.log(`   \u{1F4C4} DETAIL: ${E}`)):(l.push(E),console.log(`   \u{1F4CB} MASTER: ${E}`));}return {master:l,details:s}}catch(e){console.error("\u274C Error querying database:",e),process.exit(1);}}async function y(r,t){const a=`
        SELECT a.fname, a.datatype, a.modeofentry, a.fldsql
        FROM axpflds a
        LEFT JOIN axpdc b ON a.tstruct = b.tstruct AND a.dcname = b.dname
        WHERE b.tstruct = :tstruct AND a.fldsql IS NOT NULL AND TRIM(a.fldsql) IS NOT NULL
        ORDER BY a.dcname, a.ordno
    `;try{return (await r.execute(a,{tstruct:t.toLowerCase()},{fetchInfo:{FLDSQL:{type:c.STRING}}})).rows||[]}catch(e){return console.error("Error querying axflds table:",e),[]}}async function D(r,t){const a=`
        SELECT a.fname, a.datatype, a.modeofentry, NVL(a.flddecimal, 0) as fielddecimal,
               a.fldsql, b.asgrid, b.tablename
        FROM axpflds a
        LEFT JOIN axpdc b ON a.tstruct = b.tstruct AND a.dcname = b.dname
        WHERE b.tstruct = :tstruct 
        ORDER BY a.dcname, a.ordno
    `;try{return (await r.execute(a,{tstruct:t.toLowerCase()},{fetchInfo:{FLDSQL:{type:c.STRING}}})).rows||[]}catch(e){return console.error("Error querying axflds table:",e),[]}}async function I(r,t){const a=`
        SELECT a.fname, a.caption, a.datatype, a.flddecimal, a.modeofentry, a.expression,
               a.valexpr, a.srctf, a.fldsql, a.hidden, a.readonly, a.savevalue, a.dcname,
               b.asgrid, b.tablename, a.ordno
        FROM axpflds a
        LEFT JOIN axpdc b ON a.tstruct = b.tstruct AND a.dcname = b.dname
        WHERE b.tstruct = :tstruct AND a.fldsql IS NOT NULL AND TRIM(a.fldsql) IS NOT NULL
        ORDER BY a.dcname, a.ordno
    `;try{return (await r.execute(a,{tstruct:t.toLowerCase()},{fetchInfo:{FLDSQL:{type:c.STRING},EXPRESSION:{type:c.STRING},VALEXPR:{type:c.STRING}}})).rows||[]}catch(e){return console.error("Error querying axflds table for frontend schema:",e),[]}}const O=`
    SELECT DISTINCT NAME, CAPTION PAGE_TITLE
    FROM tstructs
    WHERE name = :tstruct
`,L=`
    SELECT dname DC_NAME, tablename TABLE_NAME, asgrid AS_GRID
    FROM axpdc
    WHERE tstruct = :tstruct
`,R=`
    SELECT fname FIELD_NAME, datatype DATA_TYPE, flddecimal FIELD_DECIMAL, modeofentry MODE_OF_ENTRY,
           fldsql FIELD_SQL, caption FIELD_CAPTION, expression EXPRESSION, valexpr VALUE_EXPRESSION,
           srctf SRC_TF, hidden IS_HIDDEN, readonly IS_READONLY, savevalue SAVE_VALUE, ordno ORDER_NO,
              dcname DC_NAME
    FROM axpflds
    wHERE tstruct = :tstruct
    ORDER BY ordno
`,g=async r=>{try{const t=await S();debug(`Fetching Axpert structure for tstruct=${r}`);const a={name:"",dcs:[],tables:{master:null,details:[]},pageTitle:void 0};let e=await t.execute(O,{tstruct:r},{outFormat:c.OUT_FORMAT_OBJECT});if(!e.rows||e.rows.length===0)throw new Error(`Tstruct '${r}' not found`);const l=e.rows[0];a.name=l.NAME,a.pageTitle=l.PAGE_TITLE,debug(`Found tstruct: ${a.name} with title: ${a.pageTitle}`),e=await t.execute(L,{tstruct:r},{outFormat:c.OUT_FORMAT_OBJECT});const s=e.rows||[];debug(`Found ${s.length} DCs for tstruct=${r}`);const E=(await t.execute(R,{tstruct:r},{outFormat:c.OUT_FORMAT_OBJECT,fetchInfo:{FIELD_SQL:{type:c.STRING},EXPRESSION:{type:c.STRING},VALUE_EXPRESSION:{type:c.STRING}}})).rows||[];debug(`Found ${E.length} fields for tstruct=${r}`),a.dcs=s.map(n=>({name:n.DC_NAME,tablename:n.TABLE_NAME,asgrid:n.AS_GRID,fields:E.filter(o=>o.DC_NAME===n.DC_NAME).map(o=>({fname:o.FIELD_NAME,datatype:o.DATA_TYPE,modeofentry:o.MODE_OF_ENTRY,fielddecimal:o.FIELD_DECIMAL,fldsql:o.FIELD_SQL,caption:o.FIELD_CAPTION,expression:o.EXPRESSION,valexpr:o.VALUE_EXPRESSION,srctf:o.SRC_TF,hidden:o.IS_HIDDEN,readonly:o.IS_READONLY,savevalue:o.SAVE_VALUE,ordno:o.ORDER_NO,tablename:n.TABLE_NAME,asgrid:n.AS_GRID,dcname:n.DC_NAME}))})),debug("Populated DC definitions");const u=s.find(n=>n.AS_GRID!=="T")?.TABLE_NAME;if(u){const n=await N(t,u),o=await m(t,u);a.tables.master={tableName:u,columns:n,primaryKeys:o},debug(`Populated master table schema for ${u}`);}for(const n of s.filter(o=>o.AS_GRID==="T")){const o=await N(t,n.TABLE_NAME),T=await m(t,n.TABLE_NAME);debug(`Populating detail table schema for ${n.TABLE_NAME}`),a.tables.details.push({tableName:n.TABLE_NAME,columns:o,primaryKeys:T});}return debug("Populated detail table schemas"),await t.close(),a}catch(t){return console.error("Error querying tstructs table:",t),null}};export{g as getAxpertStructure,I as getFieldsForFrontendSchema,D as getFieldsForParameters,y as getFieldsWithSql,S as getOracleConnection,m as getPrimaryKeys,N as getTableSchema,p as getTablesByStructure};