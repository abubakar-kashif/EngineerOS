"""
Rate limiting and cost protection for AI services.

This module provides protection against:
- Request timeouts
- Excessive context size
- Excessive response size
- Per-user rate limits
- Uncontrolled retries
- Duplicate responses
"""

import time
import hashlib
from typing import Optional, Dict, Any, List, Set
from dataclasses import dataclass, field
from collections import defaultdict
from threading import Lock

from app.core.config import settings
from app.services.ai.errors import (
    AIError,
    RateLimitedError,
    TimeoutError,
    ConfigurationError,
    AIErrorCode,
)


@dataclass
class ProtectionConfig:
    """Configuration for protection limits."""
    
    # Request timeout (seconds)
    request_timeout: int = 60
    
    # Maximum context size (characters)
    max_context_size: int = 100000
    
    # Maximum response size (characters)
    max_response_size: int = 50000
    
    # Per-user request limit per window
    max_requests_per_user: int = 100
    
    # Rate limit window (seconds)
    rate_limit_window: int = 3600  # 1 hour
    
    # Maximum retries for retryable errors
    max_retries: int = 2
    
    # Retry backoff (seconds)
    retry_backoff: float = 1.0
    
    # Enable/disable protection
    enabled: bool = True


class RateLimiter:
    """
    Per-user rate limiter for AI requests.
    
    Tracks request counts per user within a time window.
    Thread-safe for concurrent requests.
    """
    
    def __init__(self, config: ProtectionConfig):
        self.config = config
        self._requests: Dict[str, List[float]] = defaultdict(list)
        self._lock = Lock()
    
    def check_and_record(self, user_id: str) -> bool:
        """
        Check if user is within rate limit and record the request.
        
        Args:
            user_id: User identifier
            
        Returns:
            bool: True if request is allowed, False if rate limited
            
        Raises:
            RateLimitedError: If rate limit exceeded
        """
        if not self.config.enabled:
            return True
        
        with self._lock:
            now = time.time()
            window = self.config.rate_limit_window
            max_requests = self.config.max_requests_per_user
            
            # Clean old requests
            self._requests[user_id] = [
                t for t in self._requests[user_id]
                if now - t < window
            ]
            
            # Check limit
            if len(self._requests[user_id]) >= max_requests:
                raise RateLimitedError(
                    message=f"Rate limit exceeded. Maximum {max_requests} requests per {window} seconds."
                )
            
            # Record request
            self._requests[user_id].append(now)
            return True
    
    def get_remaining(self, user_id: str) -> int:
        """Get remaining requests for user within current window."""
        with self._lock:
            now = time.time()
            window = self.config.rate_limit_window
            max_requests = self.config.max_requests_per_user
            
            self._requests[user_id] = [
                t for t in self._requests[user_id]
                if now - t < window
            ]
            
            return max_requests - len(self._requests[user_id])
    
    def reset(self, user_id: str) -> None:
        """Reset rate limit for a user."""
        with self._lock:
            if user_id in self._requests:
                del self._requests[user_id]


