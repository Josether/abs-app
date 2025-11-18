# Backend Tests

## Overview

This directory contains integration tests for the ABS (Automated Backup System) backend API.

## Test Structure

- **conftest.py**: Pytest fixtures and configuration
  - `test_db`: Fresh in-memory SQLite database for each test
  - `client`: TestClient with database dependency override
  - `admin_token`, `viewer_token`: Authentication tokens for testing
  - `admin_headers`, `viewer_headers`: Authorization headers

- **test_auth.py**: Authentication and authorization tests
  - Token issuance tests (valid/invalid credentials)
  - Current user endpoint tests
  - Protected route authorization tests
  - Token expiration and validation tests

## Running Tests

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Run All Tests

```bash
pytest
```

### Run Specific Test File

```bash
pytest tests/test_auth.py
```

### Run Specific Test Class

```bash
pytest tests/test_auth.py::TestAuthToken
```

### Run Specific Test

```bash
pytest tests/test_auth.py::TestAuthToken::test_login_with_valid_admin_credentials
```

### Run with Verbose Output

```bash
pytest -v
```

### Run with Coverage

```bash
pytest --cov=app --cov-report=html
```

## Test Coverage

The test suite covers:

### Authentication (POST /auth/token)
- ✅ Valid admin credentials return token with role
- ✅ Valid viewer credentials return token with role
- ✅ Invalid username returns 401
- ✅ Invalid password returns 401
- ✅ Empty credentials return 401
- ✅ Missing fields return 422

### Current User (GET /auth/me)
- ✅ Admin token returns user info
- ✅ Viewer token returns user info
- ✅ No token returns 401
- ✅ Invalid token returns 401
- ✅ Malformed header returns 401

### Protected Routes
- ✅ Admin can access all routes
- ✅ Viewer can access read-only routes (GET)
- ✅ Viewer cannot access admin-only routes (403)
- ✅ Unauthenticated users cannot access any protected route (401)

**Routes Tested:**
- `/devices` (GET: all users, POST/PUT/DELETE: admin only)
- `/jobs` (GET: all users, POST: admin only)
- `/schedules` (GET: all users, POST/PUT/DELETE: admin only)
- `/users` (GET: all users, POST/PUT/DELETE: admin only)
- `/audit-logs` (GET: admin only)
- `/backups` (GET: all users)

### Token Validation
- ✅ Expired tokens are rejected with 401
- ✅ Tokens without 'sub' claim are rejected with 401

## Test Database

Tests use an in-memory SQLite database that is:
- Created fresh for each test function
- Seeded with two test users:
  - `testadmin` / `admin123` (role: admin)
  - `testviewer` / `viewer123` (role: viewer)
- Dropped after each test to ensure isolation

## Writing New Tests

### Basic Test Structure

```python
def test_something(client, admin_headers):
    """Test description."""
    response = client.get("/endpoint", headers=admin_headers)
    assert response.status_code == 200
    assert response.json()["key"] == "expected_value"
```

### Using Fixtures

```python
def test_with_admin(client, admin_token, admin_headers):
    # admin_token: raw JWT token string
    # admin_headers: dict with Authorization header
    pass

def test_with_viewer(client, viewer_token, viewer_headers):
    # viewer_token: raw JWT token string
    # viewer_headers: dict with Authorization header
    pass

def test_with_database(test_db):
    # test_db: SQLAlchemy session with test data
    from app.models import User
    user = test_db.query(User).first()
    assert user is not None
```

## Continuous Integration

These tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run tests
  run: |
    pip install -r requirements.txt
    pytest --cov=app --cov-report=xml
```

## Troubleshooting

### Import Errors
If you see import errors, make sure you're running pytest from the `backend/` directory:
```bash
cd backend
pytest
```

### Database Errors
The test database is in-memory and temporary. If you see database errors, check that:
- SQLAlchemy models are properly imported in conftest.py
- Base.metadata.create_all() is called before tests
- Base.metadata.drop_all() is called after tests

### Token Errors
If authentication tests fail, verify that:
- Test users are seeded in the test database
- Password hashing is working correctly
- JWT secret key matches between app and tests
