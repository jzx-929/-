import json
import os
import re
from datetime import datetime

CHUNKS_DIR = r"d:\桌面\竞赛\新生问答\group_不错过每一场可爱的活动②_954434407_20260724_172040886_chunked_jsonl\chunks"
OUTPUT_FILE = r"d:\桌面\竞赛\新生问答\src\data\faq.json"

CATEGORIES = {
    "入学报到": ["报到", "入学", "注册", "迎新", "接站", "行李", "证件", "录取通知", "开学", "学费", "缴费", "校园卡", "报道", "新生"],
    "宿舍生活": ["宿舍", "住宿", "床位", "室友", "用电", "空调", "热水", "洗衣", "寝室", "门禁", "水电", "wifi", "吹风机", "插座", "熄灯", "断网"],
    "军训安排": ["军训", "迷彩服", "训练", "教官", "请假", "队列", "汇演", "军服", "军帽"],
    "学习课程": ["课程", "上课", "选课", "考试", "补考", "重修", "绩点", "课表", "学分", "选修课", "网课", "学习通", "英语", "通识", "形策", "形势与政策", "成绩", "挂科", "期末", "期中", "老师", "教室", "综测", "工程素养", "思政", "习概", "马原", "毛概", "普通话", "六级", "四级", "四六级", "计算机", "作业", "论文", "答辩"],
    "专业介绍": ["专业", "转专业", "学科", "培养方案", "学院", "导师", "方向", "就业", "前景", "教研室", "实验室", "保研", "考研"],
    "校园生活": ["食堂", "图书馆", "交通", "社团", "活动", "商业街", "超市", "快递", "复印", "打印", "校医院", "操场", "办事大厅", "献血", "体育馆", "理发店", "银行"],
    "竞赛科研": ["竞赛", "比赛", "科研", "项目", "大创", "建模", "AI", "信息素养", "大艺展", "挑战杯", "学科竞赛", "创新创业", "互联网+"],
    "其他": []
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
    text = re.sub(r'\[回复消息[^\]]*\]', '', text)
    text = re.sub(r'\/\w+', '', text)
    text = re.sub(r'@\S+', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def is_valid_question(text):
    if len(text) < 6:
        return False
    if text.startswith('['):
        return False
    question_patterns = [
        r'.*[吗么呢吧啊]\?',
        r'.*[？?]\s*$',
        r'^请问.*',
        r'^谁.*[？?]',
        r'^什么.*[？?]',
        r'^哪.*[？?]',
        r'^能.*[？?]',
        r'^怎么.*[？?]',
        r'^如何.*[？?]',
        r'^是否.*',
        r'^有没有.*',
        r'有.*吗',
        r'需要.*吗',
        r'可以.*吗',
        r'什么时候.*[？?]',
        r'在哪里.*[？?]',
        r'怎么样.*[？?]',
        r'多少.*[？?]',
        r'麻烦问.*',
        r'问一下.*[？?]',
        r'谁知道.*[？?]',
        r'有谁知道.*[？?]',
        r'大家知道.*[？?]',
    ]
    for pattern in question_patterns:
        if re.search(pattern, text):
            return True
    return False

def is_valid_answer(text):
    text = text.strip()
    if len(text) < 5:
        return False
    if text.startswith('['):
        return False
    if is_valid_question(text):
        return False
    bad_patterns = [
        r'^[？?]+$',
        r'^[！!]+$',
        r'^[\.\.。]+$',
        r'^[？?！!]+$',
        r'^[，,]+$',
        r'^[、]+$',
        r'^\?+$',
        r'^[啊啊啊]+$',
        r'^[哈哈]+$',
        r'^[嘿嘿]+$',
        r'^[嘻嘻]+$',
        r'^[呵呵]+$',
        r'^[哦哦]+$',
        r'^[嗯嗯嗯]+$',
        r'^[好的]$',
        r'^[知道了]$',
        r'^[了解]$',
        r'^[谢谢]$',
        r'^[不客气]$',
        r'^[嗯嗯]$',
        r'^[哦]$',
        r'^[嗯]$',
    ]
    for pattern in bad_patterns:
        if re.search(pattern, text):
            return False
    return True

def has_overlap(question, answer):
    q_chars = set(question)
    a_chars = set(answer)
    overlap = q_chars.intersection(a_chars)
    return len(overlap) >= 3

def optimize_answer(answer):
    answer = answer.strip()
    
    answer = re.sub(r'[\u2700-\u27bf\u2600-\u26ff\u1f00-\u1fff\u1f600-\u1f6ff\u1f300-\u1f5ff]', '', answer)
    
    spoken_patterns = [
        (r'(^|[^a-zA-Z0-9])嗯嗯([^a-zA-Z0-9]|$)', r'\1\2'),
        (r'(^|[^a-zA-Z0-9])嗯嗯嗯([^a-zA-Z0-9]|$)', r'\1\2'),
        (r'(^|[^a-zA-Z0-9])嗯([^a-zA-Z0-9]|$)', r'\1\2'),
        (r'(^|[^a-zA-Z0-9])哦([^a-zA-Z0-9]|$)', r'\1\2'),
        (r'(^|[^a-zA-Z0-9])哦哦([^a-zA-Z0-9]|$)', r'\1\2'),
        (r'(^|[^a-zA-Z0-9])啊([^a-zA-Z0-9]|$)', r'\1\2'),
        (r'(^|[^a-zA-Z0-9])呀([^a-zA-Z0-9]|$)', r'\1\2'),
        (r'(^|[^a-zA-Z0-9])嘛([^a-zA-Z0-9]|$)', r'\1\2'),
        (r'(^|[^a-zA-Z0-9])呢([^a-zA-Z0-9]|$)', r'\1\2'),
        (r'(^|[^a-zA-Z0-9])吧([^a-zA-Z0-9]|$)', r'\1\2'),
        (r'(^|[^a-zA-Z0-9])啦([^a-zA-Z0-9]|$)', r'\1\2'),
        (r'(^|[^a-zA-Z0-9])哈([^a-zA-Z0-9]|$)', r'\1\2'),
        (r'(^|[^a-zA-Z0-9])哈哈([^a-zA-Z0-9]|$)', r'\1\2'),
        (r'(^|[^a-zA-Z0-9])笑死([^a-zA-Z0-9]|$)', r'\1\2'),
        (r'(^|[^a-zA-Z0-9])救命([^a-zA-Z0-9]|$)', r'\1\2'),
        (r'(^|[^a-zA-Z0-9])绝了([^a-zA-Z0-9]|$)', r'\1\2'),
        (r'(^|[^a-zA-Z0-9])无语([^a-zA-Z0-9]|$)', r'\1\2'),
        (r'(^|[^a-zA-Z0-9])绝([^a-zA-Z0-9]|$)', r'\1\2'),
        (r'(^|[^a-zA-Z0-9])yyds([^a-zA-Z0-9]|$)', r'\1\2'),
        (r'(^|[^a-zA-Z0-9])nb([^a-zA-Z0-9]|$)', r'\1\2'),
        (r'(^|[^a-zA-Z0-9])牛([^a-zA-Z0-9]|$)', r'\1\2'),
        (r'(^|[^a-zA-Z0-9])牛啊([^a-zA-Z0-9]|$)', r'\1\2'),
        (r'(^|[^a-zA-Z0-9])卧槽([^a-zA-Z0-9]|$)', r'\1\2'),
        (r'(^|[^a-zA-Z0-9])靠([^a-zA-Z0-9]|$)', r'\1\2'),
        (r'(^|[^a-zA-Z0-9])宝([^a-zA-Z0-9]|$)', r'\1同学\2'),
        (r'(^|[^a-zA-Z0-9])宝子([^a-zA-Z0-9]|$)', r'\1同学\2'),
        (r'(^|[^a-zA-Z0-9])大佬([^a-zA-Z0-9]|$)', r'\1同学\2'),
        (r'(^|[^a-zA-Z0-9])学长([^a-zA-Z0-9]|$)', r'\1同学\2'),
        (r'(^|[^a-zA-Z0-9])学姐([^a-zA-Z0-9]|$)', r'\1同学\2'),
        (r'(^|[^a-zA-Z0-9])学弟([^a-zA-Z0-9]|$)', r'\1同学\2'),
        (r'(^|[^a-zA-Z0-9])学妹([^a-zA-Z0-9]|$)', r'\1同学\2'),
        (r'(^|[^a-zA-Z0-9])哇([^a-zA-Z0-9]|$)', r'\1\2'),
        (r'(^|[^a-zA-Z0-9])噢([^a-zA-Z0-9]|$)', r'\1\2'),
        (r'(^|[^a-zA-Z0-9])嘞([^a-zA-Z0-9]|$)', r'\1\2'),
        (r'(^|[^a-zA-Z0-9])诶([^a-zA-Z0-9]|$)', r'\1\2'),
        (r'(^|[^a-zA-Z0-9])哎([^a-zA-Z0-9]|$)', r'\1\2'),
    ]
    
    for pattern, replacement in spoken_patterns:
        answer = re.sub(pattern, replacement, answer)
    
    spoken_words = [
        '嘛', '吧', '呢', '呀', '啊', '哦', '嗯', '哈', '嘿', '嘻',
        '哈哈哈', '呵呵', '嗯嗯', '嗯嗯嗯', '哦哦',
        '救命', '绝了', '笑死', '无语', '绝',
        'yyds', 'nb', '牛', '牛啊', '卧槽', '靠',
        '啦', '哇', '噢', '嘞', '诶', '哎',
        '哈啊', '哈哈哈哈', '嘿嘿', '嘻嘻',
        '妈耶', '我的天', '天呐', '天哪',
        '离谱', '绝绝子', '绝了绝了', '绝绝',
        '太绝了', '太离谱了', '不可思议', '震惊',
        '震惊了', '惊呆了', '吓一跳', '吓死我了',
        '笑死我了', '笑死人了', '笑不活了', '蚌埠住了',
        '绷不住了', '破防了', 'emo了', '哭了',
        '我哭了', '泪目', '泪目了', '破防',
        '太强了', '太厉害了', '牛批', '牛逼',
        'nb了', '太强', '太强了', '无敌',
        '太强了吧', '太强了吧', '太强了吧',
    ]
    
    for word in spoken_words:
        answer = answer.replace(word, '')
    
    formal_conversions_ordered = [
        ('问问导员', '咨询辅导员'),
        ('问问老师', '咨询任课教师'),
        ('问问学长', '咨询高年级同学'),
        ('问问学姐', '咨询高年级同学'),
        ('问导员', '咨询辅导员'),
        ('问老师', '咨询任课教师'),
        ('问学长', '咨询高年级同学'),
        ('问学姐', '咨询高年级同学'),
        ('我觉得', '建议'),
        ('我认为', '建议'),
        ('个人觉得', '建议'),
        ('个人认为', '建议'),
        ('感觉', '建议'),
        ('听说', '据了解'),
        ('据说', '据了解'),
        ('应该', '建议'),
        ('挂科', '不及格'),
        ('补考', '参加补考'),
        ('重修', '重修课程'),
        ('绩点', '学分绩点'),
        ('大创', '大学生创新创业训练计划'),
        ('建模', '数学建模'),
        ('AI', '人工智能'),
        ('挑战杯', '挑战杯'),
        ('互联网+', '互联网+'),
        ('保研', '推荐免试研究生'),
        ('考研', '硕士研究生入学考试'),
        ('刷脸', '人脸识别'),
        ('扫码', '扫描二维码'),
        ('连wifi', '连接无线网络'),
        ('交钱', '缴费'),
        ('打卡', '签到'),
        ('寝室', '宿舍'),
        ('门禁', '门禁'),
        ('快递', '快递'),
        ('校医院', '校医院'),
        ('办事大厅', '办事大厅'),
        ('体育馆', '体育馆'),
        ('理发店', '理发店'),
        ('银行', '银行'),
        ('竞赛', '竞赛'),
        ('科研', '科研'),
        ('转专业', '转专业'),
        ('培养方案', '培养方案'),
        ('信息素养', '信息素养'),
        ('大艺展', '大学生艺术展演'),
        ('学科竞赛', '学科竞赛'),
        ('创新创业', '创新创业'),
        ('前景', '发展前景'),
        ('教研室', '教研室'),
        ('实验室', '实验室'),
        ('宿舍楼', '宿舍'),
        ('寝室楼', '宿舍'),
        ('寝室长', '宿舍长'),
        ('舍长', '宿舍长'),
        ('宿管', '宿舍管理员'),
        ('辅导员老师', '辅导员'),
        ('任课老师', '任课教师'),
        ('专业课老师', '专业课教师'),
        ('学院老师', '学院教师'),
        ('学校老师', '学校教师'),
        ('教务处老师', '教务处工作人员'),
        ('学工办老师', '学生工作办公室工作人员'),
        ('后勤老师', '后勤服务人员'),
        ('图书馆老师', '图书馆工作人员'),
        ('食堂阿姨', '食堂工作人员'),
        ('保安', '校园安保人员'),
        ('门卫', '校园安保人员'),
        ('快递小哥', '快递人员'),
        ('外卖小哥', '外卖配送人员'),
        ('保洁阿姨', '保洁人员'),
        ('电工', '维修人员'),
        ('维修工', '维修人员'),
        ('司机', '校车司机'),
        ('校医', '校医院医生'),
        ('护士', '校医院护士'),
        ('院长', '学院院长'),
        ('书记', '学院党委书记'),
        ('主任', '部门主任'),
        ('处长', '部门处长'),
        ('科长', '部门科长'),
        ('教授', '教授'),
        ('副教授', '副教授'),
        ('讲师', '讲师'),
        ('助教', '助教'),
        ('班主任', '班主任'),
        ('研究生导师', '研究生导师'),
        ('班长', '班长'),
        ('团支书', '团支部书记'),
        ('学习委员', '学习委员'),
        ('生活委员', '生活委员'),
        ('体育委员', '体育委员'),
        ('文艺委员', '文艺委员'),
        ('宣传委员', '宣传委员'),
        ('组织委员', '组织委员'),
        ('纪律委员', '纪律委员'),
        ('心理委员', '心理委员'),
        ('研究生', '研究生'),
        ('本科生', '本科生'),
        ('专科生', '专科生'),
        ('留学生', '留学生'),
        ('交换生', '交换生'),
        ('转学生', '转学生'),
        ('应届生', '应届毕业生'),
        ('往届生', '往届毕业生'),
    ]
    
    for informal, formal in formal_conversions_ordered:
        answer = answer.replace(informal, formal)
    
    answer = re.sub(r'\s+', ' ', answer).strip()
    
    answer = re.sub(r'^[,，.。、]+', '', answer)
    answer = re.sub(r'[,，.。、]+$', '', answer)
    answer = re.sub(r'[,，.。、]+', '，', answer)
    
    if answer and not answer.endswith(('。', '！', '？', '；', ':', '：')):
        answer += '。'
    
    return answer

def parse_timestamp(timestamp_ms):
    ts = int(timestamp_ms) // 1000
    return datetime.fromtimestamp(ts).strftime('%Y-%m-%d')

def extract_faq():
    faq_list = []
    messages = []

    for filename in sorted(os.listdir(CHUNKS_DIR)):
        if not filename.endswith('.jsonl'):
            continue
        
        filepath = os.path.join(CHUNKS_DIR, filename)
        
        with open(filepath, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                
                try:
                    msg = json.loads(line)
                except json.JSONDecodeError:
                    continue
                
                content = clean_text(msg['content']['text']) if msg.get('content') else ''
                if not content or len(content) < 5:
                    continue
                
                sender_name = msg['sender']['name'] if msg.get('sender') else '未知'
                time_str = parse_timestamp(msg['timestamp'])
                msg_type = msg.get('type', 'text')
                
                reply_info = None
                if msg_type == 'reply' and msg.get('content'):
                    for element in msg['content'].get('elements', []):
                        if element.get('type') == 'reply':
                            reply_info = {
                                'referenced_content': clean_text(element.get('data', {}).get('content', '')),
                                'reply_text': ''
                            }
                            break
                    if reply_info:
                        reply_text = ''
                        for element in msg['content'].get('elements', []):
                            if element.get('type') == 'text':
                                reply_text += element.get('data', {}).get('text', '') + ' '
                        reply_info['reply_text'] = clean_text(reply_text)
                
                messages.append({
                    'text': content,
                    'sender': sender_name,
                    'time': time_str,
                    'type': msg_type,
                    'reply_info': reply_info
                })

    for msg in messages:
        if msg['type'] == 'reply' and msg['reply_info']:
            original_content = msg['reply_info']['referenced_content']
            reply_text = msg['reply_info']['reply_text']
            
            if original_content and reply_text and len(reply_text) >= 5 and len(original_content) >= 6:
                if is_valid_question(original_content) and is_valid_answer(reply_text):
                    category = get_category(original_content)
                    faq_list.append({
                        "question": original_content[:200],
                        "answer": optimize_answer(reply_text)[:500],
                        "category": category,
                        "source": "QQ群整理",
                        "time": msg['time']
                    })

    for i in range(len(messages)):
        current = messages[i]
        if current['type'] == 'reply':
            continue
        
        if is_valid_question(current['text']):
            question = current['text']
            question_sender = current['sender']
            
            answers = []
            j = i + 1
            
            while j < len(messages) and len(answers) < 2:
                next_msg = messages[j]
                
                if next_msg['type'] == 'reply':
                    break
                
                if is_valid_question(next_msg['text']):
                    break
                
                if next_msg['sender'] != question_sender and is_valid_answer(next_msg['text']):
                    answers.append(next_msg['text'])
                
                j += 1
            
            if len(answers) >= 1:
                answer = '\n'.join(answers).strip()
                if len(answer) >= 12 and has_overlap(question, answer):
                    category = get_category(question)
                    faq_list.append({
                        "question": question[:200],
                        "answer": optimize_answer(answer)[:500],
                        "category": category,
                        "source": "QQ群整理",
                        "time": current['time']
                    })
    
    unique_faq = []
    seen = set()
    for item in faq_list:
        key = item['question'][:100]
        if key not in seen:
            seen.add(key)
            unique_faq.append(item)
    
    for i, item in enumerate(unique_faq, 1):
        item['id'] = i
    
    return unique_faq

if __name__ == '__main__':
    faq_list = extract_faq()
    print(f"提取到 {len(faq_list)} 个问答对")
    
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(faq_list, f, ensure_ascii=False, indent=2)
    
    print(f"FAQ数据已保存到 {OUTPUT_FILE}")
    
    category_counts = {}
    for item in faq_list:
        cat = item['category']
        category_counts[cat] = category_counts.get(cat, 0) + 1
    
    print("\n分类统计:")
    for cat, count in sorted(category_counts.items(), key=lambda x: -x[1]):
        print(f"  {cat}: {count} 条")
    
    print("\n前40条问答示例:")
    for i, item in enumerate(faq_list[:40], 1):
        print(f"\n{i}. [{item['category']}]")
        print(f"   Q: {item['question']}")
        print(f"   A: {item['answer'][:150]}..." if len(item['answer']) > 150 else f"   A: {item['answer']}")