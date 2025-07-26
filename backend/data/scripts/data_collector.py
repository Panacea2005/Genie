#!/usr/bin/env python3
"""
Data Collector Script

This script collects data from various sources and saves them directly to the raw data folder:
1. Web scraping from specific URLs
2. Reddit API using PRAW and Pushshift
3. Hugging Face datasets

Usage:
    python data_collector.py --source [web|reddit|pushshift|huggingface|all]
"""

import os
import json
import argparse
import requests
import pandas as pd
from tqdm import tqdm
from bs4 import BeautifulSoup
import praw
from datasets import load_dataset
import time
import logging
import datetime

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("data_collection.log"),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

# Define path to raw data folder
RAW_DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "raw")

# Create raw data directory if it doesn't exist
os.makedirs(RAW_DATA_PATH, exist_ok=True)

# Source URLs from source.txt
SOURCES = {
    "web": [
        "https://www.crisistextline.org/data-philosophy/",
        "https://www.who.int/data/gho/data/themes/mental-health"
    ],
    "reddit": {
        "subreddits": ["depression", "anxiety", "mentalhealth", "bipolar", "ptsd", "SuicideWatch"],
        "limit": 100  # Number of posts to fetch per subreddit
    },
    "pushshift": {
        "subreddits": ["depression", "anxiety", "mentalhealth", "bipolar", "ptsd", "SuicideWatch"],
        "limit": 500,  # Number of posts to fetch per subreddit
        "before": "30d",  # Fetch posts from the last 30 days
        "score": ">10"  # Only posts with score > 10
    }
}

def setup_reddit_api():
    """Set up and return a Reddit API instance using PRAW."""
    try:
        # You need to create a Reddit app at https://www.reddit.com/prefs/apps/
        # and get these credentials
        client_id = os.environ.get("REDDIT_CLIENT_ID")
        client_secret = os.environ.get("REDDIT_CLIENT_SECRET")
        user_agent = os.environ.get("REDDIT_USER_AGENT")
        
        # Check if credentials are available
        if not client_id or not client_secret or not user_agent:
            logger.warning("Reddit API credentials not found in environment variables.")
            # Use a configuration file as fallback if it exists
            config_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "reddit_config.json")
            if os.path.exists(config_path):
                with open(config_path, 'r') as f:
                    config = json.load(f)
                client_id = config.get("client_id")
                client_secret = config.get("client_secret")
                user_agent = config.get("user_agent")
                logger.info("Loaded Reddit API credentials from config file.")
            else:
                # Create a sample config file for the user
                sample_config = {
                    "client_id": "YOUR_CLIENT_ID",
                    "client_secret": "YOUR_CLIENT_SECRET",
                    "user_agent": "python:mental-health-data-collector:v1.0 (by /u/YOUR_USERNAME)"
                }
                with open(config_path, 'w') as f:
                    json.dump(sample_config, f, indent=4)
                logger.error(f"Reddit API credentials not found. Please edit {config_path} with your credentials.")
                return None
        
        reddit = praw.Reddit(
            client_id=client_id,
            client_secret=client_secret,
            user_agent=user_agent
        )
        
        # Verify the credentials
        reddit.user.me()  # This will raise an error if authentication fails
        
        logger.info("Successfully authenticated with Reddit API")
        return reddit
    
    except Exception as e:
        logger.error(f"Error setting up Reddit API: {e}")
        logger.error("Please make sure your Reddit API credentials are correct.")
        return None

def scrape_web_content(url):
    """Scrape content from a given URL."""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Extract title
        title = soup.title.string if soup.title else "No Title"
        
        # Extract main content (this is a simplified approach)
        content = []
        for paragraph in soup.find_all(['p', 'h1', 'h2', 'h3', 'h4', 'h5']):
            text = paragraph.get_text(strip=True)
            if text and len(text) > 20:  # Filter out very short paragraphs
                content.append(text)
        
        return {
            "url": url,
            "title": title,
            "content": content
        }
    except Exception as e:
        logger.error(f"Error scraping {url}: {e}")
        return {
            "url": url,
            "title": "Error",
            "content": [f"Failed to scrape content: {str(e)}"]
        }

def collect_web_data():
    """Collect data from web sources and save as JSON."""
    logger.info("Collecting data from web sources...")
    
    all_data = []
    for url in tqdm(SOURCES["web"], desc="Web Sources"):
        data = scrape_web_content(url)
        all_data.append(data)
        # Sleep to avoid overwhelming servers
        time.sleep(2)
    
    # Save data
    output_path = os.path.join(RAW_DATA_PATH, "web_articles.json")
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(all_data, f, ensure_ascii=False, indent=4)
    
    logger.info(f"Web data saved to {output_path}")

