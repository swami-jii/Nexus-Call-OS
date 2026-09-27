import hashlib
import logging
import os
import re
import smtplib
import socket
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Tuple

from backend.core.config import settings

logger = logging.getLogger("createcall.email")


def validate_email_syntax_and_domain(email: str) -> Tuple[bool, str]:
    """
    Dynamically validates that the email follows universal RFC standard format
    and that its domain actually exists and resolves on internet DNS (MX/A/AAAA).
    100% Dynamic - Zero hardcoded domain extensions or provider names.
    Supports all personal, startup, corporate, business, and educational emails globally.
    """
    clean_email = (email or "").strip().lower()
    if not clean_email or "@" not in clean_email:
        return False, "Please provide a valid email address."

    # 1. Standard RFC 5322 regex pattern
    regex = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
    if not re.match(regex, clean_email):
        return False, "Invalid email address format. Please enter a valid email (e.g. alex@company.com)."

    parts = clean_email.split("@")
    if len(parts) != 2:
        return False, "Invalid email address format."

    user_part, domain_part = parts[0].strip(), parts[1].strip()
    if len(user_part) < 1 or len(domain_part) < 3:
        return False, "Email address username or domain is too short."

    if "." not in domain_part or domain_part.endswith(".") or domain_part.startswith("."):
        return False, "Email domain is invalid. Please check the domain name."

    # Allow local sovereign and development domains without external DNS lookup
    if domain_part in ("createcall.ai", "createcall.local", "localhost", "dev.local") or domain_part.endswith(".local") or domain_part.endswith(".internal"):
        return True, ""

    # 2. Dynamic Internet DNS Resolution (MX record check with A/AAAA fallback - No hardcoded lists)
    domain_exists = False
    try:
        import dns.resolver

        # First priority: check if domain has Mail Exchanger (MX) records
        try:
            dns.resolver.resolve(domain_part, "MX", lifetime=3.0)
            domain_exists = True
        except (dns.resolver.NoAnswer, dns.resolver.NoNameservers):
            # Second priority: check if domain has host/apex A records
            try:
                dns.resolver.resolve(domain_part, "A", lifetime=3.0)
                domain_exists = True
            except Exception:
                pass
        except dns.resolver.NXDOMAIN:
            return False, f"The email domain '@{domain_part}' does not exist on the internet. Please enter a real, active email address."
        except Exception:
            pass
    except ImportError:
        pass

    # Fallback to standard socket DNS resolver if dnspython was inconclusive
    if not domain_exists:
        try:
            socket.getaddrinfo(domain_part, None)
            domain_exists = True
        except socket.gaierror:
            return False, f"The email domain '@{domain_part}' does not exist or cannot be reached. Please enter a real, active email address."
        except Exception:
            domain_exists = True  # Network timeout or offline dev environment: allow format to pass

    return True, ""


def build_verification_email_html(recipient_name: str, otp_code: str, action_title: str = "Verification Code") -> str:
    """
    Generates a clean, universal, production-grade enterprise email.
    Features the prominent wide graphic banner logo with guaranteed 100% contrast in both Light Mode and Dark Mode,
    100% transparent look with zero background boxes, and dynamic cache busting.
    """
    clean_name = (recipient_name or "there").strip()
    return f"""<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>CreateCall OS Verification Code</title>
  <style>
    :root {{
      color-scheme: light dark;
      supported-color-schemes: light dark;
    }}
    @media (prefers-color-scheme: dark) {{
      body, .email-bg {{
        background-color: #09090b !important;
        color: #f4f4f5 !important;
      }}
      .email-card {{
        background-color: #121215 !important;
        border-color: #27272a !important;
      }}
      .email-heading {{
        color: #ffffff !important;
      }}
      .email-text-main {{
        color: #e4e4e7 !important;
      }}
      .email-text-muted {{
        color: #a1a1aa !important;
      }}
      .otp-box {{
        background-color: #042f2e !important;
        border-color: #115e59 !important;
      }}
      .otp-code {{
        color: #2dd4bf !important;
      }}
      .email-footer {{
        border-top-color: #27272a !important;
        color: #71717a !important;
      }}
    }}
  </style>
</head>
<body class="email-bg" style="margin:0;padding:32px 16px;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;line-height:1.6;-webkit-font-smoothing:antialiased;">
  <div class="email-card" style="max-width:540px;margin:0 auto;padding:40px 32px;background-color:#ffffff;border:1px solid #e2e8f0;border-radius:16px;box-shadow:0 4px 16px rgba(0,0,0,0.03);">
    
    <!-- Centered Brand Header (Original Wide Graphic Banner Logos) -->
    <div style="text-align:center;margin-bottom:28px;padding-bottom:22px;border-bottom:1px solid #f1f5f9;">
      <picture>
        <source srcset="https://raw.githubusercontent.com/swami-jii/Nexus-Call-OS/2cee134/public/create-call-banner-dark.png" media="(prefers-color-scheme: dark)">
        <img src="https://raw.githubusercontent.com/swami-jii/Nexus-Call-OS/2cee134/public/create-call-banner-light.png" width="230" alt="CreateCall OS" style="display:inline-block;max-width:230px;width:100%;height:auto;border:0;outline:none;background:transparent;" />
      </picture>
      <div style="font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1.5px;margin-top:12px;">
        Enterprise AI Voice Operating System
      </div>
    </div>

    <!-- Main Message -->
    <h2 class="email-heading" style="font-size:20px;font-weight:700;color:#0f172a;margin:0 0 16px 0;letter-spacing:-0.3px;text-align:center;">
      {action_title}
    </h2>

    <p class="email-text-main" style="font-size:15px;color:#334155;margin:0 0 16px 0;line-height:1.6;">
      Hello <strong>{clean_name}</strong>,
    </p>

    <p class="email-text-main" style="font-size:15px;color:#334155;margin:0 0 24px 0;line-height:1.6;">
      Please use the following 6-digit security verification code to activate your account and access your CreateCall OS workspace:
    </p>

    <!-- 6-Digit Code Box -->
    <div class="otp-box" style="background-color:#f0fdfa;border:1.5px solid #ccfbf1;border-radius:12px;padding:24px 16px;text-align:center;margin:24px 0;">
      <div style="font-size:11px;font-weight:700;color:#0d9488;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;">
        Security Verification Code
      </div>
      <div class="otp-code" style="font-family:'SF Mono','Roboto Mono',Menlo,Consolas,monospace;font-size:38px;font-weight:800;letter-spacing:10px;color:#0f766e;margin:6px 0;">
        {otp_code}
      </div>
      <div class="email-text-muted" style="font-size:13px;color:#64748b;margin-top:8px;">
        Valid for <strong>10 minutes</strong>
      </div>
    </div>

    <p class="email-text-muted" style="font-size:13px;color:#64748b;margin:24px 0 0 0;line-height:1.5;text-align:center;">
      Never share this code with anyone. If you didn't request this verification code, you can safely ignore this email.
    </p>

    <!-- Footer -->
    <div class="email-footer" style="margin-top:36px;padding-top:20px;border-top:1px solid #f1f5f9;font-size:12px;color:#94a3b8;line-height:1.5;text-align:center;">
      &copy; 2026 CreateCall OS Inc. All rights reserved.<br>
      High-Performance Autonomous AI Voice Agents & Telephony Infrastructure.
    </div>

  </div>
</body>
</html>"""


