import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { QueryCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

// DynamoDB 클라이언트 초기화
const ddbClient = new DynamoDBClient({ region: "ap-northeast-2" });
const dynamodb = DynamoDBDocumentClient.from(ddbClient);

// 테이블 이름
const TABLE_NAME = "holybean";

// 오늘 날짜를 yyyy-mm-dd 형식으로 반환하는 함수
const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0"); // 월은 0부터 시작하므로 +1 필요
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const handler = async () => {
  // 오늘 날짜를 가져오기
  const todayDate = getTodayDate();

  // 오늘 날짜의 모든 주문을 조회하고 orderNum을 내림차순으로 정렬하여 가장 큰 값을 찾는 쿼리
  const params = {
    TableName: TABLE_NAME,
    KeyConditionExpression: "orderDate = :orderDate", // orderDate가 오늘인 항목 조회
    ExpressionAttributeValues: {
      ":orderDate": todayDate,
    },
    ScanIndexForward: false, // Sort Key인 orderNum을 내림차순으로 정렬
    Limit: 1, // 가장 큰 orderNum 하나만 조회
  };

  try {
    // DynamoDB에서 오늘 날짜의 가장 큰 orderNum을 조회 (Query 사용)
    const result = await dynamodb.send(new QueryCommand(params));

    // 주문이 없는 경우 (첫 주문인 경우)
    if (result.Items.length === 0) {
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nextOrderNum: 1 }), // 첫 번째 주문 번호는 1
      };
    }

    // 가장 큰 orderNum + 1을 계산
    const nextOrderNum = result.Items[0].orderNum + 1;

    // 새 주문 번호 반환
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nextOrderNum }),
    };
  } catch (error) {
    // 오류 발생 시 500 에러 반환
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: `Error generating next order number: ${error.message}` }),
    };
  }
};
