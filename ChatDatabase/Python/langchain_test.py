from langchain_community.utilities import SQLDatabase
from langchain_ollama import ChatOllama

from langchain_community.agent_toolkits import SQLDatabaseToolkit
from langchain.agents import create_agent
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import json

host = ('localhost', 8888)

data = {'content': ''}

class Resquest(BaseHTTPRequestHandler):
    def do_GET(self):
        # 解析URL中的查询字符串
        query = parse_qs(urlparse(self.path).query)

        # 获取参数值
        content = query.get('content', [''])[0]

        print(content)
        self.send_response(200)

        question = content

        for step in agent.stream(
            {"messages": [{"role": "user", "content": question}]},
            stream_mode="values",
        ):
            step["messages"][-1].pretty_print()

            print(step["messages"][-1].content)
            data["content"] = step["messages"][-1].content
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

if __name__ == '__main__':
    llm = ChatOllama(
        model="your_model_name", 
        validate_model_on_init=True,
        temperature = 1,
        keep_alive = 0
    )

    # 设置数据库参数
    db_user = "your_db_user_name"
    db_password = "your_db_pwd"
    db_host = "your_db_host"
    db_name = "your_db_name"

    # 创建数据库连接
    db = SQLDatabase.from_uri(f"mysql+pymysql://{db_user}:{db_password}@{db_host}/{db_name}")
    # print(db.dialect)
    # print(db.get_usable_table_names())
    # print(db.run("SELECT * FROM ticket;"))

    toolkit = SQLDatabaseToolkit(db=db, llm=llm)

    tools = toolkit.get_tools()

    for tool in tools:
        print(f"{tool.name}: {tool.description}\n")

    system_prompt = """
    您是一个被设计用来与SQL数据库交互的代理。
    给定一个输入问题，创建一个语法正确的SQL语句并执行，然后查看查询结果并返回答案。
    除非用户指定了他们想要获得的示例的具体数量，否则始终将SQL查询限制为最多10个结果。
    你可以按相关列对结果进行排序，以返回MySQL数据库中最匹配的数据。
    您可以使用与数据库交互的工具。在执行查询之前，你必须仔细检查。如果在执行查询时出现错误，请重写查询SQL并重试。
    不要对数据库做任何DML语句(插入，更新，删除，删除等)。

    以下数据表用于记录作业票统计：
    CREATE TABLE ticket (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    ticket_name VARCHAR(255),
    ticket_type VARCHAR(255),
    ticket_level VARCHAR(255),
    location VARCHAR(255),
    worker_name VARCHAR(255),
    start_date DATE,
    end_date DATE,
    finished VARCHAR(255)
    );
    其中ticket_name表示作业票名称名称，ticket_type表示作业票类别，ticket_level表示作业等级，location表示作业区域，worker_name表示作业人姓名，start_date表示作业开始时间，end_date表示作业结束时间，finished表示作业是否完成，yes代表已完成，no代表未完成。
    fire代表动火作业，electricity代表临电作业。
    首先，你应该查看数据库中的表，看看可以查询什么。
    不要跳过这一步。
    然后查询最相关的表的模式。
    直接给出结果，不需要给出推理过程。
    """.format(
        dialect=db.dialect,
        top_k=5,
    )

    agent = create_agent(
        llm,
        tools,
        system_prompt=system_prompt,
    )

    server = HTTPServer(host, Resquest)
    print("Starting server, listen at: %s:%s" % host)
    server.serve_forever()