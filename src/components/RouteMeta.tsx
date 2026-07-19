import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { SITE_NAME, SITE_ORIGIN } from "../config/site";
import { getArticleBySlug } from "../features/articles/domain/registry";

/**
 * ルートごとに <title> / <meta description> / <link canonical> を出し分ける。
 *
 * React 19 のメタデータ巻き上げ（<title> 等を head へ自動移動）は初回は効くが、
 * クライアント遷移で巻き上げ済みタグの title/content を更新しないケースがあるため、
 * head の同期は useEffect から直接 DOM を操作して確実に行う。index.html には静的な
 * title/description/canonical を置かない（このコンポーネントが唯一の管理点）。
 *
 * canonicalPath を持つルート＝インデックス対象。持たないルート（結果・成績・設定など
 * 一時的/個人依存の画面）は noindex とし canonical を出さない。
 */
interface RouteMetaInfo {
  title: string;
  description?: string;
  canonicalPath?: string;
}

const SUFFIX = `｜${SITE_NAME}`;

// 固定ルートのメタ定義。記事詳細ページ（/articles/:slug）は registry から動的に生成する。
const STATIC_META: Record<string, RouteMetaInfo> = {
  "/": {
    title: `${SITE_NAME}｜点数計算(符・翻)を反復練習できる無料ドリル`,
    description: "麻雀の点数計算(符・翻・点数)をスマホで反復練習できるドリルアプリ。",
    canonicalPath: "/",
  },
  "/quiz": {
    title: `点数計算モード${SUFFIX}`,
    description: "ランダム出題される和了形から最終点数を4択で答える、麻雀の点数計算練習モード。",
    canonicalPath: "/quiz",
  },
  "/fu/quiz": {
    title: `符計算モード${SUFFIX}`,
    description: "和了形から符を4択で答える、麻雀の符計算練習モード。",
    canonicalPath: "/fu/quiz",
  },
  "/fu/parts": {
    title: `符分解モード${SUFFIX}`,
    description: "符を構成要素ごとに組み立てて理解する、麻雀の符計算練習モード。",
    canonicalPath: "/fu/parts",
  },
  "/convert": {
    title: `点数換算モード${SUFFIX}`,
    description: "符・翻から点数を即答する、麻雀の点数早見表の反復練習モード。",
    canonicalPath: "/convert",
  },
  "/articles": {
    title: `学習ガイド${SUFFIX}`,
    description: "麻雀の点数計算を基礎から学べる解説記事の一覧。",
    canonicalPath: "/articles",
  },
  "/about": {
    title: `運営者情報${SUFFIX}`,
    description: "麻雀点数トレーニングの運営者情報とサイト概要。",
    canonicalPath: "/about",
  },
  "/privacy": {
    title: `プライバシーポリシー${SUFFIX}`,
    description: "麻雀点数トレーニングのプライバシーポリシー。",
    canonicalPath: "/privacy",
  },
  "/contact": {
    title: `お問い合わせ${SUFFIX}`,
    description: "麻雀点数トレーニングへのお問い合わせ窓口。",
    canonicalPath: "/contact",
  },
  // インデックス対象外（canonicalPath なし＝noindex）。
  "/result": { title: `採点結果${SUFFIX}` },
  "/fu/result": { title: `採点結果${SUFFIX}` },
  "/stats": { title: `成績${SUFFIX}` },
  "/settings": { title: `設定${SUFFIX}` },
};

function metaForPath(pathname: string): RouteMetaInfo {
  const staticMeta = STATIC_META[pathname];
  if (staticMeta) return staticMeta;

  const articlesPrefix = "/articles/";
  if (pathname.startsWith(articlesPrefix)) {
    const slug = pathname.slice(articlesPrefix.length);
    const article = getArticleBySlug(slug);
    if (article) {
      return {
        title: `${article.title}${SUFFIX}`,
        description: article.description,
        canonicalPath: `/articles/${slug}`,
      };
    }
  }

  // 未知のパス（存在しない記事slug等）はトップへ寄せず noindex 扱いにする。
  return { title: SITE_NAME };
}

// name 付き <meta> を head に upsert する。content が undefined なら該当タグを除去。
function upsertMeta(name: string, content: string | undefined): void {
  const existing = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (content === undefined) {
    existing?.remove();
    return;
  }
  const el = existing ?? document.head.appendChild(document.createElement("meta"));
  el.setAttribute("name", name);
  el.setAttribute("content", content);
}

// rel 付き <link> を head に upsert する。href が undefined なら該当タグを除去。
function upsertLink(rel: string, href: string | undefined): void {
  const existing = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (href === undefined) {
    existing?.remove();
    return;
  }
  const el = existing ?? document.head.appendChild(document.createElement("link"));
  el.setAttribute("rel", rel);
  el.setAttribute("href", href);
}

export function RouteMeta() {
  const { pathname } = useLocation();
  const { title, description, canonicalPath } = metaForPath(pathname);

  useEffect(() => {
    document.title = title;
    upsertMeta("description", description);
    upsertLink("canonical", canonicalPath ? `${SITE_ORIGIN}${canonicalPath}` : undefined);
    upsertMeta("robots", canonicalPath ? undefined : "noindex");
  }, [title, description, canonicalPath]);

  return null;
}
