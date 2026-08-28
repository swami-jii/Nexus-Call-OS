from typing import Any, Generic, TypeVar

from sqlalchemy import or_
from sqlalchemy.orm import Session

ModelType = TypeVar("ModelType", bound=Any)


class BaseRepository(Generic[ModelType]):
    def __init__(self, model: type[ModelType]):
        self.model = model

    def get_by_id(self, db: Session, id: Any) -> ModelType | None:
        return db.query(self.model).filter(self.model.id == id).first()

    def get_multi(
        self,
        db: Session,
        *,
        skip: int = 0,
        limit: int = 20,
        filters: dict[str, Any] | None = None,
        search_query: str | None = None,
        search_fields: list[str] | None = None,
        order_by: str | None = "created_at",
        order_desc: bool = True,
    ) -> list[ModelType]:
        query = db.query(self.model)

        # Apply filtering
        if filters:
            for field, value in filters.items():
                if hasattr(self.model, field) and value is not None:
                    query = query.filter(getattr(self.model, field) == value)

        # Apply searching
        if search_query and search_fields:
            search_conditions = []
            for field in search_fields:
                if hasattr(self.model, field):
                    search_conditions.append(
                        getattr(self.model, field).ilike(f"%{search_query}%")
                    )
            if search_conditions:
                query = query.filter(or_(*search_conditions))

        # Apply ordering
        if order_by and hasattr(self.model, order_by):
            column = getattr(self.model, order_by)
            if order_desc:
                query = query.order_by(column.desc())
            else:
                query = query.order_by(column.asc())

        return query.offset(skip).limit(limit).all()

    def count(
        self,
        db: Session,
        *,
        filters: dict[str, Any] | None = None,
        search_query: str | None = None,
        search_fields: list[str] | None = None,
    ) -> int:
        query = db.query(self.model)

        if filters:
            for field, value in filters.items():
                if hasattr(self.model, field) and value is not None:
                    query = query.filter(getattr(self.model, field) == value)

        if search_query and search_fields:
            search_conditions = []
            for field in search_fields:
                if hasattr(self.model, field):
                    search_conditions.append(
                        getattr(self.model, field).ilike(f"%{search_query}%")
                    )
            if search_conditions:
                query = query.filter(or_(*search_conditions))

        return query.count()

    def create(self, db: Session, obj_in: dict[str, Any]) -> ModelType:
        db_obj = self.model(**obj_in)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(
        self, db: Session, db_obj: ModelType, obj_in: dict[str, Any]
    ) -> ModelType:
        for field, value in obj_in.items():
            if value is not None and hasattr(db_obj, field):
                setattr(db_obj, field, value)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def delete(self, db: Session, id: Any) -> ModelType | None:
        obj = db.query(self.model).filter(self.model.id == id).first()
        if obj:
            db.delete(obj)
            db.commit()
        return obj
