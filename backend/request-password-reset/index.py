import json
import os
import secrets
from datetime import datetime, timedelta
import psycopg2
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def handler(event: dict, context) -> dict:
    '''API для запроса восстановления пароля - отправляет ссылку на email'''
    
    method = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': ''
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Метод не разрешен'})
        }
    
    try:
        body = json.loads(event.get('body', '{}'))
        email = body.get('email', '').strip().lower()
        
        if not email:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Email обязателен'})
            }
        
        # Подключение к БД
        db_url = os.environ['DATABASE_URL']
        schema = os.environ['MAIN_DB_SCHEMA']
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        # Проверяем существование пользователя
        cur.execute(f"SELECT id FROM {schema}.users WHERE email = %s", (email,))
        user = cur.fetchone()
        
        if not user:
            # Не раскрываем информацию о существовании email
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'message': 'Если email существует, на него отправлена ссылка для восстановления'})
            }
        
        # Генерируем токен
        token = secrets.token_urlsafe(32)
        expires_at = datetime.now() + timedelta(hours=1)
        
        # Сохраняем токен в БД
        cur.execute(
            f"INSERT INTO {schema}.password_reset_tokens (email, token, expires_at) VALUES (%s, %s, %s)",
            (email, token, expires_at)
        )
        conn.commit()
        
        # Формируем ссылку для восстановления
        reset_link = f"https://i-hunt.ru/?token={token}"
        
        # Отправляем email
        smtp_host = os.environ['EMAIL_SMTP_HOST']
        smtp_port = int(os.environ['EMAIL_SMTP_PORT'])
        email_from = os.environ['EMAIL_FROM']
        email_password = os.environ['EMAIL_PASSWORD']
        
        msg = MIMEMultipart('alternative')
        msg['Subject'] = 'Восстановление пароля i-Hunt'
        msg['From'] = email_from
        msg['To'] = email
        
        html = f"""
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #2563eb;">Восстановление пароля</h2>
              <p>Вы запросили восстановление пароля для вашего аккаунта в системе i-Hunt.</p>
              <p>Для сброса пароля перейдите по ссылке:</p>
              <p style="margin: 30px 0;">
                <a href="{reset_link}" 
                   style="background-color: #2563eb; color: white; padding: 12px 24px; 
                          text-decoration: none; border-radius: 6px; display: inline-block;">
                  Восстановить пароль
                </a>
              </p>
              <p style="color: #666; font-size: 14px;">
                Ссылка действительна в течение 1 часа.<br>
                Если вы не запрашивали восстановление пароля, просто проигнорируйте это письмо.
              </p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
              <p style="color: #999; font-size: 12px;">
                С уважением,<br>команда i-Hunt
              </p>
            </div>
          </body>
        </html>
        """
        
        msg.attach(MIMEText(html, 'html'))
        
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(email_from, email_password)
            server.send_message(msg)
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'message': 'Если email существует, на него отправлена ссылка для восстановления'})
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Ошибка сервера: {str(e)}'})
        }