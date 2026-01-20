import pandas as pd
import random
from datetime import datetime, timedelta

# 固定每月检查项目（设施类型和检查内容）
fixed_check_items = [
    {"facility": "灭火器", "item": "压力表指针是否在绿色区域"},
    {"facility": "消火栓", "item": "水压是否达标"},
    {"facility": "应急照明灯", "item": "灯具是否正常工作"},
    {"facility": "安全出口指示灯", "item": "指示灯是否亮起"},
    {"facility": "防火门", "item": "门体是否能正常关闭"},
    {"facility": "安全出口标志", "item": "标志是否清晰可见"},
    {"facility": "疏散通道", "item": "通道是否畅通无阻"}
]

# 生成时间范围：2023-01 至 2026-01
start_date = datetime(2023, 1, 1)
end_date = datetime(2026, 1, 1)
months = []

current_date = start_date
while current_date <= end_date:
    months.append(current_date.strftime("%Y-%m"))
    current_date += timedelta(days=30)  # 每月增加 30 天

# 检查人员列表
staff = ["李明", "王芳", "张强", "陈琳", "赵伟"]

# 生成数据
data = []
for month in months:
    for workshop in ['A', 'B', 'C', 'D', 'E']:
        for check_item in fixed_check_items:
            facility = check_item["facility"]
            item = check_item["item"]
            # 异常率 10%
            if random.random() < 0.1:
                result = f"异常（{random.choice(['水压不足', '灯泡损坏', '门锁损坏', '探测器故障', '指示灯损坏', '标志模糊', '通道堵塞'])}）"
            else:
                result = "正常"
            # 处理情况
            status = "无异常" if result == "正常" else random.choice(["已维修", "待跟进", "已更换部件", "已清理"])
            # 随机选择检查人员
            checker = random.choice(staff)
            data.append([
                month, workshop, facility, item, result, checker, status
            ])

# 保存为 CSV 文件
df = pd.DataFrame(data, columns=["检查时间", "车间", "设施类型", "检查项目", "检查结果", "检查人员", "处理情况"])
df.to_csv("消防设施月度检查记录.csv", index=False, encoding="utf-8-sig")
