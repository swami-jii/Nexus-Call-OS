"""
Universal Multimodal RAG Data Models, Enums, and Contracts.
Defines data structures across Image, Audio, Video, Document, Tabular, and Web engines.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Optional


class ModalityType(str, Enum):
    DOCUMENT = "document"
    IMAGE = "image"
    AUDIO = "audio"
    VIDEO = "video"
    TABULAR = "tabular"
    WEB = "web"
    UNSTRUCTURED = "unstructured"


class DocumentPattern(str, Enum):
    HEADING = "heading"
    PRICING_TABLE = "pricing_table"
    MARKDOWN_TABLE = "markdown_table"
    BULLET_LIST = "bullet_list"
    KEY_VALUE = "key_value"
    DIALOGUE_TURN = "dialogue_turn"
    SCENE_KEYFRAME = "scene_keyframe"
    PARAGRAPH = "paragraph"


@dataclass
class ParsedPage:
    page_number: int
    text: str
    headings: list[str] = field(default_factory=list)
    tables: list[str] = field(default_factory=list)
    images: list[dict[str, Any]] = field(default_factory=list)
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass
class ParsedDocument:
    filename: str
    modality: ModalityType
    full_text: str
    pages: list[ParsedPage] = field(default_factory=list)
    metadata: dict[str, Any] = field(default_factory=dict)
    structured_tables: list[dict[str, Any]] = field(default_factory=list)
    key_entities: list[str] = field(default_factory=list)


@dataclass
class ChunkItem:
    chunk_index: int
    title: str
    page_number: int
    text: str
    word_count: int
    pattern_type: str
    snippet: str
    modality: str = "document"
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass
class RetrievalMatch:
    id: int
    chunk_index: int
    title: str
    page_number: int
    pattern_type: str
    similarityScore: float
    score: float
    snippet: str
    fullChunk: str
    word_count: int
    total_words: int
    modality: str = "document"


@dataclass
class RAGPipelineResult:
    query: str
    filename: str
    query_info: dict[str, Any]
    matches: list[dict[str, Any]]
    direct_answer: str
    provider_used: str
    pipeline_stages: dict[str, Any]
    latency_ms: float
