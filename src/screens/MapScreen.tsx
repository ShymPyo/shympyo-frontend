const MapScreen: React.FC = () => {
  const webViewRef = useRef<WebView>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  const handleShelterPress = (shelter: Shelter) => {
    // 1. WebView가 준비되었는지 확인
    if (!isMapReady || !webViewRef.current) {
      console.log("⚠️ 지도가 준비되지 않았거나 WebView 참조가 없습니다.");
      return;
    }

    // 2. 클릭한 쉼터의 이름을 콘솔에 출력
    console.log(`📩 쉼터 클릭 → 지도 이동 요청: ${shelter.name}`);

    // 3. shelter.id를 Number로 변환
    const shelterIdAsNumber = Number(shelter.id);

    // 4. WebView로 보낼 메시지 구성
    const message = {
      type: 'focus_shelter',
      id: shelterIdAsNumber,
      latitude: shelter.latitude,
      longitude: shelter.longitude
    };

    // 5. 메시지 전송
    webViewRef.current.postMessage(JSON.stringify(message));
  };

  return (
    <WebView
      ref={webViewRef}
      source={{ uri: 'https://map-deploy-olive.vercel.app/' }}
      onMessage={handleWebViewMessage}
      // ... other WebView props
    />
  );
};