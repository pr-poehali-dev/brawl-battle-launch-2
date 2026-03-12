import json
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import psycopg2
import psycopg2.extras


def handler(event, context):
    """Отправка email-уведомлений администраторам компании о событиях в ЛК"""

    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }

    cors = {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}

    if event.get('httpMethod') != 'POST':
        return {'statusCode': 405, 'headers': cors, 'body': json.dumps({'error': 'Method not allowed'})}

    raw_body = event.get('body') or '{}'
    if isinstance(raw_body, str):
        try:
            body = json.loads(raw_body)
        except (json.JSONDecodeError, TypeError):
            body = {}
    elif isinstance(raw_body, dict):
        body = raw_body
    else:
        body = {}
    if not isinstance(body, dict):
        body = {}
    company_id = body.get('company_id')
    event_type = body.get('event_type')

    if not company_id or not event_type:
        return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'company_id and event_type required'})}

    schema = os.environ.get('MAIN_DB_SCHEMA', 't_p65890965_refstaff_project')

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    conn.autocommit = True
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    cur.execute(f"SELECT name FROM {schema}.companies WHERE id = %s", (company_id,))
    company = cur.fetchone()
    if not company:
        cur.close()
        conn.close()
        return {'statusCode': 404, 'headers': cors, 'body': json.dumps({'error': 'Company not found'})}

    cur.execute(
        f"SELECT email, first_name, last_name FROM {schema}.users WHERE company_id = %s AND is_admin = true AND email_verified = true",
        (company_id,)
    )
    admins = cur.fetchall()
    cur.close()
    conn.close()

    if not admins:
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'message': 'No verified admins to notify'})}

    company_name = company['name']
    subject, html = build_email(event_type, body, company_name)

    smtp_host = os.environ.get('EMAIL_SMTP_HOST')
    smtp_port = int(os.environ.get('EMAIL_SMTP_PORT', '587'))
    smtp_user = os.environ.get('EMAIL_FROM')
    smtp_password = os.environ.get('EMAIL_PASSWORD')

    if not all([smtp_host, smtp_user, smtp_password]):
        return {'statusCode': 500, 'headers': cors, 'body': json.dumps({'error': 'Email not configured'})}

    sent = 0
    for admin in admins:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = smtp_user
        msg['To'] = admin['email']
        msg.attach(MIMEText(html, 'html', 'utf-8'))

        with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.send_message(msg)
            sent += 1

    return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'sent': sent})}


def build_email(event_type, data, company_name):
    if event_type == 'new_employee':
        subject = f'iHUNT — Новый сотрудник зарегистрирован'
        name = f"{data.get('first_name', '')} {data.get('last_name', '')}"
        position = data.get('position', 'Не указана')
        email = data.get('email', '')
        content = f"""
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                <div style="font-size: 32px; margin-bottom: 8px;">👤</div>
                <h2 style="color: #ffffff; margin: 0 0 4px;">Новый сотрудник</h2>
                <p style="color: rgba(255,255,255,0.85); margin: 0; font-size: 14px;">Зарегистрирован в системе iHUNT</p>
            </div>
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px; width: 140px;">Имя</td>
                    <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; font-weight: 600; font-size: 15px;">{name}</td>
                </tr>
                <tr>
                    <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px;">Должность</td>
                    <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; font-size: 15px;">{position}</td>
                </tr>
                <tr>
                    <td style="padding: 12px 16px; color: #64748b; font-size: 13px;">Email</td>
                    <td style="padding: 12px 16px; font-size: 15px;">{email}</td>
                </tr>
            </table>
        """

    elif event_type == 'new_recommendation':
        subject = f'iHUNT — Новая рекомендация кандидата'
        candidate = data.get('candidate_name', '')
        candidate_email = data.get('candidate_email', '')
        vacancy = data.get('vacancy_title', 'Не указана')
        recommended_by = data.get('recommended_by_name', '')
        reward = data.get('reward_amount', 0)
        content = f"""
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                <div style="font-size: 32px; margin-bottom: 8px;">🎯</div>
                <h2 style="color: #ffffff; margin: 0 0 4px;">Новая рекомендация</h2>
                <p style="color: rgba(255,255,255,0.85); margin: 0; font-size: 14px;">Сотрудник рекомендовал кандидата</p>
            </div>
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px; width: 140px;">Кандидат</td>
                    <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; font-weight: 600; font-size: 15px;">{candidate}</td>
                </tr>
                <tr>
                    <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px;">Email кандидата</td>
                    <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; font-size: 15px;">{candidate_email}</td>
                </tr>
                <tr>
                    <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px;">Вакансия</td>
                    <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; font-size: 15px;">{vacancy}</td>
                </tr>
                <tr>
                    <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px;">Рекомендовал</td>
                    <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; font-size: 15px;">{recommended_by}</td>
                </tr>
                <tr>
                    <td style="padding: 12px 16px; color: #64748b; font-size: 13px;">Вознаграждение</td>
                    <td style="padding: 12px 16px; font-weight: 600; font-size: 15px; color: #10b981;">{reward:,.0f} ₽</td>
                </tr>
            </table>
        """

    elif event_type == 'new_payout_request':
        subject = f'iHUNT — Новый запрос на выплату'
        user_name = data.get('user_name', '')
        amount = data.get('amount', 0)
        payment_method = data.get('payment_method', 'Не указан')
        content = f"""
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                <div style="font-size: 32px; margin-bottom: 8px;">💰</div>
                <h2 style="color: #ffffff; margin: 0 0 4px;">Запрос на выплату</h2>
                <p style="color: rgba(255,255,255,0.85); margin: 0; font-size: 14px;">Сотрудник запросил вывод средств</p>
            </div>
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px; width: 140px;">Сотрудник</td>
                    <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; font-weight: 600; font-size: 15px;">{user_name}</td>
                </tr>
                <tr>
                    <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px;">Сумма</td>
                    <td style="padding: 12px 16px; font-weight: 600; font-size: 18px; color: #f59e0b;">{float(amount):,.0f} ₽</td>
                </tr>
                <tr>
                    <td style="padding: 12px 16px; color: #64748b; font-size: 13px;">Способ выплаты</td>
                    <td style="padding: 12px 16px; font-size: 15px;">{payment_method}</td>
                </tr>
            </table>
        """
    else:
        return 'iHUNT — Уведомление', '<p>Неизвестный тип события</p>'

    html = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <div style="max-width: 560px; margin: 0 auto; padding: 32px 16px;">
        <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="font-size: 22px; font-weight: 700; color: #0ea5e9; margin: 0;">iHUNT</h1>
            <p style="color: #94a3b8; font-size: 13px; margin: 4px 0 0;">{company_name}</p>
        </div>
        <div style="background: #ffffff; border-radius: 16px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
            {content}
        </div>
        <div style="text-align: center; margin-top: 24px; padding: 16px;">
            <a href="https://i-hunt.ru" style="display: inline-block; background: #0ea5e9; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 14px;">Открыть личный кабинет</a>
        </div>
        <div style="text-align: center; margin-top: 16px;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">Это автоматическое уведомление от iHUNT</p>
        </div>
    </div>
</body>
</html>"""

    return subject, html