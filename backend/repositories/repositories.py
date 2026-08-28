from backend.models.models import (
    Agent,
    ApiKey,
    AuditLog,
    BillingAccount,
    CallLog,
    Campaign,
    Contact,
    Integration,
    KnowledgeDocument,
    Notification,
    Organization,
    PhoneNumber,
    User,
    Workflow,
    WorkspaceSettings,
)
from backend.repositories.base_repository import BaseRepository


class UserRepository(BaseRepository[User]):
    def __init__(self):
        super().__init__(User)

    def get_by_email(self, db, email: str):
        return db.query(User).filter(User.email == email).first()


class OrganizationRepository(BaseRepository[Organization]):
    def __init__(self):
        super().__init__(Organization)


class AgentRepository(BaseRepository[Agent]):
    def __init__(self):
        super().__init__(Agent)


class CampaignRepository(BaseRepository[Campaign]):
    def __init__(self):
        super().__init__(Campaign)


class PhoneNumberRepository(BaseRepository[PhoneNumber]):
    def __init__(self):
        super().__init__(PhoneNumber)


class ContactRepository(BaseRepository[Contact]):
    def __init__(self):
        super().__init__(Contact)


class KnowledgeRepository(BaseRepository[KnowledgeDocument]):
    def __init__(self):
        super().__init__(KnowledgeDocument)


class CallHistoryRepository(BaseRepository[CallLog]):
    def __init__(self):
        super().__init__(CallLog)


class IntegrationRepository(BaseRepository[Integration]):
    def __init__(self):
        super().__init__(Integration)


class ApiKeyRepository(BaseRepository[ApiKey]):
    def __init__(self):
        super().__init__(ApiKey)


class BillingRepository(BaseRepository[BillingAccount]):
    def __init__(self):
        super().__init__(BillingAccount)


class NotificationRepository(BaseRepository[Notification]):
    def __init__(self):
        super().__init__(Notification)


class AuditRepository(BaseRepository[AuditLog]):
    def __init__(self):
        super().__init__(AuditLog)


class SettingsRepository(BaseRepository[WorkspaceSettings]):
    def __init__(self):
        super().__init__(WorkspaceSettings)


class WorkflowRepository(BaseRepository[Workflow]):
    def __init__(self):
        super().__init__(Workflow)


user_repo = UserRepository()
org_repo = OrganizationRepository()
agent_repo = AgentRepository()
campaign_repo = CampaignRepository()
phone_repo = PhoneNumberRepository()
contact_repo = ContactRepository()
knowledge_repo = KnowledgeRepository()
call_repo = CallHistoryRepository()
integration_repo = IntegrationRepository()
api_key_repo = ApiKeyRepository()
billing_repo = BillingRepository()
notification_repo = NotificationRepository()
audit_repo = AuditRepository()
settings_repo = SettingsRepository()
workflow_repo = WorkflowRepository()
