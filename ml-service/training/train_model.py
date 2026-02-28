"""
Train Random Forest model for PLM risk prediction.

This script:
1. Loads training data
2. Performs feature engineering
3. Trains Random Forest Regressor
4. Evaluates model performance
5. Saves trained model for production
"""

import json
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime
import os


class RiskModelTrainer:
    """Train and evaluate PLM risk prediction model."""
    
    def __init__(self, data_path: str = "data/training_data.json"):
        """Initialize trainer with training data."""
        self.data_path = data_path
        self.model = None
        self.feature_names = None
        self.training_metrics = {}
        
    def load_data(self) -> pd.DataFrame:
        """Load training data from JSON."""
        print(f"\n📂 Loading training data from {self.data_path}...")
        
        with open(self.data_path, 'r') as f:
            data = json.load(f)
        
        df = pd.DataFrame(data)
        print(f"✅ Loaded {len(df)} training examples")
        
        return df
    
    def engineer_features(self, df: pd.DataFrame) -> tuple:
        """
        Convert raw data into ML features.
        
        Returns:
            X: Feature matrix
            y: Target (risk_score)
        """
        print("\n🔧 Engineering features...")
        
        # Encode change_type (one-hot)
        change_type_dummies = pd.get_dummies(df['change_type'], prefix='change')
        
        # Encode lifecycle_state (one-hot)
        lifecycle_dummies = pd.get_dummies(df['lifecycle_state'], prefix='lifecycle')
        
        # Numerical features
        numerical_features = df[[
            'bom_depth',
            'where_used_count',
            'released_affected',
            'conflicting_changes'
        ]].copy()
        
        # Boolean feature
        numerical_features['has_compliance'] = df['has_compliance_issues'].astype(int)
        
        # Derived features (feature engineering)
        numerical_features['released_ratio'] = np.where(
            df['where_used_count'] > 0,
            df['released_affected'] / df['where_used_count'],
            0
        )
        
        numerical_features['complexity_score'] = (
            df['bom_depth'] * 0.3 + 
            df['where_used_count'] * 0.2
        )
        
        numerical_features['conflict_density'] = (
            df['conflicting_changes'] * df['released_affected']
        )
        
        # Combine all features
        X = pd.concat([
            numerical_features,
            change_type_dummies,
            lifecycle_dummies
        ], axis=1)
        
        # Target variable
        y = df['risk_score'].values
        
        self.feature_names = X.columns.tolist()
        
        print(f"✅ Created {X.shape[1]} features")
        print(f"   Base features: {len(numerical_features.columns)}")
        print(f"   Change types:  {len(change_type_dummies.columns)}")
        print(f"   Lifecycle:     {len(lifecycle_dummies.columns)}")
        
        return X.values, y
    
    def train(self, X, y, test_size=0.2, random_state=42):
        """
        Train Random Forest model.
        """
        print("\n🎯 Training Random Forest model...")
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=random_state
        )
        
        print(f"   Training set:   {len(X_train)} examples")
        print(f"   Test set:       {len(X_test)} examples")
        
        # Train Random Forest Regressor
        self.model = RandomForestRegressor(
            n_estimators=100,
            max_depth=12,
            min_samples_split=5,
            min_samples_leaf=2,
            max_features='sqrt',
            random_state=random_state,
            n_jobs=-1,
            verbose=0
        )
        
        print("\n   Training in progress...")
        self.model.fit(X_train, y_train)
        print("✅ Model training complete!")
        
        # Evaluate
        train_score = self.model.score(X_train, y_train)
        test_score = self.model.score(X_test, y_test)
        
        y_pred_train = self.model.predict(X_train)
        y_pred_test = self.model.predict(X_test)
        
        # Metrics
        self.training_metrics = {
            'train_r2': train_score,
            'test_r2': test_score,
            'train_rmse': np.sqrt(mean_squared_error(y_train, y_pred_train)),
            'test_rmse': np.sqrt(mean_squared_error(y_test, y_pred_test)),
            'train_mae': mean_absolute_error(y_train, y_pred_train),
            'test_mae': mean_absolute_error(y_test, y_pred_test),
            'n_features': X.shape[1],
            'n_trees': self.model.n_estimators,
            'trained_at': datetime.utcnow().isoformat()
        }
        
        # Cross-validation
        print("\n   Running 5-fold cross-validation...")
        cv_scores = cross_val_score(
            self.model, X_train, y_train, 
            cv=5, 
            scoring='r2',
            n_jobs=-1
        )
        self.training_metrics['cv_r2_mean'] = cv_scores.mean()
        self.training_metrics['cv_r2_std'] = cv_scores.std()
        
        return X_train, X_test, y_train, y_test, y_pred_train, y_pred_test
    
    def print_evaluation(self):
        """Print model evaluation metrics."""
        print("\n" + "="*60)
        print("MODEL EVALUATION RESULTS")
        print("="*60)
        
        print(f"\n🎯 Training Performance:")
        print(f"   R² Score:        {self.training_metrics['train_r2']:.4f}")
        print(f"   RMSE:            {self.training_metrics['train_rmse']:.4f}")
        print(f"   MAE:             {self.training_metrics['train_mae']:.4f}")
        
        print(f"\n🧪 Test Performance:")
        print(f"   R² Score:        {self.training_metrics['test_r2']:.4f}")
        print(f"   RMSE:            {self.training_metrics['test_rmse']:.4f}")
        print(f"   MAE:             {self.training_metrics['test_mae']:.4f}")
        
        print(f"\n🔄 Cross-Validation (5-fold):")
        print(f"   Mean R²:        {self.training_metrics['cv_r2_mean']:.4f}")
        print(f"   Std R²:         {self.training_metrics['cv_r2_std']:.4f}")
        
        # Model interpretation
        print(f"\n💡 Model Interpretation:")
        if self.training_metrics['test_r2'] > 0.85:
            print("   ✅ EXCELLENT - Model explains >85% of variance")
        elif self.training_metrics['test_r2'] > 0.75:
            print("   ✅ GOOD - Model explains >75% of variance")
        elif self.training_metrics['test_r2'] > 0.65:
            print("   ⚠️  FAIR - Model explains >65% of variance")
        else:
            print("   ❌ POOR - Consider more features or data")
        
        mae = self.training_metrics['test_mae']
        print(f"   Average prediction error: ±{mae:.2f} risk points (0-10 scale)")
        
        print("\n" + "="*60)
    
    def plot_feature_importance(self, top_n=15, save_path="models/feature_importance.png"):
        """Plot and save feature importance."""
        if self.model is None or self.feature_names is None:
            print("⚠️  Model not trained yet")
            return
        
        print(f"\n📊 Analyzing feature importance...")
        
        # Get feature importance
        importances = self.model.feature_importances_
        indices = np.argsort(importances)[::-1][:top_n]
        
        # Create DataFrame
        importance_df = pd.DataFrame({
            'Feature': [self.feature_names[i] for i in indices],
            'Importance': importances[indices]
        })
        
        print(f"\nTop {top_n} Most Important Features:")
        for idx, row in importance_df.iterrows():
            print(f"   {idx+1:2d}. {row['Feature']:25s} {row['Importance']:.4f}")
        
        # Plot
        plt.figure(figsize=(10, 8))
        plt.barh(range(top_n), importance_df['Importance'], align='center')
        plt.yticks(range(top_n), importance_df['Feature'])
        plt.xlabel('Feature Importance', fontsize=12)
        plt.title('Top Features for Risk Prediction', fontsize=14, fontweight='bold')
        plt.tight_layout()
        
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        plt.savefig(save_path, dpi=150, bbox_inches='tight')
        print(f"\n✅ Feature importance plot saved to {save_path}")
    
    def save_model(self, model_path="models/risk_model.pkl"):
        """Save trained model to disk."""
        if self.model is None:
            print("⚠️  No model to save")
            return
        
        os.makedirs(os.path.dirname(model_path), exist_ok=True)
        
        # Save model
        joblib.dump(self.model, model_path)
        print(f"\n✅ Model saved to {model_path}")
        
        # Save metadata
        metadata_path = model_path.replace('.pkl', '_metadata.json')
        with open(metadata_path, 'w') as f:
            json.dump({
                'feature_names': self.feature_names,
                'metrics': self.training_metrics,
                'model_type': 'RandomForestRegressor',
                'sklearn_version': joblib.__version__
            }, f, indent=2)
        
        print(f"✅ Metadata saved to {metadata_path}")
        
        # Print file sizes
        model_size_mb = os.path.getsize(model_path) / (1024 * 1024)
        print(f"\n   Model size: {model_size_mb:.2f} MB")


def main():
    """Main training pipeline."""
    print("\n" + "="*60)
    print("🤖 PLM AI MODEL TRAINING PIPELINE")
    print("="*60)
    
    # Initialize trainer
    trainer = RiskModelTrainer(data_path="data/training_data.json")
    
    # Load data
    df = trainer.load_data()
    
    # Engineer features
    X, y = trainer.engineer_features(df)
    
    # Train model
    X_train, X_test, y_train, y_test, y_pred_train, y_pred_test = trainer.train(X, y)
    
    # Evaluate
    trainer.print_evaluation()
    
    # Feature importance
    trainer.plot_feature_importance()
    
    # Save model
    trainer.save_model(model_path="models/risk_model.pkl")
    
    print("\n" + "="*60)
    print("✅ MODEL TRAINING COMPLETE!")
    print("="*60)
    print("\nNext steps:")
    print("  1. Review model metrics above")
    print("  2. Check models/feature_importance.png")
    print("  3. Restart backend: docker-compose restart backend ml-service")
    print("  4. Test API: POST /api/v1/ai/analyze-impact")
    print("\n🚀 Your AI model is ready for production!\n")


if __name__ == "__main__":
    main()
