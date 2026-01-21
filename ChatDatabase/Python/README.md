使用
```python
pip install -r /path/to/requirements.txt
```
安装依赖。

修改```langchain_test.py```文件中以下内容：

```python
第40行:

llm = ChatOllama(
    model="your_model_name", #修改为实际使用的模型名称
    validate_model_on_init=True,
    temperature = 1,
    keep_alive = 0
)

# 修改为实际数据库参数
db_user = "your_db_user_name"
db_password = "your_db_pwd"
db_host = "your_db_host"
db_name = "your_db_name"
```