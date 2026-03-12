'''
Business: User authentication (registration, login, token validation)
Args: event with httpMethod, body, headers; context with request_id
Returns: HTTP response with JWT tokens or user data
'''

import json
import os
import hashlib
import hmac
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from decimal import Decimal
import psycopg2
from psycopg2.extras import RealDictCursor
import urllib.request

NOTIFY_URL = 'https://functions.poehali.dev/271cd5d9-0140-4c60-9689-1fd5d74409be'

def send_notification(payload):
    try:
        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(NOTIFY_URL, data=data, headers={'Content-Type': 'application/json'}, method='POST')
        urllib.request.urlopen(req, timeout=5)
    except Exception:
        pass

def get_db_connection():
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        raise Exception('DATABASE_URL not configured')
    return psycopg2.connect(dsn, cursor_factory=RealDictCursor)

def hash_password(password: str, salt: str = None) -> tuple[str, str]:
    if salt is None:
        salt = os.urandom(32).hex()
    pwd_hash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000).hex()
    return pwd_hash, salt

def verify_password(password: str, pwd_hash: str, salt: str) -> bool:
    new_hash, _ = hash_password(password, salt)
    return hmac.compare_digest(new_hash, pwd_hash)

def create_jwt(user_id: int, email: str, company_id: int, role: str) -> str:
    secret = os.environ.get('JWT_SECRET', 'default-secret-change-in-production')
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {
        "user_id": user_id,
        "email": email,
        "company_id": company_id,
        "role": role,
        "exp": int((datetime.utcnow() + timedelta(days=7)).timestamp())
    }
    
    import base64
    header_encoded = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip('=')
    payload_encoded = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip('=')
    message = f"{header_encoded}.{payload_encoded}"
    signature = hmac.new(secret.encode(), message.encode(), hashlib.sha256).digest()
    signature_encoded = base64.urlsafe_b64encode(signature).decode().rstrip('=')
    
    return f"{message}.{signature_encoded}"

