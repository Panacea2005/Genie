#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Data preprocessing script for mental health conversational AI data.
This script processes various raw datasets and prepares them for training.
"""

import os
import re
import json
import pandas as pd
import numpy as np
from pathlib import Path
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
import contractions
import logging
import sys

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("data_processing.log"),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Setup paths
BASE_DIR = Path(__file__).resolve().parent.parent
RAW_DIR = BASE_DIR / 'raw'
PROCESSED_DIR = BASE_DIR / 'processed'
COMBINED_DIR = BASE_DIR / 'combined'

# Create directories if they don't exist
PROCESSED_DIR.mkdir(exist_ok=True)
COMBINED_DIR.mkdir(exist_ok=True)

# Download necessary NLTK resources
try:
    nltk.download('punkt', quiet=True)
    nltk.download('stopwords', quiet=True)
    nltk.download('wordnet', quiet=True)
except Exception as e:
    logger.warning(f"Failed to download NLTK resources: {e}")

# Initialize lemmatizer
lemmatizer = WordNetLemmatizer()
stop_words = set(stopwords.words('english'))

def clean_text(text):
    """
    Clean and normalize text data.
    
    Args:
        text (str): Input text
        
    Returns:
        str: Cleaned text
    """
    if not isinstance(text, str):
        return ""
    
    # Convert to lowercase
    text = text.lower()
    
    # Expand contractions
    text = contractions.fix(text)
    
    # Remove URLs
    text = re.sub(r'http\S+|www\S+|https\S+', '', text)
    
    # Remove special characters and numbers
    text = re.sub(r'[^\w\s]', '', text)
    text = re.sub(r'\d+', '', text)
    
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    
    return text

def lemmatize_text(text):
    """
    Tokenize, remove stopwords, and lemmatize text.
    
    Args:
        text (str): Input text
        
    Returns:
        str: Processed text
    """
    word_tokens = word_tokenize(text)
    filtered_words = [lemmatizer.lemmatize(w) for w in word_tokens if w not in stop_words]
    return ' '.join(filtered_words)

def process_conversational_json(filepath, output_filepath):
    """
    Process conversational JSON data (intents format).
    
    Args:
        filepath (str): Path to raw JSON file
        output_filepath (str): Path to save processed JSON
    """
    logger.info(f"Processing {filepath}")
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Process each intent
        for intent in data.get('intents', []):
            # Clean patterns
            intent['patterns'] = [clean_text(pattern) for pattern in intent.get('patterns', [])]
            
            # Clean responses
            intent['responses'] = [response for response in intent.get('responses', [])]
        
        # Save processed data
        with open(output_filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
        
        logger.info(f"Saved processed conversational data to {output_filepath}")
        
    except Exception as e:
        logger.error(f"Error processing {filepath}: {e}")

def process_web_articles_json(filepath, output_filepath):
    """
    Process web articles JSON data.
    
    Args:
        filepath (str): Path to raw JSON file
        output_filepath (str): Path to save processed JSON
    """
    logger.info(f"Processing web articles {filepath}")
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Process articles depending on structure
        if isinstance(data, list):
            for article in data:
                if isinstance(article, dict):
                    # Clean text fields
                    for key, value in article.items():
                        if isinstance(value, str) and len(value) > 50:  # Likely a text field
                            article[key] = clean_text(value)
        elif isinstance(data, dict):
            for key, article in data.items():
                if isinstance(article, dict):
                    # Clean text fields
                    for field, value in article.items():
                        if isinstance(value, str) and len(value) > 50:  # Likely a text field
                            article[field] = clean_text(value)
        
        # Save processed data
        with open(output_filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
        
        logger.info(f"Saved processed web articles to {output_filepath}")
        
    except Exception as e:
        logger.error(f"Error processing web articles {filepath}: {e}")

def process_csv_data(filepath, output_filepath, text_columns=None):
    """
    Process CSV data files.
    
    Args:
        filepath (str): Path to raw CSV file
        output_filepath (str): Path to save processed CSV
        text_columns (list): List of column names containing text to be cleaned
    """
    logger.info(f"Processing {filepath}")
    
    try:
        # Try different encodings
        try:
            df = pd.read_csv(filepath)
        except UnicodeDecodeError:
            try:
                df = pd.read_csv(filepath, encoding='latin1')
            except:
                df = pd.read_csv(filepath, encoding='cp1252')
        
        # Auto-detect text columns if not specified
        if not text_columns:
            text_columns = []
            for col in df.columns:
                if df[col].dtype == 'object':
                    # Sample values to check if it's likely text
                    sample = df[col].dropna().astype(str).sample(min(5, len(df))).tolist()
                    avg_len = sum(len(s) for s in sample) / len(sample) if sample else 0
                    
                    # If average length > 20 characters, it's likely text
                    if avg_len > 20:
                        text_columns.append(col)
        
        # If text columns specified, clean those columns
        for col in text_columns:
            if col in df.columns:
                logger.info(f"Cleaning text column: {col}")
                df[col] = df[col].astype(str).apply(clean_text)
        
        # Handle missing values - fill numeric with 0, categorical with mode, text with empty string
        for col in df.columns:
            if df[col].dtype in ['int64', 'float64']:
                df[col] = df[col].fillna(0)
            elif col in text_columns:
                df[col] = df[col].fillna('')
            else:
                # For categorical, fill with most common value
                if df[col].nunique() < 20:  # Only if it seems categorical
                    df[col] = df[col].fillna(df[col].mode()[0] if not df[col].mode().empty else '')
                else:
                    df[col] = df[col].fillna('')
        
        # Save processed data
        df.to_csv(output_filepath, index=False)
        
        logger.info(f"Saved processed CSV data to {output_filepath}")
        
    except Exception as e:
        logger.error(f"Error processing {filepath}: {e}")

def process_dialogue_files(text_file, emotion_file, act_file, topic_file, output_file):
    """
    Process and combine dialogue files.
    
    Args:
        text_file (str): Path to dialogue text file
        emotion_file (str): Path to dialogue emotion file
        act_file (str): Path to dialogue act file
        topic_file (str): Path to dialogue topic file
        output_file (str): Path to save combined dialogue data
    """
    logger.info(f"Processing dialogue files")
    
    try:
        # Read dialogue files
        with open(text_file, 'r', encoding='utf-8') as f:
            dialogue_texts = f.readlines()
        
        with open(emotion_file, 'r', encoding='utf-8') as f:
            dialogue_emotions = f.readlines()
        
        with open(act_file, 'r', encoding='utf-8') as f:
            dialogue_acts = f.readlines()
        
        with open(topic_file, 'r', encoding='utf-8') as f:
            dialogue_topics = f.readlines()
        
        # Create DataFrame
        dialogue_data = []
        
        for i in range(min(len(dialogue_texts), len(dialogue_emotions), 
                         len(dialogue_acts), len(dialogue_topics))):
            text = clean_text(dialogue_texts[i].strip())
            emotion = dialogue_emotions[i].strip()
            act = dialogue_acts[i].strip()
            topic = dialogue_topics[i].strip()
            
            dialogue_data.append({
                'text': text,
                'emotion': emotion,
                'act': act,
                'topic': topic
            })
        
        df = pd.DataFrame(dialogue_data)
        
        # Save processed data
        df.to_csv(output_file, index=False)
        
        logger.info(f"Saved combined dialogue data to {output_file}")
        
    except Exception as e:
        logger.error(f"Error processing dialogue files: {e}")

def combine_mental_health_data(filepaths, output_filepath):
    """
    Combine multiple mental health datasets.
    
    Args:
        filepaths (list): List of file paths to combine
        output_filepath (str): Path to save combined data
    """
    logger.info("Combining mental health datasets")
    
    try:
        combined_data = []
        
        for filepath in filepaths:
            if filepath.endswith('.csv'):
                try:
                    df = pd.read_csv(filepath)
                    
                    # Standardize column names for better merging
                    columns_mapping = {
                        'text': 'text',
                        'message': 'text',
                        'content': 'text',
                        'post': 'text',
                        'tweet': 'text',
                        'comment': 'text',
                        'label': 'label',
                        'emotion': 'emotion',
                        'sentiment': 'sentiment',
                        'class': 'class',
                        'category': 'category'
                    }
                    
                    # Rename columns if they exist
                    for old_col, new_col in columns_mapping.items():
                        if old_col in df.columns and old_col != new_col:
                            # Only rename if the new column name doesn't already exist
                            if new_col not in df.columns:
                                df = df.rename(columns={old_col: new_col})
                    
                    # Add source column
                    df['source'] = os.path.basename(filepath)
                    
                    combined_data.append(df)
                except Exception as e:
                    logger.error(f"Error reading {filepath}: {e}")
        
        # Combine all dataframes
        if combined_data:
            # First, identify common columns across all dataframes
            common_columns = set.intersection(*[set(df.columns) for df in combined_data])
            
            # If there are common columns, use only those for combining
            if common_columns:
                combined_df = pd.concat([df[list(common_columns)] for df in combined_data], ignore_index=True)
            else:
                # Otherwise just concatenate and handle missing values
                combined_df = pd.concat(combined_data, ignore_index=True)
            
            # Save combined data
            combined_df.to_csv(output_filepath, index=False)
            
            logger.info(f"Saved combined mental health data to {output_filepath} with {len(combined_df)} rows")
        
    except Exception as e:
        logger.error(f"Error combining mental health data: {e}")

def process_reddit_data(filepath, output_filepath):
    """
    Process Reddit JSON data and clean text content.
    
    Args:
        filepath (str): Path to raw Reddit JSON file
        output_filepath (str): Path to save processed JSON
    """
    logger.info(f"Processing Reddit data from {filepath}")
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Process each post
        processed_posts = []
        for post in data:
            if isinstance(post, dict):
                # Clean text fields
                processed_post = {
                    'id': post.get('id', ''),
                    'subreddit': post.get('subreddit', ''),
                    'title': clean_text(post.get('title', '')),
                    'text': clean_text(post.get('selftext', '')),
                    'author': post.get('author', ''),
                    'score': post.get('score', 0),
                    'created_utc': post.get('created_utc', 0),
                    'num_comments': post.get('num_comments', 0)
                }
                
                # Only include if there's valid content
                if processed_post['title'] or processed_post['text']:
                    processed_posts.append(processed_post)
        
        # Save processed data
        with open(output_filepath, 'w', encoding='utf-8') as f:
            json.dump(processed_posts, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Saved processed Reddit data to {output_filepath} with {len(processed_posts)} posts")
        
    except Exception as e:
        logger.error(f"Error processing Reddit data {filepath}: {e}")

def combine_reddit_data(filepaths, output_filepath):
    """
    Combine multiple Reddit datasets and convert to CSV format.
    
    Args:
        filepaths (list): List of Reddit JSON file paths to combine
        output_filepath (str): Path to save combined CSV data
    """
    logger.info("Combining Reddit datasets")
    
    try:
        all_posts = []
        
        for filepath in filepaths:
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    
                # Extract subreddit type from filename
                subreddit_type = Path(filepath).stem.replace('reddit_', '')
                
                # Process each post
                for post in data:
                    if isinstance(post, dict):
                        post_data = {
                            'id': post.get('id', ''),
                            'subreddit': post.get('subreddit', ''),
                            'subreddit_type': subreddit_type,
                            'title': post.get('title', ''),
                            'text': post.get('selftext', ''),
                            'author': post.get('author', ''),
                            'score': post.get('score', 0),
                            'created_utc': post.get('created_utc', 0),
                            'num_comments': post.get('num_comments', 0)
                        }
                        all_posts.append(post_data)
                        
            except Exception as e:
                logger.error(f"Error reading {filepath}: {e}")
        
        # Convert to DataFrame
        if all_posts:
            df = pd.DataFrame(all_posts)
            
            # Clean text fields
            df['title'] = df['title'].apply(clean_text)
            df['text'] = df['text'].apply(clean_text)
            
            # Add sentiment placeholder (can be filled by sentiment analysis later)
            df['sentiment'] = ''
            
            # Add category based on subreddit
            df['category'] = df['subreddit_type'].map({
                'anxiety': 'anxiety',
                'depression': 'depression',
                'bipolar': 'bipolar',
                'ptsd': 'ptsd',
                'SuicideWatch': 'suicide',
                'mentalhealth': 'general'
            })
            
            # Save combined data
            df.to_csv(output_filepath, index=False)
            logger.info(f"Saved combined Reddit data to {output_filepath} with {len(df)} posts")
        
    except Exception as e:
        logger.error(f"Error combining Reddit data: {e}")

def process_all_files():
    """Process all raw data files."""
    logger.info("Starting data preprocessing")
    
    # Process Reddit files first
    reddit_files = list(RAW_DIR.glob('reddit_*.json'))
    processed_reddit_files = []
    
    for reddit_file in reddit_files:
        processed_path = PROCESSED_DIR / f"{reddit_file.stem}_processed.json"
        process_reddit_data(str(reddit_file), str(processed_path))
        processed_reddit_files.append(str(processed_path))
    
    # Combine Reddit data into CSV
    if processed_reddit_files:
        combine_reddit_data(
            processed_reddit_files,
            str(PROCESSED_DIR / 'reddit_mental_health_combined.csv')
        )

    # Get all raw files
    raw_files = list(RAW_DIR.glob('*.*'))
    
    # Process JSON files
    json_files = [f for f in raw_files if f.suffix.lower() == '.json']
    for json_file in json_files:
        if 'intent' in json_file.name.lower() or 'conversation' in json_file.name.lower():
            process_conversational_json(
                str(json_file),
                str(PROCESSED_DIR / f"{json_file.stem}_processed.json")
            )
        else:
            process_web_articles_json(
                str(json_file),
                str(PROCESSED_DIR / f"{json_file.stem}_processed.json")
            )
    
    # Process CSV files
    csv_files = [f for f in raw_files if f.suffix.lower() == '.csv']
    for csv_file in csv_files:
        # Determine text columns based on file name patterns
        text_columns = None
        
        if any(keyword in csv_file.name.lower() for keyword in ['mental', 'health', 'emotion', 'sentiment', 'suicide']):
            text_columns = ['text', 'message', 'content', 'post', 'tweet', 'comment', 'description']
        
        process_csv_data(
            str(csv_file),
            str(PROCESSED_DIR / f"{csv_file.stem}_processed.csv"),
            text_columns=text_columns
        )
    
    # Process dialogue files
    dialogue_files = {
        'text': RAW_DIR / 'dialogues_text.txt',
        'emotion': RAW_DIR / 'dialogues_emotion.txt',
        'act': RAW_DIR / 'dialogues_act.txt',
        'topic': RAW_DIR / 'dialogues_topic.txt'
    }
    
    if all(file_path.exists() for file_path in dialogue_files.values()):
        process_dialogue_files(
            str(dialogue_files['text']),
            str(dialogue_files['emotion']),
            str(dialogue_files['act']),
            str(dialogue_files['topic']),
            str(PROCESSED_DIR / 'dialogues_combined.csv')
        )
    
    # Combine mental health datasets
    mental_health_processed_files = [
        str(f) for f in PROCESSED_DIR.glob('*_processed.csv') 
        if any(keyword in f.name.lower() for keyword in ['mental', 'health', 'emotion', 'sentiment', 'suicide', 'anxiety', 'depression', 'therapy', 'counseling'])
    ]
    
    combine_mental_health_data(
        mental_health_processed_files,
        str(COMBINED_DIR / 'mental_health_combined.csv')
    )
    
    # Combine conversational datasets
    conversational_files = list(PROCESSED_DIR.glob('*_processed.json'))
    conversational_data = {'intents': []}
    
    for json_file in conversational_files:
        if 'intent' in json_file.name.lower() or 'conversation' in json_file.name.lower():
            try:
                with open(str(json_file), 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    conversational_data['intents'].extend(data.get('intents', []))
            except Exception as e:
                logger.error(f"Error reading {json_file}: {e}")
    
    # Save combined intents
    if conversational_data['intents']:
        with open(str(COMBINED_DIR / 'conversational_combined.json'), 'w', encoding='utf-8') as f:
            json.dump(conversational_data, f, indent=2)
            
        logger.info(f"Saved combined conversational data with {len(conversational_data['intents'])} intents")
    
    logger.info("Data preprocessing completed")

if __name__ == "__main__":
    process_all_files()