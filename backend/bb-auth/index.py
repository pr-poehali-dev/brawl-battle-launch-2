"""
Аутентификация Brawl Battle: регистрация и вход пользователей.
Принимает POST /register и POST /login, возвращает данные пользователя.
"""
import json, os, hashlib
import psycopg2

SCHEMA = '"t_p69906210_brawl_battle_launch_"'
CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def hash_pass(p): 
    return hashlib.sha256(p.encode()).hexdigest()

def user_to_dict(row):
    return {
        'id': row[0], 'username': row[1], 'is_admin': row[2],
        'crystals': row[3], 'coins': row[4], 'beauty_points': row[5],
        'level': row[6], 'xp': row[7], 'xp_max': row[8],
        'vip_style': row[9], 'profile_icon': row[10],
        'active_title': row[11], 'heart_collected': row[12],
        'letter_collected': row[13],
        'daily_gift_at': str(row[14]) if row[14] else None,
        'created_at': str(row[15]),
    }

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    path = event.get('path', '/')
    body = json.loads(event.get('body') or '{}')
    username = (body.get('username') or '').strip()
    password = body.get('password', '')

    if not username or not password:
        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Заполни все поля'})}

    conn = get_conn()
    cur = conn.cursor()

    if '/register' in path:
        if password == 'BBATTLE':
            cur.close(); conn.close()
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Этот пароль зарезервирован'})}
        cur.execute(
            f'SELECT id FROM {SCHEMA}.users WHERE username = %s', (username,)
        )
        if cur.fetchone():
            cur.close(); conn.close()
            return {'statusCode': 409, 'headers': CORS, 'body': json.dumps({'error': 'Имя уже занято'})}
        cur.execute(
            f'''INSERT INTO {SCHEMA}.users (username, password_hash, is_admin, vip_style, active_title)
                VALUES (%s, %s, FALSE, FALSE, '')
                RETURNING id, username, is_admin, crystals, coins, beauty_points,
                          level, xp, xp_max, vip_style, profile_icon, active_title,
                          heart_collected, letter_collected, daily_gift_at, created_at''',
            (username, hash_pass(password))
        )
        user = user_to_dict(cur.fetchone())
        conn.commit(); cur.close(); conn.close()
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'user': user})}

    if '/login' in path:
        is_admin = password == 'BBATTLE'
        if is_admin:
            cur.execute(
                f'SELECT id FROM {SCHEMA}.users WHERE username = %s', (username,)
            )
            existing = cur.fetchone()
            if not existing:
                cur.execute(
                    f'''INSERT INTO {SCHEMA}.users (username, password_hash, is_admin, vip_style, active_title)
                        VALUES (%s, %s, TRUE, TRUE, 'Администратор')
                        RETURNING id, username, is_admin, crystals, coins, beauty_points,
                                  level, xp, xp_max, vip_style, profile_icon, active_title,
                                  heart_collected, letter_collected, daily_gift_at, created_at''',
                    (username, hash_pass(password))
                )
            else:
                cur.execute(
                    f'''UPDATE {SCHEMA}.users SET is_admin=TRUE, vip_style=TRUE, active_title='Администратор'
                        WHERE username = %s
                        RETURNING id, username, is_admin, crystals, coins, beauty_points,
                                  level, xp, xp_max, vip_style, profile_icon, active_title,
                                  heart_collected, letter_collected, daily_gift_at, created_at''',
                    (username,)
                )
            user = user_to_dict(cur.fetchone())
            conn.commit(); cur.close(); conn.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'user': user})}

        cur.execute(
            f'''SELECT id, username, is_admin, crystals, coins, beauty_points,
                       level, xp, xp_max, vip_style, profile_icon, active_title,
                       heart_collected, letter_collected, daily_gift_at, created_at
                FROM {SCHEMA}.users WHERE username = %s AND password_hash = %s''',
            (username, hash_pass(password))
        )
        row = cur.fetchone()
        cur.close(); conn.close()
        if not row:
            return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Неверное имя или пароль'})}
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'user': user_to_dict(row)})}

    cur.close(); conn.close()
    return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Not found'})}
