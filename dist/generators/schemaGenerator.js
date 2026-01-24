import {toClassName,mapPydanticType}from'../typeMapping.js';function C(a,l,p){const c=toClassName(a);let s=false,d=false;for(const o of l){const t=mapPydanticType(o);t==="Decimal"&&(s=true),t==="datetime"&&(d=true);}const n=["from pydantic import BaseModel, Field, ConfigDict"];s&&n.push("from decimal import Decimal"),d&&n.push("from datetime import datetime"),n.push("from typing import Optional");let e=n.join(`
`)+`

`;e+=`class ${c}Base(BaseModel):
`,e+=`    """Base schema for creation/update operations"""
`;for(const o of l){const t=o.name.toLowerCase(),i=mapPydanticType(o),r=p.includes(o.name),m=o.nullable;let $;m||r?$=`Optional[${i}] = None`:$=i,e+=`    ${t}: ${$}
`;}e+=`

`,e+=`class ${c}(BaseModel):
`,e+=`    """Complete schema for read operations"""
`;for(const o of l){const t=o.name.toLowerCase(),i=mapPydanticType(o),m=o.nullable?`Optional[${i}] = None`:i;e+=`    ${t}: ${m}
`;}e+=`
    model_config = ConfigDict(from_attributes=True)
`,e+=`

`,e+=`class ${c}Create(${c}Base):
`,e+=`    """Schema for creating new records"""
`,e+=`    pass


`,e+=`class ${c}Update(BaseModel):
`,e+=`    """Schema for updating existing records (all fields optional)"""
`;for(const o of l){const t=o.name.toLowerCase(),i=mapPydanticType(o);e+=`    ${t}: Optional[${i}] = None
`;}return e}function y(a,l,p,c,s=null){const d=toClassName(a);let n=`from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


`;s&&(n+=s,n+=`

`);for(const e of l){const o=toClassName(e);n+=`class ${o}Base(BaseModel):
`,n+=`    """Base schema for ${e} (shared fields)"""
`;for(const t of p[e]){const i=t.name.toLowerCase(),r=mapPydanticType(t),m=c[e].includes(t.name),$=t.nullable;if(m)continue;const N=$?`Optional[${r}] = None`:r;n+=`    ${i}: ${N}
`;}n+=`

`,n+=`class ${o}Create(${o}Base):
`,n+=`    """Schema for creating new ${e} records"""
`,n+=`    pass


`,n+=`class ${o}Update(BaseModel):
`,n+=`    """Schema for updating ${e} records (all fields optional)"""
`;for(const t of p[e]){const i=t.name.toLowerCase(),r=mapPydanticType(t);c[e].includes(t.name)||(n+=`    ${i}: Optional[${r}] = None
`);}n+=`

`,n+=`class ${o}(BaseModel):
`,n+=`    """Complete schema for reading ${e} records"""
`;for(const t of p[e]){const i=t.name.toLowerCase(),r=mapPydanticType(t),$=t.nullable?`Optional[${r}] = None`:r;n+=`    ${i}: ${$}
`;}n+=`    model_config = ConfigDict(from_attributes=True)


`;}n+=`class ${d}Base(BaseModel):
`,n+=`    """Base schema for ${a} (shared fields)"""
`;for(const e of p[a]){const o=e.name.toLowerCase(),t=mapPydanticType(e),i=c[a].includes(e.name),r=e.nullable;if(i)continue;const m=r?`Optional[${t}] = None`:t;n+=`    ${o}: ${m}
`;}n+=`

`,n+=`class ${d}Create(${d}Base):
`,n+=`    """Schema for creating ${a} with nested detail records"""
`;for(const e of l){const o=toClassName(e);n+=`    ${e.toLowerCase()}: Optional[List[${o}Create]] = Field(default_factory=list, description='List of detail records to create')
`;}n+=`

`,n+=`class ${d}Update(BaseModel):
`,n+=`    """Schema for updating ${a} records (all fields optional)"""
`;for(const e of p[a]){const o=e.name.toLowerCase(),t=mapPydanticType(e);c[a].includes(e.name)||(n+=`    ${o}: Optional[${t}] = None
`);}for(const e of l){const o=toClassName(e);n+=`    ${e.toLowerCase()}: Optional[List[${o}Update]] = None
`;}n+=`

`,n+=`class ${d}(BaseModel):
`,n+=`    """Complete schema for reading ${a} with all details"""
`;for(const e of p[a]){const o=e.name.toLowerCase(),t=mapPydanticType(e),r=e.nullable?`Optional[${t}] = None`:t;n+=`    ${o}: ${r}
`;}for(const e of l){const o=toClassName(e);n+=`    ${e.toLowerCase()}: Optional[List[${o}]] = None
`;}return n+=`    model_config = ConfigDict(from_attributes=True)

`,n}function L(a,l){if(!l||l.length===0)return console.log(`   \u26A0\uFE0F  No fields found in axflds for tstruct='${a.toUpperCase()}'`),null;console.log(`   \u2713 Found ${l.length} fields in axflds`);let c=`class ${toClassName(a)+"Parameter"}(BaseModel):
    """Parameter schema for ${a} - auto-generated from axflds"""
`;for(const s of l){const d=s.fname.toLowerCase(),n=s.asgrid&&s.asgrid.trim().toUpperCase()==="T";let e;s.datatype&&s.datatype.trim().toUpperCase()==="C"?s.modeofentry&&s.modeofentry.trim().toLowerCase()==="select"?n?e="Optional[str | int | List[str] | List[int]] = None":e="Optional[str | int] = None":n?e="Optional[str | List[str]] = None":e="Optional[str] = None":s.datatype&&s.datatype.trim().toUpperCase()==="N"?s.fielddecimal&&s.fielddecimal>0?n?e="Optional[Decimal | int | List[Decimal] | List[int]] = None":e="Optional[Decimal | int] = None":n?e="Optional[int | List[int]] = None":e="Optional[int] = None":s.datatype&&s.datatype.trim().toUpperCase()==="D"?n?e="Optional[datetime | List[datetime]] = None":e="Optional[datetime] = None":n?e="Optional[str | List[str]] = None":e="Optional[str] = None",c+=`    ${d}: ${e}
`;}return c+=`
`,c}export{L as generateParameterSchema,C as generatePydanticSchema,y as generateUnifiedSchemas};