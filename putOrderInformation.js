import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

// DynamoDB 클라이언트 초기화
const ddbClient = new DynamoDBClient({ region: "ap-northeast-2" });
const dynamodb = DynamoDBDocumentClient.from(ddbClient);

// 테이블 이름
const TABLE_NAME = "holybean";

// yyyy-mm-dd 형식으로 날짜를 반환하는 함수
function getFormattedDate() {
  const date = new Date();
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0"); // 월은 0부터 시작하므로 +1 필요
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const handler = async (event) => {
  // 현재 날짜를 yyyy-mm-dd 형식으로
  const currentDate = getFormattedDate();

  // 요청 본문 파싱
  let body;
  try {
    body = JSON.parse(event.body);
  } catch (error) {
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: "Invalid request body" }),
    };
  }

  // 필드에 null 값이 들어왔는지 확인
  if (body.orderNum === null || body.totalAmount === null || body.paymentMethods === null || body.orderItems === null) {
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: "Invalid request: One or more required fields are null" }),
    };
  }

  // DynamoDB에 저장할 아이템 준비
  const item = {
    orderDate: currentDate, // yyyy-mm-dd 형식의 현재 날짜 (PK)
    orderNum: body.orderNum, // 주문 번호
    totalAmount: body.totalAmount, // 총 금액
    customerName: body.customerName || '', // 고객 이름 (기본값 '')
    paymentMethods: body.paymentMethods, // 결제 방식 리스트
    orderItems: body.orderItems, // 주문 항목 리스트
    creditStatus: body.creditStatus || 0, // 외상 여부 (기본값 false)
  };

  // DynamoDB에 데이터를 삽입하는 파라미터
  const params = {
    TableName: TABLE_NAME,
    Item: item,
  };

  // DynamoDB에 데이터 삽입
  try {
    await dynamodb.send(new PutCommand(params));
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: "Item inserted successfully", orderDate: currentDate }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: `Error inserting item: ${error.message}` }),
    };
  }
};
