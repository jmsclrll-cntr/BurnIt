import os
import glob
import logging
from typing import Dict, Any, Tuple
import pandas as pd
import numpy as np
from config import settings

logger = logging.getLogger("burnit.train")

def train_exercise_classifier(n_estimators: int = 100, test_size: float = 0.2) -> Dict[str, Any]:
    """
    Loads all recorded exercise CSVs, builds feature matrix, splits train/test
    by subject_id to prevent data leakage, trains a RandomForest model,
    evaluates confusion matrix and accuracy, and saves to models/exercise_model.joblib.
    """
    csv_pattern = os.path.join(settings.DATASET_DIR, "*.csv")
    csv_files = glob.glob(csv_pattern)

    if not csv_files:
        return {
            "success": False,
            "error": f"No CSV dataset files found in {settings.DATASET_DIR}. Record data first.",
        }

    dfs = []
    for f in csv_files:
        try:
            df = pd.read_csv(f)
            if len(df) > 0:
                dfs.append(df)
        except Exception as e:
            logger.error("Failed to read CSV %s: %s", f, e)

    if not dfs:
        return {"success": False, "error": "No valid data could be read from dataset CSVs."}

    data = pd.concat(dfs, ignore_index=True)
    if len(data) < 20:
        return {
            "success": False,
            "error": f"Not enough samples to train ({len(data)} rows). Need at least 20.",
        }

    # Features: Normalized landmarks (norm_0_x...norm_32_z) + Joint angles
    norm_cols = [c for c in data.columns if c.startswith("norm_")]
    angle_cols = [c for c in data.columns if c.startswith("angle_")]
    feature_cols = norm_cols + angle_cols

    X = data[feature_cols].fillna(0.0).values
    y = data["exercise"].astype(str).values
    subjects = data["subject_id"].astype(str).values

    from sklearn.ensemble import RandomForestClassifier
    from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
    from sklearn.model_selection import GroupShuffleSplit
    import joblib

    # Split by subject_id to avoid subject leakage
    gss = GroupShuffleSplit(n_splits=1, test_size=test_size, random_state=42)
    train_idx, test_idx = next(gss.split(X, y, groups=subjects))

    X_train, X_test = X[train_idx], X[test_idx]
    y_train, y_test = y[train_idx], y[test_idx]

    # Fallback to standard split if only one subject recorded
    if len(np.unique(y_test)) == 0 or len(X_test) == 0:
        from sklearn.model_selection import train_test_split
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=test_size, random_state=42)

    clf = RandomForestClassifier(n_estimators=n_estimators, random_state=42, n_jobs=-1)
    clf.fit(X_train, y_train)

    preds = clf.predict(X_test)
    acc = float(accuracy_score(y_test, preds))
    report = classification_report(y_test, preds, output_dict=True, zero_division=0)
    labels = sorted(list(set(y_test) | set(preds)))
    cm = confusion_matrix(y_test, preds, labels=labels).tolist()

    os.makedirs(settings.MODEL_DIR, exist_ok=True)
    out_path = os.path.join(settings.MODEL_DIR, "exercise_model.joblib")
    joblib.dump(clf, out_path)
    logger.info("Saved trained model to %s with accuracy %.4f", out_path, acc)

    return {
        "success": True,
        "accuracy": round(acc, 4),
        "total_samples": len(data),
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "labels": labels,
        "confusion_matrix": cm,
        "classification_report": report,
        "model_file": out_path,
    }

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    res = train_exercise_classifier()
    print("Training result:", res)

