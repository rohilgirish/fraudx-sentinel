import pandas as pd
import yaml
import os
from src.logger import get_logger

logger = get_logger(__name__)

class DataLoader:
    def __init__(self, config_path: str = "config.yaml"):
        """
        Initializes the DataLoader by reading the config file.
        """
        self.config_path = config_path
        self.config = self._load_config()

    def _load_config(self) -> dict:
        """Loads configuration from the yaml file."""
        try:
            with open(self.config_path, "r") as f:
                config = yaml.safe_load(f)
            logger.info(f"Configuration loaded successfully from {self.config_path}")
            return config
        except Exception as e:
            logger.error(f"Failed to load configuration from {self.config_path}: {e}")
            raise

    def load_raw_data(self) -> pd.DataFrame:
        """
        Loads the raw credit card dataset.
        """
        data_path = self.config['paths']['raw_data']
        logger.info(f"Attempting to load raw data from {data_path}")
        
        if not os.path.exists(data_path):
            logger.error(f"Data file not found at {data_path}. Please make sure you have downloaded it.")
            raise FileNotFoundError(f"File not found: {data_path}")
            
        try:
            df = pd.read_csv(data_path)
            logger.info(f"Data loaded successfully. Shape: {df.shape}")
            return df
        except Exception as e:
            logger.error(f"Error loading data: {e}")
            raise
            
if __name__ == "__main__":
    # Quick test of the DataLoader initialization
    try:
        loader = DataLoader()
        logger.info("DataLoader initialized successfully. Ready to load data once downloaded.")
    except Exception as e:
        logger.error(f"DataLoader initialization failed: {e}")