def verify_jwt(token: str) -> Optional[Dict[str, Any]]:
    try:
        secret = os.environ.get('JWT_SECRET', 'default-secret-change-in-production')
        parts = token.split('.')
        if len(parts) != 3:
            return None
        
        header_encoded, payload_encoded, signature_encoded = parts
        message = f"{header_encoded}.{payload_encoded}"
        
        import base64
        signature = base64.urlsafe_b64decode(signature_encoded + '==')
        expected_signature = hmac.new(secret.encode(), message.encode(), hashlib.sha256).digest()
        
        if not hmac.compare_digest(signature, expected_signature):
            return None
        
        payload = json.loads(base64.urlsafe_b64decode(payload_encoded + '=='))
        
        if payload.get('exp', 0) < datetime.utcnow().timestamp():
            return None
        
        return payload
    except Exception:
        return None

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        if method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action', 'login')
            
            if action == 'register':
                email = body_data.get('email', '').strip().lower()
                password = body_data.get('password', '')
                first_name = body_data.get('first_name', '')
                last_name = body_data.get('last_name', '')
                company_name = body_data.get('company_name')
                company_inn = body_data.get('company_inn')
                employee_count = body_data.get('employee_count', 50)
                
                if not email or not password or not first_name or not last_name:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Missing required fields'}),
                        'isBase64Encoded': False
                    }
                
                if len(password) < 8:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Password must be at least 8 characters'}),
                        'isBase64Encoded': False
                    }
                
                cursor.execute("SELECT id FROM t_p65890965_refstaff_project.users WHERE email = %s", (email,))
                if cursor.fetchone():
                    return {
                        'statusCode': 409,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Email already registered'}),
                        'isBase64Encoded': False
                    }
                
                pwd_hash, salt = hash_password(password)
                
                if company_name:
                    # Проверяем уникальность ИНН если он указан
                    if company_inn:
                        cursor.execute(
                            "SELECT id FROM t_p65890965_refstaff_project.companies WHERE inn = %s",
                            (company_inn,)
                        )
                        if cursor.fetchone():
                            return {
                                'statusCode': 409,
                                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                                'body': json.dumps({'error': 'Компания с таким ИНН уже зарегистрирована'}),
                                'isBase64Encoded': False
                            }
                    
                    invite_token = os.urandom(16).hex()
                    cursor.execute("""
                        INSERT INTO t_p65890965_refstaff_project.companies 
                        (name, employee_count, invite_token, subscription_tier, subscription_expires_at, inn, created_at, updated_at)
                        VALUES (%s, %s, %s, 'trial', %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                        RETURNING id
                    """, (company_name, employee_count, invite_token, datetime.utcnow() + timedelta(days=14), company_inn))
                    company_id = cursor.fetchone()['id']
                    role = 'admin'
                else:
                    company_id = 1
                    role = 'employee'
                
                cursor.execute("""
                    INSERT INTO t_p65890965_refstaff_project.users 
                    (company_id, email, password_hash, first_name, last_name, role, level, experience_points, 
                     total_recommendations, successful_hires, total_earnings, wallet_balance, wallet_pending,
                     is_admin, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, 1, 0, 0, 0, 0, 0, 0, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    RETURNING id
                """, (company_id, email, f"{pwd_hash}:{salt}", first_name, last_name, role, role == 'admin'))
                
                user_id = cursor.fetchone()['id']
                
                verification_token = os.urandom(32).hex()
                expires_at = datetime.utcnow() + timedelta(hours=24)
                
                cursor.execute("""
                    INSERT INTO t_p65890965_refstaff_project.email_verification_tokens 
                    (user_id, token, expires_at, created_at)
                    VALUES (%s, %s, %s, CURRENT_TIMESTAMP)
                """, (user_id, verification_token, expires_at))
                
                conn.commit()
                
                import urllib.request
                import urllib.parse
                
                send_email_url = 'https://functions.poehali.dev/f3ec5cfe-f5d1-4d21-9161-70bd08bed000'
                email_data = {
                    'to_email': email,
                    'user_name': f"{first_name} {last_name}",
                    'verification_token': verification_token,
                    'base_url': 'https://i-hunt.ru',
                    'user_type': 'company' if company_name else 'employee'
                }
                
                try:
                    req = urllib.request.Request(
                        send_email_url,
                        data=json.dumps(email_data).encode('utf-8'),
                        headers={'Content-Type': 'application/json'},
                        method='POST'
                    )
                    with urllib.request.urlopen(req, timeout=10) as response:
                        response.read()
                except Exception as e:
                    print(f"Failed to send verification email: {str(e)}")
                
                return {
                    'statusCode': 201,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'message': 'Registration successful. Please check your email to verify your account.',
                        'email': email,
                        'email_verified': False,
                        'user': {
                            'id': user_id,
                            'email': email,
                            'first_name': first_name,
                            'last_name': last_name,
                            'company_id': company_id,
                            'role': role
                        }
                    }),
                    'isBase64Encoded': False
                }
            
            elif action == 'invite_employee':
                auth_header = event.get('headers', {}).get('X-Auth-Token') or event.get('headers', {}).get('x-auth-token')
                if not auth_header:
                    return {
                        'statusCode': 401,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Authentication required'}),
                        'isBase64Encoded': False
                    }
                
                admin_payload = verify_jwt(auth_header)
                if not admin_payload:
                    return {
                        'statusCode': 401,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Invalid or expired token'}),
                        'isBase64Encoded': False
                    }
                
                email = body_data.get('email', '').strip().lower()
                password = body_data.get('password', '')
                first_name = body_data.get('first_name', '')
                last_name = body_data.get('last_name', '')
                position = body_data.get('position', '')
                department = body_data.get('department', '')
                company_id = body_data.get('company_id') or admin_payload.get('company_id')
                
                if not email or not password or not first_name or not last_name or not position or not department:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Missing required fields'}),
                        'isBase64Encoded': False
                    }
                
                if len(password) < 8:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Password must be at least 8 characters'}),
                        'isBase64Encoded': False
                    }
                
                cursor.execute("SELECT id FROM t_p65890965_refstaff_project.users WHERE email = %s", (email,))
                if cursor.fetchone():
                    return {
                        'statusCode': 409,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Email already registered'}),
                        'isBase64Encoded': False
                    }
                
                pwd_hash, salt = hash_password(password)
                
                cursor.execute("""
                    INSERT INTO t_p65890965_refstaff_project.users 
                    (company_id, email, password_hash, first_name, last_name, position, department, role, 
                     level, experience_points, total_recommendations, successful_hires, total_earnings, 
                     wallet_balance, wallet_pending, is_admin, is_hr_manager, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, 'employee', 1, 0, 0, 0, 0, 0, 0, FALSE, FALSE, 
                            CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    RETURNING id
                """, (company_id, email, f"{pwd_hash}:{salt}", first_name, last_name, position, department))
                
                user_id = cursor.fetchone()['id']
                conn.commit()
                
                return {
                    'statusCode': 201,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'message': 'Employee invited successfully',
                        'user_id': user_id
                    }),
                    'isBase64Encoded': False
                }
            
            elif action == 'register_employee_by_token':
                email = body_data.get('email', '').strip().lower()
                password = body_data.get('password', '')
                first_name = body_data.get('first_name', '')
                last_name = body_data.get('last_name', '')
                invite_token = body_data.get('invite_token', '')
                turnstile_token = body_data.get('turnstile_token', '')

                if not turnstile_token:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Капча не пройдена'}),
                        'isBase64Encoded': False
                    }

                import urllib.request as _urllib_request
                _ts_data = json.dumps({
                    'secret': os.environ.get('TURNSTILE_SECRET_KEY', ''),
                    'response': turnstile_token
                }).encode('utf-8')
                _ts_req = _urllib_request.Request(
                    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
                    data=_ts_data,
                    headers={'Content-Type': 'application/json'},
                    method='POST'
                )
                with _urllib_request.urlopen(_ts_req, timeout=10) as _ts_resp:
                    _ts_result = json.loads(_ts_resp.read())
                if not _ts_result.get('success'):
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Проверка капчи не прошла. Попробуйте ещё раз'}),
                        'isBase64Encoded': False
                    }

                if not email or not password or not first_name or not last_name or not invite_token:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Missing required fields'}),
                        'isBase64Encoded': False
                    }
                
                if len(password) < 8:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Password must be at least 8 characters'}),
                        'isBase64Encoded': False
                    }
                
                cursor.execute("SELECT id FROM t_p65890965_refstaff_project.companies WHERE invite_token = %s", (invite_token,))
                company_record = cursor.fetchone()
                
                if not company_record:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Invalid invite token'}),
                        'isBase64Encoded': False
                    }
                
                company_id = company_record['id']
                
                cursor.execute("SELECT id FROM t_p65890965_refstaff_project.users WHERE email = %s", (email,))
                if cursor.fetchone():
                    return {
                        'statusCode': 409,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Email already registered'}),
                        'isBase64Encoded': False
                    }
                
                pwd_hash, salt = hash_password(password)
                
                cursor.execute("""
                    INSERT INTO t_p65890965_refstaff_project.users 
                    (company_id, email, password_hash, first_name, last_name, role, level, experience_points, 
                     total_recommendations, successful_hires, total_earnings, wallet_balance, wallet_pending,
                     is_admin, is_hr_manager, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, 'employee', 1, 0, 0, 0, 0, 0, 0, FALSE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    RETURNING id
                """, (company_id, email, f"{pwd_hash}:{salt}", first_name, last_name))
                
                user_id = cursor.fetchone()['id']
                
                verification_token = os.urandom(32).hex()
                expires_at = datetime.utcnow() + timedelta(hours=24)
                
                cursor.execute("""
                    INSERT INTO t_p65890965_refstaff_project.email_verification_tokens 
                    (user_id, token, expires_at, created_at)
                    VALUES (%s, %s, %s, CURRENT_TIMESTAMP)
                """, (user_id, verification_token, expires_at))
                
                conn.commit()
                
                import urllib.request
                
                send_email_url = 'https://functions.poehali.dev/f3ec5cfe-f5d1-4d21-9161-70bd08bed000'
                email_data = {
                    'to_email': email,
                    'user_name': f"{first_name} {last_name}",
                    'verification_token': verification_token,
                    'base_url': 'https://i-hunt.ru',
                    'user_type': 'employee'
                }
                
                try:
                    req = urllib.request.Request(
                        send_email_url,
                        data=json.dumps(email_data).encode('utf-8'),
                        headers={'Content-Type': 'application/json'},
                        method='POST'
                    )
                    with urllib.request.urlopen(req, timeout=10) as response:
                        response.read()
                except Exception as e:
                    print(f"Failed to send verification email: {str(e)}")

                send_notification({
                    'company_id': company_id,
                    'event_type': 'new_employee',
                    'first_name': first_name,
                    'last_name': last_name,
                    'email': email,
                    'position': 'Не указана'
                })

                return {
                    'statusCode': 201,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'message': 'Registration successful. Please check your email to verify your account.',
                        'email': email,
                        'email_verified': False
                    }),
                    'isBase64Encoded': False
                }
            
            elif action == 'resend_verification':
                email = body_data.get('email', '').strip().lower()
                
                if not email:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Email required'}),
                        'isBase64Encoded': False
                    }
                
                cursor.execute("""
                    SELECT id, first_name, last_name, email_verified
                    FROM t_p65890965_refstaff_project.users
                    WHERE email = %s
                """, (email,))
                
                user = cursor.fetchone()
                if not user:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'User not found'}),
                        'isBase64Encoded': False
                    }
                
                if user['email_verified']:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Email already verified'}),
                        'isBase64Encoded': False
                    }
                
                cursor.execute("""
                    DELETE FROM t_p65890965_refstaff_project.email_verification_tokens
                    WHERE user_id = %s AND verified_at IS NULL
                """, (user['id'],))
                
                verification_token = os.urandom(32).hex()
                expires_at = datetime.utcnow() + timedelta(hours=24)
                
                cursor.execute("""
                    INSERT INTO t_p65890965_refstaff_project.email_verification_tokens 
                    (user_id, token, expires_at, created_at)
                    VALUES (%s, %s, %s, CURRENT_TIMESTAMP)
                """, (user['id'], verification_token, expires_at))
                
                conn.commit()
                
                import urllib.request
                
                send_email_url = 'https://functions.poehali.dev/f3ec5cfe-f5d1-4d21-9161-70bd08bed000'
                email_data = {
                    'to_email': email,
                    'user_name': f"{user['first_name']} {user['last_name']}",
                    'verification_token': verification_token,
                    'base_url': 'https://i-hunt.ru',
                    'user_type': 'company'
                }
                
                try:
                    req = urllib.request.Request(
                        send_email_url,
                        data=json.dumps(email_data).encode('utf-8'),
                        headers={'Content-Type': 'application/json'},
                        method='POST'
                    )
                    with urllib.request.urlopen(req, timeout=10) as response:
                        response.read()
                except Exception as e:
                    print(f"Failed to send verification email: {str(e)}")
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'message': 'Verification email sent successfully',
                        'email': email
                    }),
                    'isBase64Encoded': False
                }
            
            elif action == 'verify_email':
                token = body_data.get('token', '')
                
                if not token:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Verification token required'}),
                        'isBase64Encoded': False
                    }
                
                cursor.execute("""
                    SELECT user_id, expires_at, verified_at
                    FROM t_p65890965_refstaff_project.email_verification_tokens
                    WHERE token = %s
                """, (token,))
                
                token_record = cursor.fetchone()
                if not token_record:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Invalid verification token'}),
                        'isBase64Encoded': False
                    }
                
                if token_record['verified_at']:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Email already verified'}),
                        'isBase64Encoded': False
                    }
                
                if datetime.utcnow() > token_record['expires_at']:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Verification token expired'}),
                        'isBase64Encoded': False
                    }
                
                cursor.execute("""
                    UPDATE t_p65890965_refstaff_project.users
                    SET email_verified = TRUE, updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                """, (token_record['user_id'],))
                
                cursor.execute("""
                    UPDATE t_p65890965_refstaff_project.email_verification_tokens
                    SET verified_at = CURRENT_TIMESTAMP
                    WHERE token = %s
                """, (token,))
                
                cursor.execute("""
                    SELECT id, company_id, email, first_name, last_name, role
                    FROM t_p65890965_refstaff_project.users
                    WHERE id = %s
                """, (token_record['user_id'],))
                
                user = cursor.fetchone()
                conn.commit()
                
                jwt_token = create_jwt(user['id'], user['email'], user['company_id'], user['role'])
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'message': 'Email verified successfully',
                        'token': jwt_token,
                        'user': {
                            'id': user['id'],
                            'email': user['email'],
                            'first_name': user['first_name'],
                            'last_name': user['last_name'],
                            'company_id': user['company_id'],
                            'role': user['role'],
                            'email_verified': True
                        }
                    }),
                    'isBase64Encoded': False
                }
            
            elif action == 'login':
                email = body_data.get('email', '').strip().lower()
                password = body_data.get('password', '')
                
                if not email or not password:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Email and password required'}),
                        'isBase64Encoded': False
                    }
                
                cursor.execute("""
                    SELECT id, company_id, email, password_hash, first_name, last_name, role, 
                           position, department, avatar_url, level, is_admin, is_hr_manager, email_verified
                    FROM t_p65890965_refstaff_project.users 
                    WHERE email = %s
                """, (email,))
                
                user = cursor.fetchone()
                if not user:
                    return {
                        'statusCode': 401,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Invalid credentials'}),
                        'isBase64Encoded': False
                    }
                
                pwd_hash_parts = user['password_hash'].split(':')
                if len(pwd_hash_parts) != 2:
                    return {
                        'statusCode': 500,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Invalid password format'}),
                        'isBase64Encoded': False
                    }
                
                pwd_hash, salt = pwd_hash_parts
                if not verify_password(password, pwd_hash, salt):
                    return {
                        'statusCode': 401,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Invalid credentials'}),
                        'isBase64Encoded': False
                    }
                
                if not user['email_verified']:
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Email not verified. Please check your email for verification link.'}),
                        'isBase64Encoded': False
                    }
                
                token = create_jwt(user['id'], user['email'], user['company_id'], user['role'])
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'message': 'Login successful',
                        'token': token,
                        'user': {
                            'id': user['id'],
                            'email': user['email'],
                            'first_name': user['first_name'],
                            'last_name': user['last_name'],
                            'company_id': user['company_id'],
                            'role': user['role'],
                            'position': user['position'],
                            'department': user['department'],
                            'avatar_url': user['avatar_url'],
                            'level': user['level'],
                            'is_admin': user['is_admin'],
                            'is_hr_manager': user['is_hr_manager']
                        }
                    }),
                    'isBase64Encoded': False
                }
        
        elif method == 'GET':
            auth_header = event.get('headers', {}).get('X-Auth-Token') or event.get('headers', {}).get('x-auth-token')
            
            if not auth_header:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'No token provided'}),
                    'isBase64Encoded': False
                }
            
            payload = verify_jwt(auth_header)
            if not payload:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Invalid or expired token'}),
                    'isBase64Encoded': False
                }
            
            cursor.execute("""
                SELECT id, company_id, email, first_name, last_name, role, position, department, 
                       avatar_url, level, experience_points, total_recommendations, successful_hires,
                       total_earnings, wallet_balance, wallet_pending, is_admin, is_hr_manager
                FROM t_p65890965_refstaff_project.users 
                WHERE id = %s
            """, (payload['user_id'],))
            
            user = cursor.fetchone()
            if not user:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'User not found'}),
                    'isBase64Encoded': False
                }
            
            user_dict = {k: float(v) if isinstance(v, Decimal) else v for k, v in dict(user).items()}
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'user': user_dict}),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()