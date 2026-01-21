# 后端：
修改`index.js`文件：
```javascript
第76行：
//按实际数据库参数进行配置
const datasource = new DataSource({ type: "mysql", host: "your_db_host", port: your_db_port, username: "your_db_user_name", password: "your_db_pwd", database: "your_database_name" });
```

    cd /path/to/backend
    npm install
    npm run dev
