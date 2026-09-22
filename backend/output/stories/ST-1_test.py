# Unit Test Suite for ST-1
import pytest
from pydantic import ValidationError

def test_login_request_valid():
    from impl import LoginRequest, verify_credentials
    req = LoginRequest(email="test@example.com", password="SecretPass123")
    assert req.email == "test@example.com"
    user = verify_credentials(req)
    assert user is not None
    assert user["id"] == 101

def test_login_request_invalid_password():
    from impl import LoginRequest, verify_credentials
    req = LoginRequest(email="test@example.com", password="WrongPassword")
    user = verify_credentials(req)
    assert user is None

def test_authenticate_user_success():
    from impl import LoginRequest, authenticate_user
    req = LoginRequest(email="admin@portal.fi", password="SecretPass123")
    res = authenticate_user(req)
    assert "token" in res
    assert res["token_type"] == "bearer"
    assert res["expires_in"] == 3600
