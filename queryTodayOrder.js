import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { QueryCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

// DynamoDB 클라이언트 초기화
const ddbClient = new DynamoDBClient({ region: "ap-northeast-2" });
const dynamodb = DynamoDBDocumentClient.from(ddbClient);

// 테이블 이름
const TABLE_NAME = "holybean";

export const handler = async (event) => {
  // 경로 파라미터에서 orderDate 가져오기
  const { orderDate } = event.pathParameters || {};

  // 필수 파라미터가 제공되지 않은 경우 400 에러 반환
  if (!orderDate) {
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message: "Missing orderDate in path parameters" }),
    };
  }

  // DynamoDB에서 해당 날짜(orderDate)에 해당하는 모든 아이템을 조회하는 쿼리
  const params = {
    TableName: TABLE_NAME,
    KeyConditionExpression: "orderDate = :orderDate",  // orderDate에 해당하는 모든 항목 조회
    ExpressionAttributeValues: {
      ":orderDate": orderDate,
    },
  };

  try {
    // DynamoDB에서 해당 orderDate에 해당하는 모든 데이터를 조회 (Query 사용)
    const result = await dynamodb.send(new QueryCommand(params));

    // 아이템이 없는 경우 404 반환
    if (result.Items.length === 0) {
      return {
        statusCode: 404,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: "No orders found for the given date" }),
      };
    }

    // 필요한 필드만 추출 (각 주문마다 customerName, totalAmount, orderMethod, orderNum)
    const filteredOrders = result.Items.map(order => ({
      customerName: order.customerName,
      totalAmount: order.totalAmount,
      orderMethod: order.paymentMethods[0]?.method || 'Unknown',
      orderNum: order.orderNum
    }));

    // 조회된 데이터 반환
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(filteredOrders),
    };
  } catch (error) {
    // 오류 발생 시 500 에러 반환
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message: `Error fetching orders: ${error.message}` }),
    };
  }
};
