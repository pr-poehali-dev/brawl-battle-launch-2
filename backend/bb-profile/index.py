"""
Профиль пользователя Brawl Battle: получение данных, обновление подарков.
GET /profile?user_id=X — получить профиль
POST /collect-gift — собрать Star Сердце или Букву
POST /daily-gift — ежедневный подарок
"""
import json, os
from datetime import datetime, date
import psycopg2

SCHEMA = '"t_p69906210_brawl_battle_launch_"'
CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def user_row(cur, user_id):
    cur.execute(
        f'''SELECT id, username, is_admin, crystals, coins, beauty_points,
                   level, xp, xp_max, vip_style, profile_icon, active_title,
                   heart_collected, letter_collected, daily_gift_at, created_at
            FROM {SCHEMA}.users WHERE id = %s''',
        (user_id,)
    )
    row = cur.fetchone()
    if not row:
        return None
    titles_cur = cur.connection.cursor()
    titles_cur.execute(f'SELECT title FROM {SCHEMA}.user_titles WHERE user_id = %s', (user_id,))
    titles = [r[0] for r in titles_cur.fetchall()]
    titles_cur.close()
    return {
        'id': row[0], 'username': row[1], 'is_admin': row[2],
        'crystals': row[3], 'coins': row[4], 'beauty_points': row[5],
        'level': row[6], 'xp': row[7], 'xp_max': row[8],
        'vip_style': row[9], 'profile_icon': row[10],
        'active_title': row[11], 'heart_collected': row[12],
        'letter_collected': row[13],
        'daily_gift_at': str(row[14]) if row[14] else None,
        'created_at': str(row[15]),
        'titles': titles,
    }

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    path = event.get('path', '/')
    conn = get_conn()
    cur = conn.cursor()

    if event.get('httpMethod') == 'GET' and '/profile' in path:
        user_id = event.get('queryStringParameters', {}).get('user_id')
        if not user_id:
            cur.close(); conn.close()
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Нет user_id'})}
        user = user_row(cur, int(user_id))
        cur.close(); conn.close()
        if not user:
            return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Не найден'})}
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'user': user})}

    if event.get('httpMethod') == 'POST':
        body = json.loads(event.get('body') or '{}')
        user_id = body.get('user_id')

        if '/collect-gift' in path:
            gift_type = body.get('gift_type')
            if gift_type == 'heart':
                cur.execute(
                    f'UPDATE {SCHEMA}.users SET heart_collected=TRUE, xp=xp+20 WHERE id=%s AND heart_collected=FALSE RETURNING id',
                    (user_id,)
                )
            elif gift_type == 'letter':
                cur.execute(
                    f'UPDATE {SCHEMA}.users SET letter_collected=TRUE, beauty_points=beauty_points+10, xp=xp+20 WHERE id=%s AND letter_collected=FALSE RETURNING id',
                    (user_id,)
                )
            else:
                cur.close(); conn.close()
                return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Неверный тип'})}
            if not cur.fetchone():
                cur.close(); conn.close()
                return {'statusCode': 409, 'headers': CORS, 'body': json.dumps({'error': 'Уже собрано'})}
            conn.commit()
            user = user_row(cur, user_id)
            cur.close(); conn.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'user': user})}

        if '/daily-gift' in path:
            cur.execute(f'SELECT daily_gift_at, coins FROM {SCHEMA}.users WHERE id=%s', (user_id,))
            row = cur.fetchone()
            if not row:
                cur.close(); conn.close()
                return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Не найден'})}
            last_gift, coins = row
            today = date.today()
            if last_gift and last_gift.date() >= today:
                cur.close(); conn.close()
                return {'statusCode': 409, 'headers': CORS, 'body': json.dumps({'error': 'Уже получено сегодня'})}
            reward = 10
            cur.execute(
                f'UPDATE {SCHEMA}.users SET coins=coins+%s, daily_gift_at=NOW(), xp=xp+5 WHERE id=%s',
                (reward, user_id)
            )
            conn.commit()
            user = user_row(cur, user_id)
            cur.close(); conn.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'user': user, 'reward': reward})}

    cur.close(); conn.close()
    return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Not found'})}
