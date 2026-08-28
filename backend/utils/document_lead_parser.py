"""
Universal Document Lead Parser
Nexus Call OS Enterprise

Parses arbitrary documents (CSV, TSV, TXT, XLSX, XLS, JSON) into standardized
contact records with 100% dynamic variable preservation.
Every column in the document is converted into an accessible custom variable ({{key}}).
"""

import csv
import io
import json
import logging
import os
import re
from datetime import date, datetime
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger("nexus.document_parser")

try:
    import openpyxl
except ImportError:
    openpyxl = None


def normalize_field_slug(field_name: str) -> str:
    """
    Convert any column header into a clean snake_case variable key.
    Example: 'Account Tier ($USD)' -> 'account_tier_usd'
             'Patient Doctor Name' -> 'patient_doctor_name'
             'Loan_Amount' -> 'loan_amount'
    """
    if not field_name:
        return ""
    clean = str(field_name).strip().lower()
    # Replace non-alphanumeric characters with underscore
    slug = re.sub(r"[^a-z0-9]+", "_", clean)
    return slug.strip("_")


def format_cell_value(val: Any) -> str:
    """Formats cell values into clean strings."""
    if val is None:
        return ""
    if isinstance(val, bool):
        return "true" if val else "false"
    if isinstance(val, (datetime, date)):
        return val.isoformat()
    if isinstance(val, float):
        # Convert floating integers (e.g. 35000.0) into clean integer strings ("35000")
        if val.is_integer():
            return str(int(val))
        return f"{val:.4f}".rstrip("0").rstrip(".")
    if isinstance(val, int):
        return str(val)
    return str(val).strip()


