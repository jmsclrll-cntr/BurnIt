# BurnIt Datasets Directory

This directory contains the production training dataset for BurnIt's workout calorie burn prediction model.

## Active Dataset

* **`kaggle_calories_burnt.csv` (15,000 Records)**:
  - The gold-standard open Kaggle benchmark dataset for personal exercise and biometric calorie prediction.
  - Source: [Kaggle fmendes-DAT263x-demos](https://www.kaggle.com/datasets/fmendes/fmendesdat263xdemos)
  - Features:
    - `User_ID`: Individual participant identifier
    - `Gender`: `male` or `female`
    - `Age`: Age in years (18–79)
    - `Height`: Height in centimeters (123–222 cm)
    - `Weight`: Body weight in kilograms (36–132 kg)
    - `Duration`: Elapsed workout session length in minutes (1–30 min)
    - `Heart_Rate`: Average heart rate in beats per minute (BPM)
    - `Body_Temp`: Body temperature during exercise (°C)
    - `Calories`: **Target Label** — Kilocalories (kcal) expended

## Model Training
Run `python backend/train_calorie_model.py` to train the production Random Forest Regressor on this dataset.
- **Accuracy ($R^2$):** `0.9984` (99.84%)
- **Error Margin (MAE):** `±1.63 kcal`
- Model file saved to: `backend/models/calorie_model.joblib`


