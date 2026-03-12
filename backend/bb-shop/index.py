"""
Магазин Brawl Battle: покупка предметов, история покупок.
POST /buy — купить предмет (списывает кристаллы, сохраняет покупку)
GET /history?user_id=X — история покупок
"""
import json, os, random
import psycopg2

SCHEMA = '"t_p69906210_brawl_battle_launch_"'
CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}

SHOP_ITEMS = {
    1: {
        'name': 'Мини-сундук открытия',
        'price': 5,
        'max_buy': 3,
        'prizes': [
            {'name': '50 кристаллов', 'chance': 5, 'crystals': 50},
            {'name': 'VIP оформление', 'chance': 5, 'vip': True},
            {'name': 'Титул', 'chance': 50, 'title': True},
            {'name': '5 кристаллов', 'chance': 40, 'crystals': 5},
        ],
    },
    2: {
        'name': 'Цепочка акций',
        'price': 10,
        'max_buy': 1,
        'prizes': [
            {'name': '10 кристаллов', 'chance': 100, 'crystals': 10},
        ],
    },
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def roll_prize(prizes):
    r = random.random() * 100
    cumulative = 0
    for p in prizes:
        cumulative += p['chance']
        if r <= cumulative:
            return p
    return prizes[-1]

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    path = event.get('path', '/')
    conn = get_conn()
    cur = conn.cursor()

    if event.get('httpMethod') == 'GET' and '/history' in path:
        user_id = event.get('queryStringParameters', {}).get('user_id')
        cur.execute(
            f'''SELECT item_name, price, result, created_at
                FROM {SCHEMA}.purchases WHERE user_id=%s ORDER BY created_at DESC LIMIT 20''',
            (user_id,)
        )
        rows = cur.fetchall()
        cur.close(); conn.close()
        history = [{'item': r[0], 'price': r[1], 'result': r[2], 'at': str(r[3])} for r in rows]
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'history': history})}

    if event.get('httpMethod') == 'POST' and '/buy' in path:
        body = json.loads(event.get('body') or '{}')
        user_id = body.get('user_id')
        item_id = body.get('item_id')

        if item_id not in SHOP_ITEMS:
            cur.close(); conn.close()
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Предмет не найден'})}

        item = SHOP_ITEMS[item_id]

        cur.execute(
            f'SELECT crystals FROM {SCHEMA}.users WHERE id=%s', (user_id,)
        )
        row = cur.fetchone()
        if not row:
            cur.close(); conn.close()
            return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Пользователь не найден'})}

        crystals = row[0]
        if crystals < item['price']:
            cur.close(); conn.close()
            return {'statusCode': 402, 'headers': CORS, 'body': json.dumps({'error': 'Недостаточно кристаллов'})}

        cur.execute(
            f'SELECT COUNT(*) FROM {SCHEMA}.purchases WHERE user_id=%s AND item_id=%s',
            (user_id, item_id)
        )
        count = cur.fetchone()[0]
        if count >= item['max_buy']:
            cur.close(); conn.close()
            return {'statusCode': 409, 'headers': CORS, 'body': json.dumps({'error': 'Лимит покупок исчерпан'})}

        prize = roll_prize(item['prizes'])

        cur.execute(
            f'UPDATE {SCHEMA}.users SET crystals=crystals-%s WHERE id=%s',
            (item['price'], user_id)
        )

        if prize.get('crystals'):
            cur.execute(
                f'UPDATE {SCHEMA}.users SET crystals=crystals+%s WHERE id=%s',
                (prize['crystals'], user_id)
            )
        if prize.get('vip'):
            cur.execute(
                f"UPDATE {SCHEMA}.users SET vip_style=TRUE WHERE id=%s", (user_id,)
            )
        if prize.get('title'):
            cur.execute(
                f"INSERT INTO {SCHEMA}.user_titles (user_id, title) VALUES (%s, 'Первооткрыватель')",
                (user_id,)
            )
            cur.execute(
                f"UPDATE {SCHEMA}.users SET active_title='Первооткрыватель' WHERE id=%s AND active_title=''",
                (user_id,)
            )

        cur.execute(
            f'''INSERT INTO {SCHEMA}.purchases (user_id, item_id, item_name, price, result)
                VALUES (%s, %s, %s, %s, %s)''',
            (user_id, item_id, item['name'], item['price'], prize['name'])
        )

        cur.execute(
            f'''SELECT id, username, is_admin, crystals, coins, beauty_points,
                       level, xp, xp_max, vip_style, profile_icon, active_title,
                       heart_collected, letter_collected, daily_gift_at, created_at
                FROM {SCHEMA}.users WHERE id=%s''',
            (user_id,)
        )
        u = cur.fetchone()
        conn.commit(); cur.close(); conn.close()

        user = {
            'id': u[0], 'username': u[1], 'is_admin': u[2],
            'crystals': u[3], 'coins': u[4], 'beauty_points': u[5],
            'level': u[6], 'xp': u[7], 'xp_max': u[8],
            'vip_style': u[9], 'profile_icon': u[10],
            'active_title': u[11], 'heart_collected': u[12],
            'letter_collected': u[13],
        }
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'user': user, 'prize': prize['name']})}

    cur.close(); conn.close()
    return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Not found'})}
