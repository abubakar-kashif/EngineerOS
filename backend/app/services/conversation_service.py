"""AI Mentor conversation persistence.

Every operation is scoped to the owning user: a conversation id belonging to
someone else is indistinguishable from a missing one (404), so ownership is
enforced without leaking which ids exist.
"""

from datetime import datetime

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.conversation import Conversation, ConversationMessage
from app.schemas.conversation import (
    ConversationCreateRequest,
    ConversationUpdateRequest,
    MessageCreateRequest,
    MessageResponse,
)

DEFAULT_TITLE = "New conversation"


def _get_owned_conversation(
    db: Session, user_id: str, conversation_id: str
) -> Conversation:
    conversation = (
        db.execute(
            select(Conversation).where(
                Conversation.id == conversation_id,
                Conversation.user_id == user_id,
            )
        )
        .scalars()
        .one_or_none()
    )

    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")

    return conversation


def _summary(conversation: Conversation, message_count: int):
    from app.schemas.conversation import ConversationSummaryResponse

    return ConversationSummaryResponse(
        id=conversation.id,
        title=conversation.title,
        experiment_id=conversation.experiment_id,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        message_count=message_count,
    )


def list_conversations(db: Session, user_id: str):
    conversations = (
        db.execute(
            select(Conversation)
            .where(Conversation.user_id == user_id)
            .order_by(Conversation.updated_at.desc())
        )
        .scalars()
        .all()
    )

    results = []
    for conversation in conversations:
        count = (
            db.execute(
                select(func.count(ConversationMessage.id)).where(
                    ConversationMessage.conversation_id == conversation.id
                )
            ).scalar_one()
        )
        results.append(_summary(conversation, count))

    return results


def create_conversation(
    db: Session, user_id: str, payload: ConversationCreateRequest
):
    from app.schemas.conversation import ConversationDetailResponse

    conversation = Conversation(
        user_id=user_id,
        title=(payload.title or DEFAULT_TITLE).strip() or DEFAULT_TITLE,
        experiment_id=payload.experiment_id,
    )
    db.add(conversation)
    db.commit()
    db.refresh(conversation)

    return ConversationDetailResponse(
        id=conversation.id,
        title=conversation.title,
        experiment_id=conversation.experiment_id,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        messages=[],
    )


def get_conversation(db: Session, user_id: str, conversation_id: str):
    from app.schemas.conversation import ConversationDetailResponse

    conversation = _get_owned_conversation(db, user_id, conversation_id)

    return ConversationDetailResponse(
        id=conversation.id,
        title=conversation.title,
        experiment_id=conversation.experiment_id,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        messages=[
            MessageResponse.model_validate(message)
            for message in conversation.messages
        ],
    )


def rename_conversation(
    db: Session, user_id: str, conversation_id: str, payload: ConversationUpdateRequest
):
    conversation = _get_owned_conversation(db, user_id, conversation_id)
    conversation.title = payload.title.strip()
    conversation.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(conversation)

    count = (
        db.execute(
            select(func.count(ConversationMessage.id)).where(
                ConversationMessage.conversation_id == conversation.id
            )
        ).scalar_one()
    )
    return _summary(conversation, count)


def delete_conversation(db: Session, user_id: str, conversation_id: str) -> None:
    conversation = _get_owned_conversation(db, user_id, conversation_id)
    db.delete(conversation)
    db.commit()


def list_messages(db: Session, user_id: str, conversation_id: str):
    conversation = _get_owned_conversation(db, user_id, conversation_id)
    return [
        MessageResponse.model_validate(message) for message in conversation.messages
    ]


def add_message(
    db: Session, user_id: str, conversation_id: str, payload: MessageCreateRequest
) -> MessageResponse:
    conversation = _get_owned_conversation(db, user_id, conversation_id)

    message = ConversationMessage(
        conversation_id=conversation.id,
        role=payload.role,
        content=payload.content,
        meta=payload.metadata or {},
    )
    db.add(message)
    conversation.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(message)

    return MessageResponse.model_validate(message)


def set_message_feedback(
    db: Session,
    user_id: str,
    conversation_id: str,
    message_id: str,
    feedback: str | None,
) -> MessageResponse:
    _get_owned_conversation(db, user_id, conversation_id)

    message = (
        db.execute(
            select(ConversationMessage).where(
                ConversationMessage.id == message_id,
                ConversationMessage.conversation_id == conversation_id,
            )
        )
        .scalars()
        .one_or_none()
    )

    if message is None:
        raise HTTPException(status_code=404, detail="Message not found")

    message.feedback = feedback
    db.commit()
    db.refresh(message)

    return MessageResponse.model_validate(message)
