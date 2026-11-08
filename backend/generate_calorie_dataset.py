import os
import random
import numpy as np
import pandas as pd

def generate_calorie_dataset(n_samples: int = 10000, output_paths = None):
    """
    Generates a physiologically realistic workout calorie expenditure dataset
    based on the Keytel et al. (2005) energy expenditure equations, augmented with
    Compendium of Physical Activities MET values, mechanical rep work, and form precision.
    """
    if output_paths is None:
        output_paths = [
            os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "datasets", "workout_calories.csv"),
            os.path.join(os.path.dirname(os.path.abspath(__file__)), "datasets", "workout_calories.csv"),
        ]

    np.random.seed(42)
    random.seed(42)

    exercises = ['squat', 'bicepcurl', 'pushup', 'plank', 'jumpingjack', 'mixed']
    # MET values (Metabolic Equivalent of Task)
    met_ratings = {
        'squat': 6.5,
        'bicepcurl': 4.2,
        'pushup': 5.2,
        'plank': 4.0,
        'jumpingjack': 8.8,
        'mixed': 6.2
    }

    genders = ['male', 'female']
    
    rows = []
    for _ in range(n_samples):
        gender = random.choice(genders)
        age = int(np.random.randint(18, 66))
        
        if gender == 'male':
            height = round(float(np.random.normal(176, 7.5)), 1)
            weight = round(float(np.random.normal(76, 12.0)), 1)
            gender_code = 1
        else:
            height = round(float(np.random.normal(163, 6.5)), 1)
            weight = round(float(np.random.normal(62, 10.0)), 1)
            gender_code = 0
            
        weight = max(42.0, min(130.0, weight))
        height = max(145.0, min(205.0, height))
        
        exercise = random.choice(exercises)
        duration_min = round(float(np.random.uniform(5.0, 50.0)), 1)
        
        # Max theoretical heart rate based on Tanaka formula: 208 - (0.7 * age)
        max_theoretical_hr = 208 - (0.7 * age)
        
        # Realistic exercise heart rates based on intensity and MET
        met = met_ratings[exercise]
        intensity_factor = met / 10.0
        
        base_hr = 95 + (intensity_factor * 45) + (weight * 0.15) - (age * 0.1)
        avg_hr = round(float(np.random.normal(base_hr, 12)), 1)
        avg_hr = max(85.0, min(max_theoretical_hr - 5, avg_hr))
        
        max_hr = round(float(avg_hr + np.random.uniform(12.0, 28.0)), 1)
        max_hr = max(avg_hr + 5, min(max_theoretical_hr + 5, max_hr))
        
        # Reps and sets based on duration and exercise
        sets = max(1, int(duration_min // random.uniform(4.0, 8.0)))
        if exercise == 'plank':
            reps = sets * int(np.random.uniform(30, 75)) # hold seconds
        elif exercise == 'jumpingjack':
            reps = int(duration_min * np.random.uniform(20, 35))
        else:
            reps = sets * int(np.random.uniform(8, 16))
            
        form_score = round(float(np.random.uniform(70.0, 100.0)), 1)
        
        # Clinically validated Keytel et al. (2005) equation for energy expenditure (EE in kcal/min)
        if gender == 'male':
            ee_min = ((-55.0969 + (0.6309 * avg_hr) + (0.1988 * weight) + (0.2017 * age)) / 4.184)
        else:
            ee_min = ((-20.4022 + (0.4472 * avg_hr) - (0.1263 * weight) + (0.074 * age)) / 4.184)
            
        ee_min = max(2.5, ee_min)
        
        # Adjust for exercise type (MET ratio) and form efficiency
        met_multiplier = met / 5.5
        form_multiplier = 0.90 + (form_score / 1000.0)
        
        # Total calories burned
        total_calories = round(float(ee_min * duration_min * met_multiplier * form_multiplier), 1)
        total_calories = max(15.0, total_calories)
        
        rows.append({
            'gender': gender,
            'age': age,
            'height_cm': height,
            'weight_kg': weight,
            'duration_min': duration_min,
            'avg_heart_rate': avg_hr,
            'max_heart_rate': max_hr,
            'exercise_type': exercise,
            'total_reps': reps,
            'total_sets': sets,
            'avg_form_score': form_score,
            'calories_burned': total_calories
        })
        
    df = pd.DataFrame(rows)
    
    for path in output_paths:
        os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
        df.to_csv(path, index=False)
        print(f"Dataset successfully created at: {path} ({len(df)} rows)")
        
    return df

if __name__ == "__main__":
    generate_calorie_dataset(10000)

