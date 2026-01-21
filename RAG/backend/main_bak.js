import { createAgent, tool, SystemMessage } from 'langchain'
import { ChatOllama, OllamaEmbeddings } from '@langchain/ollama'
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters"
import * as z from "zod";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf"
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv"
import { JSONLoader } from "@langchain/classic/document_loaders/fs/json"
import { TextLoader } from "@langchain/classic/document_loaders/fs/text"
import { DocxLoader } from '@langchain/community/document_loaders/fs/docx'
import { EPubLoader } from '@langchain/community/document_loaders/fs/epub'
import { PPTXLoader } from '@langchain/community/document_loaders/fs/pptx'
import { FaissStore } from "@langchain/community/vectorstores/faiss";
// import { Chroma } from "@langchain/community/vectorstores/chroma";
import { DirectoryLoader } from '@langchain/classic/document_loaders/fs/directory';

import xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';

const data_dir = "./data/data";
const archived_dir = "./data/archived"
const processed_dir = "./data/processed"

// first turn all xlsx/xls files into csv files
async function process_excel() {
    fs.readdir(data_dir, (err, files) => {
        if (err) {
            console.error('无法读取目录:', err);
            return;
        } else {
            files.forEach(file => {
                console.log('发现文件:', file);
                if (file.endsWith('.xlsx') || file.endsWith('.xls')) {
                    const filePath = path.join(data_dir, file);
                    try {
                        // Read Excel file
                        const workbook = xlsx.readFile(filePath);
                        const sheetName = workbook.SheetNames[0];
                        const worksheet = workbook.Sheets[sheetName];
                        
                        // Convert to CSV
                        const csv = xlsx.utils.sheet_to_csv(worksheet);
                        
                        // Generate output filename
                        const outputFileName = file.replace(/\.(xlsx|xls)$/, '.csv');
                        const outputPath = path.join(data_dir, outputFileName);
                        
                        // Write CSV file
                        fs.writeFileSync(outputPath, csv, 'utf-8');
                        console.log(`✓ Converted: ${file} → ${outputFileName}`);
                        const oldPath = path.join(data_dir, file);

                    } catch (error) {
                        console.error(`✗ Error converting ${file}:`, error.message);
                        const newPath = path.join(processed_dir, file);
                        fs.rename(oldPath, newPath, (err) => {
                            if (err) {
                                console.error('移动文件时出错:', err);
                            } else {
                                // console.log(`已移动文件: ${file}`);
                            }
                        });
                    }
                }
            });
        }
    });
}

async function move_files() {
    fs.readdir(data_dir, (err, files) => {
        if (err) {
            console.error('无法读取目录:', err);
            return;
        } else {
            files.forEach(file => {
                if (file.endsWith('.pdf') || file.endsWith('.csv') || file.endsWith('.json') || file.endsWith('.txt') || file.endsWith('.epub') || file.endsWith('.pptx') || file.endsWith('.docx') || file.endsWith('.doc') || file.endsWith('.xlsx') || file.endsWith('.xls')) {
                    const oldPath = path.join(data_dir, file);
                    const newPath = path.join(archived_dir, file);
                    fs.rename(oldPath, newPath, (err) => {
                        if (err) {
                            console.error('移动文件时出错:', err);
                        } else {
                            // console.log(`已移动文件: ${file}`);
                        }
                    });
                }
            });
        }
    });
}

const embeddings = await new OllamaEmbeddings({
    model: "bge-m3:567m",
    keepAlive: 0,
    temperature: 0
})

const loader = new DirectoryLoader(
    data_dir,
    {
        ".pdf": (path) => new PDFLoader(path),
        ".csv": (path) => new CSVLoader(path),
        ".json": (path) => new JSONLoader(path),
        ".txt": (path) => new TextLoader(path),
        ".epub": (path) => new EPubLoader(path),
        ".pptx": (path) => new PPTXLoader(path),
        ".docx": (path) => new DocxLoader(path),
        ".doc": (path) => new DocxLoader(path, { type: "doc" }),
    }
);

let vectorStore = null;

try {
    const loadedVectorStore = await FaissStore.load(
        "./data/faiss",
        embeddings
    );
    vectorStore = loadedVectorStore;
    console.log("✓ 成功加载持久化向量数据库 faiss");
} catch (error) {
    console.log(`ERR: ${error}`);
    console.log("✗ 未找到持久化向量数据库 faiss，正在创建新的向量数据库 faiss");
    await process_excel();
    const docs = await loader.load()

    const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
    const allSplits = await splitter.splitDocuments(docs);

    vectorStore = await FaissStore.fromDocuments(allSplits, embeddings);

    vectorStore.save("./data/faiss");

    await move_files();
}


// const vectorStore = await new Chroma(embeddings,
//     {
//         collectionName: 'test_collection',
//     }
// )

// await process_excel();
// const docs = await loader.load()

