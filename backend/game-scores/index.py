"""
Таблица лидеров мини-игр сотрудников.
GET ?game=memory|reaction|guess|tictactoe — топ-10 по игре
POST body: {game, score} — сохранить рекорд (только если лучше предыдущего)
"""
import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
import jwt

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p65890965_refstaff_project')
CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Authorization',
}

def get_db():
    conn = psycopg2.connect(os.environ['DATABASE_URL'], cursor_factory=RealDictCursor)
    conn.autocommit = True
    return conn

def get_user_id(event):
    token = event.get('headers', {}).get('X-Authorization', '').replace('Bearer ', '')
    if not token:
        return None
    try:
        payload = jwt.decode(token, os.environ['JWT_SECRET'], algorithms=['HS256'])
        return payload.get('user_id')
    except Exception:
        return None

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')

    if method == 'GET':
        game = (event.get('queryStringParameters') or {}).get('game', 'memory')
        conn = get_db()
        cur = conn.cursor()
        cur.execute(f"""
            SELECT u.first_name, u.last_name, u.avatar_url, gs.score, gs.created_at
            FROM {SCHEMA}.game_scores gs
            JOIN {SCHEMA}.users u ON u.id = gs.user_id
            WHERE gs.game = %s
            ORDER BY gs.score ASC, gs.created_at ASC
            LIMIT 10
        """, (game,))
        rows = cur.fetchall()
        conn.close()
        leaders = [
            {
                'name': f"{r['first_name']} {r['last_name']}",
                'avatar_url': r['avatar_url'],
                'score': r['score'],
                'created_at': r['created_at'].isoformat() if r['created_at'] else None,
            }
            for r in rows
        ]
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'leaders': leaders})}

    if method == 'POST':
        user_id = get_user_id(event)
        if not user_id:
            return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'Unauthorized'})}
        body = json.loads(event.get('body') or '{}')
        game = body.get('game')
        score = body.get('score')
        if not game or score is None:
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'game and score required'})}

        # Для reaction и guess — меньше лучше; для memory — меньше лучше; для tictactoe — больше лучше
        bigger_is_better = game == 'tictactoe'

        conn = get_db()
        cur = conn.cursor()
        cur.execute(f"SELECT score FROM {SCHEMA}.game_scores WHERE user_id = %s AND game = %s", (user_id, game))
        existing = cur.fetchone()

        if existing is None:
            cur.execute(f"INSERT INTO {SCHEMA}.game_scores (user_id, game, score) VALUES (%s, %s, %s)", (user_id, game, score))
            saved = True
        else:
            old = existing['score']
            is_better = (score > old) if bigger_is_better else (score < old)
            if is_better:
                cur.execute(f"UPDATE {SCHEMA}.game_scores SET score = %s, created_at = CURRENT_TIMESTAMP WHERE user_id = %s AND game = %s", (score, user_id, game))
                saved = True
            else:
                saved = False

        conn.close()
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'saved': saved})}

    return {'statusCode': 405, 'headers': CORS, 'body': json.dumps({'error': 'Method not allowed'})}
