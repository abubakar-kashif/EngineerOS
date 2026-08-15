# Backend B — Reports & Resources

This change completes the remaining Week 1 Backend B feature scope after Quiz and Progress.

## Included

- Reports model, schema, service and routes
- Resources model, schema, service and routes
- Resource seed data
- FastAPI router registration
- Experiment, quiz and resource seeding during application startup
- API contract updates
- Reports and Resources tests

## Endpoints

### Reports

- `GET /api/reports`
- `POST /api/reports`
- `GET /api/reports/{report_id}`

### Resources

- `GET /api/resources`
- `GET /api/resources/{resource_id}`

## Test

From `EngineerOS/backend`:

```bash
pytest
```

The new test file is:

```text
tests/test_reports_resources.py
```

Do not commit generated `.db` files.
