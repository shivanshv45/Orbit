from google import genai

client = genai.Client(api_key="AIzaSyCqOEqmBmGOMxn9X7RBhFDNmyHxaVPhzvg")

models = client.list_models()

# Print the model names and supported methods
for model in models:
    print(model.name, model.supported_methods)