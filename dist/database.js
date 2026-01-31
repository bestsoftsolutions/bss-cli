import u from'oracledb';import {debug}from'./logger.js';import {loadConfig}from'./configLoader.js';async function T(){try{const t=loadConfig(),n={user:t.axpert.db?.user??"",password:t.axpert.db?.password??"",connectString:t.axpert.db?.connectString??""};return await u.getConnection(n)}catch(t){console.error("Error connecting to Oracle:",t),process.exit(1);}}async function g(t,n){const e=`
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
    `;try{const r=await t.execute(e,{tableName:n.toUpperCase()},{outFormat:u.OUT_FORMAT_OBJECT});return (!r.rows||r.rows.length===0)&&(console.error(`Error: Table '${n}' not found in USER_TAB_COLUMNS`),process.exit(1)),r.rows.map(o=>({name:o.COLUMN_NAME,type:o.DATA_TYPE,length:o.DATA_LENGTH,precision:o.DATA_PRECISION,scale:o.DATA_SCALE,nullable:o.NULLABLE==="Y"}))}catch(r){console.error("Error querying table schema:",r),process.exit(1);}}async function m(t,n){const e=`
        SELECT COLS.COLUMN_NAME
        FROM USER_CONSTRAINTS CONS
        JOIN USER_CONS_COLUMNS COLS 
            ON CONS.CONSTRAINT_NAME = COLS.CONSTRAINT_NAME
        WHERE CONS.CONSTRAINT_TYPE = 'P'
            AND CONS.TABLE_NAME = :tableName
        ORDER BY COLS.POSITION
    `;try{return (await t.execute(e,{tableName:n.toUpperCase()})).rows?.map(a=>a[0])||[]}catch(r){return console.warn("Warning: Could not retrieve primary keys:",r),[]}}async function _(t,n){const e=`
        SELECT DISTINCT tablename, asgrid
        FROM axpdc
        WHERE tstruct = :tstruct
        ORDER BY asgrid DESC, tablename
    `;try{console.log(`
Executing query...`);const r=await t.execute(e,{tstruct:n});if(!r.rows||r.rows.length===0)return console.error(`\u274C No tables found for structure: ${n}`),{master:[],details:[]};const a=[],o=[];console.log(`
Tables found for structure '${n}':`);for(const c of r.rows){const d=c[0];c[1]==="T"?(o.push(d),console.log(`   \u{1F4C4} DETAIL: ${d}`)):(a.push(d),console.log(`   \u{1F4CB} MASTER: ${d}`));}return {master:a,details:o}}catch(r){console.error("\u274C Error querying database:",r),process.exit(1);}}async function F(t,n){const e=`
        SELECT a.fname, a.datatype, a.modeofentry, a.fldsql
        FROM axpflds a
        LEFT JOIN axpdc b ON a.tstruct = b.tstruct AND a.dcname = b.dname
        WHERE b.tstruct = :tstruct AND a.fldsql IS NOT NULL AND TRIM(a.fldsql) IS NOT NULL
        ORDER BY a.dcname, a.ordno
    `;try{return (await t.execute(e,{tstruct:n.toLowerCase()},{fetchInfo:{FLDSQL:{type:u.STRING}}})).rows||[]}catch(r){return console.error("Error querying axflds table:",r),[]}}async function h(t,n){const e=`
        SELECT a.fname, a.datatype, a.modeofentry, NVL(a.flddecimal, 0) as fielddecimal,
               a.fldsql, b.asgrid, b.tablename
        FROM axpflds a
        LEFT JOIN axpdc b ON a.tstruct = b.tstruct AND a.dcname = b.dname
        WHERE b.tstruct = :tstruct 
        ORDER BY a.dcname, a.ordno
    `;try{return (await t.execute(e,{tstruct:n.toLowerCase()},{fetchInfo:{FLDSQL:{type:u.STRING}}})).rows||[]}catch(r){return console.error("Error querying axflds table:",r),[]}}async function b(t,n){const e=`
        SELECT a.fname, a.caption, a.datatype, a.flddecimal, a.modeofentry, a.expression,
               a.valexpr, a.srctf, a.fldsql, a.hidden, a.readonly, a.savevalue, a.dcname,
               b.asgrid, b.tablename, a.ordno
        FROM axpflds a
        LEFT JOIN axpdc b ON a.tstruct = b.tstruct AND a.dcname = b.dname
        WHERE b.tstruct = :tstruct AND a.fldsql IS NOT NULL AND TRIM(a.fldsql) IS NOT NULL
        ORDER BY a.dcname, a.ordno
    `;try{return (await t.execute(e,{tstruct:n.toLowerCase()},{fetchInfo:{FLDSQL:{type:u.STRING},EXPRESSION:{type:u.STRING},VALEXPR:{type:u.STRING}}})).rows||[]}catch(r){return console.error("Error querying axflds table for frontend schema:",r),[]}}const A=`
    SELECT DISTINCT NAME, CAPTION PAGE_TITLE
    FROM tstructs
    WHERE name = :tstruct
`,S=`
    SELECT dname DC_NAME, tablename TABLE_NAME, asgrid AS_GRID,
    popup,
    dcno
    FROM axpdc
    WHERE tstruct = :tstruct
`,N=`
    SELECT fname FIELD_NAME, datatype DATA_TYPE, flddecimal FIELD_DECIMAL, modeofentry MODE_OF_ENTRY,
           fldsql FIELD_SQL, caption FIELD_CAPTION, expression EXPRESSION, valexpr VALUE_EXPRESSION,
           srctf SRC_TF, srcfld SRC_FLD, hidden IS_HIDDEN, readonly IS_READONLY, savevalue SAVE_VALUE, ordno ORDER_NO,
              dcname DC_NAME
    FROM axpflds
    wHERE tstruct = :tstruct
    ORDER BY ordno
`,w=async t=>{const n=await T();try{debug(`Fetching Axpert structure for tstruct=${t}`);const e={name:"",dcs:[],tables:{master:null,details:[]},pageTitle:void 0,relations:{},fillGrids:[],subGrids:[]};let r=await n.execute(A,{tstruct:t},{outFormat:u.OUT_FORMAT_OBJECT});if(!r.rows||r.rows.length===0)throw new Error(`Tstruct '${t}' not found`);const a=r.rows[0];e.name=a.NAME,e.pageTitle=a.PAGE_TITLE,debug(`Found tstruct: ${e.name} with title: ${e.pageTitle}`),e.relations=await O(n,t),console.log(e.relations),debug(`Fetched relations for tstruct=${t}`),e.fillGrids=await L(n,t),r=await n.execute(S,{tstruct:t},{outFormat:u.OUT_FORMAT_OBJECT}),console.log("Fill grids:",e.fillGrids.length),e.subGrids=await C(n,t),console.log("Sub grids:",e.subGrids.length);const o=r.rows||[];debug(`Found ${o.length} DCs for tstruct=${t}`);const d=(await n.execute(N,{tstruct:t},{outFormat:u.OUT_FORMAT_OBJECT,fetchInfo:{FIELD_SQL:{type:u.STRING},EXPRESSION:{type:u.STRING},VALUE_EXPRESSION:{type:u.STRING}}})).rows||[];debug(`Found ${d.length} fields for tstruct=${t}`),e.dcs=o.map(i=>({name:i.DC_NAME,tablename:i.TABLE_NAME,asgrid:i.AS_GRID,fields:d.filter(s=>s.DC_NAME===i.DC_NAME).map(s=>({fname:s.FIELD_NAME,datatype:s.DATA_TYPE,modeofentry:s.MODE_OF_ENTRY,fielddecimal:s.FIELD_DECIMAL,fldsql:s.FIELD_SQL,caption:s.FIELD_CAPTION||"",expression:s.EXPRESSION,valexpr:s.VALUE_EXPRESSION,sourceTable:s.SRC_TF,sourceField:s.SRC_FLD,hidden:s.IS_HIDDEN,readonly:s.IS_READONLY,savevalue:s.SAVE_VALUE,ordno:s.ORDER_NO,tablename:i.TABLE_NAME,asgrid:i.AS_GRID,dcname:i.DC_NAME,relations:e.relations[s.FIELD_NAME.toLowerCase()]||null})),isPopup:i.POPUP==="T",popupInfo:i.POPUP==="T"?e.subGrids.find(s=>s.name===i.DC_NAME):void 0,subGrids:e.subGrids.filter(s=>s.parentDC===i.DC_NAME),fillGrids:e.fillGrids.filter(s=>s.targetDC==i.DCNO),dcno:i.DCNO})),debug("Populated DC definitions");const l=o.find(i=>i.AS_GRID!=="T")?.TABLE_NAME;if(l){const i=await g(n,l),s=await m(n,l);e.tables.master={tableName:l,columns:i,primaryKeys:s},debug(`Populated master table schema for ${l}`);}for(const i of o.filter(s=>s.AS_GRID==="T")){const s=await g(n,i.TABLE_NAME),f=await m(n,i.TABLE_NAME);debug(`Populating detail table schema for ${i.TABLE_NAME}`),e.tables.details.push({tableName:i.TABLE_NAME,columns:s,primaryKeys:f});}return debug("Populated detail table schemas"),e}catch(e){return console.trace(e),console.error("Error querying tstructs table:",e),null}finally{await n.close();}},C=async(t,n)=>{const e="select * from axppopdc where tstruct = :tstruct";try{console.log(`
Executing subgrid query...`,n);const r=await t.execute(e,{tstruct:n},{outFormat:u.OUT_FORMAT_OBJECT,fetchInfo:{AUTOFILL:{type:u.STRING}}});console.log("Subgrids found:",r.rows?.length);const a=r.rows?.map(o=>{const[c,d]=o.PARENTFIELD.split(","),[l,i]=String(o.SHOWBUTTONS||"").split(","),s=c,f=d||i||l;return {name:o.DCNAME,parentDC:o.PARENT,parentField:s,heading:o.HEADING,popupCondition:o.POPCOND,autoShow:String(o.AUTOSHOW??"").toLocaleLowerCase()==="t",autoFill:String(o.AUTOFILL??"").trim().length>0,fillScript:String(o.AUTOFILL??"").trim(),firmFill:String(o.FIRMBIND??"").toLocaleLowerCase()==="t",addRow:String(o.ADDROW??"").toLocaleLowerCase()==="t",sumExpression:String(o.SUMEXPR??"").trim(),field:f}})||[];return console.log("Constructed subgrids:",a.length),a}catch(r){return console.error("Error querying axpopdc table:",r),[]}},L=async(t,n)=>{const e="select  fgname caption,caption fgname,fgsql,tardc from axpfillgrid where tstruct = :tstruct";try{console.log(`
Executing fill grid query...`,n);const r=await t.execute(e,{tstruct:n},{outFormat:u.OUT_FORMAT_OBJECT,fetchInfo:{FGSQL:{type:u.STRING}}});console.log("Fill grids found:",r.rows?.length);const o=await t.execute("select fgname, srcfld,tarfld,caption from axpfgdtl where tstruct = :tstruct",{tstruct:n},{outFormat:u.OUT_FORMAT_OBJECT});console.log("Fill grid details found:",o.rows?.length);const c={};for(const l of o.rows||[]){console.log("Processing fill grid field:",l);const i=l.FGNAME;c[i]||(c[i]=[]),c[i].push({sourceField:l.SRCFLD,targetField:l.TARFLD,caption:l.CAPTION});}console.log("Constructed field map for fill grids:",c);const d=r.rows?.map(l=>({name:l.FGNAME,caption:l.CAPTION,sql:l.FGSQL,targetDC:l.TARDC,multiSelect:!1,fields:c[l.FGNAME]||[]}))||[];return console.log("Constructed fill grids:",d.length),d}catch(r){return console.error("Error querying axpfillgrid table:",r),[]}},x=t=>{const n=/'(?:[^']|\\')*'/g,e=t.replace(n,"NO PARAM").toLocaleLowerCase(),r=/\?|\:\w+/g,o=e.match(r)||[];return Array.from(new Set(o.map(c=>c.replace(":","").replace("@",""))))};function M(t){const n=[];let e=0;for(;e<t.length;){const r=t[e];if(r==="'"){let a="'";for(e++;e<t.length;)if(t[e]==="'"&&t[e+1]==="'")a+="''",e+=2;else if(t[e]==="'"){a+="'",e++;break}else a+=t[e++];n.push(a);continue}if(r==='"'){let a='"';for(e++;e<t.length;)if(t[e]==='"'&&t[e+1]==='"')a+='""',e+=2;else if(t[e]==='"'){a+='"',e++;break}else a+=t[e++];n.push(a);continue}if(r==="`"){let a="`";for(e++;e<t.length&&t[e]!=="`";)a+=t[e++];e<t.length&&(a+=t[e++]),n.push(a);continue}if(r==="-"&&t[e+1]==="-"){let a="--";for(e+=2;e<t.length&&t[e]!==`
`;)a+=t[e++];n.push(a);continue}if(r==="/"&&t[e+1]==="*"){let a="/*";for(e+=2;e<t.length&&!(t[e]==="*"&&t[e+1]==="/");)a+=t[e++];e<t.length&&(a+="*/",e+=2),n.push(a);continue}n.push(r.toLowerCase()),e++;}return n.join("")}async function O(t,n){const r=await t.execute("select * from axrelations where mstruct = :struct",{struct:n},{outFormat:u.OUT_FORMAT_OBJECT}),a={};for(const o of r.rows){const c=o.DFIELD.toLowerCase();a[c]||(a[c]=[]),a[c].push({sourceStruct:o.MSTRUCT.toLowerCase(),targetStruct:o.DSTRUCT.toLowerCase(),sourceField:o.MFIELD.toLowerCase(),targetField:o.DFIELD.toLowerCase(),relationType:o.RTYPE.toLowerCase()});}return a}const P=t=>{const n=/'(?:[^']|\\')*'/g,e=t.replace(n,"NO PARAM"),r=/\?|\:\w+/g,o=e.match(r)||[];return Array.from(new Set(o.map(c=>c.replace(":","").replace("@","").toLowerCase())))};export{M as convertSqlToLowercase,P as extractParams,w as getAxpertStructure,b as getFieldsForFrontendSchema,h as getFieldsForParameters,F as getFieldsWithSql,L as getFillGrids,T as getOracleConnection,m as getPrimaryKeys,x as getStatementParameters,C as getSubgrids,g as getTableSchema,_ as getTablesByStructure};