import json
from PIL import Image, ImageDraw, ImageFont
import io
import base64

def handler(event: dict, context) -> dict:
    '''Генерация Open Graph изображения для вакансии'''
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    query_params = event.get('queryStringParameters', {})
    vacancy_title = query_params.get('title', 'Вакансия')
    department = query_params.get('department', '')
    salary = query_params.get('salary', '')
    
    try:
        img = Image.new('RGB', (1200, 630), color='#ffffff')
        draw = ImageDraw.Draw(img)
        
        draw.rectangle([(0, 0), (1200, 630)], fill='#f8fafc')
        draw.rectangle([(40, 40), (1160, 590)], fill='#ffffff', outline='#e2e8f0', width=2)
        
        try:
            title_font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 60)
            dept_font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 36)
            brand_font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 48)
        except Exception:
            title_font = ImageFont.load_default()
            dept_font = ImageFont.load_default()
            brand_font = ImageFont.load_default()
        
        draw.text((80, 80), 'iHUNT', font=brand_font, fill='#3b82f6')
        
        title_lines = []
        words = vacancy_title.split()
        current_line = ''
        for word in words:
            test_line = current_line + ' ' + word if current_line else word
            if len(test_line) > 25:
                if current_line:
                    title_lines.append(current_line)
                current_line = word
            else:
                current_line = test_line
        if current_line:
            title_lines.append(current_line)
        
        y_position = 250
        for line in title_lines[:3]:
            draw.text((80, y_position), line, font=title_font, fill='#1e293b')
            y_position += 80
        
        if department:
            draw.text((80, y_position + 20), department, font=dept_font, fill='#64748b')
        
        if salary:
            draw.text((80, y_position + 80), f'💰 {salary}', font=dept_font, fill='#16a34a')
        
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        
        image_data = base64.b64encode(buffer.read()).decode('utf-8')
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'image/png',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=86400'
            },
            'body': image_data,
            'isBase64Encoded': True
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }