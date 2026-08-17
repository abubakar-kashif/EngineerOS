from sqlalchemy.orm import Session
from app.models.experiment import Experiment
from app.data.quiz_bank import iter_questions
from app.models.quiz import QuizQuestion
from app.db.database import SessionLocal, Base, engine


def init_db():
    """Create all database tables"""
    Base.metadata.create_all(bind=engine)


def seed_quizzes():
    """Seed quiz questions from quiz_bank"""
    with SessionLocal() as db:
        existing_ids = set(db.query(QuizQuestion.id).all())
        existing_ids = {id for id, in existing_ids}

        added = 0
        for item in iter_questions():
            if item["id"] in existing_ids:
                continue
            db.add(QuizQuestion(**item))
            added += 1

        if added:
            db.commit()
            print(f"  ✅ Added {added} quiz questions")
        else:
            print("  ℹ️ No new quiz questions to add")


def seed_experiments(db: Session):
    """Add initial experiments to the database"""
    
    existing = db.query(Experiment).count()
    if existing > 0:
        print(f"  ℹ️ Database already has {existing} experiments. Skipping seed.")
        return
    
    experiments = [
        {
            "id": "ohms-law",
            "title": "Ohm's Law",
            "slug": "ohms-law",
            "short_description": "Explore the relationship between voltage, current, and resistance.",
            "description": "In this experiment, you will investigate Ohm's Law, which states that the current through a conductor between two points is directly proportional to the voltage across the two points.",
            "objective": "Understand the relationship between voltage, current, and resistance in a simple circuit.",
            "theory": "Ohm's Law is a fundamental principle in electronics. It states that V = I × R, where V is voltage, I is current, and R is resistance.",
            "difficulty": "Beginner",
            "category": "Circuit Fundamentals",
            "duration_minutes": 30,
            "status": "published"
        },
        {
            "id": "series-circuit",
            "title": "Series Circuit",
            "slug": "series-circuit",
            "short_description": "Analyze the behavior of components connected in series.",
            "description": "This experiment explores how resistors behave when connected in series.",
            "objective": "Understand how voltage divides across series components and how current remains constant.",
            "theory": "In a series circuit, components are connected end-to-end. The total resistance is the sum of individual resistances.",
            "difficulty": "Beginner",
            "category": "Circuit Fundamentals",
            "duration_minutes": 35,
            "status": "published"
        },
        {
            "id": "parallel-circuit",
            "title": "Parallel Circuit",
            "slug": "parallel-circuit",
            "short_description": "Analyze the behavior of components connected in parallel.",
            "description": "This experiment explores how resistors behave when connected in parallel.",
            "objective": "Understand how current divides across parallel branches and how voltage remains constant.",
            "theory": "In a parallel circuit, components are connected across the same voltage source. The total resistance is less than the smallest individual resistance.",
            "difficulty": "Beginner",
            "category": "Circuit Fundamentals",
            "duration_minutes": 35,
            "status": "published"
        },
        {
            "id": "kvl",
            "title": "Kirchhoff's Voltage Law",
            "slug": "kvl",
            "short_description": "Verify Kirchhoff's Voltage Law in a circuit.",
            "description": "This experiment verifies Kirchhoff's Voltage Law.",
            "objective": "Validate Kirchhoff's Voltage Law by measuring voltages.",
            "theory": "Kirchhoff's Voltage Law (KVL) states that the sum of voltages around any closed loop is zero.",
            "difficulty": "Intermediate",
            "category": "Circuit Fundamentals",
            "duration_minutes": 40,
            "status": "published"
        },
        {
            "id": "kcl",
            "title": "Kirchhoff's Current Law",
            "slug": "kcl",
            "short_description": "Verify Kirchhoff's Current Law in a circuit.",
            "description": "This experiment verifies Kirchhoff's Current Law.",
            "objective": "Validate Kirchhoff's Current Law by measuring currents.",
            "theory": "Kirchhoff's Current Law (KCL) states that the sum of currents entering a node equals the sum leaving it.",
            "difficulty": "Intermediate",
            "category": "Circuit Fundamentals",
            "duration_minutes": 40,
            "status": "published"
        },
        {
            "id": "voltage-divider",
            "title": "Voltage Divider",
            "slug": "voltage-divider",
            "short_description": "Explore the voltage divider circuit.",
            "description": "This experiment investigates the voltage divider circuit.",
            "objective": "Understand how to calculate and measure voltage division.",
            "theory": "V_out = V_in × (R2 / (R1 + R2))",
            "difficulty": "Intermediate",
            "category": "Circuit Fundamentals",
            "duration_minutes": 35,
            "status": "published"
        },
        {
            "id": "current-divider",
            "title": "Current Divider",
            "slug": "current-divider",
            "short_description": "Explore the current divider circuit.",
            "description": "This experiment investigates the current divider circuit.",
            "objective": "Understand how current divides between parallel resistors.",
            "theory": "Current divides inversely proportional to resistance.",
            "difficulty": "Intermediate",
            "category": "Circuit Fundamentals",
            "duration_minutes": 35,
            "status": "published"
        },
        {
            "id": "rc-circuit",
            "title": "RC Circuit",
            "slug": "rc-circuit",
            "short_description": "Analyze the behavior of an RC circuit.",
            "description": "This experiment explores the charging and discharging of a capacitor.",
            "objective": "Understand the time-dependent behavior of RC circuits.",
            "theory": "The time constant τ = RC determines the rate of change.",
            "difficulty": "Intermediate",
            "category": "Circuit Fundamentals",
            "duration_minutes": 45,
            "status": "published"
        },
        {
            "id": "diode-characteristics",
            "title": "Diode Characteristics",
            "slug": "diode-characteristics",
            "short_description": "Explore the characteristics of a semiconductor diode.",
            "description": "This experiment investigates the I-V characteristics of a diode.",
            "objective": "Understand how diodes conduct current in one direction.",
            "theory": "A diode allows current to flow only in one direction with a forward voltage drop of ~0.7V.",
            "difficulty": "Advanced",
            "category": "Semiconductors",
            "duration_minutes": 45,
            "status": "published"
        },
        {
            "id": "led-circuit",
            "title": "LED Circuit",
            "slug": "led-circuit",
            "short_description": "Design and analyze circuits using LEDs.",
            "description": "This experiment explores how to properly use LEDs in circuits.",
            "objective": "Design LED circuits with appropriate current limiting.",
            "theory": "LEDs require a current-limiting resistor to prevent damage.",
            "difficulty": "Advanced",
            "category": "Semiconductors",
            "duration_minutes": 40,
            "status": "published"
        }
    ]
    
    for exp_data in experiments:
        experiment = Experiment(**exp_data)
        db.add(experiment)
        print(f"  ✅ Added: {exp_data['title']}")
    
    db.commit()
    print(f"\n✅ Seeded {len(experiments)} experiments!")


def seed_database(db: Session):
    """Main seed function - calls both experiment and quiz seeding"""
    print("🌱 Seeding experiments...")
    seed_experiments(db)
    
    print("🌱 Seeding quizzes...")
    seed_quizzes()
    
    print("✅ Database seeding complete!")