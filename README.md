# Amadi

요가웨어를 **Motion → Emotion → Discover → Recommend → Refine** 흐름으로 찾는 카탈로그.
2,900개+ 상품, 97개 브랜드 (해외 10곳 + 29CM 경유 한국 브랜드).

첫 진입은 시네마틱 히어로다. 필터를 보여주지 않는다. 세 가지 질문(수련 / 착용감 / 계절)으로
사용자의 flow를 받고, 그에 맞는 순서로 상품을 보여준 뒤, 원할 때 조건을 더한다.

## Your Flow와 Filters는 다른 것이다

| | 출처 | 하는 일 |
|---|---|---|
| **Your Flow** (`practice`, `fit`, `season`) | Guided Discovery | **순위를 매긴다.** 하나도 걸러내지 않는다 |
| **Filters** (`gender`, `material`, `category`, `brand`, `proportions`) | 상단 필터 바 | **걸러낸다.** 패싯 간 AND, 패싯 내 OR |

이 구분이 UI에도 그대로 있다. `Clear filters`는 Filters만 지우고 Your Flow는 남긴다
(테스트가 강제). `Refine my flow`는 초기화가 아니라 기존 답이 선택된 상태로
Discovery를 다시 여는 것이다.

둘 다 URL에 있어서 결과 페이지는 공유 가능하고 뒤로가기가 동작한다.
동점 상품은 브랜드별 라운드로빈으로 섞는다 — 안 그러면 한 브랜드 카탈로그가 상단을 덮는다.

체형(Petite / Tall / Curvy / Athletic)은 첫 Discovery에서 묻지 않는다.
`Find your fit`에서 사용자가 원할 때 선택하는 Optional Filter다.

## 모션

모션 강도는 아래로 갈수록 낮아진다: 히어로(강) → Discover(중) → 추천(중·약) → 상품(약).
히어로만 스크롤 스크럽·포인터 패럴랙스·마그네틱 CTA·SVG `feDisplacementMap` 왜곡을 쓴다
(WebGL 대신 SVG 필터 — 캔버스 없이 같은 효과를, reduced-motion에서 공짜로 끌 수 있다).

- 히어로 → Discover는 한 번의 스크롤이다. 히어로 미디어가 축소·우측 이동하며 비운 자리로
  `What's your practice?`가 올라온다. CTA를 눌러도 이동이 아니라 같은 구간을 스크롤한다.
- `prefers-reduced-motion`이면 Lenis도 GSAP 애니메이션도 돌지 않고 콘텐츠가 그대로 보인다.
  포인터가 coarse(터치)면 스무스 스크롤을 걸지 않는다.
- GSAP 로드가 실패하면 `.js` 클래스를 떼서 숨겨둔 요소를 되살린다 — 모션은 어디까지나 향상이다.
- 리빌은 `pathname + search`가 바뀔 때마다 다시 붙인다. 클라이언트 라우팅은 프로바이더를
  리마운트하지 않아서, 마운트 1회 세팅으로는 다음 페이지가 통째로 숨은 채 남는다.

