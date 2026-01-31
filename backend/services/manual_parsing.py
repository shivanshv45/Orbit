import ftfy
import spacy
import re
from services.garbage_removal import is_garbage

try:
    nlp = spacy.load('en_core_web_md')
except OSError:
    raise RuntimeError("spacy model en core web md is not installed maybe")

MAX_SUBTOPICS_PER_MODULE = 6
MIN_SUBTOPICS_PER_MODULE = 2
SIMILARITY_THRESHOLD = 0.50

TITLE_PATTERNS = [
    re.compile(r'^\d+\.\s+[A-Z]'),
    re.compile(r'^(?:Chapter|Section|Part|Module|Unit|Topic)\s+\d+', re.IGNORECASE),
    re.compile(r'^[IVXLCDM]+\.\s+[A-Z]'),
    re.compile(r'^[A-Z]\.\s+[A-Z]'),
    re.compile(r'^\(\d+\)\s+[A-Z]'),
    re.compile(r'^[\u2022\u2023\u25E6\u2043\u2219]\s*\d+\.\s+[A-Z]'),
]

MAX_TITLE_LENGTH = 100
MIN_TITLE_LENGTH = 5


def is_likely_title(text: str, element_type: str) -> bool:
    if element_type == "Title":
        return True
    
    text = text.strip()
    
    if len(text) > MAX_TITLE_LENGTH or len(text) < MIN_TITLE_LENGTH:
        return False
    
    if text.endswith('.') and not re.match(r'^\d+\.', text):
        return False
    
    for pattern in TITLE_PATTERNS:
        if pattern.match(text):
            return True
    
    return False


def extract_title_text(text: str) -> str:
    text = text.strip()
    text = re.sub(r'^[\u2022\u2023\u25E6\u2043\u2219]\s*', '', text)
    return text


def cosine_similarity(text1: str, text2: str) -> float:
    if not text1 or not text2:
        return 0.0
    t1 = nlp(text1)
    t2 = nlp(text2)
    return t1.similarity(t2)


def find_best_split_point(subtopics: list[dict], start_idx: int = 0) -> int:
    if len(subtopics) <= MIN_SUBTOPICS_PER_MODULE:
        return len(subtopics)
    
    min_similarity = 1.0
    split_idx = MAX_SUBTOPICS_PER_MODULE
    
    end_range = min(len(subtopics), MAX_SUBTOPICS_PER_MODULE + 1)
    
    for i in range(MIN_SUBTOPICS_PER_MODULE, end_range):
        if i < len(subtopics):
            sim = cosine_similarity(subtopics[i - 1]["title"], subtopics[i]["title"])
            if sim < min_similarity:
                min_similarity = sim
                split_idx = i
    
    return split_idx


def balance_modules(modules: list[list[dict]]) -> list[list[dict]]:
    balanced = []
    
    for module in modules:
        if len(module) <= MAX_SUBTOPICS_PER_MODULE:
            if len(module) > 0:
                balanced.append(module)
        else:
            remaining = module[:]
            while len(remaining) > 0:
                if len(remaining) <= MAX_SUBTOPICS_PER_MODULE:
                    balanced.append(remaining)
                    break
                
                split_point = find_best_split_point(remaining)
                balanced.append(remaining[:split_point])
                remaining = remaining[split_point:]
    
    return balanced


def merge_small_modules(modules: list[list[dict]]) -> list[list[dict]]:
    if len(modules) <= 1:
        return modules
    
    merged = []
    i = 0
    
    while i < len(modules):
        current = modules[i][:]
        
        while i + 1 < len(modules) and len(current) < MIN_SUBTOPICS_PER_MODULE:
            next_module = modules[i + 1]
            if len(current) + len(next_module) <= MAX_SUBTOPICS_PER_MODULE:
                current.extend(next_module)
                i += 1
            else:
                break
        
        merged.append(current)
        i += 1
    
    return merged


def create_modules(intake: list):
    raw_modules: list[list[dict]] = []
    current_module: list[dict] = []
    previous_title: str | None = None
    content: str = ""
    
    for element in intake:
        type_of_element: str = element["type"]
        clean_text: str = ftfy.fix_text(element["text"])
        
        if not clean_text:
            continue
        if is_garbage(clean_text, 10, 0.5) and type_of_element != "Formula":
            continue

        if is_likely_title(clean_text, type_of_element):
            if previous_title is not None and content.strip():
                new_element: dict = {"title": previous_title, "content": content.strip()}
                current_module.append(new_element)

                similarity = cosine_similarity(previous_title, clean_text)
                should_split = similarity < SIMILARITY_THRESHOLD
                module_too_large = len(current_module) >= MAX_SUBTOPICS_PER_MODULE
                
                if should_split or module_too_large:
                    if current_module:
                        raw_modules.append(current_module)
                    current_module = []
            
            previous_title = extract_title_text(clean_text)
            content = ""
            continue

        elif type_of_element == "NarrativeText":
            content = content + "  " + clean_text
        elif type_of_element == "UncategorizedText":
            content = content + "  " + clean_text
        elif type_of_element == "Formula":
            content = content + "  possibly a formula:{" + clean_text + "} "
        elif type_of_element == "Table":
            content = content + "  " + clean_text + " "
        else:
            if not is_garbage(clean_text, 20, 0.6):
                content = content + "  " + clean_text

    if previous_title is not None and content.strip():
        new_element: dict = {"title": previous_title, "content": content.strip()}
        current_module.append(new_element)

    if current_module:
        raw_modules.append(current_module)

    balanced_modules = balance_modules(raw_modules)
    final_modules = merge_small_modules(balanced_modules)
    
    return final_modules


def get_elements(intake: dict):
    outputs = intake.get('outputs', {})
    elements: list[dict] = []
    for output_elements in outputs.values():
        elements.extend(output_elements)
    return elements
