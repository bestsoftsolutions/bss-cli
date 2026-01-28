import i from'oracledb';import {debug}from'./logger.js';import {loadConfig}from'./configLoader.js';async function T(){try{const t=loadConfig(),a={user:t.axpert.db?.user??"",password:t.axpert.db?.password??"",connectString:t.axpert.db?.connectString??""};return await i.getConnection(a)}catch(t){console.error("Error connecting to Oracle:",t),process.exit(1);}}async function d(t,a){const e=`
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
    `;try{const r=await t.execute(e,{tableName:a.toUpperCase()},{outFormat:i.OUT_FORMAT_OBJECT});return (!r.rows||r.rows.length===0)&&(console.error(`Error: Table '${a}' not found in USER_TAB_COLUMNS`),process.exit(1)),r.rows.map(s=>({name:s.COLUMN_NAME,type:s.DATA_TYPE,length:s.DATA_LENGTH,precision:s.DATA_PRECISION,scale:s.DATA_SCALE,nullable:s.NULLABLE==="Y"}))}catch(r){console.error("Error querying table schema:",r),process.exit(1);}}async function N(t,a){const e=`
        SELECT COLS.COLUMN_NAME
        FROM USER_CONSTRAINTS CONS
        JOIN USER_CONS_COLUMNS COLS 
            ON CONS.CONSTRAINT_NAME = COLS.CONSTRAINT_NAME
        WHERE CONS.CONSTRAINT_TYPE = 'P'
            AND CONS.TABLE_NAME = :tableName
        ORDER BY COLS.POSITION
    `;try{return (await t.execute(e,{tableName:a.toUpperCase()})).rows?.map(n=>n[0])||[]}catch(r){return console.warn("Warning: Could not retrieve primary keys:",r),[]}}async function _(t,a){const e=`
        SELECT DISTINCT tablename, asgrid
        FROM axpdc
        WHERE tstruct = :tstruct
        ORDER BY asgrid DESC, tablename
    `;try{console.log(`
Executing query...`);const r=await t.execute(e,{tstruct:a});if(!r.rows||r.rows.length===0)return console.error(`\u274C No tables found for structure: ${a}`),{master:[],details:[]};const n=[],s=[];console.log(`
Tables found for structure '${a}':`);for(const E of r.rows){const u=E[0];E[1]==="T"?(s.push(u),console.log(`   \u{1F4C4} DETAIL: ${u}`)):(n.push(u),console.log(`   \u{1F4CB} MASTER: ${u}`));}return {master:n,details:s}}catch(r){console.error("\u274C Error querying database:",r),process.exit(1);}}async function C(t,a){const e=`
        SELECT a.fname, a.datatype, a.modeofentry, a.fldsql
        FROM axpflds a
        LEFT JOIN axpdc b ON a.tstruct = b.tstruct AND a.dcname = b.dname
        WHERE b.tstruct = :tstruct AND a.fldsql IS NOT NULL AND TRIM(a.fldsql) IS NOT NULL
        ORDER BY a.dcname, a.ordno
    `;try{return (await t.execute(e,{tstruct:a.toLowerCase()},{fetchInfo:{FLDSQL:{type:i.STRING}}})).rows||[]}catch(r){return console.error("Error querying axflds table:",r),[]}}async function y(t,a){const e=`
        SELECT a.fname, a.datatype, a.modeofentry, NVL(a.flddecimal, 0) as fielddecimal,
               a.fldsql, b.asgrid, b.tablename
        FROM axpflds a
        LEFT JOIN axpdc b ON a.tstruct = b.tstruct AND a.dcname = b.dname
        WHERE b.tstruct = :tstruct 
        ORDER BY a.dcname, a.ordno
    `;try{return (await t.execute(e,{tstruct:a.toLowerCase()},{fetchInfo:{FLDSQL:{type:i.STRING}}})).rows||[]}catch(r){return console.error("Error querying axflds table:",r),[]}}async function I(t,a){const e=`
        SELECT a.fname, a.caption, a.datatype, a.flddecimal, a.modeofentry, a.expression,
               a.valexpr, a.srctf, a.fldsql, a.hidden, a.readonly, a.savevalue, a.dcname,
               b.asgrid, b.tablename, a.ordno
        FROM axpflds a
        LEFT JOIN axpdc b ON a.tstruct = b.tstruct AND a.dcname = b.dname
        WHERE b.tstruct = :tstruct AND a.fldsql IS NOT NULL AND TRIM(a.fldsql) IS NOT NULL
        ORDER BY a.dcname, a.ordno
    `;try{return (await t.execute(e,{tstruct:a.toLowerCase()},{fetchInfo:{FLDSQL:{type:i.STRING},EXPRESSION:{type:i.STRING},VALEXPR:{type:i.STRING}}})).rows||[]}catch(r){return console.error("Error querying axflds table for frontend schema:",r),[]}}const S=`
    SELECT DISTINCT NAME, CAPTION PAGE_TITLE
    FROM tstructs
    WHERE name = :tstruct
`,f=`
    SELECT dname DC_NAME, tablename TABLE_NAME, asgrid AS_GRID
    FROM axpdc
    WHERE tstruct = :tstruct
`,L=`
    SELECT fname FIELD_NAME, datatype DATA_TYPE, flddecimal FIELD_DECIMAL, modeofentry MODE_OF_ENTRY,
           fldsql FIELD_SQL, caption FIELD_CAPTION, expression EXPRESSION, valexpr VALUE_EXPRESSION,
           srctf SRC_TF, hidden IS_HIDDEN, readonly IS_READONLY, savevalue SAVE_VALUE, ordno ORDER_NO,
              dcname DC_NAME
    FROM axpflds
    wHERE tstruct = :tstruct
    ORDER BY ordno
`,D=async t=>{try{const a=await T();debug(`Fetching Axpert structure for tstruct=${t}`);const e={name:"",dcs:[],tables:{master:null,details:[]},pageTitle:void 0};let r=await a.execute(S,{tstruct:t},{outFormat:i.OUT_FORMAT_OBJECT});if(!r.rows||r.rows.length===0)throw new Error(`Tstruct '${t}' not found`);const n=r.rows[0];e.name=n.NAME,e.pageTitle=n.PAGE_TITLE,debug(`Found tstruct: ${e.name} with title: ${e.pageTitle}`),r=await a.execute(f,{tstruct:t},{outFormat:i.OUT_FORMAT_OBJECT});const s=r.rows||[];debug(`Found ${s.length} DCs for tstruct=${t}`);const u=(await a.execute(L,{tstruct:t},{outFormat:i.OUT_FORMAT_OBJECT,fetchInfo:{FIELD_SQL:{type:i.STRING},EXPRESSION:{type:i.STRING},VALUE_EXPRESSION:{type:i.STRING}}})).rows||[];debug(`Found ${u.length} fields for tstruct=${t}`),e.dcs=s.map(c=>({name:c.DC_NAME,tablename:c.TABLE_NAME,asgrid:c.AS_GRID,fields:u.filter(o=>o.DC_NAME===c.DC_NAME).map(o=>({fname:o.FIELD_NAME,datatype:o.DATA_TYPE,modeofentry:o.MODE_OF_ENTRY,fielddecimal:o.FIELD_DECIMAL,fldsql:o.FIELD_SQL,caption:o.FIELD_CAPTION,expression:o.EXPRESSION,valexpr:o.VALUE_EXPRESSION,srctf:o.SRC_TF,hidden:o.IS_HIDDEN,readonly:o.IS_READONLY,savevalue:o.SAVE_VALUE,ordno:o.ORDER_NO,tablename:c.TABLE_NAME,asgrid:c.AS_GRID,dcname:c.DC_NAME}))})),debug("Populated DC definitions");const m=s.find(c=>c.AS_GRID!=="T")?.TABLE_NAME;if(m){const c=await d(a,m),o=await N(a,m);e.tables.master={tableName:m,columns:c,primaryKeys:o},debug(`Populated master table schema for ${m}`);}for(const c of s.filter(o=>o.AS_GRID==="T")){const o=await d(a,c.TABLE_NAME),A=await N(a,c.TABLE_NAME);debug(`Populating detail table schema for ${c.TABLE_NAME}`),e.tables.details.push({tableName:c.TABLE_NAME,columns:o,primaryKeys:A});}return debug("Populated detail table schemas"),await a.close(),e}catch(a){return console.error("Error querying tstructs table:",a),null}},b=t=>{const a=/'(?:[^']|\\')*'/g,e=t.replace(a,"NO PARAM").toLocaleLowerCase(),r=/\?|\:\w+/g,s=e.match(r)||[];return Array.from(new Set(s.map(E=>E.replace(":","").replace("@",""))))};function h(t){const a=[];let e=0;for(;e<t.length;){const r=t[e];if(r==="'"){let n="'";for(e++;e<t.length;)if(t[e]==="'"&&t[e+1]==="'")n+="''",e+=2;else if(t[e]==="'"){n+="'",e++;break}else n+=t[e++];a.push(n);continue}if(r==='"'){let n='"';for(e++;e<t.length;)if(t[e]==='"'&&t[e+1]==='"')n+='""',e+=2;else if(t[e]==='"'){n+='"',e++;break}else n+=t[e++];a.push(n);continue}if(r==="`"){let n="`";for(e++;e<t.length&&t[e]!=="`";)n+=t[e++];e<t.length&&(n+=t[e++]),a.push(n);continue}if(r==="-"&&t[e+1]==="-"){let n="--";for(e+=2;e<t.length&&t[e]!==`
`;)n+=t[e++];a.push(n);continue}if(r==="/"&&t[e+1]==="*"){let n="/*";for(e+=2;e<t.length&&!(t[e]==="*"&&t[e+1]==="/");)n+=t[e++];e<t.length&&(n+="*/",e+=2),a.push(n);continue}a.push(r.toLowerCase()),e++;}return a.join("")}const w=t=>{const a=/'(?:[^']|\\')*'/g,e=t.replace(a,"NO PARAM"),r=/\?|\:\w+/g,s=e.match(r)||[];return Array.from(new Set(s.map(E=>E.replace(":","").replace("@",""))))};export{h as convertSqlToLowercase,w as extractParams,D as getAxpertStructure,I as getFieldsForFrontendSchema,y as getFieldsForParameters,C as getFieldsWithSql,T as getOracleConnection,N as getPrimaryKeys,b as getStatementParameters,d as getTableSchema,_ as getTablesByStructure};