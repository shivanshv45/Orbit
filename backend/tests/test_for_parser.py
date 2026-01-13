import json


from services.manual_parsing import create_modules,get_elements

try:
    with open('tests/fixtures/testing_object.json','r') as f:
        data = json.load(f)
        elements_list=get_elements(data)
        modules=create_modules(elements_list)
        print(modules)






except FileNotFoundError:
    raise FileNotFoundError('Fixtures file not found.')