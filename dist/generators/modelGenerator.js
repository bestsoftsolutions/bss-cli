import {toClassName,mapSqlAlchemyType}from'../typeMapping.js';function C(a,c,m){let t=`from sqlalchemy import Column, Integer, String, Numeric, Float, DateTime, Text, LargeBinary
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class ${toClassName(a)}(Base):
    __tablename__ = '${a.toLowerCase()}'
    
`;for(const e of c){const o=e.name.toLowerCase(),r=mapSqlAlchemyType(e),n=m.includes(e.name),s=e.nullable&&!n,l=[`Column(${r}`];n&&l.push("primary_key=True"),s||l.push("nullable=False");const i=`    ${o} = ${l.join(", ")})`;t+=i+`
`;}return t}function $(a,c,m,f){const t=toClassName(a);let e=`from sqlalchemy import Column, Integer, String, Numeric, Float, DateTime, Text, LargeBinary, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()


`;e+=`class ${t}(Base):
`,e+=`    __tablename__ = '${a.toLowerCase()}'

`;for(const o of m[a]){const r=o.name.toLowerCase(),n=mapSqlAlchemyType(o),s=f[a].includes(o.name),l=o.nullable&&!s,i=[`Column(${n}`];s&&i.push("primary_key=True"),l||i.push("nullable=False");const p=`    ${r} = ${i.join(", ")})
`;e+=p;}for(const o of c){const r=toClassName(o),n=o.toLowerCase();e+=`    ${n} = relationship("${r}", back_populates="${t.toLowerCase()}")
`;}e+=`

`;for(const o of c){const r=toClassName(o);e+=`class ${r}(Base):
`,e+=`    __tablename__ = '${o.toLowerCase()}'

`;for(const s of m[o]){const l=s.name.toLowerCase(),i=mapSqlAlchemyType(s),p=f[o].includes(s.name),g=s.nullable&&!p,_=[`Column(${i}`];p&&_.push("primary_key=True"),g||_.push("nullable=False");const y=`    ${l} = ${_.join(", ")})
`;e+=y;}const n=o.toLowerCase();e+=`    ${t.toLowerCase()} = relationship("${t}", back_populates="${n}")
`,e+=`

`;}return e}function L(){return `from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator

# Oracle connection string
# Format: oracle+oracledb://user:password@host:port/?service_name=service
DATABASE_URL = "oracle+oracledb://your_user:your_password@localhost:1521/?service_name=XEPDB1"

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """
    Dependency for getting database session.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
`}export{L as generateDatabaseConfig,C as generateSqlAlchemyModel,$ as generateUnifiedModel};