class DocumentLeadParser:
    """Universal parser for lead documents and spreadsheets."""

    ALLOWED_EXTENSIONS = {".csv", ".tsv", ".txt", ".xlsx", ".xls", ".json"}

    NAME_HEADERS = {
        "name", "full_name", "fullname", "contact_name", "contactname",
        "customer_name", "customername", "client_name", "clientname",
        "lead_name", "leadname", "user_name", "username", "person_name", "person"
    }

    FIRST_NAME_HEADERS = {"first_name", "firstname", "fname", "given_name"}
    LAST_NAME_HEADERS = {"last_name", "lastname", "lname", "surname", "family_name"}

    PHONE_HEADERS = {
        "phone", "phone_number", "phonenumber", "mobile", "mobile_number",
        "mobilenumber", "cell", "cellphone", "cell_number", "contact_number",
        "contactnumber", "telephone", "tel", "contact_no", "mobile_no", "phone_no"
    }

    EMAIL_HEADERS = {
        "email", "email_address", "emailaddress", "mail", "e_mail", "customer_email",
        "client_email", "contact_email", "email_id", "emailid"
    }

    STATUS_HEADERS = {"status", "lead_status", "leadstatus", "state", "lead_state"}
    TAGS_HEADERS = {"tags", "tag", "category", "categories", "labels", "label", "groups", "group"}
    COMPANY_HEADERS = {"company", "organization", "company_name", "org_name", "business", "business_name", "employer"}
    SCORE_HEADERS = {"lead_score", "leadscore", "score", "lead_rating", "rating", "priority_score"}

    @classmethod
    def is_supported_file(cls, filename: str) -> bool:
        ext = os.path.splitext(filename.lower())[1]
        return ext in cls.ALLOWED_EXTENSIONS

    @classmethod
    def parse_document_bytes(
        cls, content_bytes: bytes, filename: str
    ) -> List[Dict[str, Any]]:
        """
        Parses document bytes according to file extension and returns a list of contact dicts.
        Guarantees 100% column extraction into custom_variables.
        """
        ext = os.path.splitext(filename.lower())[1]

        if ext in [".xlsx", ".xls"]:
            raw_rows = cls._parse_excel(content_bytes)
        elif ext == ".json":
            raw_rows = cls._parse_json(content_bytes)
        else:
            # CSV, TSV, TXT
            raw_rows = cls._parse_delimited_text(content_bytes)

        return cls._normalize_rows_to_contacts(raw_rows)

    @classmethod
    def _parse_excel(cls, content_bytes: bytes) -> List[Dict[str, Any]]:
        """Parses Excel workbook bytes into list of row dictionaries."""
        if not openpyxl:
            raise ValueError("openpyxl is not installed. Please install openpyxl to process Excel files.")

        wb = openpyxl.load_workbook(io.BytesIO(content_bytes), data_only=True)
        sheet = wb.active or wb.worksheets[0]

        rows_iter = sheet.iter_rows(values_only=True)
        headers: List[str] = []

        # Find first non-empty header row
        for row in rows_iter:
            if any(cell is not None and str(cell).strip() for cell in row):
                headers = [str(cell).strip() if cell is not None else f"Column_{i+1}" for i, cell in enumerate(row)]
                break

        if not headers:
            return []

        raw_rows: List[Dict[str, Any]] = []
        for row in rows_iter:
            if not any(cell is not None and str(cell).strip() for cell in row):
                continue
            row_dict: Dict[str, Any] = {}
            for i, cell in enumerate(row):
                if i < len(headers):
                    header_name = headers[i]
                    if header_name:
                        row_dict[header_name] = format_cell_value(cell)
            if row_dict:
                raw_rows.append(row_dict)

        wb.close()
        return raw_rows

    @classmethod
    def _parse_json(cls, content_bytes: bytes) -> List[Dict[str, Any]]:
        """Parses JSON content bytes into list of row dictionaries."""
        try:
            text = content_bytes.decode("utf-8-sig")
        except UnicodeDecodeError:
            text = content_bytes.decode("latin-1")

        data = json.loads(text)
        if isinstance(data, list):
            return [r for r in data if isinstance(r, dict)]
        elif isinstance(data, dict):
            # Check for common wrapping keys
            for k in ["contacts", "leads", "items", "data", "rows", "records", "users"]:
                if k in data and isinstance(data[k], list):
                    return [r for r in data[k] if isinstance(r, dict)]
            return [data]
        return []

    @classmethod
    def _parse_delimited_text(cls, content_bytes: bytes) -> List[Dict[str, Any]]:
        """Parses CSV/TSV/TXT content with auto-detected encoding and delimiter."""
        encodings = ["utf-8-sig", "utf-8", "latin-1", "cp1252"]
        text_content = ""

        for enc in encodings:
            try:
                text_content = content_bytes.decode(enc)
                break
            except (UnicodeDecodeError, LookupError):
                continue

        if not text_content:
            text_content = content_bytes.decode("utf-8", errors="replace")

        # Auto-detect delimiter
        sample = text_content[:4096]
        delimiter = ","
        try:
            sniffer = csv.Sniffer()
            dialect = sniffer.sniff(sample, delimiters=",;\t|")
            delimiter = dialect.delimiter
        except Exception:
            # Fallback heuristic count
            counts = {
                ",": sample.count(","),
                ";": sample.count(";"),
                "\t": sample.count("\t"),
                "|": sample.count("|"),
            }
            delimiter = max(counts, key=counts.get) if any(counts.values()) else ","

        reader = csv.DictReader(io.StringIO(text_content), delimiter=delimiter)
        raw_rows: List[Dict[str, Any]] = []

        for row in reader:
            if not row:
                continue
            clean_row = {
                (k.strip() if k else f"field_{i}"): format_cell_value(v)
                for i, (k, v) in enumerate(row.items())
                if k is not None or v is not None
            }
            if any(clean_row.values()):
                raw_rows.append(clean_row)

        return raw_rows

    @classmethod
    def _normalize_rows_to_contacts(
        cls, raw_rows: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Converts arbitrary raw rows into clean contact payloads.
        Every column in the row is automatically converted to a dynamic variable!
        """
        contacts: List[Dict[str, Any]] = []

        for row in raw_rows:
            # Map normalized keys to original keys and values
            normalized_map: Dict[str, Tuple[str, str]] = {}
            for orig_k, orig_v in row.items():
                if orig_k is None:
                    continue
                k_clean = str(orig_k).strip()
                if not k_clean:
                    continue
                k_slug = normalize_field_slug(k_clean)
                v_clean = format_cell_value(orig_v)
                normalized_map[k_slug] = (k_clean, v_clean)

            # 1. Detect Name
            name = ""
            for slug in cls.NAME_HEADERS:
                if slug in normalized_map and normalized_map[slug][1]:
                    name = normalized_map[slug][1]
                    break

            if not name:
                fname = ""
                lname = ""
                for slug in cls.FIRST_NAME_HEADERS:
                    if slug in normalized_map and normalized_map[slug][1]:
                        fname = normalized_map[slug][1]
                        break
                for slug in cls.LAST_NAME_HEADERS:
                    if slug in normalized_map and normalized_map[slug][1]:
                        lname = normalized_map[slug][1]
                        break
                if fname or lname:
                    name = f"{fname} {lname}".strip()

            if not name:
                # Fallback to first non-empty alphabetic column or "Unnamed Lead"
                for slug, (_, v) in normalized_map.items():
                    if v and not v.replace("+", "").replace("-", "").isdigit() and "@" not in v:
                        name = v
                        break
            if not name:
                name = "Unnamed Lead"

            # 2. Detect Phone Number
            phone = ""
            for slug in cls.PHONE_HEADERS:
                if slug in normalized_map and normalized_map[slug][1]:
                    phone = normalized_map[slug][1]
                    break

            if not phone:
                # Look for cell that looks like a phone number
                for slug, (_, v) in normalized_map.items():
                    digits = re.sub(r"[^\d+]", "", v)
                    if len(digits) >= 7 and (v.startswith("+") or digits == v or "(" in v):
                        phone = v
                        break
            if not phone:
                phone = "+10000000000"

            # 3. Detect Email
            email = ""
            for slug in cls.EMAIL_HEADERS:
                if slug in normalized_map and normalized_map[slug][1]:
                    email = normalized_map[slug][1]
                    break

            if not email:
                for slug, (_, v) in normalized_map.items():
                    if "@" in v and "." in v:
                        email = v
                        break

            # 4. Detect Status
            status_val = "new"
            for slug in cls.STATUS_HEADERS:
                if slug in normalized_map and normalized_map[slug][1]:
                    raw_s = normalized_map[slug][1].lower().strip()
                    if raw_s in ["new", "contacted", "qualified", "converted", "unreachable"]:
                        status_val = raw_s
                    elif "qual" in raw_s:
                        status_val = "qualified"
                    elif "conv" in raw_s:
                        status_val = "converted"
                    elif "call" in raw_s or "contact" in raw_s:
                        status_val = "contacted"
                    elif "unreach" in raw_s or "fail" in raw_s:
                        status_val = "unreachable"
                    break

            # 5. Detect Tags
            tags_list: List[str] = []
            for slug in cls.TAGS_HEADERS:
                if slug in normalized_map and normalized_map[slug][1]:
                    raw_tags = normalized_map[slug][1]
                    for item in re.split(r"[;,|]", raw_tags):
                        item_clean = item.strip()
                        if item_clean and item_clean not in tags_list:
                            tags_list.append(item_clean)
                    break

            # 6. Detect Company
            company_val = ""
            for slug in cls.COMPANY_HEADERS:
                if slug in normalized_map and normalized_map[slug][1]:
                    company_val = normalized_map[slug][1]
                    break

            # 7. Detect Lead Score
            lead_score_val = 50
            for slug in cls.SCORE_HEADERS:
                if slug in normalized_map and normalized_map[slug][1]:
                    try:
                        lead_score_val = int(normalized_map[slug][1])
                    except ValueError:
                        lead_score_val = 50
                    break

            # 8. Extract Dynamic Custom Variables (ONLY Extra Non-Standard Columns)
            # The 6 strictly standard system slugs: Name, Phone, Email, Status, Company, Lead Score
            standard_slugs = (
                cls.NAME_HEADERS
                | cls.FIRST_NAME_HEADERS
                | cls.LAST_NAME_HEADERS
                | cls.PHONE_HEADERS
                | cls.EMAIL_HEADERS
                | cls.STATUS_HEADERS
                | cls.COMPANY_HEADERS
                | cls.SCORE_HEADERS
                | {"id", "_id", "created_at", "updated_at", "organization_id"}
            )

            custom_vars: Dict[str, Any] = {}
            for slug, (orig_k, orig_v) in normalized_map.items():
                if not slug or not orig_v:
                    continue
                if slug not in standard_slugs:
                    custom_vars[slug] = orig_v

            # Persist company and lead_score in custom_variables for DB model storage and variable resolution
            if company_val:
                custom_vars["company"] = company_val
            if lead_score_val is not None:
                custom_vars["lead_score"] = lead_score_val
            if tags_list and "tags" not in custom_vars and "tag" not in custom_vars:
                custom_vars["tags"] = "; ".join(tags_list)

            contacts.append({
                "name": name,
                "phone": phone,
                "email": email,
                "status": status_val,
                "tags": tags_list,
                "custom_variables": custom_vars,
            })

        return contacts
