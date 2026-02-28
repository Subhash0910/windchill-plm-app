"""
Generate synthetic training data for PLM risk prediction model.

This creates realistic training examples based on PLM domain knowledge:
- RELEASED parts have higher risk than INWORK
- More affected parts = higher risk
- Obsolescence is riskier than revisions
- Complex BOMs increase risk
- Historical patterns simulate real outcomes
"""

import json
import random
import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict
import os


class TrainingDataGenerator:
    """Generate synthetic PLM change risk training data."""
    
    CHANGE_TYPES = ["REVISE", "OBSOLETE", "PROMOTE", "MODIFY", "DELETE"]
    LIFECYCLE_STATES = ["INWORK", "RELEASED", "UNDER_REVIEW", "PROTOTYPE"]
    
    # Risk weights (for ground truth generation)
    WEIGHTS = {
        "released_affected": 3.0,
        "conflicting_changes": 2.5,
        "where_used_base": 0.15,  # per parent assembly
        "bom_depth_base": 0.25,    # per level
        "lifecycle_released": 1.5,
        "change_obsolete": 1.0,
        "compliance_issues": 2.0,
    }
    
    def __init__(self, seed: int = 42):
        """Initialize generator with random seed for reproducibility."""
        random.seed(seed)
        np.random.seed(seed)
    
    def generate_dataset(self, n_samples: int = 1000) -> List[Dict]:
        """
        Generate n_samples of training data.
        
        Returns list of dictionaries with features and labels.
        """
        dataset = []
        
        for i in range(n_samples):
            example = self._generate_single_example(i + 1)
            dataset.append(example)
        
        return dataset
    
    def _generate_single_example(self, part_id: int) -> Dict:
        """Generate a single realistic training example."""
        
        # Sample change type (biased toward common types)
        change_type = random.choices(
            self.CHANGE_TYPES,
            weights=[0.4, 0.15, 0.25, 0.15, 0.05],  # REVISE most common
            k=1
        )[0]
        
        # Sample lifecycle state (biased toward RELEASED)
        lifecycle_state = random.choices(
            self.LIFECYCLE_STATES,
            weights=[0.2, 0.5, 0.2, 0.1],
            k=1
        )[0]
        
        # BOM depth: exponential distribution (most parts have low depth)
        bom_depth = int(np.random.exponential(scale=1.5))
        bom_depth = max(0, min(bom_depth, 8))  # Cap at 8 levels
        
        # Where used count: depends on part maturity
        if lifecycle_state == "RELEASED":
            # Released parts tend to be used more
            where_used_count = int(np.random.gamma(shape=2, scale=3))
        elif lifecycle_state == "PROTOTYPE":
            # Prototypes rarely used
            where_used_count = random.randint(0, 2)
        else:
            where_used_count = int(np.random.gamma(shape=1.5, scale=2))
        where_used_count = max(0, min(where_used_count, 25))
        
        # Released affected: subset of where_used
        if where_used_count > 0 and lifecycle_state != "INWORK":
            # Some percentage of parents are RELEASED
            released_ratio = 0.3 if lifecycle_state == "RELEASED" else 0.1
            released_affected = np.random.binomial(where_used_count, released_ratio)
        else:
            released_affected = 0
        
        # Conflicting changes: rare but impactful
        conflicting_changes = 0
        if random.random() < 0.15:  # 15% have conflicts
            conflicting_changes = random.randint(1, 3)
        
        # Compliance issues: rare
        has_compliance_issues = random.random() < 0.08  # 8% have issues
        
        # Calculate ground truth risk score
        risk_score = self._calculate_ground_truth_risk(
            change_type=change_type,
            lifecycle_state=lifecycle_state,
            bom_depth=bom_depth,
            where_used_count=where_used_count,
            released_affected=released_affected,
            conflicting_changes=conflicting_changes,
            has_compliance_issues=has_compliance_issues
        )
        
        # Add realistic noise (±0.5 points)
        noise = np.random.normal(0, 0.3)
        risk_score = max(0, min(10, risk_score + noise))
        
        # Determine risk level
        if risk_score < 4:
            risk_level = "LOW"
        elif risk_score < 7:
            risk_level = "MEDIUM"
        else:
            risk_level = "HIGH"
        
        # Simulate historical cycle time (days)
        # Higher risk = longer cycle time + randomness
        base_days = 3 + (risk_score * 1.2)
        actual_cycle_days = int(base_days + np.random.gamma(2, 1.5))
        
        # Simulate whether change had issues (higher risk = more likely)
        issue_probability = (risk_score / 10) * 0.4  # Max 40% at highest risk
        had_issues = random.random() < issue_probability
        
        return {
            # Features
            "part_id": part_id,
            "change_type": change_type,
            "lifecycle_state": lifecycle_state,
            "bom_depth": bom_depth,
            "where_used_count": where_used_count,
            "released_affected": released_affected,
            "conflicting_changes": conflicting_changes,
            "has_compliance_issues": has_compliance_issues,
            
            # Labels (targets)
            "risk_score": round(risk_score, 2),
            "risk_level": risk_level,
            "actual_cycle_days": actual_cycle_days,
            "had_issues": had_issues,
            
            # Metadata
            "generated_at": datetime.utcnow().isoformat()
        }
    
    def _calculate_ground_truth_risk(
        self,
        change_type: str,
        lifecycle_state: str,
        bom_depth: int,
        where_used_count: int,
        released_affected: int,
        conflicting_changes: int,
        has_compliance_issues: bool
    ) -> float:
        """Calculate deterministic risk score for ground truth."""
        
        score = 0.0
        
        # Released parts affected (highest weight)
        score += released_affected * self.WEIGHTS["released_affected"]
        
        # Conflicting changes
        score += conflicting_changes * self.WEIGHTS["conflicting_changes"]
        
        # Where used count (diminishing returns)
        score += min(where_used_count * self.WEIGHTS["where_used_base"], 3.0)
        
        # BOM depth complexity
        score += min(bom_depth * self.WEIGHTS["bom_depth_base"], 2.0)
        
        # Lifecycle state
        if lifecycle_state == "RELEASED":
            score += self.WEIGHTS["lifecycle_released"]
        
        # Change type
        if change_type == "OBSOLETE":
            score += self.WEIGHTS["change_obsolete"]
        elif change_type == "DELETE":
            score += 0.8
        
        # Compliance issues
        if has_compliance_issues:
            score += self.WEIGHTS["compliance_issues"]
        
        return min(score, 10.0)
    
    def save_to_json(self, dataset: List[Dict], filepath: str):
        """Save dataset to JSON file."""
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        with open(filepath, 'w') as f:
            json.dump(dataset, f, indent=2)
        
        print(f"✅ Saved {len(dataset)} training examples to {filepath}")
    
    def save_to_csv(self, dataset: List[Dict], filepath: str):
        """Save dataset to CSV file."""
        import csv
        
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        if not dataset:
            return
        
        fieldnames = dataset[0].keys()
        
        with open(filepath, 'w', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(dataset)
        
        print(f"✅ Saved {len(dataset)} training examples to {filepath}")
    
    def print_statistics(self, dataset: List[Dict]):
        """Print dataset statistics."""
        print("\n" + "="*60)
        print("TRAINING DATA STATISTICS")
        print("="*60)
        
        print(f"\nTotal samples: {len(dataset)}")
        
        # Risk level distribution
        risk_levels = [d["risk_level"] for d in dataset]
        print(f"\nRisk Level Distribution:")
        print(f"  LOW:    {risk_levels.count('LOW'):4d} ({risk_levels.count('LOW')/len(dataset)*100:.1f}%)")
        print(f"  MEDIUM: {risk_levels.count('MEDIUM'):4d} ({risk_levels.count('MEDIUM')/len(dataset)*100:.1f}%)")
        print(f"  HIGH:   {risk_levels.count('HIGH'):4d} ({risk_levels.count('HIGH')/len(dataset)*100:.1f}%)")
        
        # Risk score statistics
        risk_scores = [d["risk_score"] for d in dataset]
        print(f"\nRisk Score Statistics:")
        print(f"  Mean:   {np.mean(risk_scores):.2f}")
        print(f"  Median: {np.median(risk_scores):.2f}")
        print(f"  Std:    {np.std(risk_scores):.2f}")
        print(f"  Min:    {np.min(risk_scores):.2f}")
        print(f"  Max:    {np.max(risk_scores):.2f}")
        
        # Change type distribution
        change_types = [d["change_type"] for d in dataset]
        print(f"\nChange Type Distribution:")
        for ct in self.CHANGE_TYPES:
            count = change_types.count(ct)
            print(f"  {ct:12s}: {count:4d} ({count/len(dataset)*100:.1f}%)")
        
        # Feature statistics
        print(f"\nFeature Ranges:")
        print(f"  BOM Depth:         0-{max(d['bom_depth'] for d in dataset)}")
        print(f"  Where Used:        0-{max(d['where_used_count'] for d in dataset)}")
        print(f"  Released Affected: 0-{max(d['released_affected'] for d in dataset)}")
        print(f"  Conflicting:       0-{max(d['conflicting_changes'] for d in dataset)}")
        
        compliance_count = sum(1 for d in dataset if d['has_compliance_issues'])
        print(f"  Compliance Issues: {compliance_count} ({compliance_count/len(dataset)*100:.1f}%)")
        
        print("\n" + "="*60)


def main():
    """Generate and save training data."""
    print("\n🤖 PLM AI Training Data Generator")
    print("="*60)
    
    # Create generator
    generator = TrainingDataGenerator(seed=42)
    
    # Generate datasets of different sizes
    print("\n📊 Generating training data...")
    
    # Main training set (1000 examples)
    train_data = generator.generate_dataset(n_samples=1000)
    
    # Save in multiple formats
    generator.save_to_json(train_data, "data/training_data.json")
    generator.save_to_csv(train_data, "data/training_data.csv")
    
    # Generate smaller test set (200 examples) with different seed
    generator_test = TrainingDataGenerator(seed=123)
    test_data = generator_test.generate_dataset(n_samples=200)
    generator_test.save_to_json(test_data, "data/test_data.json")
    generator_test.save_to_csv(test_data, "data/test_data.csv")
    
    # Print statistics
    generator.print_statistics(train_data)
    
    print("\n✅ Training data generation complete!")
    print("\nNext steps:")
    print("  1. Review data/training_data.csv")
    print("  2. Run: python training/train_model.py")
    print("  3. Deploy trained model to production")


if __name__ == "__main__":
    main()
