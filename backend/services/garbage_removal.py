import re


def looks_like_page_number(text: str) -> bool:
    text = text.lower().strip()
    patterns = [
        r"^\d+$",
        r"^page\s*\d+",
        r"^\(\d+\)$",
    ]
    return any(re.match(p, text) for p in patterns)

def looks_like_separator(text: str) -> bool:
    text = text.strip()

    if not text:
        return True

    chars = set(text)


    chars = {c for c in chars if not c.isspace()}


    if not any(c.isalpha() for c in chars):

        if len(chars) <= 3:
            return True

    return False


def alphabet_ratio(text:str) -> float:
    if not text:
        return 0.0

    char:int = 0
    for i in text:
        if i.isalpha():
            char=char+1
    return char/len(text)

def is_garbage(text:str,threshold_length:int,threshold_ratio:float ) -> bool:
    text=text.strip()
    if not text:
        return True

    if len(text)<threshold_length:
        return True

    if alphabet_ratio(text)<threshold_ratio:
        return True

    if looks_like_page_number(text):
        return True

    if looks_like_separator(text):
        return True

    return False








print(is_garbage('----------'))