def collect_reddit_data():
    """Collect data from Reddit API using PRAW and save as JSON."""
    logger.info("Collecting data from Reddit using PRAW...")
    
    reddit = setup_reddit_api()
    if not reddit:
        logger.error("Could not initialize Reddit API. Skipping Reddit data collection.")
        return
    
    try:
        # Create separate files for each subreddit
        for subreddit_name in tqdm(SOURCES["reddit"]["subreddits"], desc="Subreddits"):
            subreddit_posts = []
            subreddit = reddit.subreddit(subreddit_name)
            
            # Collect hot posts
            for submission in tqdm(subreddit.hot(limit=SOURCES["reddit"]["limit"]), 
                                desc=f"Posts from r/{subreddit_name}", 
                                leave=False):
                # Skip stickied posts (usually announcements)
                if submission.stickied:
                    continue
                
                # Get top-level comments
                submission.comments.replace_more(limit=0)  # Skip "load more comments"
                comments = []
                for comment in submission.comments[:10]:  # Get top 10 comments
                    comments.append({
                        "id": comment.id,
                        "author": str(comment.author),
                        "body": comment.body,
                        "score": comment.score,
                        "created_utc": comment.created_utc
                    })
                
                post = {
                    "id": submission.id,
                    "subreddit": subreddit_name,
                    "title": submission.title,
                    "selftext": submission.selftext,
                    "author": str(submission.author),
                    "score": submission.score,
                    "upvote_ratio": submission.upvote_ratio,
                    "created_utc": submission.created_utc,
                    "num_comments": submission.num_comments,
                    "comments": comments
                }
                
                subreddit_posts.append(post)
                
                # Sleep to avoid hitting API rate limits
                time.sleep(1)
            
            # Save data for this subreddit
            if subreddit_posts:
                output_path = os.path.join(RAW_DATA_PATH, f"reddit_{subreddit_name}.json")
                with open(output_path, 'w', encoding='utf-8') as f:
                    json.dump(subreddit_posts, f, ensure_ascii=False, indent=4)
                
                logger.info(f"Reddit data for r/{subreddit_name} saved to {output_path} with {len(subreddit_posts)} posts")
    
    except Exception as e:
        logger.error(f"Error collecting Reddit data: {e}")

def collect_pushshift_data():
    """Collect data from Pushshift Reddit API and save as JSON."""
    logger.info("Collecting data from Pushshift Reddit API...")
    
    # Base URL for Pushshift API
    base_url = "https://api.pushshift.io/reddit/search/submission"
    
    # Calculate the timestamp for the 'before' parameter
    if SOURCES["pushshift"]["before"].endswith("d"):
        days = int(SOURCES["pushshift"]["before"][:-1])
        before_time = int((datetime.datetime.now() - datetime.timedelta(days=days)).timestamp())
    else:
        before_time = int(datetime.datetime.now().timestamp())
    
    for subreddit in tqdm(SOURCES["pushshift"]["subreddits"], desc="Subreddits"):
        subreddit_posts = []
        
        # Parameters for the API request
        params = {
            "subreddit": subreddit,
            "size": SOURCES["pushshift"]["limit"],
            "before": before_time,
            "sort": "desc",
            "sort_type": "created_utc"
        }
        
        # Add score filter if specified
        if "score" in SOURCES["pushshift"] and SOURCES["pushshift"]["score"]:
            params["score"] = SOURCES["pushshift"]["score"]
        
        try:
            response = requests.get(base_url, params=params, timeout=30)
            response.raise_for_status()
            data = response.json()
            
            # Process the submission data
            for submission in data.get("data", []):
                # Structure the post data
                post = {
                    "id": submission.get("id"),
                    "subreddit": submission.get("subreddit"),
                    "title": submission.get("title"),
                    "selftext": submission.get("selftext", ""),
                    "author": submission.get("author"),
                    "score": submission.get("score"),
                    "created_utc": submission.get("created_utc"),
                    "num_comments": submission.get("num_comments"),
                    "full_link": submission.get("full_link"),
                    "permalink": submission.get("permalink")
                }
                
                subreddit_posts.append(post)
            
            logger.info(f"Retrieved {len(data.get('data', []))} posts from r/{subreddit}")
            
            # Save data for this subreddit
            if subreddit_posts:
                output_path = os.path.join(RAW_DATA_PATH, f"pushshift_{subreddit}.json")
                with open(output_path, 'w', encoding='utf-8') as f:
                    json.dump(subreddit_posts, f, ensure_ascii=False, indent=4)
                
                logger.info(f"Pushshift data for r/{subreddit} saved to {output_path} with {len(subreddit_posts)} posts")
            
            # Sleep to avoid overwhelming the API
            time.sleep(1)
            
        except Exception as e:
            logger.error(f"Error collecting data from r/{subreddit} via Pushshift: {e}")


def main():
    parser = argparse.ArgumentParser(description="Collect data from various sources")
    parser.add_argument("--source", choices=["web", "reddit", "pushshift", "huggingface", "all"], 
                        default="all", help="Specify data source to collect from")
    
    args = parser.parse_args()
    
    if args.source == "web" or args.source == "all":
        collect_web_data()
    
    if args.source == "reddit" or args.source == "all":
        collect_reddit_data()
    
    if args.source == "pushshift" or args.source == "all":
        collect_pushshift_data()
    
    
    logger.info("Data collection completed!")

if __name__ == "__main__":
    main()


