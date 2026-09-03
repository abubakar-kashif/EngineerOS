"""All ORM models.

Importing every model here ensures `Base.metadata.create_all` (app startup
and tests) sees the full schema, regardless of which routers are mounted.
"""

from app.models.experiment import Experiment
from app.models.progress import Progress
from app.models.quiz import QuizAttempt, QuizQuestion
from app.models.report import Report
from app.models.resource import Resource

from app.models.user import SessionToken, User
from app.models.preferences import UserPreferences
from app.models.conversation import Conversation, ConversationMessage
from app.models.notification import Notification
from app.models.simulation import SimulationRun

__all__ = [
    "Experiment",
    "Progress",
    "QuizAttempt",
    "QuizQuestion",
    "Report",
    "Resource",
    "SessionToken",
    "User",
    "UserPreferences",
    "Conversation",
    "ConversationMessage",
    "Notification",
    "SimulationRun",
]
