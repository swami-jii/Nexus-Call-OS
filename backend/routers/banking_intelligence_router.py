"""
==============================================================================
CREATE CALL OS - 100% DYNAMIC BANKING & POSTAL INTELLIGENCE ROUTER (SSOT)
==============================================================================
Exposes live RBI, India Post, Zippopotam, and IFSC/SWIFT code lookups & MCP tools.
==============================================================================
"""

import logging
from typing import Any, Dict, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from backend.services.banking_intelligence_service import BankingIntelligenceService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/banking", tags=["Banking & Postal Intelligence"])


class McpExecuteRequest(BaseModel):
    tool_name: str
    arguments: Dict[str, Any]


@router.get("/auto-resolve")
def auto_resolve_bank_endpoint(
    bank_name: str = Query(..., description="Bank name"),
    country_iso2: str = Query("IN", description="2-letter ISO Country Code"),
    postal_code: str = Query("", description="PIN or Postal Code"),
    district: str = Query("", description="Optional District or City"),
    state: str = Query("", description="Optional State or Province"),
):
    result = BankingIntelligenceService.resolve_bank_by_pin_or_location(
        bank_name=bank_name,
        country_iso2=country_iso2,
        postal_code=postal_code,
        district=district,
        state=state,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Failed to resolve banking details.")
    return result


@router.get("/lookup-ifsc")
def lookup_ifsc_endpoint(code: str = Query(..., description="11-character Indian IFSC code")):
    result = BankingIntelligenceService.lookup_ifsc(code)
    if not result:
        raise HTTPException(status_code=404, detail=f"IFSC code '{code}' not found in live RBI records.")
    return result


@router.get("/lookup-postal")
def lookup_postal_endpoint(
    postal_code: str = Query(..., description="PIN or Postal code"),
    country_iso2: str = Query("IN", description="2-letter ISO Country Code"),
):
    result = BankingIntelligenceService.lookup_postal(country_iso2, postal_code)
    if not result:
        raise HTTPException(
            status_code=404,
            detail=f"Postal code '{postal_code}' not found for country '{country_iso2}'.",
        )
    return result


@router.get("/lookup-swift")
def lookup_swift_endpoint(
    code: str = Query(..., description="SWIFT/BIC code"),
    country_iso2: Optional[str] = Query(None, description="Country ISO2"),
):
    return BankingIntelligenceService.lookup_swift(code, country_iso2 or "")


@router.get("/mcp/tools")
def get_mcp_tools_endpoint():
    return {
        "schema_version": "2024-11-05",
        "tools": BankingIntelligenceService.get_mcp_tools_schema(),
    }


@router.post("/mcp/execute")
def execute_mcp_tool_endpoint(req: McpExecuteRequest):
    tool = req.tool_name
    args = req.arguments or {}

    if tool == "auto_resolve_bank":
        bank = args.get("bank_name", "")
        iso = args.get("country_iso2", "IN")
        pin = args.get("postal_code", "")
        dist = args.get("district", "")
        st = args.get("state", "")
        res = BankingIntelligenceService.resolve_bank_by_pin_or_location(bank, iso, pin, dist, st)
        return {"status": "success", "result": res}

    elif tool == "lookup_ifsc":
        ifsc = args.get("ifsc_code", "")
        res = BankingIntelligenceService.lookup_ifsc(ifsc)
        if not res:
            return {"status": "error", "message": f"IFSC code '{ifsc}' not found."}
        return {"status": "success", "result": res}

    elif tool == "lookup_postal_code":
        iso = args.get("country_iso2", "IN")
        pin = args.get("postal_code", "")
        res = BankingIntelligenceService.lookup_postal(iso, pin)
        if not res:
            return {"status": "error", "message": f"Postal code '{pin}' not found for {iso}."}
        return {"status": "success", "result": res}

    elif tool == "lookup_swift_bic":
        swift = args.get("swift_code", "")
        iso = args.get("country_iso2", "")
        res = BankingIntelligenceService.lookup_swift(swift, iso)
        return {"status": "success", "result": res}

    raise HTTPException(status_code=400, detail=f"Unknown tool name '{tool}'")
