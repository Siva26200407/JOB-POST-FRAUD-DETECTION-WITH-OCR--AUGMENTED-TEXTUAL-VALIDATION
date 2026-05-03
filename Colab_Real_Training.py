# !pip install transformers datasets evaluate torch scikit-learn pandas matplotlib seaborn

import pandas as pd
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification, Trainer, TrainingArguments
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_recall_fscore_support
import matplotlib.pyplot as plt
import os

# Dataset Class
class JobDataset(torch.utils.data.Dataset):
    def __init__(self, encodings, labels):
        self.encodings = encodings
        self.labels = labels

    def __getitem__(self, idx):
        item = {key: torch.tensor(val[idx]) for key, val in self.encodings.items()}
        item['labels'] = torch.tensor(self.labels[idx], dtype=torch.long)
        return item

    def __len__(self):
        return len(self.labels)

# Metrics Function
def compute_metrics(pred):
    labels = pred.label_ids
    preds = pred.predictions.argmax(-1)
    precision, recall, f1, _ = precision_recall_fscore_support(labels, preds, average='binary')
    acc = accuracy_score(labels, preds)
    return {
        'accuracy': acc,
        'f1': f1,
        'precision': precision,
        'recall': recall
    }

# Main Training Function
def train_model(model_name, df, output_dir):
    print(f"\n======================================")
    print(f" Start Training for {model_name}...")
    print(f"======================================\n")
    
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    
    train_texts, test_texts, train_labels, test_labels = train_test_split(
        df['text'].tolist(), df['label'].tolist(), test_size=0.2, random_state=42
    )

    train_encodings = tokenizer(train_texts, truncation=True, padding=True, max_length=128)
    test_encodings = tokenizer(test_texts, truncation=True, padding=True, max_length=128)

    train_dataset = JobDataset(train_encodings, train_labels)
    test_dataset = JobDataset(test_encodings, test_labels)

    model = AutoModelForSequenceClassification.from_pretrained(model_name, num_labels=2)

    training_args = TrainingArguments(
        output_dir=output_dir,
        num_train_epochs=3, # 3 Epochs runs faster for demo
        per_device_train_batch_size=16,
        per_device_eval_batch_size=16,
        warmup_steps=100,
        weight_decay=0.01,
        evaluation_strategy="epoch",
        save_strategy="epoch",
        load_best_model_at_end=True,
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=test_dataset,
        compute_metrics=compute_metrics,
    )

    trainer.train()
    eval_results = trainer.evaluate()
    
    return eval_results

# Load Dataset
print("Loading dataset...")
if not os.path.exists("train_processed.csv"):
    print("ERROR: Please upload 'train_processed.csv' to Colab first!")
else:
    df = pd.read_csv("train_processed.csv")
    
    # We take a sample of 2000 rows to train it in a reasonable time (~5-10 mins)
    if len(df) > 2000:
        df = df.sample(2000, random_state=42)

    # 1. Train distilbert (lighter version of BERT)
    bert_results = train_model("distilbert-base-uncased", df, "./results_bert")
    
    # 2. Train distilroberta (lighter version of RoBERTa)
    roberta_results = train_model("distilroberta-base", df, "./results_roberta")

    # 3. Plot Comparison Graph with REAL Metrics
    print("\n--- REAL EVALUATION RESULTS  ---")
    print(f"BERT    -> Acc: {bert_results['eval_accuracy']:.2f}, F1: {bert_results['eval_f1']:.2f}")
    print(f"RoBERTa -> Acc: {roberta_results['eval_accuracy']:.2f}, F1: {roberta_results['eval_f1']:.2f}")
    
    metrics = ['eval_accuracy', 'eval_f1', 'eval_precision', 'eval_recall']
    bert_scores = [bert_results[m] for m in metrics]
    roberta_scores = [roberta_results[m] for m in metrics]
    
    x = range(len(metrics))
    width = 0.35
    
    fig, ax = plt.subplots(figsize=(10, 6))
    ax.bar([i - width/2 for i in x], bert_scores, width, label='BERT', color='#3b82f6')
    ax.bar([i + width/2 for i in x], roberta_scores, width, label='RoBERTa', color='#10b981')
    
    ax.set_ylabel('Scores')
    ax.set_title('REAL BERT vs RoBERTa Performance on Fake Job Detection')
    ax.set_xticks(x)
    ax.set_xticklabels(['Accuracy', 'F1-Score', 'Precision', 'Recall'])
    ax.legend()
    plt.show()
