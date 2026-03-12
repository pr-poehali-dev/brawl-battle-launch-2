import json
import os
import psycopg2
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    API для приёма сообщений с формы обратной связи.
    Сохраняет сообщения в базу данных и отправляет уведомление на email.
    """
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }

    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }

    try:
        body_data = json.loads(event.get('body', '{}'))
        user_name = body_data.get('name', '').strip()
        user_email = body_data.get('email', '').strip()
        user_message = body_data.get('message', '').strip()

        if not user_name or not user_email or not user_message:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Missing required fields: name, email, message'}),
                'isBase64Encoded': False
            }

        if '@' not in user_email or '.' not in user_email:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Invalid email format'}),
                'isBase64Encoded': False
            }

        database_url = os.environ.get('DATABASE_URL')
        schema_name = os.environ.get('MAIN_DB_SCHEMA', 'public')
        
        if not database_url:
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Database not configured'}),
                'isBase64Encoded': False
            }

        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        
        insert_query = f"""
            INSERT INTO {schema_name}.contact_messages (name, email, message)
            VALUES (%s, %s, %s)
            RETURNING id, created_at
        """
        
        cursor.execute(insert_query, (user_name, user_email, user_message))
        result = cursor.fetchone()
        message_id = result[0]
        created_at = result[1]
        
        conn.commit()
        cursor.close()
        conn.close()

        # Отправка email уведомления (не блокирует ответ пользователю)
        email_sent = False
        email_error_msg = None
        try:
            send_contact_notification(user_name, user_email, user_message)
            email_sent = True
            print(f"Email notification sent successfully to {os.environ.get('SMTP_USER')}")
        except Exception as email_error:
            email_error_msg = str(email_error)
            print(f"Warning: Failed to send email notification: {email_error_msg}")

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': 'Сообщение успешно отправлено',
                'id': message_id,
                'created_at': str(created_at)
            }),
            'isBase64Encoded': False
        }

    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Invalid JSON format'}),
            'isBase64Encoded': False
        }
    except Exception as e:
        print(f"Error processing contact form: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Failed to process message'}),
            'isBase64Encoded': False
        }


def send_contact_notification(user_name: str, user_email: str, user_message: str):
    """Отправляет уведомление о новом сообщении с формы контактов на email администратора"""
    smtp_host = os.environ.get('EMAIL_SMTP_HOST')
    smtp_port = int(os.environ.get('EMAIL_SMTP_PORT', '587'))
    smtp_user = os.environ.get('EMAIL_FROM')
    smtp_password = os.environ.get('EMAIL_PASSWORD')
    
    if not all([smtp_host, smtp_user, smtp_password]):
        raise Exception('SMTP not configured')
    
    # Создаем красивое HTML письмо
    html_content = f"""
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Новое сообщение с сайта</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                                📧 Новое сообщение с сайта
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <div style="background-color: #f7fafc; border-left: 4px solid #667eea; padding: 20px; margin-bottom: 25px; border-radius: 4px;">
                                <p style="margin: 0 0 10px; color: #2d3748; font-size: 14px; font-weight: 600;">
                                    👤 Отправитель:
                                </p>
                                <p style="margin: 0; color: #4a5568; font-size: 16px;">
                                    {user_name}
                                </p>
                            </div>
                            
                            <div style="background-color: #f7fafc; border-left: 4px solid #667eea; padding: 20px; margin-bottom: 25px; border-radius: 4px;">
                                <p style="margin: 0 0 10px; color: #2d3748; font-size: 14px; font-weight: 600;">
                                    ✉️ Email:
                                </p>
                                <p style="margin: 0; color: #667eea; font-size: 16px;">
                                    <a href="mailto:{user_email}" style="color: #667eea; text-decoration: none;">{user_email}</a>
                                </p>
                            </div>
                            
                            <div style="background-color: #f7fafc; border-left: 4px solid #667eea; padding: 20px; border-radius: 4px;">
                                <p style="margin: 0 0 15px; color: #2d3748; font-size: 14px; font-weight: 600;">
                                    💬 Сообщение:
                                </p>
                                <p style="margin: 0; color: #4a5568; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">
{user_message}
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 20px 30px; background-color: #f7fafc; text-align: center; border-top: 1px solid #e2e8f0;">
                            <p style="margin: 0; color: #718096; font-size: 13px;">
                                Это автоматическое уведомление с формы обратной связи на сайте i-hunt.ru
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    """
    
    msg = MIMEMultipart('alternative')
    msg['Subject'] = f'Новое сообщение от {user_name}'
    msg['From'] = smtp_user
    msg['To'] = smtp_user  # Отправляем самому себе (на почту администратора)
    msg['Reply-To'] = user_email  # Чтобы можно было быстро ответить клиенту
    
    html_part = MIMEText(html_content, 'html', 'utf-8')
    msg.attach(html_part)
    
    with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.send_message(msg)