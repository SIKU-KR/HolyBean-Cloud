import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { GetCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

// DynamoDB 클라이언트 초기화
const ddbClient = new DynamoDBClient({ region: "ap-northeast-2" });
const dynamodb = DynamoDBDocumentClient.from(ddbClient);

// 테이블 이름
const TABLE_NAME = "holybean";

export const handler = async (event) => {
  // 쿼리 스트링 파라미터에서 orderDate와 orderNum 가져오기
  const { orderDate, orderNum } = event.queryStringParameters || {};

  // 필수 파라미터가 제공되지 않은 경우 400 에러 반환
  if (!orderDate || !orderNum) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Missing orderDate or orderNum" }),
    };
  }

  // DynamoDB에서 가져올 아이템을 지정 (Partition Key와 Sort Key를 사용)
  const params = {
    TableName: TABLE_NAME,
    Key: {
      orderDate: orderDate, // Partition Key
      orderNum: parseInt(orderNum, 10), // Sort Key, 정수로 변환
    },
  };

  try {
    // DynamoDB에서 해당 키에 일치하는 데이터를 조회
    const result = await dynamodb.send(new GetCommand(params));

    // 아이템이 없는 경우 404 반환
    if (!result.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "Order not found" }),
      };
    }

    // 조회된 데이터 반환
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json", // Content-Type을 JSON으로 명시
      },
      body: JSON.stringify(result.Item),
    };
  } catch (error) {
    // 오류 발생 시 500 에러 반환
    return {
      statusCode: 500,
      body: JSON.stringify({ message: `Error fetching order: ${error.message}` }),
    };
  }
};
