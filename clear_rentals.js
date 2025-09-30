// 현재 이용 중인 모든 사용자를 퇴장 처리하는 스크립트

const BASE_URL = 'https://shympyo.kro.kr/api';

// 여기에 accessToken을 입력하세요
const ACCESS_TOKEN = 'YOUR_ACCESS_TOKEN_HERE';

async function clearAllRentals() {
  try {
    console.log('🔍 현재 이용 중인 사용자 조회...');
    
    // 현재 이용자 조회
    const response = await fetch(`${BASE_URL}/rental`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
      },
    });

    const data = await response.json();
    
    if (!data.success || !data.data) {
      console.log('❌ 현재 이용 중인 사용자가 없습니다.');
      return;
    }

    console.log(`✅ 현재 ${data.data.length}명 이용 중`);
    console.log('사용자 목록:', data.data);

    // 각 사용자에 대해 퇴장 처리 (실제로는 자신의 rental만 퇴장 가능)
    console.log('\n🚪 퇴장 처리 시도...');
    
    const exitResponse = await fetch(`${BASE_URL}/rental/exit`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
      },
    });

    const exitData = await exitResponse.json();
    
    if (exitData.success) {
      console.log('✅ 퇴장 완료:', exitData.data);
    } else {
      console.log('❌ 퇴장 실패:', exitData.message);
    }

  } catch (error) {
    console.error('💥 오류:', error.message);
  }
}

console.log('='.repeat(50));
console.log('현재 이용자 퇴장 처리 스크립트');
console.log('='.repeat(50));

if (ACCESS_TOKEN === 'YOUR_ACCESS_TOKEN_HERE') {
  console.log('\n⚠️  ACCESS_TOKEN을 먼저 설정해주세요!');
  console.log('앱에서 로그인한 후 accessToken을 복사해서 스크립트에 붙여넣으세요.\n');
  process.exit(1);
}

clearAllRentals();