class ContextSizeValidator:
    """
    Validates and limits context size.
    
    Prevents sending excessively large prompts to the AI provider.
    """
    
    def __init__(self, config: ProtectionConfig):
        self.config = config
    
    def validate(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate and optionally truncate context.
        
        Args:
            context: The context dictionary
            
        Returns:
            Dict: Validated/truncated context
            
        Raises:
            ConfigurationError: If context exceeds limits and cannot be truncated
        """
        if not self.config.enabled:
            return context
        
        # Calculate total size
        total_size = self._calculate_size(context)
        max_size = self.config.max_context_size
        
        if total_size <= max_size:
            return context
        
        # Try to truncate
        truncated = self._truncate_context(context, max_size)
        
        if truncated is None:
            raise ConfigurationError(
                message=f"Context size ({total_size} chars) exceeds maximum ({max_size} chars)"
            )
        
        return truncated
    
    def _calculate_size(self, obj: Any) -> int:
        """Calculate approximate size of object in characters."""
        return len(str(obj))
    
    def _truncate_context(self, context: Dict[str, Any], max_size: int) -> Optional[Dict[str, Any]]:
        """
        Attempt to truncate context to fit within max_size.
        
        Returns:
            Dict: Truncated context, or None if truncation failed
        """
        # Simple truncation: remove non-essential fields
        truncated = context.copy()
        
        # Remove large fields first
        if "conversation" in truncated and isinstance(truncated["conversation"], list):
            # Keep only last 5 messages
            if len(truncated["conversation"]) > 5:
                truncated["conversation"] = truncated["conversation"][-5:]
        
        # Check if truncation worked
        if self._calculate_size(truncated) <= max_size:
            return truncated
        
        # If still too large, keep only essential fields
        essential = {}
        for key in ["experiment", "current_message"]:
            if key in truncated:
                essential[key] = truncated[key]
        
        if self._calculate_size(essential) <= max_size:
            return essential
        
        # Last resort: keep only current message
        if "current_message" in context:
            return {"current_message": context["current_message"][:1000]}
        
        return None


class ResponseSizeValidator:
    """
    Validates response size.
    
    Prevents saving or returning excessively large responses.
    """
    
    def __init__(self, config: ProtectionConfig):
        self.config = config
    
    def validate(self, response_content: str) -> str:
        """
        Validate response content size.
        
        Args:
            response_content: The response content
            
        Returns:
            str: Validated response content
            
        Raises:
            InvalidResponseError: If response exceeds max size
        """
        if not self.config.enabled:
            return response_content
        
        max_size = self.config.max_response_size
        
        if len(response_content) <= max_size:
            return response_content
        
        # Truncate response
        truncated = response_content[:max_size]
        
        return truncated


class RetryController:
    """
    Controls retries for AI requests.
    
    Only retries for retryable errors.
    Prevents duplicate responses.
    """
    
    def __init__(self, config: ProtectionConfig):
        self.config = config
        self._in_progress: Set[str] = set()
    
    def should_retry(self, error: Exception, attempt: int) -> bool:
        """
        Determine if a request should be retried.
        
        Args:
            error: The error that occurred
            attempt: Current attempt number (1-based)
            
        Returns:
            bool: True if should retry
        """
        if attempt >= self.config.max_retries:
            return False
        
        # Only retry if error is retryable
        if isinstance(error, AIError):
            return error.is_retryable()
        
        # Network/connection errors are retryable
        if "connection" in str(error).lower() or "timeout" in str(error).lower():
            return True
        
        return False
    
    def get_retry_delay(self, attempt: int) -> float:
        """
        Get retry delay with backoff.
        
        Args:
            attempt: Current attempt number (1-based)
            
        Returns:
            float: Delay in seconds
        """
        return self.config.retry_backoff * (2 ** (attempt - 1))
    
    def start_request(self, request_id: str) -> bool:
        """
        Mark a request as in progress to prevent duplicates.
        
        Args:
            request_id: Unique request identifier
            
        Returns:
            bool: True if request can proceed, False if already in progress
        """
        if request_id in self._in_progress:
            return False
        
        self._in_progress.add(request_id)
        return True
    
    def finish_request(self, request_id: str) -> None:
        """Mark a request as completed."""
        self._in_progress.discard(request_id)
    
    def generate_request_id(self, user_id: str, question: str, conversation_id: str) -> str:
        """Generate a unique request ID for deduplication."""
        key = f"{user_id}:{conversation_id}:{question}"
        return hashlib.md5(key.encode()).hexdigest()


class ProtectionManager:
    """
    Central protection manager that orchestrates all protection mechanisms.
    """
    
    def __init__(self, config: Optional[ProtectionConfig] = None):
        self.config = config or ProtectionConfig()
        self.rate_limiter = RateLimiter(self.config)
        self.context_validator = ContextSizeValidator(self.config)
        self.response_validator = ResponseSizeValidator(self.config)
        self.retry_controller = RetryController(self.config)
    
    def check_rate_limit(self, user_id: str) -> None:
        """Check and enforce per-user rate limit."""
        self.rate_limiter.check_and_record(user_id)
    
    def validate_context(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Validate and optionally truncate context."""
        return self.context_validator.validate(context)
    
    def validate_response(self, content: str) -> str:
        """Validate and optionally truncate response."""
        return self.response_validator.validate(content)
    
    def should_retry(self, error: Exception, attempt: int) -> bool:
        """Determine if a request should be retried."""
        return self.retry_controller.should_retry(error, attempt)
    
    def get_retry_delay(self, attempt: int) -> float:
        """Get retry delay with backoff."""
        return self.retry_controller.get_retry_delay(attempt)
    
    def get_rate_limit_remaining(self, user_id: str) -> int:
        """Get remaining requests for user."""
        return self.rate_limiter.get_remaining(user_id)


# Global protection instance
protection_manager = ProtectionManager()


def get_protection_manager() -> ProtectionManager:
    """Get the global protection manager instance."""
    return protection_manager