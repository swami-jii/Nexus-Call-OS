from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.auth.deps import (
    get_current_user,
    get_current_user_optional,
    ensure_super_admin_exists,
    get_effective_org_id,
)
from backend.database.session import get_db
from backend.models.models import User
from backend.repositories.repositories import agent_repo
from backend.schemas.schemas import (
    AgentCreate,
    AgentOut,
    AgentUpdate,
    PaginatedResponse,
)

router = APIRouter(prefix="/api/agents", tags=["AI Agents"])


@router.get("", response_model=PaginatedResponse)
def list_agents(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    status_filter: str | None = None,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
    x_target_organization_id: str | None = Header(None, alias="X-Target-Organization-Id"),
):
    effective_user = current_user or ensure_super_admin_exists(db)
    effective_org_id = get_effective_org_id(effective_user, x_target_organization_id)
    skip = (page - 1) * page_size
    filters = {}
    if status_filter:
        filters["status"] = status_filter
    if effective_org_id:
        filters["organization_id"] = effective_org_id
    elif effective_user.organization_id:
        filters["organization_id"] = effective_user.organization_id

    items = agent_repo.get_multi(
        db,
        skip=skip,
        limit=page_size,
        filters=filters,
        search_query=search,
        search_fields=["name", "description", "system_prompt"],
    )
    total = agent_repo.count(
        db,
        filters=filters,
        search_query=search,
        search_fields=["name", "description", "system_prompt"],
    )

    pages = (total + page_size - 1) // page_size if total > 0 else 1
    return {
        "items": [AgentOut.model_validate(item) for item in items],
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": pages,
    }


@router.post("", response_model=AgentOut, status_code=status.HTTP_201_CREATED)
def create_agent(
    agent_in: AgentCreate,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
    x_target_organization_id: str | None = Header(None, alias="X-Target-Organization-Id"),
):
    effective_user = current_user or ensure_super_admin_exists(db)
    effective_org_id = get_effective_org_id(effective_user, x_target_organization_id) or effective_user.organization_id
    data = agent_in.model_dump()
    data["organization_id"] = effective_org_id
    return agent_repo.create(db, data)



@router.get("/{agent_id}", response_model=AgentOut)
def get_agent(
    agent_id: str,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    effective_user = current_user or ensure_super_admin_exists(db)
    agent = agent_repo.get_by_id(db, agent_id)
    is_super_admin = (effective_user.role == "super_admin" or effective_user.email == "admin@createcall.ai")
    if not agent or (not is_super_admin and effective_user.organization_id and agent.organization_id != effective_user.organization_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found"
        )
    return agent


@router.put("/{agent_id}", response_model=AgentOut)
@router.patch("/{agent_id}", response_model=AgentOut)
def update_agent(
    agent_id: str,
    agent_in: AgentUpdate,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    effective_user = current_user or ensure_super_admin_exists(db)
    agent = agent_repo.get_by_id(db, agent_id)
    is_super_admin = (effective_user.role == "super_admin" or effective_user.email == "admin@createcall.ai")
    if not agent or (not is_super_admin and effective_user.organization_id and agent.organization_id != effective_user.organization_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found"
        )
    return agent_repo.update(db, agent, agent_in.model_dump(exclude_unset=True))


@router.delete("/{agent_id}")
def delete_agent(
    agent_id: str,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    effective_user = current_user or ensure_super_admin_exists(db)
    agent = agent_repo.get_by_id(db, agent_id)
    is_super_admin = (effective_user.role == "super_admin" or effective_user.email == "admin@createcall.ai")
    if not agent or (not is_super_admin and effective_user.organization_id and agent.organization_id != effective_user.organization_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found"
        )
    agent_repo.delete(db, agent_id)
    return {"message": "Agent deleted successfully", "id": agent_id}
