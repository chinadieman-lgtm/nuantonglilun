import openpyxl
import json
import os
import re
import random
from collections import namedtuple

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
XLSX_PATH = os.path.join(BASE_DIR, '题库.xlsx')
OUTPUT_PATH = os.path.join(BASE_DIR, 'data.js')


def convert():
    if not os.path.exists(XLSX_PATH):
        print(f'[ERR] 未找到文件: {XLSX_PATH}')
        return

    wb = openpyxl.load_workbook(XLSX_PATH)
    ws = wb['Sheet2']

    rows = []
    for row in ws.iter_rows(values_only=True):
        rows.append([str(v).strip() if v is not None else '' for v in row])

    Section = namedtuple('Section', ['name', 'start', 'end'])
    sections = []
    current_name = ''
    current_start = 0
    for i, (a, b, c) in enumerate(rows):
        if b in ('一、单选题', '二、多选题', '三、判断题(正确)', '四、判断题(错误)'):
            if current_name:
                sections.append(Section(current_name, current_start, i))
            current_name = b
            current_start = i + 1
    if current_name:
        sections.append(Section(current_name, current_start, len(rows)))

    questions = []
    judge_questions = []

    for sec_name, start, end in sections:
        if '单选题' in sec_name:
            qtype = '单选题'
        elif '多选题' in sec_name:
            qtype = '多选题'
        elif '判断题' in sec_name:
            qtype = '判断题'
        else:
            continue

        r = start
        while r < end:
            a, b, c = rows[r]
            if not b or b in ('高级', '答案'):
                r += 1
                continue
            if not re.match(r'\d+[、.．]\s*', b):
                r += 1
                continue

            answer = c if c else ''
            if qtype == '多选题' and not answer:
                m = re.search(r'\(([A-Za-z]+)\)', b)
                if m:
                    answer = m.group(1).upper()

            answer = answer.upper().strip()
            if answer == 'T':
                answer = 'A'
            elif answer == 'F':
                answer = 'B'

            qtext_clean = re.sub(r'^\d+[、.．]\s*', '', b).strip()
            q = {
                'type': qtype,
                'question': qtext_clean,
                'options': {},
                'answer': answer,
                'explanation': '',
            }

            if qtype == '判断题':
                q['options'] = {'A': '正确', 'B': '错误'}
                r += 1
                judge_questions.append(q)
            else:
                r += 1
                if r < end:
                    opt_row = rows[r][1]
                    opt_parts = re.findall(
                        r'\(([A-Za-z])\)\s*([^(]+?)(?=\s*\([A-Za-z]\)|$)',
                        opt_row,
                    )
                    for letter, text in opt_parts:
                        q['options'][letter.upper()] = text.strip()
                r += 1
                questions.append(q)

    # Shuffle 判断题 so correct/wrong are mixed
    random.shuffle(judge_questions)
    questions.extend(judge_questions)

    # Reassign sequential IDs
    for i, q in enumerate(questions):
        q['id'] = i + 1

    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        f.write('window.questions = ')
        json.dump(questions, f, ensure_ascii=False, indent=2)
        f.write(';\n')

    single = sum(1 for q in questions if q['type'] == '单选题')
    multi = sum(1 for q in questions if q['type'] == '多选题')
    judge = sum(1 for q in questions if q['type'] == '判断题')
    print(f'[OK] 已生成，共 {len(questions)} 道题 ({single} 单选, {multi} 多选, {judge} 判断)')


if __name__ == '__main__':
    try:
        import sys
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        pass
    convert()
