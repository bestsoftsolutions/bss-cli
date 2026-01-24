import c from'oracledb';import {debug}from'./logger.js';import {loadConfig}from'./configLoader.js';async function S(){try{const r=loadConfig(),e={user:r.axpert.db?.user??"",password:r.axpert.db?.password??"",connectString:r.axpert.db?.connectString??""};return await c.getConnection(e)}catch(r){console.error("Error connecting to Oracle:",r),process.exit(1);}}async function N(r,e){const a=`
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
    `;try{const t=await r.execute(a,{tableName:e.toUpperCase()},{outFormat:c.OUT_FORMAT_OBJECT});return (!t.rows||t.rows.length===0)&&(console.error(`Error: Table '${e}' not found in USER_TAB_COLUMNS`),process.exit(1)),t.rows.map(s=>({name:s.COLUMN_NAME,type:s.DATA_TYPE,length:s.DATA_LENGTH,precision:s.DATA_PRECISION,scale:s.DATA_SCALE,nullable:s.NULLABLE==="Y"}))}catch(t){console.error("Error querying table schema:",t),process.exit(1);}}async function m(r,e){const a=`
        SELECT COLS.COLUMN_NAME
        FROM USER_CONSTRAINTS CONS
        JOIN USER_CONS_COLUMNS COLS 
            ON CONS.CONSTRAINT_NAME = COLS.CONSTRAINT_NAME
        WHERE CONS.CONSTRAINT_TYPE = 'P'
            AND CONS.TABLE_NAME = :tableName
        ORDER BY COLS.POSITION
    `;try{return (await r.execute(a,{tableName:e.toUpperCase()})).rows?.map(l=>l[0])||[]}catch(t){return console.warn("Warning: Could not retrieve primary keys:",t),[]}}async function f(r,e){const a=`
        SELECT DISTINCT tablename, asgrid
        FROM axpdc
        WHERE tstruct = :tstruct
        ORDER BY asgrid DESC, tablename
    `;try{console.log(`
Executing query...`);const t=await r.execute(a,{tstruct:e});if(!t.rows||t.rows.length===0)return console.error(`\u274C No tables found for structure: ${e}`),{master:[],details:[]};const l=[],s=[];console.log(`
Tables found for structure '${e}':`);for(const d of t.rows){const i=d[0];d[1]==="T"?(s.push(i),console.log(`   \u{1F4C4} DETAIL: ${i}`)):(l.push(i),console.log(`   \u{1F4CB} MASTER: ${i}`));}return {master:l,details:s}}catch(t){console.error("\u274C Error querying database:",t),process.exit(1);}}async function y(r,e){const a=`
        SELECT a.fname, a.datatype, a.modeofentry, a.fldsql
        FROM axpflds a
        LEFT JOIN axpdc b ON a.tstruct = b.tstruct AND a.dcname = b.dname
        WHERE b.tstruct = :tstruct AND a.fldsql IS NOT NULL AND TRIM(a.fldsql) IS NOT NULL
        ORDER BY a.dcname, a.ordno
    `;try{return (await r.execute(a,{tstruct:e.toLowerCase()},{fetchInfo:{FLDSQL:{type:c.STRING}}})).rows||[]}catch(t){return console.error("Error querying axflds table:",t),[]}}async function D(r,e){const a=`
        SELECT a.fname, a.datatype, a.modeofentry, NVL(a.flddecimal, 0) as fielddecimal,
               a.fldsql, b.asgrid, b.tablename
        FROM axpflds a
        LEFT JOIN axpdc b ON a.tstruct = b.tstruct AND a.dcname = b.dname
        WHERE b.tstruct = :tstruct 
        ORDER BY a.dcname, a.ordno
    `;try{return (await r.execute(a,{tstruct:e.toLowerCase()},{fetchInfo:{FLDSQL:{type:c.STRING}}})).rows||[]}catch(t){return console.error("Error querying axflds table:",t),[]}}async function I(r,e){const a=`
        SELECT a.fname, a.caption, a.datatype, a.flddecimal, a.modeofentry, a.expression,
               a.valexpr, a.srctf, a.fldsql, a.hidden, a.readonly, a.savevalue, a.dcname,
               b.asgrid, b.tablename, a.ordno
        FROM axpflds a
        LEFT JOIN axpdc b ON a.tstruct = b.tstruct AND a.dcname = b.dname
        WHERE b.tstruct = :tstruct AND a.fldsql IS NOT NULL AND TRIM(a.fldsql) IS NOT NULL
        ORDER BY a.dcname, a.ordno
    `;try{return (await r.execute(a,{tstruct:e.toLowerCase()},{fetchInfo:{FLDSQL:{type:c.STRING},EXPRESSION:{type:c.STRING},VALEXPR:{type:c.STRING}}})).rows||[]}catch(t){return console.error("Error querying axflds table for frontend schema:",t),[]}}const O=`
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
`,g=async r=>{try{const e=await S();debug(`Fetching Axpert structure for tstruct=${r}`);const a={name:"",dcs:[],tables:{master:null,details:[]},pageTitle:void 0};let t=await e.execute(O,{tstruct:r},{outFormat:c.OUT_FORMAT_OBJECT});if(!t.rows||t.rows.length===0)throw new Error(`Tstruct '${r}' not found`);const l=t.rows[0];a.name=l.NAME,a.pageTitle=l.PAGE_TITLE,debug(`Found tstruct: ${a.name} with title: ${a.pageTitle}`),t=await e.execute(L,{tstruct:r},{outFormat:c.OUT_FORMAT_OBJECT});const s=t.rows||[];debug(`Found ${s.length} DCs for tstruct=${r}`);const i=(await e.execute(R,{tstruct:r},{outFormat:c.OUT_FORMAT_OBJECT,fetchInfo:{FIELD_SQL:{type:c.STRING},EXPRESSION:{type:c.STRING},VALUE_EXPRESSION:{type:c.STRING}}})).rows||[];debug(`Found ${i.length} fields for tstruct=${r}`),a.dcs=s.map(o=>({name:o.DC_NAME,tablename:o.TABLE_NAME,asgrid:o.AS_GRID,fields:i.filter(n=>n.DC_NAME===o.DC_NAME).map(n=>({fname:n.FIELD_NAME,datatype:n.DATA_TYPE,modeofentry:n.MODE_OF_ENTRY,fielddecimal:n.FIELD_DECIMAL,fldsql:n.FIELD_SQL,caption:n.FIELD_CAPTION,expression:n.EXPRESSION,valexpr:n.VALUE_EXPRESSION,srctf:n.SRC_TF,hidden:n.IS_HIDDEN,readonly:n.IS_READONLY,savevalue:n.SAVE_VALUE,ordno:n.ORDER_NO,tablename:o.TABLE_NAME,asgrid:o.AS_GRID,dcname:o.DC_NAME}))})),debug("Populated DC definitions");const u=s.find(o=>o.AS_GRID!=="T")?.TABLE_NAME;if(u){const o=await N(e,u),n=await m(e,u);a.tables.master={tableName:u,columns:o,primaryKeys:n},debug(`Populated master table schema for ${u}`);}for(const o of s.filter(n=>n.AS_GRID==="T")){const n=await N(e,o.TABLE_NAME),T=await m(e,o.TABLE_NAME);debug(`Populating detail table schema for ${o.TABLE_NAME}`),a.tables.details.push({tableName:o.TABLE_NAME,columns:n,primaryKeys:T});}return debug("Populated detail table schemas"),await e.close(),a}catch(e){return console.error("Error querying tstructs table:",e),null}};export{g as getAxpertStructure,I as getFieldsForFrontendSchema,D as getFieldsForParameters,y as getFieldsWithSql,S as getOracleConnection,m as getPrimaryKeys,N as getTableSchema,f as getTablesByStructure};