# 后端：
修改`index.js`文件：
```javascript
第76行：
//使用dotenv按实际数据库参数进行配置
const datasource = new DataSource({ 
  type: process.env.DB_TYPE, 
  host: process.env.DB_HOST, 
  port: parseInt(process.env.DB_PORT), 
  username: process.env.DB_USERNAME, 
  password: process.env.DB_PASSWORD, 
  database: process.env.DB_DATABASE 
});
```

```javascript
第99行：
const llm = new ChatOllama({
    model: process.env.MODEL_NAME, //修改为实际使用的模型名称
    temperature: 0.6,
    keepAlive: 0,
    // other params...
  })
```

使用以下命令运行：

    cd /path/to/backend
    npm install
    npm run dev

## 接口说明：
```
请求方法: GET
接口路径: /GetReqText
端口：3000
```
### 请求参数说明
|参数名|类型|是否必填|描述|
|:----:|:----:|:----:|:----:|
|content|字符串|是|用于传递文本内容|

响应说明
成功响应（200 OK）
内容类型: application/octet-stream（二进制流）

# 前端
使用以下命令运行：

    cd path/to/frontend/frontend/AI-Chat-obfuscator
    npm install
    npm run dev