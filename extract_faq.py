import json
import os
import re
from datetime import datetime

CHUNKS_DIR = r"d:\桌面\竞赛\新生问答\group_不错过每一场可爱的活动②_954434407_20260724_172040886_chunked_jsonl\chunks"
OUTPUT_FILE = r"d:\桌面\竞赛\新生问答\src\data\faq.json"

CATEGORIES = {
    "入学报到": ["报到", "入学", "注册", "迎新", "接站", "行李", "证件", "录取通知"],
    "宿舍生活": ["宿舍", "住宿", "床位", "室友", "用电", "空调", "热水", "洗衣"],
    "军训安排": ["军训", "迷彩服", "训练", "教官", "请假"],
    "学习课程": ["课程", "上课", "选课", "考试", "补考", "重修", "绩点", "课表", "学分", "选修课", "网课", "学习通", "英语", "通识", "形策", "形势与政策"],
    "专业介绍": ["专业", "转专业", "学科", "培养方案"],
    "校园生活": ["食堂", "图书馆", "校园卡", "交通", "社团", "活动", "商业街", "超市"],
    "竞赛科研": ["竞赛", "比赛", "科研", "项目", "大创", "建模", "AI", "信息素养", "大艺展"],
    "其他": ["综测", "成绩", "奖学金", "辅导员", "老师", "联系方式"]
}

def get_category(text):
    for category, keywords in CATEGORIES.items():
        for keyword in keywords:
            if keyword in text:
                return category
    return "其他"

def clean_text(text):
    text = re.sub(r'\[图片:[^\]]+\]', '', text)
    text = re.sub(r'\[JSON消息\]', '', text)
    text = re.sub(r'\[转发消息:[^\]]+\]', '', text)
    text = re.sub(r'\/\w+', '', text)
    text = re.sub(r'@\S+', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def is_question(text):
    question_patterns = [
        r'^[谁什么哪哪能怎如何是否有没有]\S*\?',
        r'.*[吗么呢吧啊]\?$',
        r'.*[？?]\s*$',
        r'请问.*',
        r'有.*吗',
        r'需要.*吗',
        r'可以.*吗',
        r'什么时候.*',
        r'在哪里.*',
        r'怎么样.*',
        r'怎么.*',
        r'多少.*'
    ]
    for pattern in question_patterns:
        if re.search(pattern, text):
            return True
    return False

def parse_timestamp(timestamp_ms):
    ts = int(timestamp_ms) // 1000
    return datetime.fromtimestamp(ts).strftime('%Y-%m-%d')

def extract_faq():
    faq_list = []
    message_buffer = []
    current_question = None
    current_question_time = None

    for filename in sorted(os.listdir(CHUNKS_DIR)):
        if not filename.endswith('.jsonl'):
            continue
        
        filepath = os.path.join(CHUNKS_DIR, filename)
        print(f"Processing {filename}...")
        
        with open(filepath, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                
                try:
                    msg = json.loads(line)
                except json.JSONDecodeError:
                    continue
                
                if msg.get('system') or msg.get('type') not in ['text', 'reply']:
                    continue
                
                content = clean_text(msg['content']['text'])
                if not content or len(content) < 5:
                    continue
                
                sender_name = msg['sender']['name'] if msg['sender'] else '未知'
                time_str = parse_timestamp(msg['timestamp'])
                
                if is_question(content):
                    if current_question and message_buffer:
                        answer = '\n'.join(message_buffer).strip()
                        if answer and len(answer) > 5:
                            category = get_category(current_question)
                            faq_list.append({
                                "question": current_question,
                                "answer": answer,
                                "category": category,
                                "source": sender_name + "等",
                                "time": current_question_time
                            })
                    
                    current_question = content
                    current_question_time = time_str
                    message_buffer = []
                else:
                    if current_question and not sender_name in current_question:
                        message_buffer.append(content)
    
    if current_question and message_buffer:
        answer = '\n'.join(message_buffer).strip()
        if answer and len(answer) > 5:
            category = get_category(current_question)
            faq_list.append({
                "question": current_question,
                "answer": answer,
                "category": category,
                "source": "QQ群整理",
                "time": current_question_time
            })
    
    for i, item in enumerate(faq_list, 1):
        item['id'] = i
    
    return faq_list

def merge_with_existing(faq_list):
    if os.path.exists(OUTPUT_FILE):
        with open(OUTPUT_FILE, 'r', encoding='utf-8') as f:
            existing_faq = json.load(f)
        
        existing_questions = set(item['question'] for item in existing_faq)
        
        new_faq = []
        for item in faq_list:
            if item['question'] not in existing_questions:
                new_faq.append(item)
        
        all_faq = existing_faq + new_faq
        
        for i, item in enumerate(all_faq, 1):
            item['id'] = i
        
        return all_faq
    return faq_list

if __name__ == '__main__':
    faq_list = extract_faq()
    print(f"Extracted {len(faq_list)} FAQ items")
    
    all_faq = merge_with_existing(faq_list)
    print(f"Total FAQ items after merge: {len(all_faq)}")
    
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(all_faq, f, ensure_ascii=False, indent=2)
    
    print(f"FAQ data saved to {OUTPUT_FILE}")
    
    for item in all_faq:
        print(f"ID: {item['id']}, Category: {item['category']}, Question: {item['question'][:30]}...")