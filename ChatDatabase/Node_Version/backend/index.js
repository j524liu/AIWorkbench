import { ChatOllama } from '@langchain/ollama'
import {createAgent, SystemMessage} from 'langchain'
import { SqlDatabase } from "@langchain/classic/sql_db"
import { DataSource } from "typeorm"
import { tool } from "langchain"
import * as z from "zod";
import express from "express"
import cors from "cors"
import dotenv from "dotenv"

dotenv.config();

const DENY_RE = /\b(INSERT|UPDATE|DELETE|ALTER|DROP|CREATE|REPLACE|TRUNCATE)\b/i;
const HAS_LIMIT_TAIL_RE = /\blimit\b\s+\d+(\s*,\s*\d+)?\s*;?\s*$/i;

function sanitizeSqlQuery(q) {
  let query = String(q ?? "").trim();

  // block multiple statements (allow one optional trailing ;)
  const semis = [...query].filter((c) => c === ";").length;
  if (semis > 1 || (query.endsWith(";") && query.slice(0, -1).includes(";"))) {
    throw new Error("multiple statements are not allowed.")
  }
  query = query.replace(/;+\s*$/g, "").trim();

  // read-only gate
  if (!query.toLowerCase().startsWith("select")) {
    throw new Error("Only SELECT statements are allowed")
  }
  if (DENY_RE.test(query)) {
    throw new Error("DML/DDL detected. Only read-only queries are permitted.")
  }

  // append LIMIT only if not already present
  if (!HAS_LIMIT_TAIL_RE.test(query)) {
    query += " LIMIT 5";
  }
  return query;
}

const executeSql = tool(
  async ({ query }) => {
    const q = sanitizeSqlQuery(query);
    try {
      const result = await db.run(q);
      return typeof result === "string" ? result : JSON.stringify(result, null, 2);
    } catch (e) {
      throw new Error(e?.message ?? String(e))
    }
  },
  {
    name: "execute_sql",
    description: "Execute a READ-ONLY MySQL SELECT query and return results.",
    schema: z.object({
      query: z.string().describe("MySQL SELECT query to execute (read-only)."),
    }),
  }
);

// If you see the error: "Client does not support authentication protocol requested by server",
// it means the MySQL server is using an auth plugin (e.g. caching_sha2_password) not supported
// by the old `mysql` client. Two remedies:
// 1) Use the `mysql2` driver (added to package.json) which supports modern auth plugins.
// 2) Change the MySQL user's auth plugin on the server side (alternate fix):
//    ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '19961026';
//    FLUSH PRIVILEGES;
// The DataSource type remains "mysql" — TypeORM will use the mysql2 driver if it's installed.
const datasource = new DataSource({ 
  type: process.env.DB_TYPE, 
  host: process.env.DB_HOST, 
  port: parseInt(process.env.DB_PORT), 
  username: process.env.DB_USERNAME, 
  password: process.env.DB_PASSWORD, 
  database: process.env.DB_DATABASE 
});

let db = await SqlDatabase.fromDataSourceParams({
    appDataSource: datasource,
})

const dialect = db.appDataSourceOptions.type;
console.log(`Dialect: ${dialect}`);
const tableNames = db.allTables.map(t => t.tableName);
console.log(`Available tables: ${tableNames.join(", ")}`);

(async () => {
  const schema = `CREATE TABLE ticket (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_name TEXT,
  ticket_type TEXT,
  ticket_level TEXT,
  location TEXT,
  worker_name TEXT,
  start_date TEXT,
  end_date TEXT,
  finished TEXT
);`;

  const llm = new ChatOllama({
    model: process.env.MODEL_NAME,
    temperature: 0.6,
    keepAlive: 0,
    // other params...
  })

  const agent = createAgent({
    model: llm,
    tools: [executeSql],
    systemPrompt: new SystemMessage(`您是一个能够将自然语言转换为SQL查询以从数据库中检索信息的专家级数据库助理。

        Authoritative schema (do not invent columns/tables):
        ${schema}
        ticket表为作业票表，包含所有作业票的信息。
        ticket_name字段为作业票名称;ticket_type字段为作业票类型;ticket_level字段为作业票等级;location字段为作业地点;worker_name字段为作业人姓名;start_date字段为作业开始日期;end_date字段为作业结束日期;finished字段为作业是否完成，yes表示已完成，no表示未完成。
        关于作业类型，fire表示动火作业，electricity表示临电作业，height表示高处作业，confined_space表示受限空间作业，excavation表示动土作业。
        时间格式为YYYY-MM-DD，顺序为年-月-日。
        Rules:
        - Think step-by-step.
        - When you need data, call the tool \`execute_sql\` with ONE SELECT query.
        - Read-only only; no INSERT/UPDATE/DELETE/ALTER/DROP/CREATE/REPLACE/TRUNCATE.
        - If the tool returns 'Error:', revise the SQL and try again.
        - Limit the number of attempts to 5.
        - If you are not successful after 5 attempts, return a note to the user.
        - Prefer explicit column lists; avoid SELECT *.
        - 只输出结果，不要输出你思考的过程
        - 不要只回答数字。
        - 回答中不要出现MySQL相关的术语。
        - 使用中文，非必要不使用英文。
        - 回答中不要出现表名或字段名。
        `
    )
  })

  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  // allow CORS for local frontend during development
  app.use(cors());
  const port = 3000;
  app.listen(port, () => {
    console.log(`express 服务启动,端口为 ${port}`);
  });
  app.get("/getReqText", async (req, res) =>{
    try {
      // 设置响应头
      res.set({
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive"
      });
      let cnt = 0;
      // 发送请求头
      res.flushHeaders();
      let data = req.query.content

      console.log('Received post data:', data);

        const start_time = new Date();

        for await (const [token, metadata] of await agent.stream(
            { messages: [{ role: "human", content: data }] },
            { streamMode: "messages" }
        )) {
            if(token.contentBlocks[0].text != "" && metadata.langgraph_node == "model_request") 
            {
                process.stdout.write(token.contentBlocks[0].text);
                res.write(`data: ${token.contentBlocks[0].text}\n\n`);
            }
        }
        const end_time = new Date();
        res.write(`data: (time used: ${(end_time - start_time) / 1000} s)\n\n`);
        res.write(`data: [DONE]\n\n`);
        console.log();
        //流式传输结束，关闭连接。(使用API测试软件时使用，如配合前端使用，请将本语句注释掉，关闭连接由前端实现。)
        res.end();
    } catch (error) {
      console.error('Error in getReqText:', error);
      res.status(500).send('Internal Server Error');
    }
  });
})();