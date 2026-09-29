"""Placeholder for future Slack/email notifications. Today it only records intent."""

import logging

logger = logging.getLogger(__name__)


class NotificationService:
    def notify_approval_required(self, incident_id: str, action_type: str, target: str) -> None:
        logger.info(
            "approval required incident=%s action=%s target=%s",
            incident_id,
            action_type,
            target,
        )


notification_service = NotificationService()
