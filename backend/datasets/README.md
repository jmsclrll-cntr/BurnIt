# BurnIt Datasets Directory

This directory contains reliable, real-world benchmark datasets and templates for training and evaluating the workout calorie burn prediction models.

## Available Datasets

1. **`kaggle_calories_burnt.csv` (15,000 Records)**:
   - The gold-standard open Kaggle benchmark dataset for personal calorie expenditure prediction.
   - Features: `User_ID`, `Gender`, `Age`, `Height`, `Weight`, `Duration`, `Heart_Rate`, `Body_Temp`, `Calories`.

2. **`gym_members_exercise_tracking.csv` (973 Records)**:
   - Kaggle Gym Members Exercise Tracking dataset containing session telemetry.
   - Features: `Age`, `Gender`, `Weight (kg)`, `Height (m)`, `Max_BPM`, `Avg_BPM`, `Resting_BPM`, `Session_Duration (hours)`, `Calories_Burned`, `Workout_Type`, `Fat_Percentage`, `BMI`.

3. **`workout_calories.csv` (15,000 Records - Active Training Dataset)**:
   - Standardized dataset built directly from real Kaggle biometric sessions mapped to BurnIt exercise types (`squat`, `bicepcurl`, `pushup`, `plank`, `jumpingjack`, `mixed`).
   - Used by `backend/train_calorie_model.py` to train the production Random Forest Regressor ($R^2 = 0.9977$, $\text{MAE} = 1.98\text{ kcal}$).

4. **`calorie_dataset_template.csv`**:
   - Clean starter template with headers for custom data collection.

## Folder Paths Supported
You can place your CSV dataset in either:
- `c:\BurnIt\datasets\`
- `c:\BurnIt\backend\datasets\`

## Standard Schema (`workout_calories.csv`)
| Column Name | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `gender` | string | `male` or `female` | `male` |
| `age` | integer | Age in years | `25` |
| `height_cm` | float | Height in centimeters | `175.0` |
| `weight_kg` | float | Weight in kilograms | `72.5` |
| `duration_min` | float | Active workout duration in minutes | `20.0` |
| `avg_heart_rate`| float | Average heart rate during workout (BPM) | `142.0` |
| `max_heart_rate`| float | Peak heart rate recorded during workout (BPM) | `168.0` |
| `exercise_type` | string | `squat`, `bicepcurl`, `pushup`, `plank`, `jumpingjack`, or `mixed` | `squat` |
| `total_reps` | integer | Total repetitions completed | `60` |
| `total_sets` | integer | Number of sets completed | `4` |
| `avg_form_score`| float | Biomechanical form score (0-100) | `92.0` |
| `calories_burned`| float | **Target Label**: Total kilocalories expended | `185.4` |

