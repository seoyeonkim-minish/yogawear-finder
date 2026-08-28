# yogawear-finder

요가 브랜드를 가로질러 요가웨어를 **소재 / 계절 / 종류 / 브랜드**로 탐색하는 카탈로그.

## 실행

```bash
npm install
npm run dev     # http://localhost:3000
npm test        # 시드 데이터 스키마 + 필터 로직 검증
npm run build
```

## 구조

| 경로 | 역할 |
|---|---|
| `data/products.json` | 유일한 데이터 소스. 브랜드는 상품의 필드 (별도 파일 없음) |
| `lib/products.ts` | 타입, 필터링(패싯 간 AND / 패싯 내 OR), 패싯 집계, URL 직렬화 |
| `app/page.tsx` | 필터 그리드. 필터 상태는 URL searchParams — 클라이언트 상태 없음 |
| `app/product/[id]/page.tsx` | 상세. `generateStaticParams`로 SSG |
| `test/filter.test.ts` | `node:test` 단일 체크 |

## 상품 추가

`data/products.json`에 항목 하나 추가하면 끝. 새 소재/계절 값은 필터 UI에 자동으로 나타남 (`facetOptions`가 데이터에서 파생).

```json
{
  "id": "brand-slug-product-slug",
  "brand": "Brand", "name": "Product name", "category": "leggings",
  "material": ["organic cotton"], "season": ["spring", "fall"],
  "price": 78, "colors": ["black"],
  "image": "https://…", "url": "https://…"
}
```

`season`은 `spring | summer | fall | winter`만 허용 (테스트가 강제). 이미지는 현재 placehold.co placeholder.
