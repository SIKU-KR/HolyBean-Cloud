import boto3
import json
from datetime import datetime

# DynamoDB 클라이언트 초기화
ddb_client = boto3.client('dynamodb', region_name='ap-northeast-2')
TABLE_NAME = "holybean"

# yyyy-mm-dd 형식으로 날짜를 반환하는 함수
def get_formatted_date():
    date = datetime.now()
    return date.strftime('%Y-%m-%d')

def lambda_handler(event, context):
    current_date = get_formatted_date()

    # 요청 본문 파싱
    try:
        body = json.loads(event.get('body', ''))
    except (TypeError, json.JSONDecodeError):
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
            },
            'body': json.dumps({'message': "Invalid or missing request body"}),
        }

    # 필드에 null 값이 들어왔는지 확인
    required_fields = ['orderNum', 'totalAmount', 'paymentMethods', 'orderItems']
    if any(body.get(field) is None for field in required_fields):
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
            },
            'body': json.dumps({'message': "Invalid request: One or more required fields are null"}),
        }

    # DynamoDB에 저장할 아이템 준비
    item = {
        'orderDate': {'S': current_date},  # yyyy-mm-dd 형식의 현재 날짜 (PK)
        'orderNum': {'N': str(body['orderNum'])},  # 주문 번호
        'totalAmount': {'N': str(body['totalAmount'])},  # 총 금액
        'customerName': {'S': body.get('customerName', '')},  # 고객 이름 (기본값 '')
        'paymentMethods': {'L': [{'M': pm} for pm in body['paymentMethods']]},  # 결제 방식 리스트
        'orderItems': {'L': [{'M': oi} for oi in body['orderItems']]},  # 주문 항목 리스트
        'creditStatus': {'BOOL': body.get('creditStatus', False)},  # 외상 여부 (기본값 false)
    }

    # DynamoDB에 데이터를 삽입하는 파라미터
    params = {
        'TableName': TABLE_NAME,
        'Item': item,
    }

    # DynamoDB에 데이터 삽입
    try:
        ddb_client.put_item(**params)
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
            },
            'body': json.dumps({'message': "Item inserted successfully", 'orderDate': current_date}),
        }
    except Exception as error:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
            },
            'body': json.dumps({'message': f"Error inserting item: {str(error)}"}),
        }