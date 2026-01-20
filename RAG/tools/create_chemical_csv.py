import pandas as pd
import random
from datetime import datetime, timedelta

# 生成1000条数据
data = []
for _ in range(1000):
    # 化学品名称（模拟数据）
    chemicals = ["乙醇", "硫酸", "氯气", "苯", "氢氧化钠", "甲醇", "盐酸", "液化石油气", "氰化物", "硝酸"]
    name = random.choice(chemicals)
    
    # 危险类别（联合国分类标准）
    categories = ["第3类（易燃液体）", "第8类（腐蚀品）", "第2.3类（毒性气体）", 
                  "第1类（爆炸品）", "第6.1类（毒性物质）", "第6.2类（感染性物质）"]
    category = random.choice(categories)
    
    # 存储位置（虚拟仓库编号）
    locations = ["A区-01室", "A区-02室", "B区-03室", "B区-04室", "C区-05室"]
    location = random.choice(locations)

    # 入库数量（50-1000kg）
    in_stock = random.randint(50, 1000)
    
    # 出库数量（0-入库数量）
    out_stock = random.randint(0, in_stock)
    
    # 存量 = 入库数量 - 出库数量
    stock = in_stock - out_stock
    
    # 日期范围（2025-01-01 至 2025-12-01）
    start_date = datetime(2025, 1, 1)
    end_date = datetime(2025, 12, 1)
    date = start_date + (end_date - start_date) * random.random()
    in_date = date.strftime("%Y-%m-%d")
    update_date = (date + timedelta(days=random.randint(0, 30))).strftime("%Y-%m-%d")
    
    # 安全措施（根据危险类别生成）
    if "易燃液体" in category:
        safety = "通风、防火"
    elif "腐蚀品" in category:
        safety = "防泄漏、防腐蚀"
    elif "毒性气体" in category:
        safety = "密闭储存、防毒"
    elif "爆炸品" in category:
        safety = "防爆、防火"
    elif "毒性物质" in category:
        safety = "防毒、防泄漏"
    else:
        safety = "防感染、防泄漏"
    
    data.append([name, category, location, in_stock, "张伟", in_date, update_date, safety, stock])

# 保存为CSV文件
df = pd.DataFrame(data, columns=["化学品名称","危险类别","存储位置","入库数量(kg)","负责人","入库日期","更新日期","安全措施","存量(kg)"])
df.to_csv("危化品存储台账.csv", index=False, encoding="utf-8-sig")
