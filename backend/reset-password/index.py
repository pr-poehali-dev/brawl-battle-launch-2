import json
import os
import hashlib
from datetime import datetime
import psycopg2

def handler(event: dict, context) -> dict:
    '''API для сброса пароля по токену из email'''
    
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
        token = body.get('token', '').strip()
        new_password = body.get('password', '')
        
        if not token or not new_password:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Токен и новый пароль обязательны'})
            }
        
        if len(new_password) < 6:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Пароль должен содержать минимум 6 символов'})
            }
        
        # Подключение к БД
        db_url = os.environ['DATABASE_URL']
        schema = os.environ['MAIN_DB_SCHEMA']
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        # Проверяем токен
        cur.execute(
            f"SELECT email, expires_at, used FROM {schema}.password_reset_tokens WHERE token = %s",
            (token,)
        )
        token_data = cur.fetchone()
        
        if not token_data:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Неверный токен'})
            }
        
        email, expires_at, used = token_data
        
        if used:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Токен уже использован'})
            }
        
        if datetime.now() > expires_at:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Токен истек. Запросите восстановление пароля снова'})
            }
        
        # Хешируем новый пароль
        password_hash = hashlib.sha256(new_password.encode()).hexdigest()
        
        # Обновляем пароль пользователя
        cur.execute(
            f"UPDATE {schema}.users SET password_hash = %s, updated_at = CURRENT_TIMESTAMP WHERE email = %s",
            (password_hash, email)
        )
        
        # Отмечаем токен как использованный
        cur.execute(
            f"UPDATE {schema}.password_reset_tokens SET used = true WHERE token = %s",
            (token,)
        )
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'message': 'Пароль успешно изменен'})
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Ошибка сервера: {str(e)}'})
        }
