from datetime import datetime, timezone

from backend.models.models import (
    Agent,
    AgentMemoryFact,
    AgentSessionMemory,
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


class AgentSessionMemoryRepository(BaseRepository[AgentSessionMemory]):
    def __init__(self):
        super().__init__(AgentSessionMemory)

    def get_by_session_id(self, db, session_id: str):
        return db.query(AgentSessionMemory).filter(AgentSessionMemory.session_id == session_id).first()

    def get_by_agent(self, db, agent_id: str, include_deleted: bool = False):
        query = db.query(AgentSessionMemory).filter(AgentSessionMemory.agent_id == agent_id)
        if not include_deleted:
            query = query.filter(AgentSessionMemory.is_deleted == False)
        return query.order_by(AgentSessionMemory.started_at.desc()).all()

    def get_deleted(self, db, agent_id: str | None = None):
        query = db.query(AgentSessionMemory).filter(AgentSessionMemory.is_deleted == True)
        if agent_id:
            query = query.filter(AgentSessionMemory.agent_id == agent_id)
        return query.order_by(AgentSessionMemory.deleted_at.desc()).all()

    def soft_delete(self, db, session_id: str) -> bool:
        record = self.get_by_session_id(db, session_id)
        if not record:
            record = self.get_by_id(db, session_id)
        if record:
            now = datetime.now(timezone.utc)
            record.is_deleted = True
            record.deleted_at = now
            # Cascade soft delete all facts extracted/bound to this session
            tied_facts = db.query(AgentMemoryFact).filter(
                (AgentMemoryFact.source_session_id == record.session_id) |
                (AgentMemoryFact.source_session_id == record.id)
            ).all()
            for fact in tied_facts:
                fact.is_deleted = True
                fact.deleted_at = now
            db.commit()
            db.refresh(record)
            return True
        return False

    def restore(self, db, session_id: str) -> bool:
        record = self.get_by_session_id(db, session_id)
        if not record:
            record = self.get_by_id(db, session_id)
        if record:
            record.is_deleted = False
            record.deleted_at = None
            # Cascade restore all facts extracted/bound to this session
            tied_facts = db.query(AgentMemoryFact).filter(
                (AgentMemoryFact.source_session_id == record.session_id) |
                (AgentMemoryFact.source_session_id == record.id)
            ).all()
            for fact in tied_facts:
                fact.is_deleted = False
                fact.deleted_at = None
            db.commit()
            db.refresh(record)
            return True
        return False

    def permanent_delete(self, db, session_id: str) -> bool:
        record = self.get_by_session_id(db, session_id)
        if not record:
            record = self.get_by_id(db, session_id)
        if record:
            # Cascade permanently purge all facts extracted/bound to this session
            tied_facts = db.query(AgentMemoryFact).filter(
                (AgentMemoryFact.source_session_id == record.session_id) |
                (AgentMemoryFact.source_session_id == record.id)
            ).all()
            for fact in tied_facts:
                db.delete(fact)
            db.delete(record)
            db.commit()
            return True
        return False

    def empty_recycle_bin(self, db) -> int:
        deleted_items = db.query(AgentSessionMemory).filter(AgentSessionMemory.is_deleted == True).all()
        count = len(deleted_items)
        for item in deleted_items:
            tied_facts = db.query(AgentMemoryFact).filter(
                (AgentMemoryFact.source_session_id == item.session_id) |
                (AgentMemoryFact.source_session_id == item.id)
            ).all()
            for fact in tied_facts:
                db.delete(fact)
            db.delete(item)
        db.commit()
        return count


class AgentMemoryFactRepository(BaseRepository[AgentMemoryFact]):
    def __init__(self):
        super().__init__(AgentMemoryFact)

    def get_by_agent(self, db, agent_id: str, include_deleted: bool = False):
        query = db.query(AgentMemoryFact).filter(AgentMemoryFact.agent_id == agent_id)
        if not include_deleted:
            query = query.filter(AgentMemoryFact.is_deleted == False)
        return query.order_by(AgentMemoryFact.created_at.desc()).all()

    def get_deleted(self, db, agent_id: str | None = None):
        query = db.query(AgentMemoryFact).filter(AgentMemoryFact.is_deleted == True)
        if agent_id:
            query = query.filter(AgentMemoryFact.agent_id == agent_id)
        return query.order_by(AgentMemoryFact.deleted_at.desc()).all()

    def soft_delete(self, db, fact_id: str) -> bool:
        record = self.get_by_id(db, fact_id)
        if record:
            record.is_deleted = True
            record.deleted_at = datetime.now(timezone.utc)
            db.commit()
            db.refresh(record)
            return True
        return False

    def restore(self, db, fact_id: str) -> bool:
        record = self.get_by_id(db, fact_id)
        if record:
            record.is_deleted = False
            record.deleted_at = None
            db.commit()
            db.refresh(record)
            return True
        return False

    def permanent_delete(self, db, fact_id: str) -> bool:
        record = self.get_by_id(db, fact_id)
        if record:
            db.delete(record)
            db.commit()
            return True
        return False

    def empty_recycle_bin(self, db) -> int:
        deleted_items = db.query(AgentMemoryFact).filter(AgentMemoryFact.is_deleted == True).all()
        count = len(deleted_items)
        for item in deleted_items:
            db.delete(item)
        db.commit()
        return count


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
memory_session_repo = AgentSessionMemoryRepository()
memory_fact_repo = AgentMemoryFactRepository()

