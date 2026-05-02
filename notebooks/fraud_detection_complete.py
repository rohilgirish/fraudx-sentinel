# FraudX Sentinel - Complete Project Notebook
# ============================================
# This script consolidates the entire project pipeline into a single
# executable file. It covers EDA, Preprocessing, Model Training,
# Evaluation, and Explainability.
#
# To convert to Jupyter Notebook: jupyter nbconvert --to notebook fraud_detection.py

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split, StratifiedKFold
from sklearn.preprocessing import RobustScaler
from sklearn.metrics import (classification_report, confusion_matrix,
                             roc_curve, precision_recall_curve,
                             average_precision_score, roc_auc_score)
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import IsolationForest
from sklearn.neighbors import LocalOutlierFactor
from imblearn.over_sampling import SMOTE
from imblearn.pipeline import Pipeline as ImbPipeline
from xgboost import XGBClassifier
import warnings
warnings.filterwarnings('ignore')

print("=" * 60)
print("  FRAUDX SENTINEL - COMPLETE ANALYSIS")
print("=" * 60)

# ── PHASE 1: DATA LOADING ──
print("\n[Phase 1] Loading Data...")
df = pd.read_csv('data/raw/creditcard.csv')
print(f"Dataset shape: {df.shape}")
print(f"Columns: {list(df.columns)}")

# ── PHASE 2: EDA ──
print("\n[Phase 2] Exploratory Data Analysis")
print(f"Class Distribution:\n{df['Class'].value_counts()}")
fraud_pct = df['Class'].mean() * 100
print(f"Fraud Percentage: {fraud_pct:.3f}%")
print(f"\nFraud Amount Stats:\n{df[df['Class']==1]['Amount'].describe()}")
print(f"\nNormal Amount Stats:\n{df[df['Class']==0]['Amount'].describe()}")

# Top discriminative features
correlations = df.corr()['Class'].abs().sort_values(ascending=False)
print(f"\nTop 5 Most Discriminative Features: {list(correlations[1:6].index)}")

# ── PHASE 3: PREPROCESSING ──
print("\n[Phase 3] Preprocessing...")
scaler = RobustScaler()
df['Amount'] = scaler.fit_transform(df['Amount'].values.reshape(-1, 1))
df['Time'] = scaler.fit_transform(df['Time'].values.reshape(-1, 1))

X = df.drop('Class', axis=1)
y = df['Class']
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
print(f"Train: {X_train.shape}, Test: {X_test.shape}")

# ── PHASE 4: UNSUPERVISED MODELS ──
print("\n[Phase 4] Unsupervised Anomaly Detection")

# Isolation Forest
iso = IsolationForest(n_estimators=100, contamination=0.0017, random_state=42)
iso.fit(X_train)
iso_pred = iso.predict(X_test)
iso_pred = [1 if x == -1 else 0 for x in iso_pred]
print(f"Isolation Forest Results:")
print(classification_report(y_test, iso_pred, target_names=['Normal', 'Fraud']))

# Local Outlier Factor
lof = LocalOutlierFactor(n_neighbors=20, contamination=0.0017)
lof_pred = lof.fit_predict(X_test)
lof_pred = [1 if x == -1 else 0 for x in lof_pred]
print(f"Local Outlier Factor Results:")
print(classification_report(y_test, lof_pred, target_names=['Normal', 'Fraud']))

# ── PHASE 5: SUPERVISED MODELS ──
print("\n[Phase 5] Supervised Classification")

# Baseline: Logistic Regression
print("--- Logistic Regression (Baseline) ---")
lr = LogisticRegression(max_iter=1000, random_state=42)
lr.fit(X_train, y_train)
lr_pred = lr.predict(X_test)
print(classification_report(y_test, lr_pred, target_names=['Normal', 'Fraud']))

# XGBoost with SMOTE
print("--- XGBoost + SMOTE ---")
smote = SMOTE(sampling_strategy='minority', random_state=42)
xgb = XGBClassifier(n_estimators=100, max_depth=4, scale_pos_weight=577, random_state=42, eval_metric='aucpr')
pipe = ImbPipeline([('smote', smote), ('xgb', xgb)])
pipe.fit(X_train, y_train)
xgb_pred = pipe.predict(X_test)
xgb_prob = pipe.predict_proba(X_test)[:, 1]
print(classification_report(y_test, xgb_pred, target_names=['Normal', 'Fraud']))

# ── PHASE 6: EVALUATION ──
print("\n[Phase 6] Detailed Evaluation")

pr_auc = average_precision_score(y_test, xgb_prob)
roc_auc = roc_auc_score(y_test, xgb_prob)
print(f"PR-AUC: {pr_auc:.4f}")
print(f"ROC-AUC: {roc_auc:.4f}")

# Model Comparison Table
print("\n--- Model Comparison ---")
comparison = pd.DataFrame({
    'Model': ['Logistic Regression', 'Isolation Forest', 'Local Outlier Factor', 'XGBoost + SMOTE'],
    'Precision': [
        classification_report(y_test, lr_pred, output_dict=True)['Fraud']['precision'],
        classification_report(y_test, iso_pred, output_dict=True)['Fraud']['precision'],
        classification_report(y_test, lof_pred, output_dict=True)['Fraud']['precision'],
        classification_report(y_test, xgb_pred, output_dict=True)['Fraud']['precision'],
    ],
    'Recall': [
        classification_report(y_test, lr_pred, output_dict=True)['Fraud']['recall'],
        classification_report(y_test, iso_pred, output_dict=True)['Fraud']['recall'],
        classification_report(y_test, lof_pred, output_dict=True)['Fraud']['recall'],
        classification_report(y_test, xgb_pred, output_dict=True)['Fraud']['recall'],
    ]
})
print(comparison.to_string(index=False))

# Confusion Matrix
cm = confusion_matrix(y_test, xgb_pred)
print(f"\nXGBoost Confusion Matrix:\n{cm}")

print("\n" + "=" * 60)
print("  ANALYSIS COMPLETE")
print("=" * 60)
