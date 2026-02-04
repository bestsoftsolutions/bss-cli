import u from'oracledb';import {debug}from'./logger.js';import {loadConfig}from'./configLoader.js';async function T(){try{const t=loadConfig(),o={user:t.axpert.db?.user??"",password:t.axpert.db?.password??"",connectString:t.axpert.db?.connectString??""};return await u.getConnection(o)}catch(t){console.error("Error connecting to Oracle:",t),process.exit(1);}}async function g(t,o){const e=`
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
    `;try{const r=await t.execute(e,{tableName:o.toUpperCase()},{outFormat:u.OUT_FORMAT_OBJECT});return (!r.rows||r.rows.length===0)&&(console.error(`Error: Table '${o}' not found in USER_TAB_COLUMNS`),process.exit(1)),r.rows.map(n=>({name:n.COLUMN_NAME.toLowerCase(),type:n.DATA_TYPE,length:n.DATA_LENGTH,precision:n.DATA_PRECISION,scale:n.DATA_SCALE,nullable:n.NULLABLE==="Y",isPrimaryKey:n.COLUMN_NAME.toLowerCase()==o.toLowerCase()+"id"}))}catch(r){console.error("Error querying table schema:",r),process.exit(1);}}async function m(t,o){const e=`
        SELECT COLS.COLUMN_NAME
        FROM USER_CONSTRAINTS CONS
        JOIN USER_CONS_COLUMNS COLS 
            ON CONS.CONSTRAINT_NAME = COLS.CONSTRAINT_NAME
        WHERE CONS.CONSTRAINT_TYPE = 'P'
            AND CONS.TABLE_NAME = :tableName
        ORDER BY COLS.POSITION
    `;try{return (await t.execute(e,{tableName:o.toUpperCase()})).rows?.map(a=>a[0])||[]}catch(r){return console.warn("Warning: Could not retrieve primary keys:",r),[]}}async function I(t,o){const e=`
        SELECT DISTINCT tablename, asgrid
        FROM axpdc
        WHERE tstruct = :tstruct
        ORDER BY asgrid DESC, tablename
    `;try{console.log(`
Executing query...`);const r=await t.execute(e,{tstruct:o});if(!r.rows||r.rows.length===0)return console.error(`\u274C No tables found for structure: ${o}`),{master:[],details:[]};const a=[],n=[];console.log(`
Tables found for structure '${o}':`);for(const c of r.rows){const d=c[0];c[1]==="T"?(n.push(d),console.log(`   \u{1F4C4} DETAIL: ${d}`)):(a.push(d),console.log(`   \u{1F4CB} MASTER: ${d}`));}return {master:a,details:n}}catch(r){console.error("\u274C Error querying database:",r),process.exit(1);}}async function F(t,o){const e=`
        SELECT a.fname, a.datatype, a.modeofentry, a.fldsql
        FROM axpflds a
        LEFT JOIN axpdc b ON a.tstruct = b.tstruct AND a.dcname = b.dname
        WHERE b.tstruct = :tstruct AND a.fldsql IS NOT NULL AND TRIM(a.fldsql) IS NOT NULL
        ORDER BY a.dcname, a.ordno
    `;try{return (await t.execute(e,{tstruct:o.toLowerCase()},{fetchInfo:{FLDSQL:{type:u.STRING}}})).rows||[]}catch(r){return console.error("Error querying axflds table:",r),[]}}async function w(t,o){const e=`
        SELECT a.fname, a.datatype, a.modeofentry, NVL(a.flddecimal, 0) as fielddecimal,
               a.fldsql, b.asgrid, b.tablename
        FROM axpflds a
        LEFT JOIN axpdc b ON a.tstruct = b.tstruct AND a.dcname = b.dname
        WHERE b.tstruct = :tstruct 
        ORDER BY a.dcname, a.ordno
    `;try{return (await t.execute(e,{tstruct:o.toLowerCase()},{fetchInfo:{FLDSQL:{type:u.STRING}}})).rows||[]}catch(r){return console.error("Error querying axflds table:",r),[]}}async function h(t,o){const e=`
        SELECT a.fname, a.caption, a.datatype, a.flddecimal, a.modeofentry, a.expression,
               a.valexpr, a.srctf, a.fldsql, a.hidden, a.readonly, a.savevalue, a.dcname,
               b.asgrid, b.tablename, a.ordno
        FROM axpflds a
        LEFT JOIN axpdc b ON a.tstruct = b.tstruct AND a.dcname = b.dname
        WHERE b.tstruct = :tstruct AND a.fldsql IS NOT NULL AND TRIM(a.fldsql) IS NOT NULL
        ORDER BY a.dcname, a.ordno
    `;try{return (await t.execute(e,{tstruct:o.toLowerCase()},{fetchInfo:{FLDSQL:{type:u.STRING},EXPRESSION:{type:u.STRING},VALEXPR:{type:u.STRING}}})).rows||[]}catch(r){return console.error("Error querying axflds table for frontend schema:",r),[]}}const C=`
    SELECT DISTINCT NAME, CAPTION PAGE_TITLE
    FROM tstructs
    WHERE name = :tstruct
`,A=`
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
`,b=async t=>{const o=await T();try{debug(`Fetching Axpert structure for tstruct=${t}`);const e={name:"",dcs:[],tables:{master:null,details:[]},pageTitle:void 0,relations:{},fillGrids:[],subGrids:[]};let r=await o.execute(C,{tstruct:t},{outFormat:u.OUT_FORMAT_OBJECT});if(!r.rows||r.rows.length===0)throw new Error(`Tstruct '${t}' not found`);const a=r.rows[0];e.name=a.NAME,e.pageTitle=a.PAGE_TITLE,debug(`Found tstruct: ${e.name} with title: ${e.pageTitle}`),e.relations=await O(o,t),console.log(e.relations),debug(`Fetched relations for tstruct=${t}`),e.fillGrids=await L(o,t),r=await o.execute(A,{tstruct:t},{outFormat:u.OUT_FORMAT_OBJECT}),console.log("Fill grids:",e.fillGrids.length),e.subGrids=await S(o,t),console.log("Sub grids:",e.subGrids.length);const n=r.rows||[];debug(`Found ${n.length} DCs for tstruct=${t}`);const d=(await o.execute(N,{tstruct:t},{outFormat:u.OUT_FORMAT_OBJECT,fetchInfo:{FIELD_SQL:{type:u.STRING},EXPRESSION:{type:u.STRING},VALUE_EXPRESSION:{type:u.STRING}}})).rows||[];debug(`Found ${d.length} fields for tstruct=${t}`),e.dcs=n.map(i=>({name:i.DC_NAME,tablename:i.TABLE_NAME.toLowerCase(),asgrid:i.AS_GRID,fields:d.filter(s=>s.DC_NAME===i.DC_NAME).map(s=>({fname:s.FIELD_NAME.toLowerCase(),datatype:s.DATA_TYPE,modeofentry:s.MODE_OF_ENTRY,fielddecimal:s.FIELD_DECIMAL,fldsql:s.FIELD_SQL,caption:s.FIELD_CAPTION||"",expression:s.EXPRESSION,valexpr:s.VALUE_EXPRESSION,sourceTable:s.SRC_TF,sourceField:s.SRC_FLD,hidden:s.IS_HIDDEN,readonly:s.IS_READONLY,savevalue:s.SAVE_VALUE,ordno:s.ORDER_NO,tablename:i.TABLE_NAME.toLowerCase(),asgrid:i.AS_GRID,dcname:i.DC_NAME,relations:e.relations[s.FIELD_NAME.toLowerCase()]||null})),isPopup:i.POPUP==="T",popupInfo:i.POPUP==="T"?e.subGrids.find(s=>s.name===i.DC_NAME):void 0,subGrids:e.subGrids.filter(s=>s.parentDC===i.DC_NAME),fillGrids:e.fillGrids.filter(s=>s.targetDC==i.DCNO),dcno:i.DCNO})),debug("Populated DC definitions");const l=n.find(i=>i.AS_GRID!=="T")?.TABLE_NAME.toLowerCase();if(l){const i=await g(o,l),s=await m(o,l);e.tables.master={tableName:l.toLowerCase(),columns:i,primaryKeys:s},debug(`Populated master table schema for ${l}`);}for(const i of n.filter(s=>s.AS_GRID==="T")){const s=await g(o,i.TABLE_NAME.toLowerCase()),f=await m(o,i.TABLE_NAME.toLowerCase());debug(`Populating detail table schema for ${i.TABLE_NAME}`),e.tables.details.push({tableName:i.TABLE_NAME.toLowerCase(),columns:s,primaryKeys:f});}return debug("Populated detail table schemas"),e}catch(e){return console.trace(e),console.error("Error querying tstructs table:",e),null}finally{await o.close();}},S=async(t,o)=>{const e="select * from axppopdc where tstruct = :tstruct";try{console.log(`
Executing subgrid query...`,o);const r=await t.execute(e,{tstruct:o},{outFormat:u.OUT_FORMAT_OBJECT,fetchInfo:{AUTOFILL:{type:u.STRING}}});console.log("Subgrids found:",r.rows?.length);const a=r.rows?.map(n=>{const[c,d]=n.PARENTFIELD.split(","),[l,i]=String(n.SHOWBUTTONS||"").split(","),s=c,f=d||i||l;return {name:n.DCNAME,parentDC:n.PARENT,parentField:s,heading:n.HEADING,popupCondition:n.POPCOND,autoShow:String(n.AUTOSHOW??"").toLocaleLowerCase()==="t",autoFill:String(n.AUTOFILL??"").trim().length>0,fillScript:String(n.AUTOFILL??"").trim(),firmFill:String(n.FIRMBIND??"").toLocaleLowerCase()==="t",addRow:String(n.ADDROW??"").toLocaleLowerCase()==="t",sumExpression:String(n.SUMEXPR??"").trim(),field:f}})||[];return console.log("Constructed subgrids:",a.length),a}catch(r){return console.error("Error querying axpopdc table:",r),[]}},L=async(t,o)=>{const e="select  fgname caption,caption fgname,fgsql,tardc from axpfillgrid where tstruct = :tstruct";try{console.log(`
Executing fill grid query...`,o);const r=await t.execute(e,{tstruct:o},{outFormat:u.OUT_FORMAT_OBJECT,fetchInfo:{FGSQL:{type:u.STRING}}});console.log("Fill grids found:",r.rows?.length);const n=await t.execute("select fgname, srcfld,tarfld,caption from axpfgdtl where tstruct = :tstruct",{tstruct:o},{outFormat:u.OUT_FORMAT_OBJECT});console.log("Fill grid details found:",n.rows?.length);const c={};for(const l of n.rows||[]){console.log("Processing fill grid field:",l);const i=l.FGNAME;c[i]||(c[i]=[]),c[i].push({sourceField:l.SRCFLD,targetField:l.TARFLD,caption:l.CAPTION});}console.log("Constructed field map for fill grids:",c);const d=r.rows?.map(l=>({name:l.FGNAME,caption:l.CAPTION,sql:l.FGSQL,targetDC:l.TARDC,multiSelect:!1,fields:c[l.FGNAME]||[]}))||[];return console.log("Constructed fill grids:",d.length),d}catch(r){return console.error("Error querying axpfillgrid table:",r),[]}},x=t=>{const o=/'(?:[^']|\\')*'/g,e=t.replace(o,"NO PARAM").toLocaleLowerCase(),r=/\?|\:\w+/g,n=e.match(r)||[];return Array.from(new Set(n.map(c=>c.replace(":","").replace("@",""))))};function M(t){const o=[];let e=0;for(;e<t.length;){const r=t[e];if(r==="'"){let a="'";for(e++;e<t.length;)if(t[e]==="'"&&t[e+1]==="'")a+="''",e+=2;else if(t[e]==="'"){a+="'",e++;break}else a+=t[e++];o.push(a);continue}if(r==='"'){let a='"';for(e++;e<t.length;)if(t[e]==='"'&&t[e+1]==='"')a+='""',e+=2;else if(t[e]==='"'){a+='"',e++;break}else a+=t[e++];o.push(a);continue}if(r==="`"){let a="`";for(e++;e<t.length&&t[e]!=="`";)a+=t[e++];e<t.length&&(a+=t[e++]),o.push(a);continue}if(r==="-"&&t[e+1]==="-"){let a="--";for(e+=2;e<t.length&&t[e]!==`
`;)a+=t[e++];o.push(a);continue}if(r==="/"&&t[e+1]==="*"){let a="/*";for(e+=2;e<t.length&&!(t[e]==="*"&&t[e+1]==="/");)a+=t[e++];e<t.length&&(a+="*/",e+=2),o.push(a);continue}o.push(r.toLowerCase()),e++;}return o.join("")}async function O(t,o){const r=await t.execute("select * from axrelations where mstruct = :struct",{struct:o},{outFormat:u.OUT_FORMAT_OBJECT}),a={};for(const n of r.rows){const c=n.DFIELD.toLowerCase();a[c]||(a[c]=[]),a[c].push({sourceStruct:n.MSTRUCT.toLowerCase(),targetStruct:n.DSTRUCT.toLowerCase(),sourceField:n.MFIELD.toLowerCase(),targetField:n.DFIELD.toLowerCase(),relationType:n.RTYPE.toLowerCase()});}return a}const P=t=>{const o=/'(?:[^']|\\')*'/g,e=t.replace(o,"NO PARAM"),r=/\?|\:\w+/g,n=e.match(r)||[];return Array.from(new Set(n.map(c=>c.replace(":","").replace("@","").toLowerCase())))};export{M as convertSqlToLowercase,P as extractParams,b as getAxpertStructure,h as getFieldsForFrontendSchema,w as getFieldsForParameters,F as getFieldsWithSql,L as getFillGrids,T as getOracleConnection,m as getPrimaryKeys,x as getStatementParameters,S as getSubgrids,g as getTableSchema,I as getTablesByStructure};