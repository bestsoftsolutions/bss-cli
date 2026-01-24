import c from'inquirer';import n from'oracledb';async function T(t){const r=await n.getConnection({user:t.user,password:t.password,connectString:t.connectString});try{const s=(await r.execute(`
      SELECT DISTINCT name AS TSTRUCT
      FROM tstructs
      ORDER BY name
      `,[],{outFormat:n.OUT_FORMAT_OBJECT})).rows??[];if(!s.length)throw new Error("No tstructs found in database");const e=s.map(o=>o.TSTRUCT);return (await c.prompt([{type:"list",name:"tstruct",message:"Select tstruct:",choices:e}])).tstruct}finally{await r.close();}}export{T as pickTstructInteractive};