// const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
// const allSplits = await splitter.splitDocuments(docs);

// vectorStore = await FaissStore.fromDocuments(allSplits, embeddings);

// vectorStore.save("./data/faiss");

// await move_files();

const max_results = vectorStore.index.ntotal()

console.log('向量总数:', max_results);

const retrieveSchema = z.object({ query: z.string() });

const retrieve = tool(
  async ({ query }) => {
    const retrievedDocs = await vectorStore.similaritySearch(query, 20);
    const serialized = retrievedDocs
      .map(
        (doc) => `Source: ${doc.metadata.source}\nContent: ${doc.pageContent}`
      )
      .join("\n");
    return [serialized, retrievedDocs];
  },
  {
    name: "retrieve",
    description: "Retrieve information related to a query.",
    schema: retrieveSchema,
    responseFormat: "content_and_artifact",
  }
);

const getCurrentTimeSchema = z.object({});

const getCurrentTime = tool(
  async () => {
    const now = new Date();
    return now.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
  },
  {
    name: "getCurrentTime",
    description: "Get the current date and time in Chinese locale.",
    schema: getCurrentTimeSchema,
  }
);

const getVectorCountSchema = z.object({});

const getVectorCount = tool(
  async () => {
    return vectorStore.index.ntotal;
  },
  {
    name: "getVectorCount",
    description: "Get the total number of vectors in the vector store.",
    schema: getVectorCountSchema,
  }
);

const tools = [retrieve, getCurrentTime, getVectorCount];
const systemPrompt = new SystemMessage(
    "您是一个文档检索助手，可以使用工具对文件内容进行检索。" +
    "检索到相关数据后，优先使用检索到的数据回答用户的问题。不要让用户自己查看文件。回答涉及时间的问题时，请使用获取当前时间工具，确保时间准确无误。不要编造数据" + 
    "使用简体中文回答所有问题，不要使用英文。" + 
    "注意：特殊作业与消防、危化品存储无关！" + 
    "直接给出答案，不需要给出推理过程"
)

const model = await new ChatOllama({
  model: "qwen3:8b",
  temperature: 0.1,
  keepAlive: 0,
})

const agent = await createAgent({
  model: model,
  tools: tools,
  systemPrompt: systemPrompt
})

console.log(`Question: 现在是什么时间？`)
for await (const [token, metadata] of await agent.stream(
            { messages: [{ role: "human", content: `现在是什么时间？` }] },
            { streamMode: "messages" }
        )) {
            if(token.contentBlocks[0].text != "" && metadata.langgraph_node == "model_request") 
            {
                process.stdout.write(token.contentBlocks[0].text);
            }
        }

        console.log()

        console.log(`------------------------------------------------------------------------------------------------`)

        console.log()

console.log(`Question: 特殊作业审批模块操作指南？`)
for await (const [token, metadata] of await agent.stream(
            { messages: [{ role: "human", content: `特殊作业审批模块操作指南?` }] },
            { streamMode: "messages" }
        )) {
            if(token.contentBlocks[0].text != "" && metadata.langgraph_node == "model_request") 
            {
                process.stdout.write(token.contentBlocks[0].text);
            }
        }

        console.log()

        console.log(`------------------------------------------------------------------------------------------------`)

        console.log()

console.log(`Question: 帮我调取2025年Q4所有危化品的存储台账数据`)
for await (const [token, metadata] of await agent.stream(
            { messages: [{ role: "human", content: `帮我调取2025年Q4所有危化品的存储台账数据` }] },
            { streamMode: "messages" }
        )) {
            if(token.contentBlocks[0].text != "" && metadata.langgraph_node == "model_request") 
            {
                process.stdout.write(token.contentBlocks[0].text);
            }
        }

        console.log()

        console.log(`------------------------------------------------------------------------------------------------`)

        console.log()

console.log(`Question: 查找车间A近6个月的消防设施月度检查记录`)
for await (const [token, metadata] of await agent.stream(
            { messages: [{ role: "human", content: `输出车间A近6个月的消防设施月度检查记录` }] },
            { streamMode: "messages" }
        )) {
            if(token.contentBlocks[0].text != "" && metadata.langgraph_node == "model_request") 
            {
                process.stdout.write(token.contentBlocks[0].text);
            }
        }

        console.log()

        console.log(`------------------------------------------------------------------------------------------------`)

        console.log()

console.log(`Question: 有多少条危化品台账记录？`)
for await (const [token, metadata] of await agent.stream(
            { messages: [{ role: "human", content: `有多少条危化品台账记录？` }] },
            { streamMode: "messages" }
        )) {
            if(token.contentBlocks[0].text != "" && metadata.langgraph_node == "model_request") 
            {
                process.stdout.write(token.contentBlocks[0].text);
            }
        }

        console.log()

        console.log(`------------------------------------------------------------------------------------------------`)

        console.log()