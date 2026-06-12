import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings

async def send_sms_alert(phone: str, message: str):
    try:
        if not settings.twilio_account_sid:
            print(f"[DEV SMS] To: {phone} | Msg: {message}")
            return True
        from twilio.rest import Client
        client = Client(settings.twilio_account_sid, settings.twilio_auth_token)
        client.messages.create(body=message, from_=settings.twilio_phone_number, to=phone)
        print(f"[SMS SENT] To: {phone}")
        return True
    except Exception as e:
        print(f"SMS error: {e}")
        return False

async def send_email_alert(to_email: str, subject: str, body: str):
    try:
        if not settings.smtp_email:
            print(f"[DEV EMAIL] To: {to_email} | Subject: {subject}")
            print(f"[DEV EMAIL] Body: {body}")
            return True
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = settings.smtp_email
        msg['To'] = to_email
        html = f"""
        <html><body style="font-family:Arial,sans-serif;background:#0f0f0f;color:#fff;padding:20px;">
          <div style="max-width:500px;margin:0 auto;background:#1a1a2e;border-radius:12px;padding:24px;border:2px solid #e74c3c;">
            <h1 style="color:#e74c3c;text-align:center;">🚨 EMERGENCY SOS ALERT</h1>
            <div style="background:#2b0a0a;border-radius:8px;padding:16px;margin:16px 0;border:1px solid #e74c3c44;">
              <p style="color:#fff;font-size:16px;">{body}</p>
            </div>
            <p style="color:#888;font-size:12px;text-align:center;">Sent via SafeGuard — Women Safety Network</p>
          </div>
        </body></html>
        """
        msg.attach(MIMEText(html, 'html'))
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(settings.smtp_email, settings.smtp_password)
            server.sendmail(settings.smtp_email, to_email, msg.as_string())
        print(f"[EMAIL SENT] To: {to_email}")
        return True
    except Exception as e:
        print(f"Email error: {e}")
        return False

async def send_push_notification(fcm_token: str, title: str, body: str):
    print(f"[DEV PUSH] {title}: {body}")
    return True


async def send_whatsapp_alert(phone: str, user_name: str, maps_link: str):
    """Send WhatsApp message via Twilio Sandbox."""
    try:
        from app.config import settings
        if not settings.twilio_account_sid:
            print(f"[DEV WHATSAPP] To: {phone} | {user_name} needs help! {maps_link}")
            return True
        from twilio.rest import Client
        client = Client(settings.twilio_account_sid, settings.twilio_auth_token)
        client.messages.create(
            body=(
                f"🚨 EMERGENCY SOS ALERT!\n\n"
                f"*{user_name}* needs your help RIGHT NOW!\n\n"
                f"📍 Live Location:\n{maps_link}\n\n"
                f"Please respond immediately!\n\n"
                f"_Sent via SafeGuard Safety Network_"
            ),
            from_='whatsapp:+14155238886',
            to=f'whatsapp:{phone}'
        )
        print(f"[WHATSAPP SENT] To: {phone}")
        return True
    except Exception as e:
        print(f"WhatsApp error: {e}")
        return False


async def make_voice_call(phone: str, user_name: str, maps_link: str):
    """Make automated voice call via Twilio."""
    try:
        from app.config import settings
        if not settings.twilio_account_sid:
            print(f"[DEV VOICE CALL] To: {phone} | {user_name} needs help!")
            return True
        from twilio.rest import Client
        client = Client(settings.twilio_account_sid, settings.twilio_auth_token)
        twiml = f"""
        <Response>
          <Say voice="alice" loop="3">
            Emergency alert. Emergency alert.
            {user_name} needs your help immediately.
            They have triggered an SOS emergency alert.
            Please check your email for their live location
            and respond immediately.
            Emergency alert. {user_name} needs help now.
          </Say>
        </Response>
        """
        call = client.calls.create(
            twiml=twiml,
            from_=settings.twilio_phone_number,
            to=phone
        )
        print(f"[VOICE CALL] To: {phone} | SID: {call.sid}")
        return True
    except Exception as e:
        print(f"Voice call error: {e}")
        return False
