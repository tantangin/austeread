import ArticleCard from "@client/article/componenst/article-card";
import { AppInterface } from "@client/commons/interface/app";
import Banner from "@client/components/banner";
import { useEffect, useRef, useState } from "react";
import { Link, useLoaderData } from "react-router-dom";
import { SkeletonNews } from "../article/componenst/skeleton-card";
import useData from "../commons/data";
import { urlAsset } from "../commons/helpers";
import "./style.css";
import TitleKategori from "./title-kategori";

export default function IndexPage() {
  const { news } = useLoaderData() as { news: AppInterface.ArticleGroupKategori[] };

  const parentScroll = useRef<HTMLDivElement>(null);
  const [colsArt, setColsArt] = useState(3);

  const { data: newsHightLight, get: getNewsHightLight } = useData<{ data: AppInterface.HightLight[] }>();
  const [groupNews, setGroupNews] = useState<AppInterface.ArticleGroupKategoriCustom[]>([]);

  useEffect(() => {
    if (!Array.isArray(news)) return;

    const newGrb = news.map((newByKategori, iParent) => {
      const articlesSort: AppInterface.Article[][] = [];
      newByKategori.value.forEach((article, i) => {
        const keyMod = (i + 1) % colsArt;
        let ky = 0;
        if (keyMod == 2) ky = 1;
        else if (keyMod == 0) ky = 2;
        if (!articlesSort[ky]) articlesSort[ky] = [article];
        else articlesSort[ky].push(article);
      });
      return {
        articlesSort: articlesSort,
        category_name: articlesSort.length > 0 ? articlesSort[0][0].tbl_news_category_name : "",
      };
    });
    setGroupNews(newGrb);

    return () => {};
  }, [news, colsArt]);

  useEffect(() => {
    getNewsHightLight("news/highlight");
    const handleResize = () => {
      setColsArt(window.innerWidth < 500 ? 2 : 3);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.addEventListener("resize", handleResize);
    };
  }, []);
  return (
    <div>
      <div className="sm:max-w-[90%] sm:w-[729px] sm:my-10 mx-auto">
        <Banner />
      </div>
      {groupNews[0] && groupNews[0].articlesSort.length > 0 && (
        <div className="all-article px-2 sm:px-0 py-5">
          <div className="articles-header">
            <TitleKategori text="What's on today" />
          </div>
          <div className="body">
            <div className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${colsArt}, minmax(0, 1fr))` }}>
              {groupNews[0].articlesSort.map((indexArticle, i) => {
                return (
                  <div className="flex flex-col gap-4" key={i}>
                    {indexArticle.map((article) => {
                      return <ArticleCard key={article.id} article={article} />;
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      <div className="bg-gray-100 py-10">
        <div className="container px-2 sm:px-0">
          <div className="all-article">
            <div className="articles-header">
              <TitleKategori text="Don't miss this" />
            </div>
            <div className="articles-body mt-6">
              <div ref={parentScroll} className="relative grid grid-flow-col gap-3 overflow-x-auto hide-scroll-bar">
                {newsHightLight.data
                  ? newsHightLight.data.map((highlight, i) => {
                      return (
                        <Link
                          to={"/news/" + highlight.id}
                          key={i}
                          className="min-w-[240px] w-1/2"
                          style={{ width: parentScroll.current ? `${parentScroll.current.offsetWidth / 3}px` : "240px" }}
                        >
                          <div className="card bg-dark rounded overflow-hidden text-white relative">
                            <img className="h-[210px] sm:h-[232px] w-full" src={urlAsset("img/upload/" + highlight.thumbnail)} alt={`Thumbnail ${highlight.title}`} />
                            <div className="absolute inset-0 flex justify-end p-4 items-center flex-col bg-black/60">
                              <p className="text-xs">{`${highlight.tbl_news_category.name} | ${highlight.createdAt}`}</p>
                              <h5 className="text-center mt-3">{highlight.title}</h5>
                            </div>
                          </div>
                        </Link>
                      );
                    })
                  : [1, 2, 3, 4].map((a) => (
                      <div key={a} className="min-w-[240px] w-1/2" style={{ width: parentScroll.current ? `${parentScroll.current.offsetWidth / 3}px` : "240px" }}>
                        <SkeletonNews />
                      </div>
                    ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="container py-10">
        {groupNews.map((groupKategori, i) => {
          if (i == 0) return "";
          return (
            <div key={i} className="mb-10 border-b last:border-b-0">
              <div className="all-article px-2 sm:px-0">
                <div className="articles-header">
                  <TitleKategori text={groupKategori.category_name} />
                </div>
                <div className="articles-body mt-6">
                  <div className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${colsArt}, minmax(0, 1fr))` }}>
                    {groupKategori.articlesSort.map((indexArticle, i) => {
                      return (
                        <div className="flex flex-col gap-4" key={i}>
                          {indexArticle.map((article) => {
                            return <ArticleCard key={article.id} article={article} />;
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="text-center my-10">
                <Link to={"/news-by-category/" + groupKategori.category_name} className="outline-none bg-black rounded py-2 px-4 text-white hover:scale-105 duration-300">
                  View all {groupKategori.category_name} Article
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
