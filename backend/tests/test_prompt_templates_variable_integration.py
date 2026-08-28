"""
Unit and Integration Tests for Prompt Template AI router with VariableResolverService (Phase 2A)
"""

import os
import sys
import unittest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath("."))

from backend.main import app
from backend.services.variable_resolver import variable_resolver


class TestPromptTemplatesVariableIntegration(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_scan_variables_in_prompt_template_ai(self):
        """Verify prompt template variable scanning extracts exact tags via VariableResolverService."""
        template_text = (
            "You are {{agent_name}} calling {{customer_name}} regarding {{service_name}} "
            "at {{company_name}}. Booking date is {{appointment_date}}."
        )
        detected = variable_resolver.scan_variables(template_text)
        expected = ["agent_name", "customer_name", "service_name", "company_name", "appointment_date"]
        for exp in expected:
            self.assertIn(exp, detected)

    def test_prompt_template_test_endpoint_variable_resolution(self):
        """Test /api/prompt-templates/test-prompt endpoint interpolates variables and returns structured response."""
        payload = {
            "system_prompt": "You are {{agent_name}} from {{business_name}}. You are speaking with {{customer_name}}.",
            "user_prompt": "Hello {{customer_name}}, thank you for contacting {{business_name}} regarding {{service_name}}.",
            "template_name": "Outbound Sales SDR Test",
            "category": "Consulting Strategy",
            "gender": "female"
        }
        res = self.client.post("/api/prompt-templates/test-prompt", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data.get("status"), "success")
        self.assertTrue(len(data.get("interpolated_prompt", "")) > 0)
        # Verify raw {{}} brackets are replaced cleanly
        self.assertNotIn("{{customer_name}}", data.get("interpolated_prompt", ""))
        self.assertNotIn("{{business_name}}", data.get("interpolated_prompt", ""))
        self.assertIn("resolved_entities", data)


if __name__ == "__main__":
    unittest.main()
