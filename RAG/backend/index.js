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

import xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';

const data_dir = "./data";

async function load_pdf(file, vectorStore) {
    // const filePath = path.join(data_dir, file);
    console.log('加载文件路径:', file);
    const filePath = path.join(data_dir, file);
    const loader = new PDFLoader(`${filePath}`);
    const docs = await loader.load();
    const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 4000, chunkOverlap: 200 });
    const allSplits = await splitter.splitDocuments(docs);
    // Sanitize metadata for ChromaDB compatibility
    allSplits.forEach(doc => {
        for (const key in doc.metadata) {
            const value = doc.metadata[key];
            if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean' && value !== null) {
                doc.metadata[key] = JSON.stringify(value);
            }
        }
    });
    // Add documents in batches to avoid exceeding ChromaDB max batch size
    const batchSize = 4000;
    for (let i = 0; i < allSplits.length; i += batchSize) {
        const batch = allSplits.slice(i, i + batchSize);
        await vectorStore.addDocuments(batch);
    }
}

async function load_csv(file, vectorStore) {
    // console.log('加载文件路径:', file);
    const filePath = path.join(data_dir, file);
    const loader = new CSVLoader(filePath);
    const docs = await loader.load();
    const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 4000, chunkOverlap: 200 });
    const allSplits = await splitter.splitDocuments(docs);
    // Sanitize metadata for ChromaDB compatibility
    allSplits.forEach(doc => {
        // console.log(doc);
        for (const key in doc.metadata) {
            const value = doc.metadata[key];
            if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean' && value !== null) {
                doc.metadata[key] = JSON.stringify(value);
            }
        }
    });
    // Add documents in batches to avoid exceeding ChromaDB max batch size
    const batchSize = 4000;
    for (let i = 0; i < allSplits.length; i += batchSize) {
        const batch = allSplits.slice(i, i + batchSize);
        await vectorStore.addDocuments(batch);
    }
}

async function load_json(file, vectorStore) {
    const filePath = path.join(data_dir, file);
    const loader = new JSONLoader(filePath);
    const docs = await loader.load();
    const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 4000, chunkOverlap: 200 });
    const allSplits = await splitter.splitDocuments(docs);
    // Sanitize metadata for ChromaDB compatibility
    allSplits.forEach(doc => {
        for (const key in doc.metadata) {
            const value = doc.metadata[key];
            if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean' && value !== null) {
                doc.metadata[key] = JSON.stringify(value);
            }
        }
    });
    // Add documents in batches to avoid exceeding ChromaDB max batch size
    const batchSize = 4000;
    for (let i = 0; i < allSplits.length; i += batchSize) {
        const batch = allSplits.slice(i, i + batchSize);
        await vectorStore.addDocuments(batch);
    }
}

async function load_text(file, vectorStore) {
    const filePath = path.join(data_dir, file);
    const loader = new TextLoader(filePath);
    const docs = await loader.load();
    const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 4000, chunkOverlap: 200 });
    const allSplits = await splitter.splitDocuments(docs);
    // Sanitize metadata for ChromaDB compatibility
    allSplits.forEach(doc => {
        for (const key in doc.metadata) {
            const value = doc.metadata[key];
            if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean' && value !== null) {
                doc.metadata[key] = JSON.stringify(value);
            }
        }
    });
    // Add documents in batches to avoid exceeding ChromaDB max batch size
    const batchSize = 4000;
    for (let i = 0; i < allSplits.length; i += batchSize) {
        const batch = allSplits.slice(i, i + batchSize);
        await vectorStore.addDocuments(batch);
    }
}

async function load_epub(file, vectorStore) {
    const filePath = path.join(data_dir, file);
    const loader = new EPubLoader(filePath);
    const docs = await loader.load();
    const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 4000, chunkOverlap: 200 });
    const allSplits = await splitter.splitDocuments(docs);
    // Sanitize metadata for ChromaDB compatibility
    allSplits.forEach(doc => {
        for (const key in doc.metadata) {
            const value = doc.metadata[key];
            if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean' && value !== null) {
                doc.metadata[key] = JSON.stringify(value);
            }
        }
    });
    // Add documents in batches to avoid exceeding ChromaDB max batch size
    const batchSize = 4000;
    for (let i = 0; i < allSplits.length; i += batchSize) {
        const batch = allSplits.slice(i, i + batchSize);
        await vectorStore.addDocuments(batch);
    }
}

async function load_pptx(file, vectorStore) {
    const filePath = path.join(data_dir, file);
    const loader = new PPTXLoader(filePath);
    const docs = await loader.load();
    const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 4000, chunkOverlap: 200 });
    const allSplits = await splitter.splitDocuments(docs);
    // Sanitize metadata for ChromaDB compatibility
    allSplits.forEach(doc => {
        for (const key in doc.metadata) {
            const value = doc.metadata[key];
            if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean' && value !== null) {
                doc.metadata[key] = JSON.stringify(value);
            }
        }
    });
    // Add documents in batches to avoid exceeding ChromaDB max batch size
    const batchSize = 4000;
    for (let i = 0; i < allSplits.length; i += batchSize) {
        const batch = allSplits.slice(i, i + batchSize);
        await vectorStore.addDocuments(batch);
    }
}

