from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import pandas as pd
import numpy as np
import shap
import json
import time
import logging
from typing import Dict, List, Any

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("FraudX-API")

app = FastAPI(title="FraudX Sentinel API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

try:
    xgb_model     = joblib.load('models/xgb_model.pkl')
    amount_scaler = joblib.load('models/amount_scaler.pkl')
    time_scaler   = joblib.load('models/time_scaler.pkl')
    feature_names = joblib.load('models/feature_names.pkl')
    explainer     = shap.TreeExplainer(xgb_model)
    with open('models/eval_data.json', 'r') as f:
        eval_data = json.load(f)
    COST_THRESHOLD = eval_data.get('cost_optimized_threshold', 0.5)
    logger.info(f"Models loaded. Cost-optimal threshold: {COST_THRESHOLD:.4f}")
except Exception as e:
    logger.warning(f"Could not load models. Run pipeline.py first. Error: {e}")
    COST_THRESHOLD = 0.5
    eval_data = {}

class TransactionInput(BaseModel):
    Amount: float = 150.0
    Time:   float = 3600.0
    V17:    float = 0.0
    V14:    float = 0.0
    V12:    float = 0.0

class PredictionOutput(BaseModel):
    risk_score:      float
    prediction:      str
    probability:     float
    shap_values:     Dict[str, float]
    rules_triggered: List[str]

@app.middleware("http")
async def latency_logger(request: Request, call_next):
    t0 = time.time()
    response = await call_next(request)
    ms = (time.time() - t0) * 1000
    response.headers["X-Process-Time-Ms"] = f"{ms:.2f}"
    logger.info(f"{request.method} {request.url.path} — {ms:.2f}ms")
    return response

@app.get("/")
def root():
    return {"service": "FraudX Sentinel API", "status": "online", "version": "2.0.0"}

@app.get("/eval_data")
def get_eval_data():
    return eval_data

def evaluate_rules(txn: TransactionInput):
    rules, modifier = [], 0.0
    if txn.Amount > 5000:
        rules.append("High Amount (> $5k)")
        modifier += 0.15
    if txn.Time < 20000 and txn.Amount > 1000:
        rules.append("High Amount + Unusual Time")
        modifier += 0.10
    return rules, modifier

def process_predictions(transactions: List[TransactionInput]) -> List[PredictionOutput]:
    try:
        if not transactions:
            return []
        rows = []
        for txn in transactions:
            row = {f: 0.0 for f in feature_names}
            row['Amount'] = float(amount_scaler.transform([[txn.Amount]])[0][0])
            row['Time']   = float(time_scaler.transform([[txn.Time]])[0][0])
            row['V17']    = txn.V17
            row['V14']    = txn.V14
            row['V12']    = txn.V12
            rows.append(row)

        df = pd.DataFrame(rows)[feature_names]
        probs     = xgb_model.predict_proba(df)[:, 1]
        shap_vals = explainer(df)

        results = []
        for i, txn in enumerate(transactions):
            prob   = float(probs[i])
            rules, modifier = evaluate_rules(txn)
            final  = min(prob + modifier, 1.0)
            label  = "FRAUD" if final > COST_THRESHOLD else "LEGITIMATE"
            shap_d = {feature_names[j]: float(shap_vals.values[i][j]) for j in range(len(feature_names))}
            results.append(PredictionOutput(
                risk_score=round(final * 100, 2),
                prediction=label,
                probability=round(final, 4),
                shap_values=shap_d,
                rules_triggered=rules
            ))
        return results
    except Exception as e:
        import traceback
        logger.error(f"process_predictions error: {traceback.format_exc()}")
        raise


@app.post("/predict", response_model=PredictionOutput)
def predict(txn: TransactionInput):
    return process_predictions([txn])[0]

@app.post("/predict_batch", response_model=List[PredictionOutput])
def predict_batch(txns: List[TransactionInput]):
    return process_predictions(txns)
