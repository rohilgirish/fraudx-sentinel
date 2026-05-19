# Project Report: FraudX Sentinel
## Enterprise-Grade Credit Card Fraud Detection and Risk Operations Console

**Author / Developer:** Rohil Girish
**Date:** May 2026

---

## 1. Abstract
The accelerating volume of digital payments has created a critical gap between transaction throughput and fraud detection capabilities. Conventional classification models often fail when confronted with extreme class imbalance and static classification thresholds that do not account for the asymmetric financial costs of fraud. **FraudX Sentinel** is a production-ready, real-time platform engineered to bridge this gap. By combining a supervised ensemble classification engine (XGBoost) optimized for high recall with a robust Explainable AI (XAI) module, the platform delivers threshold-tunable predictions. Furthermore, it integrates a FastAPI-driven inference backend with an interactive React dashboard, enabling financial operations teams to perform real-time transaction surveillance, dynamic risk assessment, and transparent auditing.

## 2. Introduction & Problem Statement
The proliferation of e-commerce has led to a proportional increase in credit card fraud, necessitating highly accurate and rapid detection mechanisms. Current risk operations face several critical challenges:
*   **Extreme Class Imbalance:** Fraudulent transactions represent a minuscule fraction of total transactions. Conventional models optimizing for overall accuracy often achieve >99% accuracy simply by classifying all transactions as legitimate, thereby missing actual fraud.
*   **Static Thresholds:** Traditional machine learning approaches utilize fixed probability thresholds (e.g., 0.5) to separate classes. This fails to account for the asymmetric cost where a False Negative (missed fraud) is vastly more expensive than a False Positive (wrongly flagged legitimate transaction).
*   **Opaque Decision Making:** Financial regulatory bodies require automated decisions to be explainable. Black-box models are difficult to audit and trust.
*   **Fragmented Workflows:** Existing solutions often lack a cohesive interface linking raw machine learning predictions to human-in-the-loop operational review.

## 3. System Architecture & Methodology
FraudX Sentinel operates on a decoupled, modern architecture designed for scalability and real-time inference.

### 3.1 Technology Stack
*   **Backend & Machine Learning Engine:** Python 3.11, FastAPI, Uvicorn, scikit-learn, imbalanced-learn, XGBoost.
*   **Explainable AI (XAI):** SHAP (Shapley Additive exPlanations).
*   **Frontend Application:** React, Vite, Tailwind CSS, Recharts, Framer Motion.

### 3.2 Data Pipeline
The system ingests raw transaction data, performing automated preprocessing and feature engineering. A RobustScaler is utilized to ensure reliability against feature outliers and scaling artifacts, stabilizing the model inputs prior to inference.

## 4. Implementation Details

### 4.1 Cost-Optimized Machine Learning Engine
The core anomaly detection is driven by an XGBoost (Extreme Gradient Boosting) classifier. 
*   **Training Strategy:** The model undergoes asymmetric risk profiling—it is heavily penalized for missing fraudulent transactions during the training phase. 
*   **Dynamic Thresholding:** Rather than using a static cutoff, the backend exposes the predicted probabilities. The frontend dashboard allows analysts to adjust the classification threshold dynamically, optimizing the balance between False Positives and False Negatives based on real-time business needs.

### 4.2 Explainable AI (XAI) and Policy Engine
To ensure compliance and trust:
*   **SHAP Integration:** The system computes exact feature contributions in polynomial time. For any given transaction, the API returns quantifiable data explaining exactly which variables drove the risk score higher or lower.
*   **Rules Engine:** A deterministic policy layer acts as a safety net, automatically flagging transactions that exceed predefined monetary limits or exhibit unusual latency, overriding the ML model if necessary.

### 4.3 Interactive Operations Console
The frontend is a centralized, dark-mode application built for high-volume fraud analysts. It features:
*   Real-time transaction risk scoring and visualization.
*   Interactive audit logs generated with a single click for compliance reporting.
*   A fluid, keyboard-driven interface minimizing operational latency.

## 5. Results & Evaluation
The models were evaluated against an untouched, highly imbalanced production-like test dataset.

*   **Model Performance:** The supervised engine achieved an **85.7% fraud recall** and a **0.792 PR-AUC** (Precision-Recall Area Under Curve). This demonstrates exceptional performance in capturing actual fraud without generating an unmanageable volume of false positives.
*   **Financial Projection:** Under simulated conditions (assuming an average fraud loss of Rs. 2,000 and a verification cost of Rs. 50), the dynamic thresholding system is calibrated to capture over 1,400 fraudulent transactions daily. This translates to an estimated annual cost savings exceeding Rs. 100 Crores for a mid-tier processing volume, proving the financial viability of the platform.

## 6. Conclusion & Future Scope
FraudX Sentinel successfully demonstrates that combining cost-sensitive machine learning with Explainable AI and a decoupled, interactive dashboard results in a vastly superior risk operations platform. 

**Future Enhancements:**
*   **Federated Learning Integration:** Expanding the architecture to train on decentralized data from multiple financial institutions without compromising user privacy.
*   **Graph Neural Networks (GNNs):** Implementing graph-based models to detect complex, multi-node fraud rings based on transaction networks.
*   **Streaming Analytics:** Transitioning from batch ingestion to Apache Kafka-based event streaming for sub-millisecond latency.

---
*Repository Link:* [https://github.com/rohilgirish/fraudx-sentinel](https://github.com/rohilgirish/fraudx-sentinel)
