# FraudX Sentinel: Enterprise-Grade Credit Card Fraud Detection and Risk Operations Console

## Project Overview
FraudX Sentinel is a comprehensive, real-time platform designed for credit card fraud detection and risk operations. It provides transaction monitoring, anomaly detection through supervised machine learning ensembles, and dynamic financial risk assessment. The system integrates an interactive visualization dashboard using React with a FastAPI-driven backend to deliver predictive insights and explainable AI for financial operations teams.

## Problem Statement
The accelerating volume of digital payments has created a critical gap between transaction throughput and fraud detection capability. Current risk operations challenges include:

*   **Extreme Class Imbalance:** Massive transaction streams are processed where conventional accuracy metrics fail due to the rarity of actual fraud.
*   **Static Thresholds:** Most traditional systems rely on static classification thresholds and react without accounting for the asymmetric financial costs of fraud detection.
*   **Opaque Decision Making:** Stringent financial regulations mandate transparent reasoning, yet many highly accurate prediction tools are opaque and difficult to audit.
*   **Fragmented Workflows:** A lack of unified systems that combine high-speed automated inference with human-readable auditability and operations control.

## Core Modules

### 1. Cost-Optimized Machine Learning Engine
This module monitors transaction risk through a supervised classification ensemble designed for high-recall fraud detection.

*   **Core Model:** Utilizes a gradient-boosted tree architecture (XGBoost) selected for high-speed inference and precision.
*   **Asymmetric Risk Profiling:** The model is strictly tuned to penalize missed fraud during training, addressing extreme class imbalance.
*   **Dynamic Thresholding:** Operations teams can adjust classification thresholds in real-time to balance False Positives versus False Negatives.
*   **Performance Metrics:** Achieves an 85.7% fraud recall and a 0.792 PR-AUC score, optimizing for high-cost fraud capture.

### 2. Explainable AI (XAI) and Policy Engine
This module ensures transparent reasoning for automated decisions and provides deterministic safety fallbacks.

*   **SHAP Integration:** Computes exact feature contributions in polynomial time, quantifying how each variable shifts the base risk score for regulatory compliance.
*   **Rules Engine:** A deterministic policy engine acts as an override safety net for transactions exhibiting unusual latency or extreme monetary values.
*   **Interactive Auditability:** Supports one-click generation of plain-text audit logs for compliance reporting and team communication.

## End-to-End Pipeline
The system operates through an integrated data and machine learning pipeline:

*   **Data Ingestion:** Automated processing of raw transaction datasets into engineered feature sets.
*   **ML Inference:** Real-time risk scoring and SHAP value computation via REST APIs.
*   **Alert Engine:** Threshold-based triggers and deterministic rules that flag high-risk transactions for review.
*   **Monitoring Layer:** A centralized, dark-mode operations console for continuous transaction surveillance and risk management.

## Workspace Structure
*   `api/`: FastAPI prediction endpoints and scoring logic.
*   `config.yaml`: Centralized hyperparameter and path definitions.
*   `data/`: Raw and processed dataset artifacts.
*   `frontend/`: React interface for real-time visualization and status monitoring.
*   `models/`: Centralized repository for serialized ensemble and classification models.
*   `notebooks/`: Exploratory data analysis and experimental modeling.
*   `reports/`: Visualizations and analytical outputs.
*   `src/`: Core data pipeline, training, and evaluation scripts.
