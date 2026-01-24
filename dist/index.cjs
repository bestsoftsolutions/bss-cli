#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/index.ts
var import_commander = require("commander");
var path7 = __toESM(require("path"), 1);

// src/templateGenerator.ts
var fs = __toESM(require("fs"), 1);
var path = __toESM(require("path"), 1);
var import_eta = require("eta");
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
var eta = new import_eta.Eta({
  useWith: true
});
function copyTemplateStructure(srcDir, destDir, placeholders) {
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    let outName = entry.name;
    for (const [ph, val] of Object.entries(placeholders)) {
      outName = outName.replace(new RegExp(ph, "g"), val);
    }
    const srcPath = path.join(srcDir, entry.name);
    let destPath = path.join(destDir, outName.replace(/\.eta$/, ""));
    if (entry.isDirectory()) {
      copyTemplateStructure(srcPath, destPath, placeholders);
    } else if (entry.isFile()) {
      if (entry.name.endsWith(".eta")) {
        const template = fs.readFileSync(srcPath, "utf-8");
        const rendered = eta.renderString(template, placeholders) ?? "";
        fs.writeFileSync(destPath, rendered, "utf-8");
      } else {
        fs.writeFileSync(destPath, "", "utf-8");
      }
    }
  }
}
function generatePageFromTemplate(templateDir, outputDir, pageName) {
  copyTemplateStructure(templateDir, outputDir, {
    __page__: pageName,
    __Page__: capitalize(pageName),
    __PAGE__: pageName.toUpperCase()
  });
}
function compileTemplate(templatePath, data) {
  eta.configure({ views: path.dirname(templatePath) });
  const templateString = eta.renderString(fs.readFileSync(templatePath, "utf-8"), data);
  return templateString ?? "";
}
async function writeCompiledTemplate(templatePath, outputPath, data, placeholders) {
  const dir = path.dirname(outputPath);
  const filename = path.basename(outputPath);
  let outName = path.basename(outputPath);
  for (const [ph, val] of Object.entries(placeholders)) {
    outName = outName.replace(new RegExp(ph, "g"), val);
  }
  let destPath = path.join(dir, outName.replace(/\.eta$/, ""));
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (fs.existsSync(destPath)) {
    console.warn(`\u26A0\uFE0F  Warning: Overwriting existing file at ${destPath}`);
  }
  if (filename.endsWith(".eta")) {
    destPath = destPath.replace(/\.eta$/, "");
  }
  const compiled = compileTemplate(templatePath, {
    ...placeholders,
    ...data
  });
  fs.writeFileSync(destPath, compiled, "utf-8");
}

// src/axpertPageGenerator.ts
var import_path = __toESM(require("path"), 1);

// src/logger.ts
var level = "silent";
function setLogLevel(input) {
  if (input?.debug) level = "debug";
  else if (input?.verbose) level = "verbose";
  else level = "silent";
}
function log(msg) {
  if (level !== "silent") console.log(msg);
}
function debug(msg) {
  if (level === "debug") console.log(`[debug] ${msg}`);
}

// src/database.ts
var import_oracledb = __toESM(require("oracledb"), 1);

// src/config.ts
var fs2 = __toESM(require("fs"), 1);
var path2 = __toESM(require("path"), 1);
var __dirname2 = path2.dirname(__filename);
var cliRoot = path2.resolve(__dirname2, "..");
function getTemplatePath(type) {
  return path2.resolve(cliRoot, "./templates", type);
}
function loadConfig() {
  try {
    const projectConfigPath = path2.join(process.cwd(), "bss.config.json");
    let config2 = void 0;
    if (fs2.existsSync(projectConfigPath)) {
      config2 = JSON.parse(fs2.readFileSync(projectConfigPath, "utf-8"));
    } else {
      const fallbackConfigPath = path2.join(__dirname2, "..", "bss.config.json");
      if (fs2.existsSync(fallbackConfigPath)) {
        config2 = JSON.parse(fs2.readFileSync(fallbackConfigPath, "utf-8"));
      } else {
        throw new Error("bss.config.json not found. Run `init` first.");
      }
    }
    if (config2.axpert && config2.axpert.db) {
      config2.database = config2.axpert.db;
    }
    return config2;
  } catch (err) {
    throw new Error("Failed to load config: " + err);
  }
  return {
    database: {
      user: "garment",
      password: "log",
      connectString: "192.168.1.95:1521/xe"
    },
    paths: {
      backend: "./backend/app/modules",
      frontend: "./frontend/apps/modules"
    },
    defaults: {
      pageSize: 10,
      maxPageSize: 100
    }
  };
}
var config = loadConfig();
var ORACLE_CONFIG = {
  user: config.database?.user ?? "",
  password: config.database?.password ?? "",
  connectString: config.database?.connectString ?? ""
};
var BACKEND_PATH = config.paths?.backend ?? "./backend/apps/modules";
var FRONTEND_PATH = config.paths?.frontend ?? "./frontend/apps/modules";
var DEFAULT_PAGE_SIZE = config.defaults?.pageSize ?? 10;
var MAX_PAGE_SIZE = config.defaults?.maxPageSize ?? 100;

