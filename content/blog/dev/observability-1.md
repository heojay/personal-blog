---
title: 관찰 가능성, 3년을 돌아보며 - 1
date: 2021-05-01 00:00:00
category: dev
thumbnail: { thumbnailSrc }
draft: false
---

원문: [Observability — A 3-Year Retrospective](https://thenewstack.io/observability-a-3-year-retrospective/)

최근에 읽었던 글 중 가장 인상 깊었던 관찰 가능성(observability)에 관한 글을 번역하려고 합니다. 감사하게도 저자께서 흔쾌히 번역을 허락해주셨습니다. 글이 길어져 총 세 편으로 나눴으며 이는 그 중 첫 번째 편입니다.

개발 접근, 혹은 그보다 움직임(movement)이라고 할 수 있는 관찰 가능성은 이제 갓 3살 정도 됐으며, 이 분야의 초기 개척자 중 하나인 [Charity Majors](https://twitter.com/mipsytipsy)는 한 발짝 물러서 얼마나 멀리 왔는지 "관찰"하기로 했습니다. 이 글에서 그녀는 중요한 기여자들을 인용하며 왜 관찰 가능성이 생겼고, 왜 다른 접근과 방법은 부족한지 살펴봅니다. 그녀는 관찰 가능성을 도입하는 것은 복잡한 분산 시스템을 구축하고 유지하는 모든 엔지니어링 팀에게 중요하다고 설명합니다.

---

소프트웨어 엔지니어링의 다른 수많은 용어와 마찬가지로, "관찰 가능성"은 물리 분야(이 경우에는 제어 시스템 공학)에서 빌려온 용어입니다. 관찰 가능성은 제어 가능성과 수학적 쌍대관계(mathematical dual)에 있습니다.

> 조금 느슨하게 얘기하면, 이는 곧 시스템의 출력으로 전체 시스템의 동작을 확인할 수 있다는 것을 의미합니다. 만약 시스템이 관찰 가능하지 않은 상태라면, 이 말은 시스템의 상태 값 중 일부는 출력 센서를 통해 현재 상태를 확인할 수 없다는 뜻이기도 합니다.

관찰 가능성이 왜 단순히 제품 마케팅 용어가 아니라 의미 있는 기술 용어인지 알아보기 전에, 먼저 모니터링, 메트릭, 이벤트, 그리고 우리가 시스템을 인지하기 위해 했던 시도의 간략한 역사를 이해할 필요가 있습니다. 우린 왜 하필 관찰 가능성에 주목해야 하는지, 왜 지금인지 이해하기 위해 우선 어떻게 세상이 변해왔는지 이해해야 합니다.

터미널과 고급 프로그래밍 언어가 생긴 이래, 로그가 있었습니다. 무엇이 일어나고 있었는지 이해할 수 있게 도와주는, 사람이 읽을 수 있는 형태의 문자열 출력 말이죠. 다음은 단일 노드 성능을 이해하는 데 여전히 가장 좋은 방법인 초기 텍스트 기반 시스템 패키지들, sysstat, sar, iostat, netstat, mpstat 등이 등장했습니다. 그리고 1988년 (제가 알기로) 첫 번째 메트릭 기반의 원격 측정 시스템인 SNMPv1이 탄생했습니다.

메트릭은 80년대 이후를 지배해왔습니다. snmp, rrdtool, cacti, Ganglia, [유례없이 영향력 있는 Etsy](https://codeascraft.com/2011/02/15/measure-anything-measure-everything/?utm_source=thenewstack&utm_medium=website&utm_campaign=platform) statsd. 이들의 현대 계승자들로는 SignalFX, DataDog, Wavefront 등이 있습니다. 사용자 경험은 큰 발전을 이루었지만, 결국 이 모든 툴은 그룹화와 출처를 찾기 용이한 단일 숫자 형태가 기본이 되어왔습니다.

요청이 당신의 코드를 통과하면 요청이 완료되기 전에 수십 또는 수백 개의 메트릭이 — 빌드 ID, AWS 리전 등과 같은 태그가 달린 게이지, 카운터, CPU 사용량이나 메모리 크기, I/O 통계와 같은 숫자 — 발생할 수 있습니다. 일반적으로 메트릭은 기록될 때 집계되고, 시간에 지남에 따라 입상도(granularity)를 잃고 수집과 저장하기 아주 효율적인 형태가 됩니다. 메트릭은 여전히 당신의 인프라를 전체적인 동작의 관점에서 이해하기에 가장 중요한 방법이며, 아마 늘 그럴지도 모릅니다. 하지만 상술했듯 "입상도"를 잃는다는 사항을 잊지 마세요. 우린 이 지점으로 다시 돌아올 것이기 때문에 기억해 두는 것이 좋습니다; **메트릭은 관찰 가능성과 같지 않습니다.**

### 2000년대 등장한 새로운 벤더: APM

약 10년 전, APM(Application Performance Management) 우산 아래 새로운 벤더들이 등장했습니다. NewRelic, AppDynamics, 그리고 다른 업체들은 애플리케이션을 잘 이해하려는 이들의 돈을 걷어갔습니다. 에이전트를 사용하는 대신 코드에 라이브러리를 설치해 요청을 추적하고, 언어와 요청에 특화된 보고를 해줍니다. 그들은 유용한 top-10 리스트를 만들어 엔드포인트, 쿼리, 등 성능 문제가 어디서 비롯됐는지 알려줍니다.

이러한 툴은 중요한 발전을 가져왔습니다. 이들은 여전히 대부분 메트릭 기반이었지만, 3인칭 관찰자에서 1인칭으로의 시점 전환은 당신의 소프트웨어와 그 동작에 대한 더 깊은 자기성찰을 가져왔습니다.

어느덧 툴은 먼 길을 왔습니다. 하지만 불과 5년 전, 제가 (이후에 Facebook에 인수되는) Parse에 있었을 때, 지속해서 다운되고 예측할 수 없는 공통 테넌트(co-tenancy) 문제로 고통받는 플랫폼을 고민하고 있었을 때, 이러한 툴들을 모두 사용해 보았지만 어느 것 하나도 시스템 성능과 안정성 문제를 해결하는 데는 도움이 되지 않았습니다. 다시 말하겠습니다: 어느 것 하나도 그들이 주장한 대로 동작하지 않았습니다. 이는 그들이 거짓말을 하거나, 그들 자신을 잘못 표현했기 때문이 아니라, 우리가 구축하고 있던 시스템의 종류가 이러한 툴들이 이해하려 했던 시스템과 근본적으로 달랐기 때문입니다. Parse는 많은 트렌드의 얼리 어답터였고 여전히 상대적으로 최첨단에 있으며, 그리고 점점 더 많은 사람이 제가 그 기간 겪었던 당혹감과 좌절감을 경험하고 있습니다. 한때 혁명적이었던 이 낡은 도구들은 더 이상 현재의 우리 시스템에서 동작하지 않습니다.

### 카디널리티와 복잡한 분산 시스템과의 관계

이유를 완전히 이해하려면 — 먼저 우리가 구축하는 오늘날의 시스템이 어떻게 (그리고 왜) 다른지 이해해야 하며, 그리고 그 핵심은 카디널리티라 부르는 것을 이해하는 것입니다.

카디널리티는 집합의 고유 항목 수를 나타냅니다. 고유 ID는 항상 가장 높은 카디널리티가 되고, 단일 값은 항상 가장 낮은 카디널리티가 됩니다. 1억 개의 사용자 명부가 있다면, 사회 보장 번호가 가능한 가장 높은 카디널리티를 가질 것이라고 확신할 수 있습니다. 이름과 성은 (동명이인이 있을 수 있기 때문에) 그보다는 낮지만, 꽤 높은 카디널리티입니다. 성별은 상당히 낮은 카디널리티이고, "종: 인간"은 아마도 가장 낮은 카디널리티가 될 것이며, 분명 기록하는 것도 귀찮은 일이겠죠.

### 높은 카디널리티 데이터에 접근할 수 없다면? 디버깅은 하늘에 맡겨요!

이게 왜 중요할까요? 높은 카디널리티 정보는 시스템을 디버깅하거나 이해하는 데 가장 유용한 데이터이기 때문입니다 (사용자 ID, 장바구니 ID, 요청 ID... 기본적으로 모든 ID와 인스턴스, 컨테이너, 빌드 번호, 스팬(span) ID 등). 고유 ID는 항상 주어진 건초 더미에서 각각의 바늘들을 식별하기에 가장 좋은 역할을 수행합니다.

그러나 메트릭 기반 도구 시스템은 카디널리티가 낮은 차원만 대규모로 처리할 수 있습니다. 호스트가 수백 개에 불과한 경우에도, 당신은 호스트 이름을 식별 태그로 넣을 수 없습니다. 그렇지 않으면, 카디널리티 키 공간이 사라질 테니까요. 마찬가지로, 메트릭 기반 도구로 질문하려는 모든 질문에 대해 미리 정해두어야 주어진 작성 시간 안에 답변을 작성할 수 있습니다. 이 말인즉슨,

1. 무언가 일이 일어난 후에 새로운 질문을 하고 싶어도, 할 수 없습니다.
2. 물어 볼 수 있길 바라는(!) 질문 수에 비례하여 비용은 상승합니다.

모놀리딕을 무수히 많은 서비스로 부풀렸을 때, 우린 디버거로 코드를 단계별로 실행할 수 있는 능력을 상실했습니다: 이제 네트워크를 넘나듭니다. 우리의 툴들은 여전히 이러한 극적인 변화에 맞서고 있습니다.

카디널리티가 높은 차원은 매우 드물었기 때문에, 오랫동안 이것은 그다지 중요한 문제가 아니었습니다. 일반적인 모놀리딕 시스템에서는 단일 앱 계층과 하나의 데이터베이스만 있었습니다. 모든 흥미로운 로직은 애플리케이션 코드 내부에 숨어있었고, gdb와 같은 디버거를 사용해 단계별로 실행할 수 있었습니다. 트러블슈팅할 때도 대시보드를 보고 직감적으로 3~5개의 모놀리딕 구성요소 중 어떤 요소에 결함이 있는지 알 수 있었죠.

이것은 점점 사실이 아니게 됐습니다. 지난 5년 이상의 모든 인프라/아키텍처 동향을 살펴보십시오. 컨테이너, 스케줄러, 마이크로서비스, 다중 언어(polyglot) 지속성, 메시 라우팅, 임시 오토스케일링 인스턴스, 서버리스, 람다 함수. 요청은 엣지 이후 20~30홉을 수행하거나 — 데이터베이스 쿼리를 계산하는 경우 몇 배를 수행할 수도 있습니다. 이제 시스템 디버깅에서 가장 어려운 점은 코드가 어떻게 동작하는 지가 아니라, 어디에 문제가 있는 코드가 있는지 시스템상에서 찾는 것입니다. 일반적으로 대시 보드나 서비스 맵만 보고 어떤 노드나 서비스 혹은 구성 요소가 느린지 확인할 수 없습니다. 이들은 다시 자기 자신으로 돌아가기 때문에 — 어떤 것의 속도가 느려지면, **모든 것**의 속도가 느려집니다. 오늘날의 현대적 클라우드 네이티브 환경은 기본적으로 플랫폼입니다. 즉, 코드 "내부" 및 쿼리가 단일팀의 제어 아래에 있지 않을 수 있습니다.

모놀리딕을 무수히 많은 서비스로 부풀렸을 때, 우린 디버거로 코드를 단계별로 실행할 수 있는 능력을 상실했습니다: 이제 네트워크를 넘나듭니다. 우리의 툴들은 여전히 이러한 극적인 변화에 맞서고 있습니다.

Parse로 돌아가서, 사용자는 "Parse가 다운됐어!"라고 문의를 할 수 있습니다. 우리 모니터링 툴은 Parse가 다운되지 않았음을 분명히 보여줍니다. 그렇다면 사용자는 무얼 보고 다운됐다고 말하는 걸까요? 글쎄요, 우리는 조사를 위해 누군가를 붙이겠지만, 그것은 완전히 명확하지는 않았습니다; 개발자는 자신의 코드와 쿼리를 업로드할 수 있었고, 우리는 수십만 개의 다른 인접 앱과 공유되는 하드웨어에서 작동하도록 만들어야 했습니다. 따라서 문제는 아마 다음 중 하나였을 겁니다.

1. 개발자들의 코드나 쿼리 변경
2. 우리의 코드나 쿼리 변경
3. 이 두 변경의 교집합
4. 문의를 제기한 사용자와 리소스를 공유하는 사용자의 코드나 쿼리 변경
5. 리소스를 공유하는 사용자에게 영향을 미치는 일부 우리의 코드나 쿼리 변경
6. 이들의 교집합

아, 그리고 우리는 백만 개가 넘는 앱을 가지고 있었고, 그들 모두에 영향을 미치는 코드를 지속해서 제공했고, 그들 각각은 독자적인 전체 유저 생태계를 가지고 있었으며, 그들은 또 그들 자신의 사용자에게 지속해서 영향을 미치는 자체 코드를 제공했습니다.

그것 참 좋은 때였죠.

모니터링 툴은 안정적인 아는-모르는 것들(known-unknowns)과 비교적 적은 수 모르는-모르는 것들(unknown-unknowns)의 집합으로 이뤄진 시스템에서 효과적입니다. 모르는-모르는 것들이 대부분인 시스템의 경우, 모니터링 툴은 거의 쓸모 없었습니다. 우린 문자 그대로 손으로, 고통스럽게, 그리고 천천히 디버깅해야 했습니다. 사용자의 불만을 추적하거나, 실제로 "그들" 쪽에 있는 문제라고 결정하는 데까지 하루 이상이 걸리는 경우가 많았습니다. 마침내 우리를 구한 솔루션은 Parse가 인수된 후 사용하기 시작한 Facebook의 Scuba였습니다. 우린 Scuba에 데이터 셋을 공급하기 시작했고, 사용자 ID, 엔드 포인트, 쿼리 등 임시 차원별로 데이터를 분할 할 수 있었습니다. 이로 인해 문제를 식별하는 데까지 걸리는 시간은 하루에서 몇 분으로 줄었고 심지어 몇 초까지로 줄었습니다.

이 경험은 저에게 깊은 인상을 주었지만, 당시에는 이를 설명할 단어가 없었습니다. "관찰 가능성"이라는 용어를 우연히 발견하고, 그 유래를 알아보고 나서, 이해 가능한 소프트웨어 시스템을 구축하는 법에 대해 얼마나 많은 것을 가르쳐야 하는지 깨달았습니다.
