import json
import os
import urllib.request
import urllib.error
from typing import Optional


def handler(event: dict, context) -> dict:
    """
    API для проверки ИНН компании через DaData.
    Возвращает данные о компании из ЕГРЮЛ: название, адрес, статус, руководителя.
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
            'body': ''
        }

    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'})
        }

    api_key = os.environ.get('DADATA_API_KEY')
    if not api_key:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'DaData API key not configured'})
        }

    body_data = json.loads(event.get('body', '{}'))
    inn = body_data.get('inn', '').strip()

    if not inn:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'ИНН обязателен для проверки'})
        }

    if not validate_inn(inn):
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Неверный формат ИНН'})
        }

    company_data = fetch_company_by_inn(inn, api_key)

    if not company_data:
        return {
            'statusCode': 404,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Компания с таким ИНН не найдена'})
        }

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(company_data)
    }


def validate_inn(inn: str) -> bool:
    """Проверка формата ИНН (10 или 12 цифр с валидной контрольной суммой)"""
    if not inn.isdigit():
        return False
    
    if len(inn) == 10:
        coefficients = [2, 4, 10, 3, 5, 9, 4, 6, 8]
        check_sum = sum(int(inn[i]) * coefficients[i] for i in range(9)) % 11 % 10
        return check_sum == int(inn[9])
    
    elif len(inn) == 12:
        coefficients1 = [7, 2, 4, 10, 3, 5, 9, 4, 6, 8]
        coefficients2 = [3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8]
        
        check_sum1 = sum(int(inn[i]) * coefficients1[i] for i in range(10)) % 11 % 10
        check_sum2 = sum(int(inn[i]) * coefficients2[i] for i in range(11)) % 11 % 10
        
        return check_sum1 == int(inn[10]) and check_sum2 == int(inn[11])
    
    return False


def fetch_company_by_inn(inn: str, api_key: str) -> Optional[dict]:
    """Запрос данных о компании из DaData API"""
    url = "https://suggestions.dadata.ru/suggestions/api/4_1/rs/findById/party"
    
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": f"Token {api_key}"
    }
    
    data = json.dumps({"query": inn}).encode('utf-8')
    
    request = urllib.request.Request(url, data=data, headers=headers, method='POST')
    
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            result = json.loads(response.read().decode('utf-8'))
            
            if not result.get('suggestions'):
                return None
            
            suggestion = result['suggestions'][0]
            company = suggestion.get('data', {})
            
            status_code = company.get('state', {}).get('status')
            is_active = status_code == 'ACTIVE'
            
            return {
                'inn': company.get('inn'),
                'ogrn': company.get('ogrn'),
                'kpp': company.get('kpp'),
                'name': {
                    'full': company.get('name', {}).get('full_with_opf', ''),
                    'short': company.get('name', {}).get('short_with_opf', ''),
                },
                'address': {
                    'full': company.get('address', {}).get('value', ''),
                    'data': company.get('address', {}).get('data', {})
                },
                'management': {
                    'name': company.get('management', {}).get('name', ''),
                    'post': company.get('management', {}).get('post', '')
                },
                'status': {
                    'code': status_code,
                    'isActive': is_active,
                    'text': 'Действующая' if is_active else 'Не действует'
                },
                'registrationDate': company.get('state', {}).get('registration_date'),
                'type': company.get('type'),
                'opf': {
                    'code': company.get('opf', {}).get('code'),
                    'full': company.get('opf', {}).get('full'),
                    'short': company.get('opf', {}).get('short')
                }
            }
    
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        print(f"DaData API error: {e.code} - {error_body}")
        return None
    except Exception as e:
        print(f"Error fetching company data: {str(e)}")
        return None
