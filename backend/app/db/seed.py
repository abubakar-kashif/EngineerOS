from sqlalchemy.orm import Session
from app.models.experiment import Experiment

def seed_database(db: Session):
    """Add initial experiments to the database"""
    
    existing = db.query(Experiment).count()
    if existing > 0:
        print(f"Database already has {existing} experiments. Skipping seed.")
        return
    
    experiments = [
        {
            "name": "ohms-law",
            "slug": "ohms-law",
            "title": "Ohm's Law",
            "short_description": "Explore the relationship between voltage, current, and resistance.",
            "difficulty": "Beginner",
            "category": "Circuit Fundamentals",
            "duration_minutes": 30,
            "status": "published"
        },
        {
            "name": "series-circuit",
            "slug": "series-circuit",
            "title": "Series Circuit",
            "short_description": "Analyze the behavior of components connected in series.",
            "difficulty": "Beginner",
            "category": "Circuit Fundamentals",
            "duration_minutes": 35,
            "status": "published"
        },
        {
            "name": "parallel-circuit",
            "slug": "parallel-circuit",
            "title": "Parallel Circuit",
            "short_description": "Analyze the behavior of components connected in parallel.",
            "difficulty": "Beginner",
            "category": "Circuit Fundamentals",
            "duration_minutes": 35,
            "status": "published"
        }
    ]
    
    for exp_data in experiments:
        experiment = Experiment(**exp_data)
        db.add(experiment)
        print(f"  ✅ Added: {exp_data['title']}")
    
    db.commit()
    print(f"\n✅ Seeded {len(experiments)} experiments!")