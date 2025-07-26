#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Data combining script for mental health conversational AI data.
This script combines all processed datasets into training-ready formats.
"""

import os
import json
import pandas as pd
import numpy as np
from pathlib import Path
import logging
import sys

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("data_combining.log"),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Setup paths
BASE_DIR = Path(__file__).resolve().parent.parent
PROCESSED_DIR = BASE_DIR / 'processed'
COMBINED_DIR = BASE_DIR / 'combined'
TRAINING_DIR = BASE_DIR / 'training'

# Create directories if they don't exist
TRAINING_DIR.mkdir(exist_ok=True)

def combine_mental_health_conversations():
    """
    Combine all mental health conversation datasets into a single dataset.
    This will merge datasets that have Q&A/conversation formats.
    """
    logger.info("Combining mental health conversation datasets")
    
    # List of datasets that contain conversational data (question-answer pairs)
    conversation_files = [
        'combined_mental_health_processed.csv',
        'mental_health_processed.csv',
        'student_mental_health_counseling_processed.csv'
    ]
    
    combined_conversations = []
    
    for file in conversation_files:
        file_path = PROCESSED_DIR / file
        if file_path.exists():
            try:
                df = pd.read_csv(file_path)
                
                # Standardize column names
                column_mapping = {
                    'question': 'question',
                    'input': 'question',
                    'query': 'question',
                    'text': 'question',
                    'answer': 'answer',
                    'response': 'answer',
                    'reply': 'answer'
                }
                
                # Rename columns to standard format if they exist
                for old_col, new_col in column_mapping.items():
                    if old_col in df.columns and old_col != new_col:
                        if new_col not in df.columns:
                            df = df.rename(columns={old_col: new_col})
                
                # Make sure we have both question and answer columns
                if 'question' in df.columns and 'answer' in df.columns:
                    # Add source information
                    df['source'] = file
                    
                    # Select only relevant columns
                    keep_cols = ['question', 'answer', 'source']
                    extra_cols = [col for col in df.columns if col not in ['question', 'answer', 'source']]
                    if extra_cols:
                        for col in extra_cols:
                            if col in df.columns and col not in keep_cols:
                                keep_cols.append(col)
                    
                    # Append to combined dataset
                    combined_conversations.append(df[keep_cols])
                    logger.info(f"Added {len(df)} conversations from {file}")
                else:
                    logger.warning(f"File {file} does not have both question and answer columns")
            except Exception as e:
                logger.error(f"Error processing {file}: {e}")
    
    # Combine all dataframes
    if combined_conversations:
        combined_df = pd.concat(combined_conversations, ignore_index=True)
        
        # Remove any rows with empty questions or answers
        combined_df = combined_df.dropna(subset=['question', 'answer'])
        
        # Save combined dataset
        combined_df.to_csv(TRAINING_DIR / 'mental_health_conversations.csv', index=False)
        logger.info(f"Saved combined mental health conversations dataset with {len(combined_df)} entries")
    else:
        logger.warning("No conversation datasets found")

def combine_intent_data():
    """
    Combine all intent-based conversational data (from JSON files).
    """
    logger.info("Combining intent-based conversational data")
    
    # List of intent-based JSON files
    intent_files = [
        'conversional_processed.json',
        'intents_processed.json'
    ]
    
    combined_intents = {"intents": []}
    tag_set = set()  # To track unique tags and avoid duplicates
    
    for file in intent_files:
        file_path = PROCESSED_DIR / file
        if file_path.exists():
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                # Check if the JSON has the expected structure
                if 'intents' in data and isinstance(data['intents'], list):
                    for intent in data['intents']:
                        # Add source information to track where the intent came from
                        intent['source'] = file
                        
                        # Check if this tag already exists
                        if intent.get('tag') not in tag_set:
                            tag_set.add(intent.get('tag'))
                            combined_intents['intents'].append(intent)
                        else:
                            # For duplicate tags, merge patterns and responses
                            for existing_intent in combined_intents['intents']:
                                if existing_intent.get('tag') == intent.get('tag'):
                                    # Merge patterns
                                    existing_patterns = set(existing_intent.get('patterns', []))
                                    new_patterns = set(intent.get('patterns', []))
                                    all_patterns = list(existing_patterns.union(new_patterns))
                                    existing_intent['patterns'] = all_patterns
                                    
                                    # Merge responses
                                    existing_responses = set(existing_intent.get('responses', []))
                                    new_responses = set(intent.get('responses', []))
                                    all_responses = list(existing_responses.union(new_responses))
                                    existing_intent['responses'] = all_responses
                                    
                                    break
                    
                    logger.info(f"Added intents from {file}")
                else:
                    logger.warning(f"File {file} does not have the expected 'intents' structure")
            except Exception as e:
                logger.error(f"Error processing {file}: {e}")
    
    # Save combined intents
    if combined_intents['intents']:
        with open(TRAINING_DIR / 'combined_intents.json', 'w', encoding='utf-8') as f:
            json.dump(combined_intents, f, indent=2)
        logger.info(f"Saved combined intents dataset with {len(combined_intents['intents'])} intents")
    else:
        logger.warning("No intent datasets found")

def combine_sentiment_data():
    """
    Combine all sentiment analysis datasets.
    """
    logger.info("Combining sentiment analysis datasets")
    
    # List of sentiment analysis files
    sentiment_files = [
        'emotions_processed.csv',
        'sentiment_analysis_processed.csv',
        'sentiment_mental_health_processed.csv'
    ]
    
    combined_sentiment = []
    
    for file in sentiment_files:
        file_path = PROCESSED_DIR / file
        if file_path.exists():
            try:
                df = pd.read_csv(file_path)
                
                # Standardize column names
                column_mapping = {
                    'text': 'text',
                    'content': 'text',
                    'message': 'text',
                    'sentence': 'text',
                    'sentiment': 'sentiment',
                    'emotion': 'emotion',
                    'label': 'label'
                }
                
                # Rename columns to standard format if they exist
                for old_col, new_col in column_mapping.items():
                    if old_col in df.columns and old_col != new_col:
                        if new_col not in df.columns:
                            df = df.rename(columns={old_col: new_col})
                
                # Make sure we have text and at least one sentiment/emotion column
                has_text = 'text' in df.columns
                has_sentiment = any(col in df.columns for col in ['sentiment', 'emotion', 'label'])
                
                if has_text and has_sentiment:
                    # Add source information
                    df['source'] = file
                    
                    # Select relevant columns
                    keep_cols = ['text', 'source']
                    if 'sentiment' in df.columns:
                        keep_cols.append('sentiment')
                    if 'emotion' in df.columns:
                        keep_cols.append('emotion')
                    if 'label' in df.columns:
                        keep_cols.append('label')
                    
                    # Append to combined dataset
                    combined_sentiment.append(df[keep_cols])
                    logger.info(f"Added {len(df)} entries from {file}")
                else:
                    logger.warning(f"File {file} does not have required columns")
            except Exception as e:
                logger.error(f"Error processing {file}: {e}")
    
    # Combine all dataframes
    if combined_sentiment:
        combined_df = pd.concat(combined_sentiment, ignore_index=True)
        
        # Remove any rows with empty text
        combined_df = combined_df.dropna(subset=['text'])
        
        # Save combined dataset
        combined_df.to_csv(TRAINING_DIR / 'sentiment_analysis.csv', index=False)
        logger.info(f"Saved combined sentiment dataset with {len(combined_df)} entries")
    else:
        logger.warning("No sentiment datasets found")

def combine_dialogues():
    """
    Process dialogue data for training.
    """
    logger.info("Processing dialogue data")
    
    # Check for dialogues_combined.csv
    dialogue_file = PROCESSED_DIR / 'dialogues_combined.csv'
    
    if dialogue_file.exists():
        try:
            df = pd.read_csv(dialogue_file)
            
            # Make sure we have the expected columns
            required_cols = ['text', 'emotion', 'act', 'topic']
            if all(col in df.columns for col in required_cols):
                # Create a clean version for training
                df_clean = df.copy()
                
                # Save for training
                df_clean.to_csv(TRAINING_DIR / 'dialogues_training.csv', index=False)
                logger.info(f"Saved dialogue training dataset with {len(df_clean)} entries")
            else:
                logger.warning(f"Dialogue file {dialogue_file} does not have all required columns")
        except Exception as e:
            logger.error(f"Error processing dialogue file: {e}")
    else:
        logger.warning("No dialogue combined file found")

def create_mental_health_dataset():
    """
    Create a comprehensive mental health dataset by combining all relevant data.
    """
    logger.info("Creating comprehensive mental health dataset")
    
    # List of mental health data files
    mental_health_files = [
        'Indicators_of_Anxiety_or_Depression_processed.csv',
        'mental_health_processed.csv',
        'Suicide_Detection_processed.csv'
    ]
    
    combined_mental_health = []
    
    for file in mental_health_files:
        file_path = PROCESSED_DIR / file
        if file_path.exists():
            try:
                df = pd.read_csv(file_path)
                
                # Add source information
                df['source'] = file
                
                # Append to combined dataset
                combined_mental_health.append(df)
                logger.info(f"Added data from {file}")
            except Exception as e:
                logger.error(f"Error processing {file}: {e}")
    
    # Combine all dataframes
    if combined_mental_health:
        combined_df = pd.concat(combined_mental_health, ignore_index=True)
        
        # Save combined dataset
        combined_df.to_csv(TRAINING_DIR / 'mental_health_comprehensive.csv', index=False)
        logger.info(f"Saved comprehensive mental health dataset with {len(combined_df)} entries")
    else:
        logger.warning("No mental health datasets found")

def create_conversation_training_format():
    """
    Create a simplified conversation format suitable for training chatbot models.
    """
    logger.info("Creating conversation training format")
    
    # Load the mental health conversations
    conversation_file = TRAINING_DIR / 'mental_health_conversations.csv'
    intent_file = TRAINING_DIR / 'combined_intents.json'
    
    training_conversations = []
    
    # Process conversation CSV
    if conversation_file.exists():
        try:
            df = pd.read_csv(conversation_file)
            
            # Convert to simple format (input/output pairs)
            for _, row in df.iterrows():
                if pd.notnull(row['question']) and pd.notnull(row['answer']):
                    training_conversations.append({
                        'input': row['question'],
                        'output': row['answer']
                    })
            
            logger.info(f"Added {len(df)} conversations from CSV")
        except Exception as e:
            logger.error(f"Error processing conversation file: {e}")
    
    # Process intents JSON
    if intent_file.exists():
        try:
            with open(intent_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Convert intents to input/output pairs
            for intent in data.get('intents', []):
                patterns = intent.get('patterns', [])
                responses = intent.get('responses', [])
                
                # Create all possible combinations of patterns and responses
                for pattern in patterns:
                    if pattern:  # Skip empty patterns
                        # For each pattern, use the first response (to avoid too many duplicates)
                        if responses:
                            training_conversations.append({
                                'input': pattern,
                                'output': responses[0]
                            })
            
            logger.info(f"Added conversations from intents")
        except Exception as e:
            logger.error(f"Error processing intent file: {e}")
    
    # Save in different formats for training
    if training_conversations:
        # Save as JSON for language model fine-tuning
        with open(TRAINING_DIR / 'conversations_training.json', 'w', encoding='utf-8') as f:
            json.dump(training_conversations, f, indent=2)
        
        # Save as CSV for easier viewing and other models
        df = pd.DataFrame(training_conversations)
        df.to_csv(TRAINING_DIR / 'conversations_training.csv', index=False)
        
        logger.info(f"Saved {len(training_conversations)} conversation pairs for training")
    else:
        logger.warning("No conversation data available for training format")

def main():
    """Run all data combination functions."""
    logger.info("Starting data combination process")
    
    # Combine different types of data
    combine_mental_health_conversations()
    combine_intent_data()
    combine_sentiment_data()
    combine_dialogues()
    create_mental_health_dataset()
    
    # Create training-ready format
    create_conversation_training_format()
    
    logger.info("Data combination completed. Training datasets created in 'training' directory")

if __name__ == "__main__":
    main()