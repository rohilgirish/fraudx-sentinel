import pandas as pd
import numpy as np
import os
import json
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import RobustScaler
from sklearn.metrics import (precision_score, recall_score, average_precision_score,
                             confusion_matrix, roc_curve, precision_recall_curve, f1_score)
from imblearn.over_sampling import SMOTE
from imblearn.pipeline import Pipeline as ImbPipeline
from xgboost import XGBClassifier
from sklearn.ensemble import IsolationForest

import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from src.data_loader import DataLoader
from src.logger import get_logger

logger = get_logger("Pipeline")

def run_pipeline():
    loader = DataLoader()
    df = loader.load_raw_data()

    logger.info("Starting preprocessing...")
    amount_scaler = RobustScaler()
    time_scaler = RobustScaler()
    df['Amount'] = amount_scaler.fit_transform(df['Amount'].values.reshape(-1, 1))
    df['Time'] = time_scaler.fit_transform(df['Time'].values.reshape(-1, 1))

    X = df.drop('Class', axis=1)
    y = df['Class']

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=loader.config['data']['test_size'],
        random_state=loader.config['data']['random_state'], stratify=y
    )

    os.makedirs('models', exist_ok=True)
    joblib.dump(amount_scaler, 'models/amount_scaler.pkl')
    joblib.dump(time_scaler, 'models/time_scaler.pkl')
    joblib.dump(list(X.columns), 'models/feature_names.pkl')

    # Isolation Forest
    logger.info("Training Isolation Forest...")
    contam = loader.config['model']['isolation_forest']['contamination']
    iso_forest = IsolationForest(n_estimators=100, contamination=contam, random_state=42)
    iso_forest.fit(X_train)

    # XGBoost with SMOTE pipeline
    logger.info("Training XGBoost with SMOTE...")
    smote = SMOTE(sampling_strategy='minority', random_state=42)
    xgb_model = XGBClassifier(
        n_estimators=100, max_depth=4,
        scale_pos_weight=loader.config['model']['xgboost']['scale_pos_weight'],
        random_state=42, eval_metric='aucpr'
    )
    pipeline = ImbPipeline([('smote', smote), ('xgb', xgb_model)])
    pipeline.fit(X_train, y_train)

    logger.info("Evaluating on test set...")
    y_pred = pipeline.predict(X_test)
    y_prob = pipeline.predict_proba(X_test)[:, 1]

    precision = precision_score(y_test, y_pred)
    recall = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    pr_auc = average_precision_score(y_test, y_prob)
    cm = confusion_matrix(y_test, y_pred).tolist()

    # Cost-oriented threshold calculation
    # Cost = FN * C_fn + FP * C_fp
    C_fn = 2000
    C_fp = 50
    best_threshold = 0.5
    min_cost = float('inf')
    
    # thresholds from precision_recall_curve usually has length len(pr_prec)-1
    # We can also just iterate over thresholds returned by roc_curve, which has the same probabilities
    fpr, tpr, roc_thresholds = roc_curve(y_test, y_prob)
    P = sum(y_test) # Total positives
    N = len(y_test) - P # Total negatives
    
    for thresh in roc_thresholds:
        # Calculate FP and FN for this threshold
        y_pred_t = (y_prob >= thresh).astype(int)
        tn, fp, fn, tp = confusion_matrix(y_test, y_pred_t).ravel()
        cost = fn * C_fn + fp * C_fp
        if cost < min_cost:
            min_cost = cost
            best_threshold = float(thresh)
            
    # PR curve data
    pr_prec, pr_rec, _ = precision_recall_curve(y_test, y_prob)
    # Feature importances
    importances = pipeline.named_steps['xgb'].feature_importances_.tolist()

    # Save all evaluation data
    eval_data = {
        'precision': precision, 'recall': recall, 'f1': f1, 'pr_auc': pr_auc,
        'confusion_matrix': cm,
        'roc_fpr': fpr.tolist(), 'roc_tpr': tpr.tolist(),
        'pr_precision': pr_prec.tolist(), 'pr_recall': pr_rec.tolist(),
        'feature_names': list(X.columns),
        'feature_importances': importances,
        'fraud_amounts': df[df['Class'] == 1]['Amount'].tolist(),
        'normal_amounts': df[df['Class'] == 0]['Amount'].sample(500, random_state=42).tolist(),
        'cost_optimized_threshold': best_threshold,
        'min_expected_cost': float(min_cost)
    }
    with open('models/eval_data.json', 'w') as f:
        json.dump(eval_data, f)

    logger.info(f"Precision={precision:.3f}, Recall={recall:.3f}, F1={f1:.3f}, PR-AUC={pr_auc:.3f}")

    joblib.dump(pipeline.named_steps['xgb'], 'models/xgb_model.pkl')
    joblib.dump(iso_forest, 'models/isolation_forest.pkl')
    logger.info("Pipeline complete. Models and evaluation data saved.")

if __name__ == "__main__":
    run_pipeline()
