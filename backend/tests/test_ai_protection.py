"""
Tests for rate/cost protection (Phase 22).
"""

import pytest

from app.services.ai.protection import (
    ProtectionConfig,
    ProtectionManager,
    RateLimiter,
    RetryController,
)
from app.services.ai.errors import RateLimitedError


def test_protection_config():
    """Test ProtectionConfig defaults."""
    config = ProtectionConfig()
    assert config.request_timeout == 60
    assert config.max_context_size == 100000


def test_rate_limiter():
    """Test RateLimiter."""
    config = ProtectionConfig(max_requests_per_user=2, rate_limit_window=3600)
    limiter = RateLimiter(config)

    assert limiter.check_and_record("user-a") is True
    assert limiter.check_and_record("user-a") is True

    with pytest.raises(RateLimitedError):
        limiter.check_and_record("user-a")


def test_retry_controller():
    """Test RetryController."""
    config = ProtectionConfig(max_retries=3)
    controller = RetryController(config)

    error = ValueError("Invalid request")
    assert controller.should_retry(error, 1) is False


def test_protection_manager():
    """Test ProtectionManager."""
    manager = ProtectionManager()
    assert manager.config is not None
    assert manager.rate_limiter is not None