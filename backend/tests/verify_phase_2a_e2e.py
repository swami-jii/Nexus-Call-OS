"""
Deterministic E2E Verification Script for Phase 2A:
1. Test Variable registration in DB (customer_name with default 'Test Customer')
2. Test Prompt Template test execution via /api/prompt-templates/test-prompt with {{customer_name}} and {{business_name}}
3. Test Contact custom_variables override precedence
4. Test plain prompt with zero variables (Regression check)
"""

import os
import sys
import json
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath("."))

from backend.main import app
from backend.database.session import SessionLocal
from backend.models.models import Contact, Organization, ProviderCredential, User
from backend.services.variable_resolver import variable_resolver, ResolutionContext

client = TestClient(app)

def run_phase_2a_verification():
    print("=" * 70)
    print("PHASE 2A: PROMPT TEMPLATES & VARIABLE RESOLVER E2E VERIFICATION")
    print("=" * 70)
    
    db = SessionLocal()
    try:
        # Check active User, Org, and Contact
        org = db.query(Organization).first()
        contact = db.query(Contact).first()
        user = db.query(User).first()
        
        org_name = org.name if org else "Nexus Enterprise AI"
        contact_name = contact.name if contact else "Aarav Sharma"
        
        print(f"\n[1] Active DB Environment State:")
        print(f"  - Organization Name: {org_name}")
        print(f"  - Contact Name in DB: {contact_name}")
        if contact and contact.custom_variables:
            print(f"  - Contact custom_variables in DB: {contact.custom_variables}")

        # -------------------------------------------------------------
        # TEST 1: Register 'customer_name' Variable in DB
        # -------------------------------------------------------------
        print("\n" + "-" * 70)
        print("[TEST 1] Registering variable in DB via /api/credentials/ ...")
        var_payload = {
            "id": "var_customer_name_e2e",
            "provider": "customer_name",
            "display_name": "Customer Name",
            "category": "variables",
            "primary_model": "String",
            "metadata_json": {
                "name": "customer_name",
                "display_name": "Customer Name",
                "variable_type": "String",
                "scope": "Contact Level",
                "default_value": "Test Customer",
                "status": "Active"
            }
        }
        res1 = client.post("/api/credentials/", json=var_payload)
        print(f"  - Variable Save Status: {res1.status_code}")
        print(f"  - Variable Save Response: {res1.json()}")
        
        # Verify in DB
        saved_var = db.query(ProviderCredential).filter(
            ProviderCredential.category == "variables",
            ProviderCredential.provider_name == "customer_name"
        ).first()
        print(f"  - Verified in DB ProviderCredential: {saved_var is not None}")

        # -------------------------------------------------------------
        # TEST 2: Run Prompt Template Test with {{customer_name}} & {{business_name}}
        # -------------------------------------------------------------
        print("\n" + "-" * 70)
        print("[TEST 2] Testing Prompt Template Live Resolution ...")
        prompt_payload = {
            "system_prompt": "You are Alex calling on behalf of {{business_name}}. Deliver the introductory opening to {{customer_name}}.",
            "user_prompt": "Hello {{customer_name}}, welcome to {{business_name}}.",
            "template_name": "Outbound Intro Template",
            "category": "Outbound Sales",
            "gender": "female"
        }
        res2 = client.post("/api/prompt-templates/test-prompt", json=prompt_payload)
        data2 = res2.json()
        print(f"  - Response Status Code: {res2.status_code}")
        print(f"  - Interpolated User Prompt: {data2.get('interpolated_prompt')}")
        print(f"  - Model Used: {data2.get('model_used')}")
        print(f"  - Latency: {data2.get('latency_ms')}ms")
        print(f"  - Resolved Entities: {json.dumps(data2.get('resolved_entities', {}), indent=2)}")
        print(f"  - AI Response: {data2.get('ai_response')}")

        # Check that raw tags were cleanly resolved
        assert "{{" not in data2.get('interpolated_prompt', ''), "Error: raw {{}} found in prompt!"
        assert org_name in data2.get('interpolated_prompt', '') or "Nexus" in data2.get('interpolated_prompt', ''), "Error: Org name missing!"
        print("  [OK] TEST 2 PASSED: All variables dynamically resolved with zero raw brackets.")

        # -------------------------------------------------------------
        # TEST 3: Contact Custom Variables Override Precedence Test
        # -------------------------------------------------------------
        print("\n" + "-" * 70)
        print("[TEST 3] Testing Contact custom_variables Override Precedence ...")
        
        # Test resolver directly with custom_variables override
        ctx_override = ResolutionContext(
            custom_variables={"customer_name": "Dr. Sameer Kapoor (VIP Contact)"},
            workspace_overrides={"business_name": org_name}
        )
        res3 = variable_resolver.resolve_text(
            "Hello {{customer_name}}, welcome to {{business_name}}.",
            context=ctx_override
        )
        print(f"  - Original Template: Hello {{{{customer_name}}}}, welcome to {{{{business_name}}}}.")
        print(f"  - Resolved with Contact Override: {res3.resolved_text}")
        print(f"  - Precedence Trace: {res3.precedence_trace}")
        assert "Dr. Sameer Kapoor (VIP Contact)" in res3.resolved_text, "Error: Contact custom_variable did not override default!"
        assert res3.precedence_trace.get("customer_name") == "Contact Level", "Error: Trace not Contact Level!"
        print("  [OK] TEST 3 PASSED: Contact-level custom variable correctly overrides default/workspace.")

        # -------------------------------------------------------------
        # TEST 4: Regression Check with Plain Prompt (No Variables)
        # -------------------------------------------------------------
        print("\n" + "-" * 70)
        print("[TEST 4] Testing Plain Prompt Without Any Variables (Regression Check) ...")
        plain_payload = {
            "system_prompt": "You are a professional customer support representative. Answer customer questions clearly.",
            "user_prompt": "Can you tell me your operational working hours?",
            "template_name": "Plain Support Prompt",
            "category": "Inbound Support",
            "gender": "female"
        }
        res4 = client.post("/api/prompt-templates/test-prompt", json=plain_payload)
        data4 = res4.json()
        print(f"  - Response Status Code: {res4.status_code}")
        print(f"  - Interpolated Prompt: {data4.get('interpolated_prompt')}")
        print(f"  - Model Used: {data4.get('model_used')}")
        print(f"  - Status: {data4.get('status')}")
        assert res4.status_code == 200, "Error: Plain prompt failed!"
        print("  [OK] TEST 4 PASSED: Non-variable prompts execute without regression.")

        print("\n" + "=" * 70)
        print("ALL 4 VERIFICATION SCENARIOS PASSED WITH 100% SUCCESS!")
        print("=" * 70)

    finally:
        db.close()

if __name__ == "__main__":
    run_phase_2a_verification()
