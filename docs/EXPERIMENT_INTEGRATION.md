# Experiment Integration

This progress branch now requires the real `Experiment` model and the
`experiments` table because `Progress.experiment_id` uses a foreign key to
`experiments.id`.

The catalog experiment IDs include the original Week 1 set plus later expansions:

- ohms-law
- series-circuit
- parallel-circuit
- kvl
- kcl
- voltage-divider
- current-divider
- rc-circuit
- diode-characteristics
- led-circuit
- wheatstone-bridge

If the shared application already has Backend A's experiment model/seed,
keep that implementation and do not create a duplicate. Import/register that
existing model before `Base.metadata.create_all()` and let the shared seed
process create the catalog experiment records.

If the shared experiment foundation is not yet present, this package includes
`app/models/experiment.py` and `app/db/seed_experiments.py` as the temporary
Week 1 implementation needed to make the progress branch runnable.
