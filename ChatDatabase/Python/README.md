使用
```python
pip install -r /path/to/requirements.txt
```
安装依赖。

修改```langchain_test.py```文件中以下内容：
```python{.line-numbers}
llm = ChatOllama(
    model="your_model_name",  #修改为实际使用的模型名称
    validate_model_on_init=True,
    temperature = 1,
    keep_alive = 0
)
```