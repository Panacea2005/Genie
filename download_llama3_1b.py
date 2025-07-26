from transformers import AutoModelForCausalLM, AutoTokenizer

BASE_MODEL = "meta-llama/Llama-3.2-1B-Instruct"
TARGET_DIR = "./backend/ai_models/model/llama1b-qlora-mh"

print(f"Downloading {BASE_MODEL} to {TARGET_DIR} ...")

# Download model weights
AutoModelForCausalLM.from_pretrained(BASE_MODEL, cache_dir=TARGET_DIR)
# Download tokenizer
AutoTokenizer.from_pretrained(BASE_MODEL, cache_dir=TARGET_DIR)

print("Download complete! You can now run your local model with your adapter.") 