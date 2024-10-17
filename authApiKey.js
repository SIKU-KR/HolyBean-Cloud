export const handler = async (event) => {
    const apiKeyFromHeader = event.headers['apikey']; // 요청 헤더에서 API 키 추출
    const validApiKey = process.env.VALID_API_KEY; // Lambda 환경 변수에 저장된 유효한 API 키

    // 로그를 통해 이벤트 정보 출력 (디버깅용)
    // console.log("Received event:", JSON.stringify(event, null, 2));

    // API 키가 유효한지 확인
    const isAuthorized = (apiKeyFromHeader === validApiKey);

    // Boolean 값 반환 (단순 응답)
    return {
        isAuthorized: isAuthorized,
    };
};
