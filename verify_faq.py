import json

data = json.load(open(r'd:\桌面\竞赛\新生问答\src\data\faq.json', 'r', encoding='utf-8'))
print(f'Total items: {len(data)}')
print('Last 5 items:')
for item in data[-5:]:
    print(f"ID:{item['id']} Cat:{item['category']} Q:{item['question'][:40]} A:{item['answer'][:30]}")