// src/database.ts
async function getOracleConnection() {
  try {
    const connection = await import_oracledb.default.getConnection(ORACLE_CONFIG);
    return connection;
  } catch (error) {
    console.error("Error connecting to Oracle:", error);
    process.exit(1);
  }
}
async function getTableSchema(conn, tableName) {
  const query = `
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
    `;
  try {
    const result = await conn.execute(
      query,
      { tableName: tableName.toUpperCase() },
      { outFormat: import_oracledb.default.OUT_FORMAT_OBJECT }
    );
    if (!result.rows || result.rows.length === 0) {
      console.error(`Error: Table '${tableName}' not found in USER_TAB_COLUMNS`);
      process.exit(1);
    }
    const schema = result.rows.map((col) => ({
      name: col.COLUMN_NAME,
      type: col.DATA_TYPE,
      length: col.DATA_LENGTH,
      precision: col.DATA_PRECISION,
      scale: col.DATA_SCALE,
      nullable: col.NULLABLE === "Y"
    }));
    return schema;
  } catch (error) {
    console.error("Error querying table schema:", error);
    process.exit(1);
  }
}
async function getPrimaryKeys(conn, tableName) {
  const query = `
        SELECT COLS.COLUMN_NAME
        FROM USER_CONSTRAINTS CONS
        JOIN USER_CONS_COLUMNS COLS 
            ON CONS.CONSTRAINT_NAME = COLS.CONSTRAINT_NAME
        WHERE CONS.CONSTRAINT_TYPE = 'P'
            AND CONS.TABLE_NAME = :tableName
        ORDER BY COLS.POSITION
    `;
  try {
    const result = await conn.execute(
      query,
      { tableName: tableName.toUpperCase() }
    );
    return result.rows?.map((row) => row[0]) || [];
  } catch (error) {
    console.warn("Warning: Could not retrieve primary keys:", error);
    return [];
  }
}
var TSTRUCT_QUERY = `
    SELECT DISTINCT NAME, CAPTION PAGE_TITLE
    FROM tstructs
    WHERE name = :tstruct
`;
var DC_QUERY = `
    SELECT dname DC_NAME, tablename TABLE_NAME, asgrid AS_GRID
    FROM axpdc
    WHERE tstruct = :tstruct
`;
var FIELDS_QUERY = `
    SELECT fname FIELD_NAME, datatype DATA_TYPE, flddecimal FIELD_DECIMAL, modeofentry MODE_OF_ENTRY,
           fldsql FIELD_SQL, caption FIELD_CAPTION, expression EXPRESSION, valexpr VALUE_EXPRESSION,
           srctf SRC_TF, hidden IS_HIDDEN, readonly IS_READONLY, savevalue SAVE_VALUE, ordno ORDER_NO,
              dcname DC_NAME
    FROM axpflds
    wHERE tstruct = :tstruct
    ORDER BY ordno
`;
var getAxpertStructure = async (tstruct) => {
  try {
    const conn = await getOracleConnection();
    debug(`Fetching Axpert structure for tstruct=${tstruct}`);
    const structure = {
      name: "",
      dcs: [],
      tables: { master: null, details: [] },
      pageTitle: void 0
    };
    let result = await conn.execute(
      TSTRUCT_QUERY,
      { tstruct },
      { outFormat: import_oracledb.default.OUT_FORMAT_OBJECT }
    );
    if (!result.rows || result.rows.length === 0) {
      throw new Error(`Tstruct '${tstruct}' not found`);
    }
    const tstructRow = result.rows[0];
    structure.name = tstructRow.NAME;
    structure.pageTitle = tstructRow.PAGE_TITLE;
    debug(`Found tstruct: ${structure.name} with title: ${structure.pageTitle}`);
    result = await conn.execute(
      DC_QUERY,
      { tstruct },
      { outFormat: import_oracledb.default.OUT_FORMAT_OBJECT }
    );
    const dcs = result.rows || [];
    debug(`Found ${dcs.length} DCs for tstruct=${tstruct}`);
    const fieldsResult = await conn.execute(
      FIELDS_QUERY,
      { tstruct },
      {
        outFormat: import_oracledb.default.OUT_FORMAT_OBJECT,
        fetchInfo: {
          "FIELD_SQL": { type: import_oracledb.default.STRING },
          "EXPRESSION": { type: import_oracledb.default.STRING },
          "VALUE_EXPRESSION": { type: import_oracledb.default.STRING }
        }
      }
    );
    const fields = fieldsResult.rows || [];
    debug(`Found ${fields.length} fields for tstruct=${tstruct}`);
    structure.dcs = dcs.map((dc) => ({
      name: dc.DC_NAME,
      tablename: dc.TABLE_NAME,
      asgrid: dc.AS_GRID,
      fields: fields.filter((f) => f.DC_NAME === dc.DC_NAME).map((f) => ({
        fname: f.FIELD_NAME,
        datatype: f.DATA_TYPE,
        modeofentry: f.MODE_OF_ENTRY,
        fielddecimal: f.FIELD_DECIMAL,
        fldsql: f.FIELD_SQL,
        caption: f.FIELD_CAPTION,
        expression: f.EXPRESSION,
        valexpr: f.VALUE_EXPRESSION,
        srctf: f.SRC_TF,
        hidden: f.IS_HIDDEN,
        readonly: f.IS_READONLY,
        savevalue: f.SAVE_VALUE,
        ordno: f.ORDER_NO,
        tablename: dc.TABLE_NAME,
        asgrid: dc.AS_GRID,
        dcname: dc.DC_NAME
      }))
    }));
    debug(`Populated DC definitions`);
    const masterTableName = dcs.find((dc) => dc.AS_GRID !== "T")?.TABLE_NAME;
    if (masterTableName) {
      const masterColumns = await getTableSchema(conn, masterTableName);
      const masterPrimaryKeys = await getPrimaryKeys(conn, masterTableName);
      structure.tables.master = {
        tableName: masterTableName,
        columns: masterColumns,
        primaryKeys: masterPrimaryKeys
      };
      debug(`Populated master table schema for ${masterTableName}`);
    }
    for (const dc of dcs.filter((dc2) => dc2.AS_GRID === "T")) {
      const detailColumns = await getTableSchema(conn, dc.TABLE_NAME);
      const detailPrimaryKeys = await getPrimaryKeys(conn, dc.TABLE_NAME);
      debug(`Populating detail table schema for ${dc.TABLE_NAME}`);
      structure.tables.details.push({
        tableName: dc.TABLE_NAME,
        columns: detailColumns,
        primaryKeys: detailPrimaryKeys
      });
    }
    debug(`Populated detail table schemas`);
    await conn.close();
    return structure;
  } catch (error) {
    console.error("Error querying tstructs table:", error);
    return null;
  }
};

