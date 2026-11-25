# Nucleus End (Web) - external assets

All external assets are **CC0** from [Poly Haven](https://polyhaven.com) (downloaded 2026-11-25).

## Textures (assets/textures/)
- `aerial_grass_rock` (diffuse + normal, 1k) — steppe ground. https://polyhaven.com/a/aerial_grass_rock
- `snow_01` (diffuse + normal, 1k) — snow ground in the south and north regions (brightest of Poly Haven's snow set; the aerial field variant read as dirty slush and was dropped). https://polyhaven.com/a/snow_01
- `weathered_plank_siding`, `roof_planks`, `dark_wooden_planks` (diffuse + normal, 1k) — village house walls, roofs, doors and lamp poles.
- Object scatter (added after the "too few objects" pass): `pine_sapling_medium` (raw 6.0M tris simplified with gltfpack to a ~5MB GLB; originals in ~/workspace/nucleus-end-assets-original/), `tree_stump_01`, `boulder_01`, `dead_tree_trunk_02`, `wooden_barrels_01`, `wooden_crate_01`, `dry_branches_medium_01` (all 1k gltf), `shrub_01` and `sand_rocks_small_01` (gltfpack-simplified GLBs, originals archived the same way).

## Models (assets/models/)
- `grass_medium_01` — grass tufts scattered across the steppe. https://polyhaven.com/a/grass_medium_01
- `dead_tree_trunk` — dead trees on the steppe. https://polyhaven.com/a/dead_tree_trunk
- `rock_face_01` — large rocks on the steppe. https://polyhaven.com/a/rock_face_01
- `rock_07` — rocks on the shore and in the northern mountains. https://polyhaven.com/a/rock_07
- `pine_tree_01` — living pines in the south and north regions. The raw Poly Haven model is 17,182,252 triangles (949MB .bin): at 60 instances that is over a billion triangles per frame, which no GPU can render. An aggressive simplify to 89k triangles was tested and rejected: the needle cards collapsed into black shards. The game therefore loads `pine_tree_01_mid.glb` — the same tree simplified conservatively with gltfpack (meshoptimizer) to 356,910 triangles / 18MB, original textures embedded, verified by screenshot (sparse winter pines, no shard artifacts). The raw files are preserved untouched in `~/workspace/nucleus-end-assets-original/pine_tree_01/`. Region streaming keeps the cost scoped: the pine file is fetched only when the south or north region loads.

## Notes
- three.js r160 is vendored under `lib/` (MIT). GLTFLoader + BufferGeometryUtils under `lib/addons/`.

## Lite pass (2026-11-25, dzyai式の軽量化)
- 全モデルを実ゲーム向けのポリゴン数へ削減（松 178k→74k、苗木 55k→2.8k、小石 59k→4.8k、草 2.5k→370 など）。地域あたりの総ポリゴンは南 29.8M→6.1M、草原 30.5M→3.8M。
- 松は量子化済みGLBへの再間引きが葉を壊すため、Blenderで非量子化に書き出してから間引きした。
- 草・低木・小石・苗木・枯れ枝は影を落とさない（シャドウパスのコスト削減）。個体ごとの色味のばらつき（instanceColor）を追加。
- レンダラーは ACES トーンマッピング＋画素密度上限 1.5。
