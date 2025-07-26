#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script to merge all training data into a single CSV with one text column for Hugging Face auto-train.
"""

import pandas as pd
import json
from pathlib import Path
import logging
import sys

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("merge_training_data.log"),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Setup paths
BASE_DIR = Path(__file__).resolve().parent.parent
TRAINING_DIR = BASE_DIR / 'training'
OUTPUT_FILE = TRAINING_DIR / 'merged_training_data.csv'

def merge_training_data():
    """
    Merge all training data into a single CSV with one text column.
    """
    logger.info("Starting to merge all training data")
    
    all_texts = []
    
    # 1. Process conversations_training.csv
    conv_csv = TRAINING_DIR / 'conversations_training.csv'
    if conv_csv.exists():
        try:
            df = pd.read_csv(conv_csv)
            logger.info(f"Processing {conv_csv.name} with {len(df)} rows")
            
            # Extract input and output as separate texts
            if 'input' in df.columns:
                texts = df['input'].dropna().astype(str).tolist()
                all_texts.extend([f"User: {text}" for text in texts])
                
            if 'output' in df.columns:
                texts = df['output'].dropna().astype(str).tolist()
                all_texts.extend([f"Assistant: {text}" for text in texts])
                
            logger.info(f"Added {len(df)} conversation pairs from {conv_csv.name}")
            
        except Exception as e:
            logger.error(f"Error processing {conv_csv.name}: {e}")
    
    # 2. Process conversations_training.json
    conv_json = TRAINING_DIR / 'conversations_training.json'
    if conv_json.exists():
        try:
            with open(conv_json, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            logger.info(f"Processing {conv_json.name} with {len(data)} entries")
            
            for item in data:
                if isinstance(item, dict):
                    if 'input' in item and item['input']:
                        all_texts.append(f"User: {str(item['input'])}")
                    if 'output' in item and item['output']:
                        all_texts.append(f"Assistant: {str(item['output'])}")
                        
            logger.info(f"Added conversation data from {conv_json.name}")
            
        except Exception as e:
            logger.error(f"Error processing {conv_json.name}: {e}")
    
    # 3. Process combined_intents.json
    intents_json = TRAINING_DIR / 'combined_intents.json'
    if intents_json.exists():
        try:
            with open(intents_json, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            logger.info(f"Processing {intents_json.name}")
            
            if 'intents' in data:
                for intent in data['intents']:
                    # Add patterns as user inputs
                    if 'patterns' in intent:
                        for pattern in intent['patterns']:
                            all_texts.append(f"User: {str(pattern)}")
                    
                    # Add responses as assistant outputs
                    if 'responses' in intent:
                        for response in intent['responses']:
                            all_texts.append(f"Assistant: {str(response)}")
                            
            logger.info(f"Added intent data from {intents_json.name}")
            
        except Exception as e:
            logger.error(f"Error processing {intents_json.name}: {e}")
    
    # 4. Process dialogues_training.csv
    dialogues_csv = TRAINING_DIR / 'dialogues_training.csv'
    if dialogues_csv.exists():
        try:
            df = pd.read_csv(dialogues_csv)
            logger.info(f"Processing {dialogues_csv.name} with {len(df)} rows")
            
            # Extract text column
            if 'text' in df.columns:
                texts = df['text'].dropna().astype(str).tolist()
                all_texts.extend(texts)
                
            logger.info(f"Added {len(df)} dialogue texts from {dialogues_csv.name}")
            
        except Exception as e:
            logger.error(f"Error processing {dialogues_csv.name}: {e}")
    
    # 5. Process mental_health_comprehensive.csv
    comprehensive_csv = TRAINING_DIR / 'mental_health_comprehensive.csv'
    if comprehensive_csv.exists():
        try:
            df = pd.read_csv(comprehensive_csv)
            logger.info(f"Processing {comprehensive_csv.name} with {len(df)} rows")
            
            # Try to extract question-answer pairs
            if 'question' in df.columns and 'answer' in df.columns:
                questions = df['question'].dropna().astype(str).tolist()
                answers = df['answer'].dropna().astype(str).tolist()
                
                all_texts.extend([f"User: {q}" for q in questions])
                all_texts.extend([f"Assistant: {a}" for a in answers])
                
            # Or extract any text column
            elif 'text' in df.columns:
                texts = df['text'].dropna().astype(str).tolist()
                all_texts.extend(texts)
                
            logger.info(f"Added comprehensive data from {comprehensive_csv.name}")
            
        except Exception as e:
            logger.error(f"Error processing {comprehensive_csv.name}: {e}")
    
    # 6. Process mental_health_conversations.csv
    mh_conv_csv = TRAINING_DIR / 'mental_health_conversations.csv'
    if mh_conv_csv.exists():
        try:
            df = pd.read_csv(mh_conv_csv)
            logger.info(f"Processing {mh_conv_csv.name} with {len(df)} rows")
            
            if 'question' in df.columns and 'answer' in df.columns:
                questions = df['question'].dropna().astype(str).tolist()
                answers = df['answer'].dropna().astype(str).tolist()
                
                all_texts.extend([f"User: {q}" for q in questions])
                all_texts.extend([f"Assistant: {a}" for a in answers])
                
            logger.info(f"Added mental health conversations from {mh_conv_csv.name}")
            
        except Exception as e:
            logger.error(f"Error processing {mh_conv_csv.name}: {e}")
    
    # 7. Process reddit_mental_health_combined.csv
    reddit_csv = TRAINING_DIR / 'reddit_mental_health_combined.csv'
    if reddit_csv.exists():
        try:
            df = pd.read_csv(reddit_csv)
            logger.info(f"Processing {reddit_csv.name} with {len(df)} rows")
            
            # Extract text content
            text_columns = ['text', 'title', 'selftext', 'body', 'comment']
            for col in text_columns:
                if col in df.columns:
                    texts = df[col].dropna().astype(str).tolist()
                    all_texts.extend([f"Reddit: {text}" for text in texts if text.strip()])
                    
            logger.info(f"Added Reddit data from {reddit_csv.name}")
            
        except Exception as e:
            logger.error(f"Error processing {reddit_csv.name}: {e}")
    
    # 8. Process sentiment_analysis.csv
    sentiment_csv = TRAINING_DIR / 'sentiment_analysis.csv'
    if sentiment_csv.exists():
        try:
            df = pd.read_csv(sentiment_csv)
            logger.info(f"Processing {sentiment_csv.name} with {len(df)} rows")
            
            if 'text' in df.columns:
                texts = df['text'].dropna().astype(str).tolist()
                all_texts.extend(texts)
                
            logger.info(f"Added sentiment data from {sentiment_csv.name}")
            
        except Exception as e:
            logger.error(f"Error processing {sentiment_csv.name}: {e}")
    
    # Clean and deduplicate texts
    logger.info("Cleaning and deduplicating texts")
    
    # Remove empty texts and clean
    cleaned_texts = []
    for text in all_texts:
        if text and isinstance(text, str):
            cleaned_text = text.strip()
            if len(cleaned_text) > 10:  # Minimum length filter
                cleaned_texts.append(cleaned_text)
    
    # Remove duplicates while preserving order
    unique_texts = list(dict.fromkeys(cleaned_texts))
    
    logger.info(f"Total texts before cleaning: {len(all_texts)}")
    logger.info(f"Total texts after cleaning: {len(cleaned_texts)}")
    logger.info(f"Total unique texts: {len(unique_texts)}")
    
    # Create DataFrame and save
    if unique_texts:
        df_merged = pd.DataFrame({'text': unique_texts})
        df_merged.to_csv(OUTPUT_FILE, index=False, encoding='utf-8')
        
        logger.info(f"✓ Merged training data saved to {OUTPUT_FILE}")
        logger.info(f"  Total rows: {len(df_merged)}")
        logger.info(f"  Sample texts:")
        for i, text in enumerate(unique_texts[:5]):
            logger.info(f"    {i+1}. {text[:100]}...")
            
        return df_merged
    else:
        logger.error("No valid texts found to merge")
        return None

def create_huggingface_format():
    """
    Create additional formats optimized for Hugging Face training.
    """
    logger.info("Creating Hugging Face optimized formats")
    
    # Load merged data
    if OUTPUT_FILE.exists():
        df = pd.read_csv(OUTPUT_FILE)
        
        # Create conversation format (for chat models)
        conversation_data = []
        current_user = None
        
        for text in df['text']:
            if text.startswith('User: '):
                current_user = text[6:]  # Remove 'User: ' prefix
            elif text.startswith('Assistant: ') and current_user:
                assistant_response = text[10:]  # Remove 'Assistant: ' prefix
                conversation_data.append({
                    'input': current_user,
                    'output': assistant_response
                })
                current_user = None
        
        if conversation_data:
            df_conv = pd.DataFrame(conversation_data)
            conv_output = TRAINING_DIR / 'huggingface_conversations.csv'
            df_conv.to_csv(conv_output, index=False, encoding='utf-8')
            logger.info(f"✓ Conversation format saved to {conv_output} ({len(df_conv)} pairs)")
        
        # Create instruction format
        instruction_data = []
        for _, row in df.iterrows():
            text = row['text']
            if not text.startswith(('User: ', 'Assistant: ', 'Reddit: ')):
                instruction_data.append({
                    'instruction': 'Provide mental health support and guidance.',
                    'input': '',
                    'output': text
                })
        
        if instruction_data:
            df_inst = pd.DataFrame(instruction_data)
            inst_output = TRAINING_DIR / 'huggingface_instructions.csv'
            df_inst.to_csv(inst_output, index=False, encoding='utf-8')
            logger.info(f"✓ Instruction format saved to {inst_output} ({len(df_inst)} entries)")

def main():
    """Run the merging process."""
    logger.info("Starting training data merge process")
    
    # Check if training directory exists
    if not TRAINING_DIR.exists():
        logger.error(f"Training directory not found: {TRAINING_DIR}")
        return
    
    # List available files
    training_files = list(TRAINING_DIR.glob('*'))
    logger.info(f"Found {len(training_files)} files in training directory:")
    for file in training_files:
        logger.info(f"  - {file.name}")
    
    # Merge all training data
    result = merge_training_data()
    
    if result is not None:
        # Create additional formats
        create_huggingface_format()
        logger.info("✓ Training data merge completed successfully")
    else:
        logger.error("✗ Training data merge failed")

if __name__ == "__main__":
    main()