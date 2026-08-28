from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.auth.deps import get_current_user
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
    current_user: User = Depends(get_current_user),
):
    skip = (page - 1) * page_size
    filters = {}
    if status_filter:
        filters["status"] = status_filter
    if current_user.organization_id:
        filters["organization_id"] = current_user.organization_id

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
    current_user: User = Depends(get_current_user),
):
    data = agent_in.model_dump()
    data["organization_id"] = current_user.organization_id
    return agent_repo.create(db, data)


@router.get("/{agent_id}", response_model=AgentOut)
def get_agent(
    agent_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    agent = agent_repo.get_by_id(db, agent_id)
    if not agent:
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
    current_user: User = Depends(get_current_user),
):
    agent = agent_repo.get_by_id(db, agent_id)
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found"
        )
    return agent_repo.update(db, agent, agent_in.model_dump(exclude_unset=True))


@router.delete("/{agent_id}")
def delete_agent(
    agent_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    agent = agent_repo.get_by_id(db, agent_id)
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found"
        )
    agent_repo.delete(db, agent_id)
    return {"message": "Agent deleted successfully", "id": agent_id}