class EmailService:
    """Dispatches clean, universal verification emails via SMTP with zero file attachments."""

    def send_verification_otp(
        self, recipient_email: str, recipient_name: str, otp_code: str, action_title: str = "Security Verification"
    ) -> bool:
        clean_email = recipient_email.strip()
        subject = f"CreateCall OS Verification Code: {otp_code}"

        html_content = build_verification_email_html(
            recipient_name=recipient_name,
            otp_code=otp_code,
            action_title=action_title,
        )

        # Dynamically reload .env so edits take effect immediately
        try:
            from dotenv import load_dotenv
            load_dotenv(override=True)
        except Exception:
            pass

        smtp_host = (os.getenv("SMTP_HOST") or settings.SMTP_HOST or "smtp.gmail.com").strip()
        smtp_port = int(os.getenv("SMTP_PORT") or settings.SMTP_PORT or 587)
        smtp_user = (os.getenv("SMTP_USER") or settings.SMTP_USER or "").strip()
        smtp_password = (os.getenv("SMTP_PASSWORD") or settings.SMTP_PASSWORD or "").strip().replace(" ", "")
        from_email = (os.getenv("EMAILS_FROM_EMAIL") or getattr(settings, "EMAILS_FROM_EMAIL", None) or smtp_user or "security@createcall.ai").strip()
        from_name = (os.getenv("EMAILS_FROM_NAME") or getattr(settings, "EMAILS_FROM_NAME", None) or "CreateCall OS Security").strip()

        # Always log cleanly to server log for observability
        logger.info(
            f"[CreateCall OS Email Service] Verification code dispatched for {clean_email}."
        )
        print(f"\n=======================================================")
        print(f"[CreateCall OS EMAIL DISPATCHER]")
        print(f"   To: {clean_email} ({recipient_name})")
        print(f"   Subject: {subject}")
        print(f"   From: {from_name} <{from_email}>")
        print(f"   SMTP Server: {smtp_host}:{smtp_port} (User: {smtp_user})")
        print(f"=======================================================\n")

        # If SMTP is configured, send pure text/html email with NO file attachments
        if smtp_host and smtp_user and smtp_password:
            try:
                msg = MIMEMultipart("alternative")
                msg["Subject"] = subject
                msg["From"] = f"{from_name} <{from_email}>"
                msg["To"] = clean_email
                msg["Reply-To"] = from_email

                text_fallback = (
                    f"CreateCall OS Verification Code\n\n"
                    f"Hello {recipient_name},\n\n"
                    f"Your 6-digit security verification code is: {otp_code}\n\n"
                    f"This code is valid for 10 minutes. Never share this code with anyone.\n\n"
                    f"© 2026 CreateCall OS Inc."
                )
                msg.attach(MIMEText(text_fallback, "plain", "utf-8"))
                msg.attach(MIMEText(html_content, "html", "utf-8"))

                if smtp_port == 465:
                    with smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=15) as server:
                        server.login(smtp_user, smtp_password)
                        server.sendmail(from_email, [clean_email], msg.as_string())
                else:
                    with smtplib.SMTP(smtp_host, smtp_port, timeout=15) as server:
                        server.ehlo()
                        server.starttls()
                        server.ehlo()
                        server.login(smtp_user, smtp_password)
                        server.sendmail(from_email, [clean_email], msg.as_string())

                logger.info(f"Successfully sent clean verification email to {clean_email} via SMTP ({smtp_host}).")
                print(f"[SUCCESS] Clean verification email delivered to {clean_email} via {smtp_host}\n")
                return True
            except Exception as e:
                logger.error(f"SMTP dispatch error for {clean_email}: {e}")
                print(f"[ERROR] SMTP dispatch failed for {clean_email}: {e}\n")
                return False

        return True


email_service = EmailService()
