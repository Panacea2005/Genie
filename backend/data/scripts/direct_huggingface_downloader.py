#!/usr/bin/env python3
"""
Direct Mental Health Datasets Downloader from Hugging Face

This script downloads mental health datasets directly from Hugging Face Hub API 
instead of using the datasets library. This can help bypass issues with the datasets library.

Requirements:
    pip install huggingface_hub pandas requests tqdm

Usage:
    python direct_huggingface_downloader.py
"""

import os
import json
import logging
import time
import requests
import pandas as pd
from tqdm import tqdm
from huggingface_hub import HfApi, login, list_repo_files, hf_hub_download
from typing import Dict, List, Any, Optional, Tuple
from pathlib import Path

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("direct_dataset_loader.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class DirectHuggingFaceDownloader:
    """
    Directly download datasets from Hugging Face Hub using the Hub API
    instead of the datasets library which may have issues with some datasets.
    """
    
    def __init__(self, save_dir: str = "data/raw", use_auth: bool = True):
        """
        Initialize the downloader.
        
        Args:
            save_dir: Directory to save downloaded datasets
            use_auth: Whether to authenticate with Hugging Face (recommended)
        """
        self.save_dir = save_dir
        os.makedirs(save_dir, exist_ok=True)
        self.api = HfApi()
        self.use_auth = use_auth
        self.token = None
        
        # Mental health datasets to download
        self.datasets_info = [
            {
                "repo_id": "fadodr/mental_health_therapy",
                "output_name": "mental_health_therapy.csv",
                "file_patterns": ["*.csv", "*.parquet", "data/*.csv", "data/*.parquet", "train.csv", "data.csv"]
            },
            {
                "repo_id": "arafatanam/Student-Mental-Health-Counseling-20K",
                "output_name": "student_mental_health_counseling.csv",
                "file_patterns": ["*.csv", "data/*.csv", "Student-Mental-Health-Counseling-20K.csv"]
            },
            {
                "repo_id": "tcabanski/mental_health_counseling_responses",
                "output_name": "mental_health_counseling_responses.csv",
                "file_patterns": ["*.csv", "data/*.csv", "mental_health_counseling_responses.csv"]
            },
            {
                "repo_id": "AnuradhaPoddar/synthetic_mental_health",
                "output_name": "synthetic_mental_health.csv",
                "file_patterns": ["*.csv", "data/*.csv", "synthetic_mental_health.csv"]
            },
            {
                "repo_id": "TungHamHoc/sentiment-mental-health",
                "output_name": "sentiment_mental_health.csv",
                "file_patterns": ["*.csv", "data/*.csv", "train.csv"]
            }
        ]
    
    def authenticate(self, token: Optional[str] = None):
        """
        Authenticate with the Hugging Face Hub.
        
        Args:
            token: Hugging Face API token (if None, will try to use cached token or prompt)
        """
        try:
            if token:
                login(token=token)
                self.token = token
            else:
                # This will use cached token or prompt for login
                login()
            logger.info("Authenticated with Hugging Face")
            return True
        except Exception as e:
            logger.warning(f"Authentication failed: {e}")
            logger.info("Continuing without authentication (may have limited access)")
            return False
    
    def list_dataset_files(self, repo_id: str) -> List[str]:
        """
        List all files in a Hugging Face dataset repository.
        
        Args:
            repo_id: Repository ID (e.g., 'username/dataset_name')
            
        Returns:
            List of file paths in the repository
        """
        try:
            files = list_repo_files(repo_id, repo_type="dataset")
            logger.info(f"Found {len(files)} files in {repo_id}")
            return files
        except Exception as e:
            logger.error(f"Error listing files for {repo_id}: {e}")
            return []
    
    def find_data_file(self, repo_id: str, file_patterns: List[str]) -> Optional[str]:
        """
        Find the main data file in a dataset repository.
        
        Args:
            repo_id: Repository ID
            file_patterns: List of file patterns to look for
            
        Returns:
            The path of the main data file, or None if not found
        """
        files = self.list_dataset_files(repo_id)
        
        # First try exact matches from the patterns
        for pattern in file_patterns:
            if '*' not in pattern:
                if pattern in files:
                    return pattern
        
        # Then try to match patterns
        for pattern in file_patterns:
            base_pattern = pattern.replace('*', '')
            for file in files:
                if pattern.startswith('*') and file.endswith(base_pattern):
                    return file
                elif pattern.endswith('*') and file.startswith(base_pattern):
                    return file
                elif base_pattern in file:
                    return file
        
        # If we can't find a match, use heuristics to find CSV files
        csv_files = [f for f in files if f.endswith('.csv')]
        if csv_files:
            # Prefer files with recognizable names
            for name in ['data', 'train', 'dataset']:
                for file in csv_files:
                    if name in file.lower():
                        return file
            # Otherwise, take the first CSV
            return csv_files[0]
            
        # Try parquet files if no CSV
        parquet_files = [f for f in files if f.endswith('.parquet')]
        if parquet_files:
            return parquet_files[0]
            
        # If we get here, we couldn't find a suitable file
        return None
    
    def download_file(self, repo_id: str, file_path: str, output_path: str) -> bool:
        """
        Download a file from Hugging Face.
        
        Args:
            repo_id: Repository ID
            file_path: Path to file within the repository
            output_path: Local path to save the file
            
        Returns:
            True if download was successful, False otherwise
        """
        try:
            # First try using the hf_hub_download function
            downloaded_path = hf_hub_download(
                repo_id=repo_id,
                filename=file_path,
                repo_type="dataset",
                local_dir=os.path.dirname(output_path),
                local_dir_use_symlinks=False
            )
            
            # If the downloaded file is not where we want it, move it
            if downloaded_path != output_path:
                if os.path.exists(downloaded_path):
                    os.rename(downloaded_path, output_path)
            
            logger.info(f"Downloaded {file_path} from {repo_id} to {output_path}")
            return True
        except Exception as e:
            logger.warning(f"hf_hub_download failed: {e}")
            
            # Fallback: Try direct URL download
            try:
                url = f"https://huggingface.co/datasets/{repo_id}/resolve/main/{file_path}"
                logger.info(f"Trying direct download from {url}")
                
                response = requests.get(url, stream=True)
                if response.status_code == 200:
                    total_size = int(response.headers.get('content-length', 0))
                    
                    with open(output_path, 'wb') as f, tqdm(
                        desc=file_path,
                        total=total_size,
                        unit='B',
                        unit_scale=True,
                        unit_divisor=1024,
                    ) as pbar:
                        for chunk in response.iter_content(chunk_size=8192):
                            if chunk:  # filter out keep-alive chunks
                                f.write(chunk)
                                pbar.update(len(chunk))
                    
                    logger.info(f"Direct download successful: {output_path}")
                    return True
                else:
                    logger.error(f"Direct download failed with status code: {response.status_code}")
                    return False
            except Exception as e2:
                logger.error(f"Direct download also failed: {e2}")
                return False
    
    def download_dataset(self, dataset_info: Dict[str, Any]) -> Tuple[bool, Optional[pd.DataFrame]]:
        """
        Download a dataset from Hugging Face.
        
        Args:
            dataset_info: Dictionary with dataset information
            
        Returns:
            Tuple of (success, DataFrame or None)
        """
        repo_id = dataset_info["repo_id"]
        output_name = dataset_info["output_name"]
        file_patterns = dataset_info["file_patterns"]
        
        logger.info(f"Downloading dataset: {repo_id}")
        
        # Find the main data file
        data_file = self.find_data_file(repo_id, file_patterns)
        if not data_file:
            logger.error(f"Could not find a suitable data file in {repo_id}")
            return False, None
        
        # Download the file
        output_path = os.path.join(self.save_dir, output_name)
        success = self.download_file(repo_id, data_file, output_path)
        
        if success and os.path.exists(output_path):
            # Load the data into a DataFrame for verification
            try:
                if output_path.endswith('.csv'):
                    df = pd.read_csv(output_path)
                elif output_path.endswith('.parquet'):
                    df = pd.read_parquet(output_path)
                    # Save as CSV as well for consistency
                    csv_path = output_path.replace('.parquet', '.csv')
                    df.to_csv(csv_path, index=False)
                    output_path = csv_path
                else:
                    logger.warning(f"Unsupported file format: {output_path}")
                    return True, None
                
                logger.info(f"Successfully loaded dataset with shape: {df.shape}")
                return True, df
            except Exception as e:
                logger.error(f"Error loading the downloaded file: {e}")
                return True, None
        
        return False, None
    
    def download_all_datasets(self) -> Dict[str, pd.DataFrame]:
        """
        Download all mental health datasets.
        
        Returns:
            Dictionary mapping dataset names to DataFrames
        """
        if self.use_auth:
            self.authenticate()
        
        results = {}
        
        for dataset_info in self.datasets_info:
            repo_id = dataset_info["repo_id"]
            short_name = repo_id.split('/')[-1]
            
            print(f"\n{'='*50}")
            print(f"Downloading {repo_id}")
            print(f"{'='*50}")
            
            success, df = self.download_dataset(dataset_info)
            
            if success:
                if df is not None:
                    output_path = os.path.join(self.save_dir, dataset_info["output_name"])
                    print(f"✓ Successfully downloaded: {output_path}")
                    print(f"  Shape: {df.shape}")
                    print(f"  Columns: {list(df.columns)}")
                    results[short_name] = df
                else:
                    print(f"✓ File downloaded but could not be loaded as DataFrame")
            else:
                print(f"✗ Failed to download {repo_id}")
            
            # Add a small delay between downloads
            time.sleep(1)
        
        return results
    
    def create_combined_dataset(self, datasets: Dict[str, pd.DataFrame]) -> Optional[pd.DataFrame]:
        """
        Combine all downloaded datasets into a single dataset.
        
        Args:
            datasets: Dictionary mapping dataset names to DataFrames
            
        Returns:
            Combined DataFrame or None if no datasets were successfully downloaded
        """
        if not datasets:
            logger.warning("No datasets to combine")
            return None
        
        print("\n" + "="*50)
        print("CREATING COMBINED DATASET")
        print("="*50)
        
        combined_dfs = []
        
        for name, df in datasets.items():
            # Add a source column to identify the original dataset
            df = df.copy()
            df['source_dataset'] = name
            combined_dfs.append(df)
            print(f"Adding {len(df)} rows from {name}")
        
        if combined_dfs:
            # Combine all datasets
            combined_df = pd.concat(combined_dfs, ignore_index=True)
            
            # Save the combined dataset
            output_path = os.path.join(self.save_dir, "combined_mental_health.csv")
            combined_df.to_csv(output_path, index=False)
            
            print(f"\n✓ Combined dataset saved to {output_path}")
            print(f"  Total rows: {len(combined_df)}")
            print(f"  Columns: {list(combined_df.columns)}")
            
            return combined_df
        
        return None

def main():
    """Main function to execute the downloader"""
    print("\n" + "="*50)
    print(" DIRECT HUGGING FACE DATASET DOWNLOADER ")
    print("="*50)
    print("This script downloads mental health datasets directly from Hugging Face Hub")
    print("without using the datasets library which may have issues with some datasets.")
    
    # Initialize the downloader
    downloader = DirectHuggingFaceDownloader()
    
    # Download all datasets
    datasets = downloader.download_all_datasets()
    
    # Count successful downloads
    successful = len(datasets)
    print(f"\nSuccessfully downloaded {successful}/{len(downloader.datasets_info)} datasets")
    
    # Create combined dataset
    if successful > 0:
        combined_df = downloader.create_combined_dataset(datasets)
    
    print("\n" + "="*50)
    print("DOWNLOAD COMPLETE!")
    print("="*50)
    print(f"All datasets saved to: {downloader.save_dir}")
    
    # List all files created
    data_dir = Path(downloader.save_dir)
    if data_dir.exists():
        csv_files = list(data_dir.glob("*.csv"))
        if csv_files:
            print("\nFiles created:")
            for file_path in csv_files:
                size_mb = file_path.stat().st_size / (1024 * 1024)
                try:
                    df = pd.read_csv(file_path)
                    shape_info = f", {df.shape[0]} rows, {df.shape[1]} cols"
                except:
                    shape_info = " (could not read file)"
                    
                print(f"  - {file_path.name} ({size_mb:.2f} MB{shape_info})")
        else:
            print("\nNo CSV files were created.")
    
    print("\nIf you still have issues downloading these datasets, you may need to:")
    print("1. Check your internet connection")
    print("2. Log in to Hugging Face: run 'huggingface-cli login'")
    print("3. Visit the dataset pages directly and download manually:")
    for dataset_info in downloader.datasets_info:
        print(f"   - https://huggingface.co/datasets/{dataset_info['repo_id']}")

if __name__ == "__main__":
    main()