async function load_docx(file, vectorStore) {
    const filePath = path.join(data_dir, file);
    let loader;
    if(filePath.endsWith(".docx")) {
        loader = new DocxLoader(filePath);
    } else if(filePath.endsWith(".doc")) {
        loader = new DocxLoader(filePath, {
            type: "doc",
        });
    }
    const docs = await loader.load();
    const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 4000, chunkOverlap: 200 });
    const allSplits = await splitter.splitDocuments(docs);
    // Sanitize metadata for ChromaDB compatibility
    allSplits.forEach(doc => {
        for (const key in doc.metadata) {
            const value = doc.metadata[key];
            if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean' && value !== null) {
                doc.metadata[key] = JSON.stringify(value);
            }
        }
    });
    // Add documents in batches to avoid exceeding ChromaDB max batch size
    const batchSize = 4000;
    for (let i = 0; i < allSplits.length; i += batchSize) {
        const batch = allSplits.slice(i, i + batchSize);
        await vectorStore.addDocuments(batch);
    }
}

async function load_files(vectorStore) {
    fs.readdir(data_dir, (err, files) => {
        if (err) {
            console.error('无法读取目录:', err);
            return;
        } else {
            files.forEach(file => {
                console.log('发现文件:', file);
                if (file.endsWith('.pdf')) {
                    load_pdf(file, vectorStore);
                } else if (file.endsWith('.csv')) {
                    load_csv(file, vectorStore);
                } else if (file.endsWith('.json')) {
                    load_json(file, vectorStore);
                } else if (file.endsWith('.txt')) {
                    load_text(file, vectorStore);
                } else if (file.endsWith('.epub')) {
                    load_epub(file, vectorStore);
                } else if (file.endsWith('.pptx')) {
                    load_pptx(file, vectorStore);
                } else if (file.endsWith('.docx') || file.endsWith('.doc')) {
                    load_docx(file, vectorStore);
                }else if (file.endsWith('.xlsx') || file.endsWith('.xls')) {
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
                        load_csv(outputFileName, vectorStore);
                    } catch (error) {
                        console.error(`✗ Error converting ${file}:`, error.message);
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
                    const newPath = path.join(data_dir, 'archived', file);
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
})

const vectorStore = await new FaissStore(embeddings, {});


// await load_csv("BME688_Remote_MQTT.csv", vectorStore);
// await load_pdf("Mind+四足扩展包使用说明.pdf", vectorStore);

if (fs.existsSync('./data/faiss')) {
    console.log('目录存在');
} else {
    console.log('目录不存在');
}

await load_files(vectorStore);

await move_files();

// Save the vector store to a directory
const directory = "./data/faiss";

await vectorStore.save(directory);

const retrieveSchema = z.object({ query: z.string() });

const retrieve = tool(
  async ({ query }) => {
    const retrievedDocs = await vectorStore.similaritySearch(query, 2);
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

const tools = [retrieve];
const systemPrompt = new SystemMessage(
    "You have access to a tool that retrieves context from local files. " +
    "Use the tool to help answer user queries."
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

// while (true) {

// }

for await (const [token, metadata] of await agent.stream(
            { messages: [{ role: "human", content: `如何进入特殊作业审批模块？` }] },
            { streamMode: "messages" }
        )) {
            // console.log(`node: ${metadata.langgraph_node}`);
            // console.log(`content: ${JSON.stringify(token.contentBlocks, null, 2)}`);
            if(token.contentBlocks[0].text != "" && metadata.langgraph_node == "model_request") 
            {
                process.stdout.write(token.contentBlocks[0].text);
            }
        }

        console.log()

        console.log(`------------------------------------------------------------------------------------------------`)

        console.log()

for await (const [token, metadata] of await agent.stream(
            { messages: [{ role: "human", content: `帮我调取 2025年Q4所有危化品的存储台账数据` }] },
            { streamMode: "messages" }
        )) {
            // console.log(`node: ${metadata.langgraph_node}`);
            // console.log(`content: ${JSON.stringify(token.contentBlocks, null, 2)}`);
            if(token.contentBlocks[0].text != "" && metadata.langgraph_node == "model_request") 
            {
                process.stdout.write(token.contentBlocks[0].text);
            }
        }

        console.log()

        console.log(`------------------------------------------------------------------------------------------------`)

        console.log()

for await (const [token, metadata] of await agent.stream(
            { messages: [{ role: "human", content: `查找车间 A 近 6 个月的消防设施月度检查记录` }] },
            { streamMode: "messages" }
        )) {
            // console.log(`node: ${metadata.langgraph_node}`);
            // console.log(`content: ${JSON.stringify(token.contentBlocks, null, 2)}`);
            if(token.contentBlocks[0].text != "" && metadata.langgraph_node == "model_request") 
            {
                process.stdout.write(token.contentBlocks[0].text);
            }
        }

        console.log()

        console.log(`------------------------------------------------------------------------------------------------`)

        console.log()