#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Data analysis script for mental health conversational AI data.
This script generates visualizations and statistics for raw and processed datasets.
"""

import os
import json
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
from collections import Counter
from wordcloud import WordCloud
import logging
import sys
import re

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("data_analysis.log"),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Setup paths
BASE_DIR = Path(__file__).resolve().parent.parent
RAW_DIR = BASE_DIR / 'raw'
PROCESSED_DIR = BASE_DIR / 'processed'
COMBINED_DIR = BASE_DIR / 'combined'
ANALYSIS_DIR = BASE_DIR / 'analysis'

# Create analysis directories if they don't exist
ANALYSIS_DIR.mkdir(exist_ok=True)
(ANALYSIS_DIR / 'raw').mkdir(exist_ok=True)
(ANALYSIS_DIR / 'conversational').mkdir(exist_ok=True)
(ANALYSIS_DIR / 'dialogue').mkdir(exist_ok=True)
(ANALYSIS_DIR / 'mental_health').mkdir(exist_ok=True)
(ANALYSIS_DIR / 'comparisons').mkdir(exist_ok=True)

def analyze_conversational_data(filepath, output_dir):
    """
    Analyze conversational JSON data.
    
    Args:
        filepath (str): Path to JSON file
        output_dir (str): Directory to save analysis results
    """
    logger.info(f"Analyzing conversational data: {filepath}")
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        intents = data.get('intents', [])
        
        if not intents:
            logger.warning(f"No intents found in {filepath}")
            return
        
        # Count number of patterns and responses per intent
        intent_stats = []
        all_patterns = []
        all_responses = []
        
        for intent in intents:
            tag = intent.get('tag', '')
            patterns = intent.get('patterns', [])
            responses = intent.get('responses', [])
            
            intent_stats.append({
                'tag': tag,
                'pattern_count': len(patterns),
                'response_count': len(responses)
            })
            
            all_patterns.extend(patterns)
            all_responses.extend(responses)
        
        # Create stats DataFrame
        stats_df = pd.DataFrame(intent_stats)
        stats_df.to_csv(f"{output_dir}/intent_statistics_{Path(filepath).stem}.csv", index=False)
        
        # Plot intent pattern/response counts
        plt.figure(figsize=(12, 8))
        sns.barplot(x='tag', y='pattern_count', data=stats_df.sort_values('pattern_count', ascending=False).head(20))
        plt.xticks(rotation=90)
        plt.title(f'Number of Patterns per Intent (Top 20) - {Path(filepath).stem}')
        plt.tight_layout()
        plt.savefig(f"{output_dir}/intent_pattern_counts_{Path(filepath).stem}.png")
        plt.close()
        
        # Plot response counts
        plt.figure(figsize=(12, 8))
        sns.barplot(x='tag', y='response_count', data=stats_df.sort_values('response_count', ascending=False).head(20))
        plt.xticks(rotation=90)
        plt.title(f'Number of Responses per Intent (Top 20) - {Path(filepath).stem}')
        plt.tight_layout()
        plt.savefig(f"{output_dir}/intent_response_counts_{Path(filepath).stem}.png")
        plt.close()
        
        # Create word cloud of all patterns
        if all_patterns:
            all_patterns_text = ' '.join(all_patterns)
            wordcloud = WordCloud(width=800, height=400, background_color='white', max_words=200).generate(all_patterns_text)
            
            plt.figure(figsize=(10, 5))
            plt.imshow(wordcloud, interpolation='bilinear')
            plt.axis('off')
            plt.title(f'Word Cloud of All Patterns - {Path(filepath).stem}')
            plt.tight_layout()
            plt.savefig(f"{output_dir}/patterns_wordcloud_{Path(filepath).stem}.png")
            plt.close()
        
        # Create word cloud of all responses
        if all_responses:
            all_responses_text = ' '.join(all_responses)
            wordcloud = WordCloud(width=800, height=400, background_color='white', max_words=200).generate(all_responses_text)
            
            plt.figure(figsize=(10, 5))
            plt.imshow(wordcloud, interpolation='bilinear')
            plt.axis('off')
            plt.title(f'Word Cloud of All Responses - {Path(filepath).stem}')
            plt.tight_layout()
            plt.savefig(f"{output_dir}/responses_wordcloud_{Path(filepath).stem}.png")
            plt.close()
            
        # Intent category analysis
        if stats_df.shape[0] > 0:
            # Try to categorize intents based on keywords
            def categorize_intent(tag):
                tag_lower = tag.lower()
                if any(word in tag_lower for word in ['greeting', 'hello', 'hi', 'welcome']):
                    return 'Greeting'
                elif any(word in tag_lower for word in ['farewell', 'goodbye', 'bye']):
                    return 'Farewell'
                elif any(word in tag_lower for word in ['thanks', 'thank', 'gratitude']):
                    return 'Gratitude'
                elif any(word in tag_lower for word in ['help', 'support', 'assist']):
                    return 'Help'
                elif any(word in tag_lower for word in ['depress', 'anxiety', 'stress', 'mental']):
                    return 'Mental Health'
                elif any(word in tag_lower for word in ['anger', 'sad', 'happy', 'emotion']):
                    return 'Emotion'
                else:
                    return 'Other'
            
            stats_df['category'] = stats_df['tag'].apply(categorize_intent)
            category_counts = stats_df['category'].value_counts()
            
            plt.figure(figsize=(10, 6))
            sns.barplot(x=category_counts.index, y=category_counts.values)
            plt.xticks(rotation=45)
            plt.title(f'Intent Categories - {Path(filepath).stem}')
            plt.tight_layout()
            plt.savefig(f"{output_dir}/intent_categories_{Path(filepath).stem}.png")
            plt.close()
        
        logger.info(f"Saved conversational data analysis to {output_dir}")
        
    except Exception as e:
        logger.error(f"Error analyzing conversational data {filepath}: {e}")

def analyze_dialogue_data(filepath, output_dir, has_header=True, delimiter=','):
    """
    Analyze dialogue data from CSV or TXT files.
    
    Args:
        filepath (str): Path to dialogue file
        output_dir (str): Directory to save analysis results
        has_header (bool): Whether the file has a header row
        delimiter (str): Delimiter used in the file
    """
    logger.info(f"Analyzing dialogue data: {filepath}")
    file_path = Path(filepath)
    
    try:
        # For text files
        if file_path.suffix.lower() == '.txt':
            with open(filepath, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            
            # Create a simple DataFrame
            df = pd.DataFrame({'text': [line.strip() for line in lines]})
            
            # Analyze text length
            df['text_length'] = df['text'].apply(len)
            
            # Basic statistics
            text_stats = df['text_length'].describe()
            text_stats.to_csv(f"{output_dir}/text_stats_{file_path.stem}.csv")
            
            # Length distribution
            plt.figure(figsize=(10, 6))
            sns.histplot(df['text_length'], bins=50)
            plt.title(f'Distribution of Text Length - {file_path.stem}')
            plt.xlabel('Text Length (characters)')
            plt.tight_layout()
            plt.savefig(f"{output_dir}/text_length_distribution_{file_path.stem}.png")
            plt.close()
            
            # Word frequency analysis (top 20 words)
            all_text = ' '.join(df['text'].tolist())
            words = re.findall(r'\b\w+\b', all_text.lower())
            word_freq = Counter(words)
            
            # Remove very common English words
            common_words = {'the', 'and', 'a', 'to', 'of', 'is', 'in', 'it', 'that', 'you', 'for', 'with', 'on', 'are', 'be', 'this', 'as', 'at', 'have', 'from', 'or', 'an'}
            word_freq = {word: count for word, count in word_freq.items() if word not in common_words}
            
            word_df = pd.DataFrame({'word': list(word_freq.keys()), 'frequency': list(word_freq.values())})
            word_df = word_df.sort_values('frequency', ascending=False).head(20)
            
            plt.figure(figsize=(12, 8))
            sns.barplot(x='word', y='frequency', data=word_df)
            plt.xticks(rotation=45)
            plt.title(f'Top 20 Words - {file_path.stem}')
            plt.tight_layout()
            plt.savefig(f"{output_dir}/word_frequency_{file_path.stem}.png")
            plt.close()
            
        # For CSV files
        else:
            # Try to read the CSV file
            try:
                if has_header:
                    df = pd.read_csv(filepath, delimiter=delimiter)
                else:
                    df = pd.read_csv(filepath, delimiter=delimiter, header=None)
                    df.columns = [f'Column_{i}' for i in range(len(df.columns))]
            except Exception as e:
                logger.error(f"Error reading CSV file {filepath}: {e}")
                return
            
            # Save basic dataset info
            data_info = {
                'num_rows': len(df),
                'num_columns': len(df.columns),
                'columns': list(df.columns)
            }
            
            with open(f"{output_dir}/dataset_info_{file_path.stem}.json", 'w') as f:
                json.dump(data_info, f, indent=4)
            
            # Analyze each column
            for column in df.columns:
                try:
                    # Skip analysis for columns with too many unique values or non-string/numeric data
                    if df[column].dtype == 'object' and df[column].nunique() > min(100, len(df) // 10):
                        continue
                    
                    # Categorical data analysis
                    if df[column].dtype == 'object' or df[column].nunique() < 20:
                        value_counts = df[column].value_counts().reset_index()
                        value_counts.columns = ['value', 'count']
                        
                        if len(value_counts) > 20:
                            value_counts = value_counts.head(20)
                        
                        plt.figure(figsize=(12, 8))
                        sns.barplot(x='value', y='count', data=value_counts)
                        plt.xticks(rotation=45)
                        plt.title(f'Distribution of {column} - {file_path.stem}')
                        plt.tight_layout()
                        plt.savefig(f"{output_dir}/{column}_distribution_{file_path.stem}.png")
                        plt.close()
                    
                    # Numeric data analysis
                    elif pd.api.types.is_numeric_dtype(df[column]):
                        plt.figure(figsize=(10, 6))
                        sns.histplot(df[column].dropna())
                        plt.title(f'Distribution of {column} - {file_path.stem}')
                        plt.tight_layout()
                        plt.savefig(f"{output_dir}/{column}_distribution_{file_path.stem}.png")
                        plt.close()
                    
                except Exception as e:
                    logger.error(f"Error analyzing column {column} in {filepath}: {e}")
            
            # Text column analysis (if any)
            text_columns = [col for col in df.columns if df[col].dtype == 'object']
            
            for col in text_columns[:3]:  # Limit to first 3 text columns to avoid excessive processing
                try:
                    # Text length analysis
                    df[f'{col}_length'] = df[col].astype(str).apply(len)
                    
                    plt.figure(figsize=(10, 6))
                    sns.histplot(df[f'{col}_length'], bins=50)
                    plt.title(f'Distribution of {col} Length - {file_path.stem}')
                    plt.xlabel('Text Length (characters)')
                    plt.tight_layout()
                    plt.savefig(f"{output_dir}/{col}_length_distribution_{file_path.stem}.png")
                    plt.close()
                    
                    # Word cloud for text data
                    sample_texts = df[col].dropna().astype(str).sample(min(1000, len(df)))
                    
                    if not sample_texts.empty:
                        sample_text = ' '.join(sample_texts)
                        wordcloud = WordCloud(width=800, height=400, background_color='white', max_words=200).generate(sample_text)
                        
                        plt.figure(figsize=(10, 5))
                        plt.imshow(wordcloud, interpolation='bilinear')
                        plt.axis('off')
                        plt.title(f'Word Cloud of {col} - {file_path.stem}')
                        plt.tight_layout()
                        plt.savefig(f"{output_dir}/{col}_wordcloud_{file_path.stem}.png")
                        plt.close()
                
                except Exception as e:
                    logger.error(f"Error analyzing text column {col} in {filepath}: {e}")
        
        logger.info(f"Saved dialogue data analysis to {output_dir}")
        
    except Exception as e:
        logger.error(f"Error analyzing dialogue data {filepath}: {e}")

def analyze_mental_health_data(filepath, output_dir):
    """
    Analyze mental health data from CSV files.
    
    Args:
        filepath (str): Path to mental health data file
        output_dir (str): Directory to save analysis results
    """
    logger.info(f"Analyzing mental health data: {filepath}")
    
    try:
        # Try different encodings
        try:
            df = pd.read_csv(filepath)
        except UnicodeDecodeError:
            try:
                df = pd.read_csv(filepath, encoding='latin1')
            except:
                df = pd.read_csv(filepath, encoding='cp1252')
        
        file_name = Path(filepath).stem
        
        # Dataset overview
        dataset_info = {
            'filename': file_name,
            'num_rows': len(df),
            'num_columns': len(df.columns),
            'columns': list(df.columns),
            'missing_values': df.isnull().sum().to_dict()
        }
        
        with open(f"{output_dir}/{file_name}_info.json", 'w') as f:
            json.dump(dataset_info, f, indent=4)
        
        # Source distribution (if available)
        if 'source' in df.columns:
            source_counts = df['source'].value_counts()
            
            plt.figure(figsize=(10, 6))
            sns.barplot(x=source_counts.index, y=source_counts.values)
            plt.xticks(rotation=45)
            plt.title(f'Distribution of Data Sources - {file_name}')
            plt.tight_layout()
            plt.savefig(f"{output_dir}/{file_name}_source_distribution.png")
            plt.close()
            
            # Save source counts
            source_counts.to_csv(f"{output_dir}/{file_name}_source_counts.csv")
        
        # Label distribution (common columns in mental health datasets)
        label_columns = ['label', 'sentiment', 'emotion', 'class', 'mental_health_condition', 
                         'category', 'condition', 'diagnosis', 'status', 'severity']
        
        for col in label_columns:
            if col in df.columns and df[col].nunique() < 50:  # Only for columns with reasonable number of categories
                label_counts = df[col].value_counts()
                
                plt.figure(figsize=(10, 6))
                sns.barplot(x=label_counts.index, y=label_counts.values)
                plt.xticks(rotation=45)
                plt.title(f'Distribution of {col.capitalize()} - {file_name}')
                plt.tight_layout()
                plt.savefig(f"{output_dir}/{file_name}_{col}_distribution.png")
                plt.close()
                
                # Save label counts
                label_counts.to_csv(f"{output_dir}/{file_name}_{col}_counts.csv")
        
        # Text analysis (common text columns)
        text_columns = ['text', 'content', 'message', 'post', 'tweet', 'comment', 'description']
        
        for col in text_columns:
            if col in df.columns:
                # Text length analysis
                df[f'{col}_length'] = df[col].astype(str).apply(len)
                
                plt.figure(figsize=(10, 6))
                sns.histplot(df[f'{col}_length'], bins=50)
                plt.title(f'Distribution of {col} Length - {file_name}')
                plt.xlabel('Text Length (characters)')
                plt.tight_layout()
                plt.savefig(f"{output_dir}/{file_name}_{col}_length_distribution.png")
                plt.close()
                
                # Sample of text data for word cloud
                sample_texts = df[col].dropna().astype(str).sample(min(1000, len(df)))
                
                if not sample_texts.empty:
                    sample_text = ' '.join(sample_texts)
                    wordcloud = WordCloud(width=800, height=400, background_color='white', max_words=200).generate(sample_text)
                    
                    plt.figure(figsize=(10, 5))
                    plt.imshow(wordcloud, interpolation='bilinear')
                    plt.axis('off')
                    plt.title(f'Word Cloud of {col} - {file_name}')
                    plt.tight_layout()
                    plt.savefig(f"{output_dir}/{file_name}_{col}_wordcloud.png")
                    plt.close()
        
        # Correlation analysis for numeric columns
        numeric_cols = df.select_dtypes(include=['int64', 'float64']).columns
        
        if len(numeric_cols) > 1 and len(numeric_cols) < 20:  # Only if there are 2-20 numeric columns
            correlation = df[numeric_cols].corr()
            
            plt.figure(figsize=(12, 10))
            sns.heatmap(correlation, annot=True, cmap='coolwarm', linewidths=0.5)
            plt.title(f'Correlation Matrix - {file_name}')
            plt.tight_layout()
            plt.savefig(f"{output_dir}/{file_name}_correlation_matrix.png")
            plt.close()
        
        logger.info(f"Saved mental health data analysis to {output_dir}")
        
    except Exception as e:
        logger.error(f"Error analyzing mental health data {filepath}: {e}")

def analyze_web_articles(filepath, output_dir):
    """
    Analyze web articles data from JSON files.
    
    Args:
        filepath (str): Path to web articles JSON file
        output_dir (str): Directory to save analysis results
    """
    logger.info(f"Analyzing web articles: {filepath}")
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        file_name = Path(filepath).stem
        
        # Convert to DataFrame if possible
        if isinstance(data, list):
            if len(data) > 0 and isinstance(data[0], dict):
                df = pd.json_normalize(data)
            else:
                logger.warning(f"Cannot convert {filepath} to DataFrame: not a list of dictionaries")
                return
        elif isinstance(data, dict):
            # Try to flatten the dictionary structure
            flattened_data = []
            for key, value in data.items():
                if isinstance(value, dict):
                    value['id'] = key
                    flattened_data.append(value)
                else:
                    flattened_data.append({'id': key, 'value': value})
            
            df = pd.DataFrame(flattened_data)
        else:
            logger.warning(f"Cannot convert {filepath} to DataFrame: unsupported format")
            return
        
        # Dataset overview
        dataset_info = {
            'filename': file_name,
            'num_records': len(df),
            'num_columns': len(df.columns),
            'columns': list(df.columns)
        }
        
        with open(f"{output_dir}/{file_name}_info.json", 'w') as f:
            json.dump(dataset_info, f, indent=4)
        
        # Analyze text columns
        text_columns = [col for col in df.columns if df[col].dtype == 'object']
        
        for col in text_columns[:3]:  # Limit to first 3 text columns
            try:
                # Text length analysis
                df[f'{col}_length'] = df[col].astype(str).apply(len)
                
                plt.figure(figsize=(10, 6))
                sns.histplot(df[f'{col}_length'], bins=50)
                plt.title(f'Distribution of {col} Length - {file_name}')
                plt.xlabel('Text Length (characters)')
                plt.tight_layout()
                plt.savefig(f"{output_dir}/{file_name}_{col}_length_distribution.png")
                plt.close()
                
                # Word cloud for text data
                sample_texts = df[col].dropna().astype(str).sample(min(500, len(df)))
                
                if not sample_texts.empty:
                    sample_text = ' '.join(sample_texts)
                    wordcloud = WordCloud(width=800, height=400, background_color='white', max_words=200).generate(sample_text)
                    
                    plt.figure(figsize=(10, 5))
                    plt.imshow(wordcloud, interpolation='bilinear')
                    plt.axis('off')
                    plt.title(f'Word Cloud of {col} - {file_name}')
                    plt.tight_layout()
                    plt.savefig(f"{output_dir}/{file_name}_{col}_wordcloud.png")
                    plt.close()
            
            except Exception as e:
                logger.error(f"Error analyzing text column {col} in {filepath}: {e}")
        
        logger.info(f"Saved web articles analysis to {output_dir}")
        
    except Exception as e:
        logger.error(f"Error analyzing web articles {filepath}: {e}")

def generate_data_statistics(input_dirs, output_file):
    """
    Generate overall statistics about the datasets.
    
    Args:
        input_dirs (list): List of directories containing data
        output_file (str): Path to save statistics
    """
    logger.info("Generating overall data statistics")
    
    try:
        stats = []
        
        # Count files by type
        for input_dir in input_dirs:
            dir_path = Path(input_dir)
            dir_name = dir_path.name
            csv_files = list(dir_path.glob('*.csv'))
            json_files = list(dir_path.glob('*.json'))
            txt_files = list(dir_path.glob('*.txt'))
            
            csv_count = len(csv_files)
            json_count = len(json_files)
            txt_count = len(txt_files)
            
            # Count total records in CSV files
            total_csv_records = 0
            csv_file_stats = []
            
            for csv_file in csv_files:
                try:
                    df = pd.read_csv(csv_file)
                    num_records = len(df)
                    total_csv_records += num_records
                    
                    csv_file_stats.append({
                        'file': csv_file.name,
                        'records': num_records,
                        'columns': len(df.columns)
                    })
                except Exception as e:
                    logger.error(f"Error reading CSV file {csv_file}: {e}")
            
            # Count total intents/patterns/responses in JSON files
            total_intents = 0
            total_patterns = 0
            total_responses = 0
            json_file_stats = []
            
            for json_file in json_files:
                try:
                    with open(json_file, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                    
                    intents = data.get('intents', [])
                    total_intents += len(intents)
                    
                    patterns_count = 0
                    responses_count = 0
                    
                    for intent in intents:
                        patterns_count += len(intent.get('patterns', []))
                        responses_count += len(intent.get('responses', []))
                    
                    total_patterns += patterns_count
                    total_responses += responses_count
                    
                    json_file_stats.append({
                        'file': json_file.name,
                        'intents': len(intents),
                        'patterns': patterns_count,
                        'responses': responses_count
                    })
                except Exception as e:
                    logger.error(f"Error reading JSON file {json_file}: {e}")
            
            # Count total lines in TXT files
            total_txt_lines = 0
            txt_file_stats = []
            
            for txt_file in txt_files:
                try:
                    with open(txt_file, 'r', encoding='utf-8') as f:
                        lines = f.readlines()
                    
                    num_lines = len(lines)
                    total_txt_lines += num_lines
                    
                    txt_file_stats.append({
                        'file': txt_file.name,
                        'lines': num_lines
                    })
                except Exception as e:
                    logger.error(f"Error reading TXT file {txt_file}: {e}")
            
            stats.append({
                'directory': dir_name,
                'csv_files': csv_count,
                'json_files': json_count,
                'txt_files': txt_count,
                'total_csv_records': total_csv_records,
                'total_intents': total_intents,
                'total_patterns': total_patterns,
                'total_responses': total_responses,
                'total_txt_lines': total_txt_lines
            })
            
            # Save detailed file stats
            if csv_file_stats:
                pd.DataFrame(csv_file_stats).to_csv(f"{ANALYSIS_DIR}/{dir_name}_csv_file_stats.csv", index=False)
            
            if json_file_stats:
                pd.DataFrame(json_file_stats).to_csv(f"{ANALYSIS_DIR}/{dir_name}_json_file_stats.csv", index=False)
            
            if txt_file_stats:
                pd.DataFrame(txt_file_stats).to_csv(f"{ANALYSIS_DIR}/{dir_name}_txt_file_stats.csv", index=False)
        
        # Create stats DataFrame
        stats_df = pd.DataFrame(stats)
        stats_df.to_csv(output_file, index=False)
        
        # Create comparative visualizations
        if len(stats) > 1:
            # Compare number of files
            plt.figure(figsize=(12, 8))
            stats_df_melted = pd.melt(stats_df, id_vars=['directory'], value_vars=['csv_files', 'json_files', 'txt_files'],
                                     var_name='file_type', value_name='count')
            sns.barplot(x='directory', y='count', hue='file_type', data=stats_df_melted)
            plt.title('Number of Files by Type and Directory')
            plt.xticks(rotation=45)
            plt.tight_layout()
            plt.savefig(f"{ANALYSIS_DIR}/comparisons/file_count_comparison.png")
            plt.close()
            
            # Compare total records
            plt.figure(figsize=(12, 8))
            stats_df_melted = pd.melt(stats_df, id_vars=['directory'], 
                                     value_vars=['total_csv_records', 'total_intents', 'total_txt_lines'],
                                     var_name='record_type', value_name='count')
            sns.barplot(x='directory', y='count', hue='record_type', data=stats_df_melted)
            plt.title('Number of Records by Type and Directory')
            plt.xticks(rotation=45)
            plt.tight_layout()
            plt.savefig(f"{ANALYSIS_DIR}/comparisons/record_count_comparison.png")
            plt.close()
        
        logger.info(f"Saved overall data statistics to {output_file}")
        
    except Exception as e:
        logger.error(f"Error generating data statistics: {e}")

def analyze_raw_file(filepath):
    """
    Analyze a raw data file based on its type.
    
    Args:
        filepath (str): Path to the raw data file
    """
    file_path = Path(filepath)
    file_type = file_path.suffix.lower()
    
    raw_analysis_dir = str(ANALYSIS_DIR / 'raw')
    
    if file_type == '.json':
        if 'intent' in file_path.name.lower() or 'conversation' in file_path.name.lower():
            analyze_conversational_data(str(file_path), raw_analysis_dir)
        else:
            analyze_web_articles(str(file_path), raw_analysis_dir)
    
    elif file_type == '.csv':
        if any(keyword in file_path.name.lower() for keyword in ['mental', 'health', 'emotion', 'sentiment', 'anxiety', 'depression', 'suicide']):
            analyze_mental_health_data(str(file_path), raw_analysis_dir)
        else:
            analyze_dialogue_data(str(file_path), raw_analysis_dir)
    
    elif file_type == '.txt':
        analyze_dialogue_data(str(file_path), raw_analysis_dir, has_header=False, delimiter='\t')

def compare_raw_vs_processed(raw_file, processed_file, output_dir):
    """
    Compare raw and processed versions of the same dataset.
    
    Args:
        raw_file (str): Path to raw data file
        processed_file (str): Path to processed data file
        output_dir (str): Directory to save comparison results
    """
    logger.info(f"Comparing raw vs processed: {raw_file} vs {processed_file}")
    
    try:
        raw_path = Path(raw_file)
        proc_path = Path(processed_file)
        
        # Skip if file types don't match
        if raw_path.suffix != proc_path.suffix:
            logger.warning(f"File types don't match: {raw_path.suffix} vs {proc_path.suffix}")
            return
        
        file_type = raw_path.suffix.lower()
        
        if file_type == '.csv':
            # Read CSV files
            try:
                raw_df = pd.read_csv(raw_file)
                proc_df = pd.read_csv(processed_file)
            except Exception as e:
                logger.error(f"Error reading CSV files: {e}")
                return
            
            # Basic comparison
            comparison = {
                'raw_rows': len(raw_df),
                'proc_rows': len(proc_df),
                'raw_columns': len(raw_df.columns),
                'proc_columns': len(proc_df.columns),
                'raw_missing': raw_df.isnull().sum().sum(),
                'proc_missing': proc_df.isnull().sum().sum()
            }
            
            # Compare shared columns
            shared_columns = set(raw_df.columns) & set(proc_df.columns)
            comparison['shared_columns'] = list(shared_columns)
            
            with open(f"{output_dir}/{raw_path.stem}_vs_{proc_path.stem}_comparison.json", 'w') as f:
                json.dump(comparison, f, indent=4)
            
            # Compare text columns
            for col in shared_columns:
                if raw_df[col].dtype == 'object' and proc_df[col].dtype == 'object':
                    # Text length comparison
                    raw_df[f'{col}_length'] = raw_df[col].astype(str).apply(len)
                    proc_df[f'{col}_length'] = proc_df[col].astype(str).apply(len)
                    
                    plt.figure(figsize=(12, 6))
                    plt.hist(raw_df[f'{col}_length'], bins=50, alpha=0.5, label='Raw')
                    plt.hist(proc_df[f'{col}_length'], bins=50, alpha=0.5, label='Processed')
                    plt.title(f'Text Length Comparison - {col}')
                    plt.xlabel('Text Length (characters)')
                    plt.legend()
                    plt.tight_layout()
                    plt.savefig(f"{output_dir}/{raw_path.stem}_vs_{proc_path.stem}_{col}_length.png")
                    plt.close()
        
        elif file_type == '.json':
            # Read JSON files
            try:
                with open(raw_file, 'r', encoding='utf-8') as f:
                    raw_data = json.load(f)
                
                with open(processed_file, 'r', encoding='utf-8') as f:
                    proc_data = json.load(f)
            except Exception as e:
                logger.error(f"Error reading JSON files: {e}")
                return
            
            # Compare intents data
            if 'intents' in raw_data and 'intents' in proc_data:
                raw_intents = raw_data['intents']
                proc_intents = proc_data['intents']
                
                comparison = {
                    'raw_intents': len(raw_intents),
                    'proc_intents': len(proc_intents)
                }
                
                # Count patterns and responses
                raw_patterns = sum(len(intent.get('patterns', [])) for intent in raw_intents)
                proc_patterns = sum(len(intent.get('patterns', [])) for intent in proc_intents)
                
                raw_responses = sum(len(intent.get('responses', [])) for intent in raw_intents)
                proc_responses = sum(len(intent.get('responses', [])) for intent in proc_intents)
                
                comparison['raw_patterns'] = raw_patterns
                comparison['proc_patterns'] = proc_patterns
                comparison['raw_responses'] = raw_responses
                comparison['proc_responses'] = proc_responses
                
                with open(f"{output_dir}/{raw_path.stem}_vs_{proc_path.stem}_comparison.json", 'w') as f:
                    json.dump(comparison, f, indent=4)
                
                # Create comparison bar chart
                labels = ['Intents', 'Patterns', 'Responses']
                raw_values = [len(raw_intents), raw_patterns, raw_responses]
                proc_values = [len(proc_intents), proc_patterns, proc_responses]
                
                x = np.arange(len(labels))
                width = 0.35
                
                plt.figure(figsize=(10, 6))
                plt.bar(x - width/2, raw_values, width, label='Raw')
                plt.bar(x + width/2, proc_values, width, label='Processed')
                
                plt.xlabel('Data Type')
                plt.ylabel('Count')
                plt.title('Raw vs Processed Data Comparison')
                plt.xticks(x, labels)
                plt.legend()
                plt.tight_layout()
                plt.savefig(f"{output_dir}/{raw_path.stem}_vs_{proc_path.stem}_comparison.png")
                plt.close()
        
        logger.info(f"Saved comparison analysis to {output_dir}")
        
    except Exception as e:
        logger.error(f"Error comparing raw vs processed files: {e}")

def run_analysis():
    """Run all data analysis functions."""
    logger.info("Starting data analysis")
    
    # Analyze raw data files
    raw_files = list(RAW_DIR.glob('*.*'))
    for file_path in raw_files:
        if file_path.is_file() and file_path.suffix.lower() in ['.csv', '.json', '.txt']:
            analyze_raw_file(str(file_path))
    
    # Analyze processed files
    
    # Create analysis subdirectories
    conversational_dir = str(ANALYSIS_DIR / 'conversational')
    dialogue_dir = str(ANALYSIS_DIR / 'dialogue')
    mental_health_dir = str(ANALYSIS_DIR / 'mental_health')
    
    # Analyze conversational data
    for json_file in PROCESSED_DIR.glob('*conversational*.json'):
        analyze_conversational_data(str(json_file), conversational_dir)
    
    for json_file in PROCESSED_DIR.glob('*intent*.json'):
        analyze_conversational_data(str(json_file), conversational_dir)
    
    for json_file in COMBINED_DIR.glob('*conversational*.json'):
        analyze_conversational_data(str(json_file), conversational_dir)
    
    # Analyze dialogue data
    for csv_file in PROCESSED_DIR.glob('*dialogue*.csv'):
        analyze_dialogue_data(str(csv_file), dialogue_dir)
    
    # Analyze mental health data
    for csv_file in COMBINED_DIR.glob('*mental_health*.csv'):
        analyze_mental_health_data(str(csv_file), mental_health_dir)
    
    for csv_file in PROCESSED_DIR.glob('*mental_health*.csv'):
        analyze_mental_health_data(str(csv_file), mental_health_dir)
    
    # Compare raw vs processed data
    comparison_dir = str(ANALYSIS_DIR / 'comparisons')
    
    # Find pairs of raw and processed files
    for raw_file in RAW_DIR.glob('*.csv'):
        processed_file = PROCESSED_DIR / f"{raw_file.stem}_processed.csv"
        if processed_file.exists():
            compare_raw_vs_processed(str(raw_file), str(processed_file), comparison_dir)
    
    for raw_file in RAW_DIR.glob('*.json'):
        processed_file = PROCESSED_DIR / f"{raw_file.stem}_processed.json"
        if processed_file.exists():
            compare_raw_vs_processed(str(raw_file), str(processed_file), comparison_dir)
    
    # Generate overall statistics
    generate_data_statistics(
        [str(RAW_DIR), str(PROCESSED_DIR), str(COMBINED_DIR)],
        str(ANALYSIS_DIR / 'overall_statistics.csv')
    )
    
    logger.info("Data analysis completed")

if __name__ == "__main__":
    run_analysis()