// src/typeMapping.ts
function toClassName(tableName) {
  return tableName.replace(" ", "_").split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join("");
}

// src/fileUtils.ts
var fs3 = __toESM(require("fs"), 1);
var path3 = __toESM(require("path"), 1);
function dirExists(dirPath) {
  return fs3.existsSync(dirPath) && fs3.statSync(dirPath).isDirectory();
}
function createDir(dirPath, ...args) {
  const fullPath = path3.join(dirPath, ...args);
  if (!fs3.existsSync(fullPath)) {
    fs3.mkdirSync(fullPath, { recursive: true });
  }
}

// src/axpertPageGenerator.ts
async function buildCreatePageContext(tstruct, moduleName, dbConfig) {
  const axp_struct = await getAxpertStructure(tstruct);
  if (!axp_struct) {
    throw new Error(`Axpert structure not found for tstruct: ${tstruct}`);
  }
  return axp_struct;
}
function capitalize2(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
function buildAxpertPlaceholders(ctx) {
  return {
    __module__: ctx.moduleName,
    __Module__: capitalize2(ctx.moduleName),
    __MODULE__: ctx.moduleName.toUpperCase(),
    __page__: ctx.page?.name ?? "",
    __Page__: capitalize2(ctx.page?.name ?? ""),
    __PAGE__: (ctx.page?.name ?? "").toUpperCase(),
    __TSTRUCT__: ctx.tstruct,
    __Tstruct__: capitalize2(ctx.tstruct),
    __tstruct__: ctx.tstruct.toLowerCase(),
    tstuct: ctx.tstruct,
    PAGE_NAME: ctx.page?.name ?? "",
    PAGE_TITLE: ctx.pageTitle ?? "",
    MASTER_TABLE: ctx.tables.master.tableName ?? ""
    // MASTER_PK: JSON.stringify(ctx.tables.master.primaryKeys ?? []),
    // MASTER_FIELDS: JSON.stringify(ctx.tables.master.columns ?? []),
    // DETAILS: JSON.stringify(ctx.tables.details ?? []),
    // DCS: JSON.stringify(ctx.dcs ?? []),
  };
}
async function createAxpertBackendModule(moduleName, backendRoot, templateRoot, placeholders, context, options) {
  log("Generating backend module...");
  const backendOutput = import_path.default.join(backendRoot, moduleName);
  const modelDir = import_path.default.join(backendOutput, "models");
  if (!dirExists(modelDir)) {
    createDir(modelDir);
  }
  const { master, details } = context.tables;
  debug(`Generating master model for table ${master.tableName}`);
  const masterModelFile = import_path.default.join(
    modelDir,
    `${context.pageTitle.replace(/\s+/g, "_").toLocaleLowerCase()}_model.py`
  );
  writeCompiledTemplate(
    import_path.default.join(templateRoot, "backend", "MODEL.eta"),
    masterModelFile,
    {
      TABLE_NAME: master.tableName,
      CLASS_NAME: toClassName(context.pageTitle),
      COLUMNS: master.columns,
      PRIMARY_KEYS: master.primaryKeys,
      MASTER_TABLE: master.tableName,
      DETAILS: details,
      SCHEMA: context,
      toClassName
    },
    placeholders
  );
  debug(`Master model written to ${masterModelFile}`);
  for (const detailTable of details) {
    debug(`Generating detail model for table ${detailTable.tableName}`);
    const detailModelFile = import_path.default.join(
      modelDir,
      `${detailTable.tableName.toLocaleLowerCase()}_model.py`
    );
    writeCompiledTemplate(
      import_path.default.join(templateRoot, "backend", "MODEL.eta"),
      detailModelFile,
      {
        SCHEMA: context,
        TABLE_NAME: detailTable.tableName,
        CLASS_NAME: toClassName(detailTable.tableName),
        COLUMNS: detailTable.columns,
        PRIMARY_KEYS: detailTable.primaryKeys,
        MASTER_TABLE: master.tableName,
        DETAILS: details,
        toClassName
      },
      placeholders
    );
    debug(`Detail model written to ${detailModelFile}`);
  }
  debug(`Generating master model init file`);
  const masterModelInitFile = import_path.default.join(
    modelDir,
    `__init__.py`
  );
  writeCompiledTemplate(
    import_path.default.join(templateRoot, "backend", "MODEL_INIT.eta"),
    masterModelInitFile,
    {
      TABLE_NAME: master.tableName,
      CLASS_NAME: toClassName(master.tableName),
      COLUMNS: master.columns,
      PRIMARY_KEYS: master.primaryKeys,
      toClassName,
      MASTER_TABLE: master.tableName,
      DETAILS: details,
      SCHEMA: context
    },
    placeholders
  );
  debug(`Master model init file written to ${masterModelInitFile}`);
  debug("Model generation completed");
  debug("Generating Service layer...");
  const serviceDir = import_path.default.join(backendOutput, "services");
  if (!dirExists(serviceDir)) {
    createDir(serviceDir);
  }
  debug(`service path=${serviceDir}`);
  const serviceFile = import_path.default.join(
    serviceDir,
    `${context.pageTitle.replace(/\s+/g, "_").toLocaleLowerCase()}_service.py`
  );
  writeCompiledTemplate(
    import_path.default.join(templateRoot, "backend", "MODEL_SERVICE.eta"),
    serviceFile,
    {
      SCHEMA: context,
      MASTER_TABLE: master.tableName,
      SERVICE_NAME: `${toClassName(master.tableName)}Service`,
      CLASS_NAME: toClassName(context.pageTitle),
      DETAILS: details,
      toClassName
    },
    placeholders
  );
  debug("Generating Data Service layer...");
  const data_service_file = import_path.default.join(
    serviceDir,
    `${context.pageTitle.replace(/\s+/g, "_").toLocaleLowerCase()}_data_service.py`
  );
  console.log(JSON.stringify(context), null, 2);
  writeCompiledTemplate(
    import_path.default.join(templateRoot, "backend", "DATA_SERVICE.eta"),
    data_service_file,
    {
      SCHEMA: context,
      MASTER_TABLE: master.tableName,
      SERVICE_NAME: `DataService`,
      CLASS_NAME: "DataService",
      DETAILS: details,
      toClassName
    },
    placeholders
  );
  debug("Generating Data Service init layer...");
  const serviceInitFile = import_path.default.join(
    serviceDir,
    `__init__.py`
  );
  writeCompiledTemplate(
    import_path.default.join(templateRoot, "backend", "SERVICE_INIT.eta"),
    serviceInitFile,
    {
      SCHEMA: context,
      MASTER_TABLE: master.tableName,
      SERVICE_NAME: `${toClassName(master.tableName)}Service`,
      CLASS_NAME: toClassName(master.tableName),
      DETAILS: details,
      toClassName
    },
    placeholders
  );
  debug("Generating Data Service layer completed");
  debug("Generating Schema file...");
  const schemaDir = import_path.default.join(backendOutput, "schemas");
  if (!dirExists(schemaDir)) {
    createDir(schemaDir);
  }
  const schemaTemplateInitPath = import_path.default.join(templateRoot, "backend", "SCHEMA_INIT.eta");
  const schemaTemplatePath = import_path.default.join(templateRoot, "backend", "SCHEMA.eta");
  writeCompiledTemplate(
    schemaTemplateInitPath,
    import_path.default.join(schemaDir, `__init__.py`),
    {
      SCHEMA: context,
      MASTER_TABLE: master.tableName,
      CLASS_NAME: toClassName(master.tableName),
      DETAILS: details,
      COLUMNS: master.columns,
      PRIMARY_KEYS: master.primaryKeys,
      toClassName
    },
    placeholders
  );
  writeCompiledTemplate(
    schemaTemplatePath,
    import_path.default.join(schemaDir, `${context.pageTitle?.replace(/\s+/g, "_").toLowerCase()}_schema.py`),
    {
      SCHEMA: context,
      MASTER_TABLE: master.tableName,
      CLASS_NAME: toClassName(context.pageTitle) + "Schema",
      DETAILS: details,
      COLUMNS: master.columns,
      PRIMARY_KEYS: master.primaryKeys,
      toClassName,
      is_master: true
    },
    placeholders
  );
  for (const detail of details) {
    console.log(`Generating schema for detail table ${detail.tableName}`);
    const schemaFile = import_path.default.join(schemaDir, `${detail.tableName}_schema.py`);
    writeCompiledTemplate(
      schemaTemplatePath,
      schemaFile,
      {
        SCHEMA: context,
        MASTER_TABLE: master.tableName,
        CLASS_NAME: toClassName(`${detail.tableName}`) + "Schema",
        DETAILS: details,
        COLUMNS: detail.columns,
        PRIMARY_KEYS: detail.primaryKeys,
        toClassName,
        is_master: false
      },
      placeholders
    );
  }
  const parameterSchemaPath = import_path.default.join(
    templateRoot,
    "backend",
    "PARAMETER_SCHEMA.eta"
  );
  writeCompiledTemplate(
    parameterSchemaPath,
    import_path.default.join(schemaDir, `parameter.py`),
    {
      SCHEMA: context,
      MASTER_TABLE: master.tableName,
      CLASS_NAME: toClassName(master.tableName),
      DETAILS: details,
      FIELDS: context.dcs.flatMap((dc) => dc.fields),
      toClassName
    },
    placeholders
  );
  debug("Schema file generation completed");
  debug("Generating Router file...");
  const routeFile = import_path.default.join(backendOutput, `router.py`);
  writeCompiledTemplate(
    import_path.default.join(templateRoot, "backend", "ROUTER.eta"),
    routeFile,
    {
      SCHEMA: context,
      MODULE_NAME: moduleName,
      CLASS_NAME: toClassName(master.tableName),
      MODEL_SERVICE_NAME: `${toClassName(moduleName)}Service`,
      DATA_SERVICE_NAME: `DataService`,
      MASTER_TABLE: master.tableName,
      DETAILS: details,
      toClassName
    },
    placeholders
  );
  debug(`Router file written to ${routeFile}`);
  try {
    debug("Copying other backend files...");
    const otherBackendTemplate = import_path.default.join(templateRoot, "backend", "other");
    copyTemplateStructure(otherBackendTemplate, backendOutput, placeholders);
  } catch (error) {
    debug(`Error copying other backend files: ${error.message}`);
  }
  const initFile = import_path.default.join(backendOutput, `__init__.py`);
  writeCompiledTemplate(
    import_path.default.join(templateRoot, "backend", "INIT.eta"),
    initFile,
    {
      SCHEMA: context,
      toClassName
    },
    placeholders
  );
  debug("Backend generation completed");
}
async function createAxpertFrontendModule(moduleName, frontendRoot, templateRoot, placeholders, context, options) {
  log("Generating frontend module...");
  log("Generating frontend...");
  const frontendOutput = import_path.default.join(frontendRoot, moduleName);
  const componentsOutput = import_path.default.join(frontendOutput, "components");
  const schemasPath = import_path.default.join(frontendOutput, "schemas");
  createDir(schemasPath);
  debug(`frontend path=${frontendOutput}`);
  createDir(componentsOutput);
  debug(`components path=${componentsOutput}`);
  for (const dc of context.dcs) {
    const schemaFile = import_path.default.join(schemasPath, `${dc.name}Schema.ts`);
    if (!options?.dryRun) {
      debug(`Writing schema for table ${dc.tablename} to ${schemaFile}`);
      writeCompiledTemplate(
        import_path.default.join(templateRoot, "frontend", "DC_SCHEMA.eta"),
        schemaFile,
        {
          DC_NAME: dc.name,
          FIELDS: dc.fields,
          // SCHEMA: JSON.stringify(dc),
          toClassName
        },
        placeholders
      );
      const componentFile = import_path.default.join(
        componentsOutput,
        `${dc.name}Component.tsx`
      );
      debug(`Writing component for table ${dc.tablename} to ${componentFile}`);
      writeCompiledTemplate(
        import_path.default.join(templateRoot, "frontend", "DC_COMPONENT.eta"),
        componentFile,
        {
          dc,
          DC_NAME: dc.name,
          COMPONENT_NAME: `${dc.name}Component`,
          SCHEMA: context,
          ...context,
          toClassName
        },
        placeholders
      );
    } else {
      debug(
        `Dry-run: skipping schema write for table ${dc.tablename} to ${schemaFile}`
      );
    }
  }
  const allSchemaFile = import_path.default.join(schemasPath, `allSchemas.ts`);
  debug("Generating all schemas index...");
  writeCompiledTemplate(
    import_path.default.join(templateRoot, "frontend", "ALL_SCHEMA.eta"),
    allSchemaFile,
    {
      DCS: context.dcs,
      capitalize: capitalize2,
      toClassName
    },
    placeholders
  );
  const schemaIndexFile = import_path.default.join(schemasPath, `index.ts`);
  debug(`Writing schema index to ${schemaIndexFile}`);
  writeCompiledTemplate(
    import_path.default.join(templateRoot, "frontend", "schemaIndex.eta"),
    schemaIndexFile,
    {
      DCS: context.dcs,
      capitalize: capitalize2,
      toClassName
    },
    placeholders
  );
  const componentIndexFile = import_path.default.join(componentsOutput, `index.ts`);
  debug(`Writing component index to ${componentIndexFile}`);
  writeCompiledTemplate(
    import_path.default.join(templateRoot, "frontend", "componentIndex.eta"),
    componentIndexFile,
    {
      DCS: context.dcs,
      capitalize: capitalize2,
      toClassName
    },
    placeholders
  );
  const pageFile = import_path.default.join(
    frontendOutput,
    `${placeholders["__Page__"]}Page.tsx`
  );
  debug(`Writing page to ${pageFile}`);
  writeCompiledTemplate(
    import_path.default.join(templateRoot, "frontend", "PAGE_FORM.eta"),
    pageFile,
    {
      ...context,
      ...placeholders,
      toClassName
    },
    placeholders
  );
  const pageFormFile = import_path.default.join(
    frontendOutput,
    `${placeholders["__Page__"]}Page.tsx`
  );
  debug(`Writing page form to ${pageFormFile}`);
  writeCompiledTemplate(
    import_path.default.join(templateRoot, "frontend", "PAGE_INDEX.eta"),
    pageFormFile,
    {
      ...context,
      ...placeholders
    },
    placeholders
  );
  const typesFile = import_path.default.join(frontendOutput, `types.ts`);
  debug(`Writing types to ${typesFile}`);
  writeCompiledTemplate(
    import_path.default.join(templateRoot, "frontend", "TYPES.eta"),
    typesFile,
    {
      ...context,
      ...placeholders
    },
    placeholders
  );
  const apiFile = import_path.default.join(frontendOutput, `api.ts`);
  debug(`Writing API to ${apiFile}`);
  writeCompiledTemplate(
    import_path.default.join(templateRoot, "frontend", "API.eta"),
    apiFile,
    {
      ...context,
      ...placeholders
    },
    placeholders
  );
  const otherFrontendTemplate = import_path.default.join(templateRoot, "frontend", "other");
  debug(`Copying other frontend files from ${otherFrontendTemplate}`);
  copyTemplateStructure(otherFrontendTemplate, frontendOutput, placeholders);
  debug(`Writing page styles`);
  const pageStylesFile = import_path.default.join(frontendOutput, `styles.css`);
  writeCompiledTemplate(
    import_path.default.join(templateRoot, "frontend", "PAGE_STYLES.eta"),
    pageStylesFile,
    {
      ...context,
      ...placeholders
    },
    placeholders
  );
  debug(`Writing page index`);
  const pageIndexFile = import_path.default.join(frontendOutput, `index.ts`);
  writeCompiledTemplate(
    import_path.default.join(templateRoot, "frontend", "PAGE_INDEX_FILE.eta"),
    pageIndexFile,
    {
      ...context,
      ...placeholders
    },
    placeholders
  );
  debug("Frontend generation completed");
}
async function createAxpertPage(tstruct, moduleName, backendRoot, frontendRoot, templateRoot, dbConfig, options) {
  log("Starting Axpert page generation");
  debug(`tstruct=${tstruct}`);
  debug(`module=${moduleName}`);
  debug(`templateRoot=${templateRoot}`);
  if (options?.skipBackend && options?.skipFrontend) {
    throw new Error(
      "Both backend and frontend are skipped. Nothing to generate."
    );
  }
  const context = await buildCreatePageContext(tstruct, moduleName, dbConfig);
  debug(`context keys: ${Object.keys(context).join(", ")}`);
  const placeholders = buildAxpertPlaceholders({
    moduleName,
    tstruct,
    ...context
  });
  const scopeCtx = {
    moduleName,
    tstruct,
    ...context,
    toClassName
  };
  debug(`placeholders: ${Object.keys(placeholders).join(", ")}`);
  if (!options?.skipBackend) {
    log("Generating backend...");
    createAxpertBackendModule(
      moduleName,
      backendRoot,
      templateRoot,
      placeholders,
      context,
      { dryRun: options?.dryRun }
    );
  } else {
    log("Backend generation skipped");
  }
  if (!options?.skipFrontend) {
    createAxpertFrontendModule(
      moduleName,
      frontendRoot,
      templateRoot,
      placeholders,
      context,
      { dryRun: options?.dryRun }
    );
  } else {
    log("Frontend generation skipped");
  }
  log("Axpert page generation completed");
}

// src/axpertPicker.ts
var import_inquirer = __toESM(require("inquirer"), 1);
var import_oracledb2 = __toESM(require("oracledb"), 1);
async function pickTstructInteractive(dbConfig) {
  const conn = await import_oracledb2.default.getConnection({
    user: dbConfig.user,
    password: dbConfig.password,
    connectString: dbConfig.connectString
  });
  try {
    const result = await conn.execute(
      `
      SELECT DISTINCT name AS TSTRUCT
      FROM tstructs
      ORDER BY name
      `,
      [],
      { outFormat: import_oracledb2.default.OUT_FORMAT_OBJECT }
    );
    const rows = result.rows ?? [];
    if (!rows.length) {
      throw new Error("No tstructs found in database");
    }
    const choices = rows.map((r) => r.TSTRUCT);
    const answer = await import_inquirer.default.prompt([
      {
        type: "list",
        name: "tstruct",
        message: "Select tstruct:",
        choices
      }
    ]);
    return answer.tstruct;
  } finally {
    await conn.close();
  }
}

// src/configLoader.ts
var fs4 = __toESM(require("fs"), 1);
var path5 = __toESM(require("path"), 1);
var CONFIG_FILE = "bss.config.json";
function saveConfig(config2) {
  const configPath = path5.join(process.cwd(), CONFIG_FILE);
  fs4.writeFileSync(configPath, JSON.stringify(config2, null, 2));
}
function loadConfig2() {
  const configPath = path5.join(process.cwd(), CONFIG_FILE);
  if (!fs4.existsSync(configPath)) {
    throw new Error("bss.config.json not found. Run `init` first.");
  }
  return JSON.parse(fs4.readFileSync(configPath, "utf-8"));
}

// src/commands/init.ts
var import_child_process = require("child_process");
var import_path2 = __toESM(require("path"), 1);
function ensurePackage(pkg, opts = {}) {
  const { version = "", silent = false } = opts;
  const name = version ? `${pkg}@${version}` : pkg;
  try {
    return require(pkg);
  } catch {
    console.log(`\u{1F4E6} ${pkg} not found. Installing automatically...`);
    const cliRoot2 = import_path2.default.resolve(__dirname, "..", "..");
    (0, import_child_process.execSync)(`npm install ${name} --no-save`, {
      cwd: cliRoot2,
      stdio: silent ? "ignore" : "inherit"
    });
    console.log(`\u2705 ${pkg} installed`);
    return require(pkg);
  }
}

// src/index.ts
var program = new import_commander.Command();
program.command("create-axpert-page [tstruct]").description("Create Axpert backend + frontend from DB structure").option("--interactive", "Pick tstruct interactively").option("-m, --module <name>", "Module name (default: tstruct)").option("-b, --backend <path>", "Override backend output path").option("-f, --frontend <path>", "Override frontend output path").option("--skip-backend", "Skip backend generation").option("--skip-frontend", "Skip frontend generation").option("--verbose", "Enable verbose output").option("--debug", "Enable debug output").option("--dry-run", "Preview actions without writing files").action(async (tstructArg, opts) => {
  try {
    setLogLevel({ verbose: opts.verbose, debug: opts.debug });
    const config2 = loadConfig2();
    let tstruct = tstructArg;
    if (!tstruct || opts.interactive) {
      tstruct = await pickTstructInteractive(config2.axpert.db);
    }
    const moduleName = opts.module ?? tstruct;
    const backendRoot = opts.backend ?? config2.paths.backend;
    const frontendRoot = opts.frontend ?? config2.paths.frontend;
    await createAxpertPage(
      tstruct,
      moduleName,
      backendRoot,
      frontendRoot,
      getTemplatePath("axpert"),
      config2.axpert.db,
      {
        skipBackend: !!opts.skipBackend,
        skipFrontend: !!opts.skipFrontend,
        dryRun: !!opts.dryRun
      }
    );
    console.log("\n\u2705 Axpert page processed successfully\n");
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
});
program.command("create-page").description("Create a new frontend/backend page from the template structure (no logic, no content)").argument("<module>", "Module name (used for placeholder replacement)").argument("<page>", "Page name (used for placeholder replacement)").option("-o, --output <path>", "Output directory for the new page", "./modules").action(async (module2, page, options) => {
  try {
    const templateRoot = getTemplatePath("page");
    const outputRoot = path7.resolve(process.cwd(), options.output, module2, page);
    generatePageFromTemplate(templateRoot, outputRoot, page);
    console.log(`
\u2705 Page created at: ${outputRoot}
`);
  } catch (err) {
    console.error("Error creating page:", err);
    process.exit(1);
  }
});
program.command("init").description("Initialize BSS CLI configuration").action(async () => {
  try {
    console.log("Checking Dependencies...");
    ensurePackage("inquirer", { silent: true });
    console.log("Inquirer is installed.");
    ensurePackage("fs-extra", { silent: true });
    console.log("fs-extra is installed.");
    ensurePackage("oracledb", { silent: true });
    console.log("oracledb is installed.");
    console.log("All dependencies are satisfied.\n");
    console.log("\n\u{1F4CB} BSS CLI Initialization\n");
    console.log("Please provide the following configuration details:\n");
    const inquirer2 = (await import("inquirer")).default;
    const answers = await inquirer2.prompt([
      {
        type: "input",
        name: "backendPath",
        message: "Backend modules path:",
        default: "./backend/apps/modules",
        validate: (v) => v.trim() !== "" || "Required"
      },
      {
        type: "input",
        name: "frontendPath",
        message: "Frontend modules path:",
        default: "./frontend/apps/modules",
        validate: (v) => v.trim() !== "" || "Required"
      },
      {
        type: "input",
        name: "dbUser",
        message: "Axpert DB user:",
        validate: (v) => v.trim() !== "" || "Required"
      },
      {
        type: "password",
        name: "dbPassword",
        message: "Axpert DB password:",
        mask: "*",
        validate: (v) => v.trim() !== "" || "Required"
      },
      {
        type: "input",
        name: "dbConnect",
        message: "Axpert DB connect string (host:port/service):",
        validate: (v) => v.trim() !== "" || "Required"
      }
    ]);
    const config2 = {
      paths: {
        backend: answers.backendPath,
        frontend: answers.frontendPath
      },
      axpert: {
        db: {
          user: answers.dbUser,
          password: answers.dbPassword,
          connectString: answers.dbConnect
        }
      }
    };
    saveConfig(config2);
    console.log("\n\u2705 bss.config.json created successfully\n");
  } catch (err) {
    console.error("Init failed:", err);
    process.exit(1);
  }
});
program.parse();