## 실행

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # 데이터 스키마 + 필터 불변식 + 통화 혼입 검증
npm run crawl    # 데이터 재수집 (.cache/ 재사용)
npm run build
```

## 구조

| 경로 | 역할 |
|---|---|
| `scripts/crawl.mjs` | 수집. 소스 2개, 매핑·소재·계절·성별 판정이 모두 여기 |
| `data/products.json` | 커밋되는 산출물. 앱은 이 파일만 읽음 |
| `data/materials.json` | 해외 브랜드 원단 라인 → 섬유 매핑 (손으로 유지) |
| `lib/products.ts` | 타입, flow 랭킹(`score`/`recommend`), 필터, 추천 이유, 라벨 |
| `app/page.tsx` | 랜딩(flow 없음) / 결과(flow 있음) 두 상태 |
| `components/hero.tsx` | 시네마틱 히어로. 스크롤 스크럽 · 키네틱 워드 · 마그네틱 CTA · SVG 왜곡 |
| `components/motion.tsx` | Lenis + GSAP ScrollTrigger. 리빌은 라우트 변경마다 재바인딩 |
| `components/landing.tsx` | 히어로 → 인라인 Discover를 하나의 스크롤로 잇는 껍데기 |
| `components/discovery.tsx` | 3단계 Guided Discovery. inline(첫 진입) / modal(Refine) 두 모드 |
| `components/filter-bar.tsx` | 상단 필터 바. 네이티브 `<details>` 팝오버 + 링크, 클라이언트 상태 없음 |
| `components/product-card.tsx` | 추천 이유 태그가 붙는 카드 |
| `lib/use-wishlist.ts` | 위시리스트 스토어. 로그인 도입 시 교체할 단일 지점 |
| `components/wishlist-button.tsx` | 카드 위의 하트. 카드 링크와 클릭을 분리 |
| `app/wishlist/page.tsx` | 저장한 제품 화면 |
| `app/practice/[slug]/page.tsx` | 수련별 아카이브 |
| `app/product/[id]/page.tsx` | 상세 + "Why it fits your flow" |
| `test/filter.test.ts` | `node:test`, 프레임워크 없음 |

## 데이터 출처와 한계

**소스 1 — 브랜드 Shopify `/products.json`** (Alo Yoga, Beyond Yoga, Girlfriend Collective,
TALA, Onzie, Senita, Manduka, Liforme, Spiritual Gangster, PopFlex). robots.txt가 막지 않는
공개 엔드포인트, 요청 간격 4초.
Lululemon(403)·Athleta·prAna·Vuori·젝시믹스는 엔드포인트가 없어 제외.

**소스 2 — 29CM 공개 검색 API.** 한국 브랜드 88곳을 한 소스로 커버. 브랜드 사이트를
따로 긁는 대신 이쪽을 쓴 이유는 한국 D2C가 대부분 Cafe24/자체몰이라 공개 JSON이 없기 때문.

**Practice / Fit / Proportions / 성능 속성은 어느 소스에도 없다.** 더 긁어도 안 나온다.
그래서 가진 것(소재 · 품목 · 계절 · 상품명)에서 파생시키고, 그 값을 추천 가중치로 쓴다
(`scripts/crawl.mjs`의 derived shopping traits). 사실이 아니라 랭킹 신호다.
소재 미상 상품은 품목이 보장하는 것만 가정한다 — 레깅스·브라는 신축성이 있다.

나머지 세 필드도 소스가 그냥 주지 않아서 이렇게 채운다:

- **소재 (전체 50%)** — Shopify 페이로드에는 사실상 없다(측정 0~45%, 4개 브랜드 중 3개는
  상세페이지에서 JS로 렌더링). 그래서 해외는 상품명에 들어 있는 원단 라인명(Spacedye,
  SkinLuxe, Airlift…)으로 `data/materials.json`에서 찾고, 한국은 29CM 상품페이지의
  구조화 필드 `제품 소재`(itemDetailsCode 101101)에서 실제 혼용률을 파싱한다 —
  이쪽이 90% 채워져 있어서 손으로 매핑할 필요가 없다.
- **계절** — 데이터에 없다. 소재 + 품목 키워드(기모·플리스→겨울, 린넨·냉감→여름)로
  **추정**하며, UI에 "추정"이라고 표기한다.
- **성별** — 29CM은 자체 카테고리(여성의류/남성의류)로 알려준다. 해외는 상품명·태그에서
  판정하고 기본값은 여성. `"men"`이 `"women"`의 부분 문자열이라 단어 경계로 매칭한다
  (이걸 안 해서 한때 여성 상품 전부가 남성으로 분류됐다).

**통화**: Shopify Markets가 요청 지역(한국)에 맞춰 일부 스토어 가격을 원화로 내려주는데
`meta.json`은 여전히 USD라고 말한다. 그래서 브랜드별 가격 중간값이 5,000 이상이면 KRW로
판정한다. 원화 가격이 USD로 표기되는 사고를 테스트가 막는다.

상품명·이미지를 브랜드/29CM에서 그대로 가져오는 구조이므로, 상업적 이용 전에는 각
출처의 ToS를 확인해야 한다.

## 상품 링크와 위시리스트

상품 카드를 누르면 **브랜드/29CM의 실제 상품 페이지**가 새 탭에서 열린다
(`target="_blank" rel="noopener noreferrer"`). 이 사이트는 파는 곳이 아니라 찾는 곳이다.

하트는 카드 링크 안에 있으므로 클릭이 링크로 전파되지 않게 막는다 — 저장이 쇼핑몰을 열면 안 된다.

위시리스트는 `localStorage`에 **상품 ID만** 저장하고 렌더 시 카탈로그에서 조회한다.
이름·가격 복사본을 저장하면 재크롤 직후부터 낡은 값을 보여주기 때문이다. 사라진 ID는 조용히 빠진다.

## Maternity

`maternityFriendly`는 **브랜드가 상품명에 스스로 표기한 경우에만** true다(37개).
편안한 핏이나 신축성 좋은 소재에서 추론하지 않는다 — 그건 없는 제품 주장을 만드는 일이다.
머천다이징 태그도 근거로 쓰지 않는다: 태그까지 인정했더니 맥시 드레스가 마타니티 목록에 들어왔다.
성별이나 체형 필터 안에 넣지 않고 독립 필터로 둔다.

## 데이터 갱신

```bash
npm run crawl                 # 캐시 사용 (매핑만 다시 계산 — 요청 0회)
npm run crawl -- fresh        # 전부 재수집
npm run crawl -- only=29cm    # 한국 소스만
```

마지막에 소재가 비어 있는 브랜드를 상품 수 순으로 출력한다. 위에서부터
`data/materials.json`에 원단 라인 키를 추가하면 커버율이 올라간다.
