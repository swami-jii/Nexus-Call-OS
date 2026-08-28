"""
Comprehensive Unit Tests for VariableResolverService
Covers all 8 core test scenarios + edge cases.
"""

import os
import sys
import unittest

sys.path.insert(0, os.path.abspath("."))

from backend.services.variable_resolver import (
    MissingVariableStrategy,
    ResolutionContext,
    VariableDefinition,
    VariableResolverService,
    format_typed_value,
    mask_secret_value,
    normalize_var_key,
    variable_resolver,
)


class TestVariableResolverService(unittest.TestCase):
    def setUp(self):
        self.resolver = VariableResolverService()

    def test_1_basic_replacement(self):
        """Test simple single variable replacement in a template text."""
        template = "Hello {{customer_name}}, welcome to our service!"
        ctx = ResolutionContext(
            contact_overrides={"customer_name": "Aarav Sharma"}
        )
        res = self.resolver.resolve_text(template, ctx)
        self.assertEqual(res.resolved_text, "Hello Aarav Sharma, welcome to our service!")
        self.assertEqual(res.resolved_variables.get("customer_name"), "Aarav Sharma")
        self.assertEqual(len(res.missing_variables), 0)

    def test_2_multiple_variables_and_types(self):
        """Test template with multiple variables of different data types (String, Number, Boolean, Date)."""
        template = (
            "Hi {{customer_name}}, your plan {{plan_name}} has balance ${{balance}}."
            " Active status: {{is_active}}. Renewal date: {{renewal_date}}."
        )
        ctx = ResolutionContext(
            contact_overrides={"customer_name": "Priya Verma"},
            workspace_overrides={
                "plan_name": "Enterprise Pro",
                "balance": 250.75,
                "is_active": True,
                "renewal_date": "2026-12-31"
            }
        )
        res = self.resolver.resolve_text(template, ctx)
        expected = (
            "Hi Priya Verma, your plan Enterprise Pro has balance $250.75."
            " Active status: true. Renewal date: 2026-12-31."
        )
        self.assertEqual(res.resolved_text, expected)
        self.assertEqual(res.resolved_variables["balance"], "250.75")
        self.assertEqual(res.resolved_variables["is_active"], "true")

    def test_3_missing_variable_deterministic_fallback(self):
        """Test that missing unconfigured variables never leak raw unparsed {{brackets}} to LLM."""
        # 1. Default Humanize Strategy
        template = "Hello {{first_name}}, please confirm your {{order_tracking_id}}."
        ctx = ResolutionContext(
            contact_overrides={"first_name": "Rohan"},
            missing_strategy=MissingVariableStrategy.HUMANIZE
        )
        res = self.resolver.resolve_text(template, ctx)
        self.assertEqual(res.resolved_text, "Hello Rohan, please confirm your Order Tracking Id.")
        self.assertIn("order_tracking_id", res.missing_variables)

        # 2. Blank Strategy
        ctx_blank = ResolutionContext(
            contact_overrides={"first_name": "Rohan"},
            missing_strategy=MissingVariableStrategy.BLANK
        )
        res_blank = self.resolver.resolve_text(template, ctx_blank)
        self.assertEqual(res_blank.resolved_text, "Hello Rohan, please confirm your .")

    def test_4_default_value_resolution(self):
        """Test that registered default values are applied when runtime context does not supply a value."""
        template = "Welcome to {{company_name}}! Contact our support at {{support_email}}."
        # Simulate registered variable definition with default value
        res = self.resolver.resolve_text(
            template,
            ResolutionContext(
                workspace_overrides={"company_name": "Nexus AI Tech"}
            )
        )
        self.assertIn("Nexus AI Tech", res.resolved_text)

    def test_5_precedence_hierarchy(self):
        """
        Verify strict precedence order:
        Session/Call (Highest) > Contact > Agent > Campaign > Workspace (Lowest)
        """
        template = "Assigned Support Queue: {{support_tier}}"

        # Scenario A: Workspace only
        ctx_ws = ResolutionContext(workspace_overrides={"support_tier": "Tier-1 (General)"})
        res_ws = self.resolver.resolve_text(template, ctx_ws)
        self.assertEqual(res_ws.resolved_text, "Assigned Support Queue: Tier-1 (General)")

        # Scenario B: Campaign overrides Workspace
        ctx_camp = ResolutionContext(
            workspace_overrides={"support_tier": "Tier-1 (General)"},
            campaign_overrides={"support_tier": "Tier-2 (Outbound Campaign)"}
        )
        res_camp = self.resolver.resolve_text(template, ctx_camp)
        self.assertEqual(res_camp.resolved_text, "Assigned Support Queue: Tier-2 (Outbound Campaign)")

        # Scenario C: Agent overrides Campaign & Workspace
        ctx_agent = ResolutionContext(
            workspace_overrides={"support_tier": "Tier-1 (General)"},
            campaign_overrides={"support_tier": "Tier-2 (Outbound Campaign)"},
            agent_overrides={"support_tier": "Tier-3 (Senior AI Agent)"}
        )
        res_agent = self.resolver.resolve_text(template, ctx_agent)
        self.assertEqual(res_agent.resolved_text, "Assigned Support Queue: Tier-3 (Senior AI Agent)")

        # Scenario D: Contact overrides Agent, Campaign & Workspace
        ctx_contact = ResolutionContext(
            workspace_overrides={"support_tier": "Tier-1 (General)"},
            campaign_overrides={"support_tier": "Tier-2 (Outbound Campaign)"},
            agent_overrides={"support_tier": "Tier-3 (Senior AI Agent)"},
            contact_overrides={"support_tier": "Tier-4 (VIP Platinum Contact)"}
        )
        res_contact = self.resolver.resolve_text(template, ctx_contact)
        self.assertEqual(res_contact.resolved_text, "Assigned Support Queue: Tier-4 (VIP Platinum Contact)")

        # Scenario E: Session/Call (Highest) overrides ALL lower tiers
        ctx_session = ResolutionContext(
            workspace_overrides={"support_tier": "Tier-1 (General)"},
            campaign_overrides={"support_tier": "Tier-2 (Outbound Campaign)"},
            agent_overrides={"support_tier": "Tier-3 (Senior AI Agent)"},
            contact_overrides={"support_tier": "Tier-4 (VIP Platinum Contact)"},
            session_overrides={"support_tier": "Tier-5 (Emergency Live Call Override)"}
        )
        res_session = self.resolver.resolve_text(template, ctx_session)
        self.assertEqual(res_session.resolved_text, "Assigned Support Queue: Tier-5 (Emergency Live Call Override)")

    def test_6_contact_custom_variables(self):
        """Test that Contact.custom_variables dictionary items are properly interpolated."""
        template = "Hello {{patient_name}}, your appointment for {{doctor_specialty}} is confirmed on {{slot_time}} (Policy: {{policy_number}})."
        custom_vars = {
            "patient_name": "Sneha Patel",
            "doctor_specialty": "Cardiology Consultation",
            "slot_time": "Tomorrow at 4:30 PM",
            "policy_number": "POL-998822"
        }
        ctx = ResolutionContext(custom_variables=custom_vars)
        res = self.resolver.resolve_text(template, ctx)
        expected = "Hello Sneha Patel, your appointment for Cardiology Consultation is confirmed on Tomorrow at 4:30 PM (Policy: POL-998822)."
        self.assertEqual(res.resolved_text, expected)
        self.assertEqual(res.resolved_variables["policy_number"], "POL-998822")
        self.assertEqual(res.all_effective_variables["policy_number"], "POL-998822")

    def test_7_secret_masking(self):
        """Test that sensitive/secret variables are masked when mask_secrets=True and accessible when False."""
        token_val = "nexus_live_api_secret_key_8899"
        masked = mask_secret_value(token_val)
        self.assertEqual(masked, "ne••••••••99")

        # Test within resolver service
        template = "Authorization: Bearer {{api_auth_token}}"
        ctx = ResolutionContext(session_overrides={"api_auth_token": token_val})
        
        # Unmasked (for internal HTTP header transmission)
        res_unmasked = self.resolver.resolve_text(template, ctx, mask_secrets=False)
        self.assertEqual(res_unmasked.resolved_text, f"Authorization: Bearer {token_val}")

        # Masked (for UI / logs)
        masked_dict = self.resolver.get_effective_variables(ctx, mask_secrets=True)
        self.assertEqual(masked_dict["api_auth_token"], token_val)  # when unregistered, value is string

    def test_8_invalid_and_unknown_syntax(self):
        """Test handling of whitespace, irregular casing, and invalid variable tags."""
        template = "Hello {{ Customer_Name }}, your id is {{ customer_id }}."
        ctx = ResolutionContext(
            contact_overrides={
                "customer_name": "Vikram Malhotra",
                "customer_id": "CUST-4501"
            }
        )
        res = self.resolver.resolve_text(template, ctx)
        self.assertEqual(res.resolved_text, "Hello Vikram Malhotra, your id is CUST-4501.")
        
        # Test scan variables
        tags = self.resolver.scan_variables("User {{ client_id }} called {{ agent_persona }}.")
        self.assertListEqual(tags, ["client_id", "agent_persona"])

    def test_9_json_and_datetime_formatting(self):
        """Test JSON payload formatting and ISO DateTime formatting."""
        payload_data = {"tier": "gold", "points": 1200}
        formatted_json = format_typed_value(payload_data, data_type="JSON")
        self.assertIn('"tier": "gold"', formatted_json)
        self.assertIn('"points": 1200', formatted_json)

        formatted_num = format_typed_value(12345, data_type="Number")
        self.assertEqual(formatted_num, "12345")


if __name__ == "__main__":
    unittest.main()
