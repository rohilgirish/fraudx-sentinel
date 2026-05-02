"""
Phase 2: Exploratory Data Analysis & Deep Insights

This script generates the visualizations and the narrative "story" for our credit card fraud dataset.
Run this script to generate insight plots in a 'reports/figures' folder and read the analysis in the console.
"""

import sys
import os
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

# Add project root to path so we can import our src modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from src.data_loader import DataLoader
from src.logger import get_logger

logger = get_logger("EDA_Story")

def create_eda_story():
    # Ensure figures directory exists
    os.makedirs("reports/figures", exist_ok=True)
    
    logger.info("Loading dataset for EDA...")
    df = DataLoader().load_raw_data()
    
    print("\n" + "="*60)
    print("         --- THE STORY OF CREDIT CARD FRAUD ---")
    print("="*60 + "\n")
    
    # 1. The Imbalance Story
    fraud_count = df['Class'].value_counts()[1]
    normal_count = df['Class'].value_counts()[0]
    fraud_pct = (fraud_count / len(df)) * 100
    
    print("--- 1. The Needle in the Haystack ---")
    print(f"Total Transactions: {len(df):,}")
    print(f"Normal: {normal_count:,}")
    print(f"Fraud: {fraud_count:,} ({fraud_pct:.3f}%)")
    print("\n* Insight: Why is fraud rare but impactful?")
    print("Fraud accounts for only 0.17% of transactions. A naive model that just guesses 'Normal' every")
    print("time will be 99.8% accurate, but completely useless for business. A single missed fraud can cost")
    print("thousands of dollars and erode customer trust. This extreme imbalance means accuracy is dead;")
    print("we must focus on Precision, Recall, and the cost of False Negatives.\n")
    
    # Plot Class Imbalance
    plt.figure(figsize=(8, 5))
    sns.countplot(x='Class', data=df, hue='Class', palette='Set1', legend=False)
    plt.title('Class Distribution (0: Normal, 1: Fraud)')
    plt.yscale('log')
    plt.ylabel('Count (Log Scale)')
    plt.savefig('reports/figures/01_class_imbalance.png')
    plt.close()
    
    # 2. Amount Distribution
    print("--- 2. The Thief's Footprint: Transaction Amounts ---")
    fraud_amt = df[df['Class'] == 1]['Amount'].describe()
    normal_amt = df[df['Class'] == 0]['Amount'].describe()
    print(f"Average Fraud Transaction: ${fraud_amt['mean']:.2f}")
    print(f"Average Normal Transaction: ${normal_amt['mean']:.2f}")
    print(f"Max Fraud Transaction: ${fraud_amt['max']:.2f}")
    print("\n* Insight: Are frauds always large purchases?")
    print("Interestingly, no. Fraudulent transactions average around $122, slightly higher than normal ")
    print("transactions ($88). However, fraudsters often make small test purchases before a big strike.")
    print("Because the amounts overlap heavily, 'Amount' alone isn't enough to catch them.\n")
    
    # 3. Finding the Discriminative Features
    print("--- 3. Unmasking the Fraudsters: The Top 5 Features ---")
    logger.info("Calculating correlations to find the most discriminative features...")
    
    # We look at absolute correlation with the target variable
    correlations = df.corr()['Class'].abs().sort_values(ascending=False)
    # Exclude 'Class' itself
    top_5_features = correlations[1:6].index.tolist()
    
    print(f"\nThe Top 5 Most Discriminative Features are: {top_5_features}")
    print("\n* Insight: Which features separate fraud most clearly?")
    print("The features V1-V28 are anonymized (PCA transformed). However, features like V17, V14, and V12")
    print("show massive divergence. In a normal transaction, these features cluster tightly around zero.")
    print("In fraudulent transactions, these specific features display extreme negative outliers. Our models ")
    print("will rely heavily on these distinct multidimensional signatures to separate the classes.\n")
    
    # Plot Distributions of Top 3 features
    fig, axes = plt.subplots(1, 3, figsize=(18, 5))
    for i, feature in enumerate(top_5_features[:3]):
        sns.kdeplot(df[df['Class'] == 0][feature], label='Normal', fill=True, ax=axes[i], color='blue')
        sns.kdeplot(df[df['Class'] == 1][feature], label='Fraud', fill=True, ax=axes[i], color='red')
        axes[i].set_title(f'Distribution of {feature}')
        axes[i].legend()
    plt.tight_layout()
    plt.savefig('reports/figures/02_top_features_distribution.png')
    plt.close()
    
    print("============================================================")
    print("[DONE] EDA Visualizations successfully saved to 'reports/figures/'.")
    print("[DONE] Phase 2 Complete! Next up: Phase 3 (Advanced Preprocessing).")

if __name__ == "__main__":
    create_eda_story()
