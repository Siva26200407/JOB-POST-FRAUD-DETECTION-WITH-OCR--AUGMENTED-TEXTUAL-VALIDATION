import pandas as pd
import re
import numpy as np
from sklearn.model_selection import train_test_split

def clean_text(text):
    if pd.isna(text):
        return ""
    text = text.lower()
    text = re.sub(r'http\S+|www\S+|https\S+', '', text, flags=re.MULTILINE)
    text = re.sub(r'\@\w+|\#','', text)
    text = re.sub(r'[^\w\s]', '', text)
    return text

def preprocess_data(file_path):
    print(f"Loading dataset from {file_path}...")
    df = pd.read_csv(file_path)
    
    # Required columns: title, location, company_profile, description, requirements, label
    # Assuming 'fraudulent' is the label column if 'label' isn't present
    label_col = 'label' if 'label' in df.columns else 'fraudulent'
    
    # Handle missing values
    if 'description' in df.columns:
        df['description'] = df['description'].fillna("Not Provided")
    else:
        df['description'] = ""
    
    # Clean text (Only using description)
    print("Cleaning description text...")
    df['clean_text'] = df['description'].apply(clean_text)
    
    # Balance the dataset to fix bias (undersampling majority class)
    print("Balancing dataset to remove bias...")
    fake_jobs = df[df[label_col] == 1]
    real_jobs = df[df[label_col] == 0]
    
    # Undersample real jobs to match the number of fake jobs
    if len(fake_jobs) < len(real_jobs) and len(fake_jobs) > 0:
        real_jobs = real_jobs.sample(len(fake_jobs), random_state=42)
    
    balanced_df = pd.concat([fake_jobs, real_jobs]).sample(frac=1, random_state=42).reset_index(drop=True)
    
    # Split dataset
    X = balanced_df['clean_text'].values
    y = balanced_df[label_col].values
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    print(f"Data split successful. Training set: {len(X_train)}, Testing set: {len(X_test)}")
    
    # Save processed data for modeling
    train_df = pd.DataFrame({'text': X_train, 'label': y_train})
    test_df = pd.DataFrame({'text': X_test, 'label': y_test})
    
    train_df.to_csv("train_processed.csv", index=False)
    test_df.to_csv("test_processed.csv", index=False)
    print("Processed datasets saved as train_processed.csv and test_processed.csv")

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        preprocess_data(sys.argv[1])
    else:
        preprocess_data("../Job post dataset.csv")

