import ftfy
import spacy
try:
    nlp = spacy.load('en_core_web_md')
except OSError:
    raise RuntimeError("spacy model en core web md is not installed maybe")
from garbage_removal import is_garbage
def  create_modules(intake:list):
    modules:list[list]=[]
    current_module:list[dict]=[]
    previous_title:str=""

    content:str=""
    for element in intake:

        type_of_element:str=element["type"]
        clean_text:str=ftfy.fix_text(element["text"])
        if is_garbage(clean_text,10,0.5) and type_of_element!="Formula":
            continue

        if type_of_element=="Title":
            if previous_title!="":
                new_element:dict={"title":previous_title,"content":content}
                current_module.append(new_element)

                # here we check for the semantic similarity between two topcis for module separation
                if cosine_similarity(previous_title, clean_text) < 0.5:
                    modules.append(current_module)
                    current_module=[]
                    previous_title=""
                else:
                    previous_title=clean_text



            content=""
        elif type_of_element=="NarrativeText"  :


            content=content+"  " +clean_text
        elif type_of_element=="UncategorizedText":
            content=content+"  "+clean_text

        elif type_of_element=="Formula":
            content=content+"  possibly a formula:{"+clean_text+"} "

        elif type_of_element=="Table":
            content=content+"  "+clean_text+" "
        else:
            if not is_garbage(clean_text, 20, 0.6):
                content=content+"  "+clean_text
    new_element:dict={"title":previous_title,"content":content}
    current_module.append(new_element)
    modules.append(current_module)






    return modules







def get_elements(intake:dict):
    outputs=intake.get('outputs',{})
    elements:list[dict] = []
    for output_elements in outputs.values():
        elements.extend(output_elements)

    return elements



def cosine_similarity(text1:str, text2:str):
    t1=nlp(text1)
    t2=nlp(text2)
    return t1.similarity(t2)