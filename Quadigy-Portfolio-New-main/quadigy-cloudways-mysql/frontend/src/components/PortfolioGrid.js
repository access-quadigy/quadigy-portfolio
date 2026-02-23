import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useProducts } from "../store/useProducts";
import "./PortfolioGrid.css";

const PortfolioGrid = () => {
  const { items, load } = useProducts();

  // Load portfolio items once
  useEffect(() => {
    if (!items || items.length === 0) {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Empty state
  if (!items || items.length === 0) {
    return (
      <div className="portfolio-empty">
        No portfolio items yet. Please add from Admin.
      </div>
    );
  }

  return (
    <div className="portfolio-grid">
      {items.map((it) => {
        const id = it.id;
        const title = it.title || "Untitled Project";
        const category = it.category || "general";
        const image = it.image_url || it.image || it.url || "";

        return (
          <Link
            key={id}
            to={`/portfolio/${id}`}
            className="p-card"
            aria-label={title}
          >
            {/* Image */}
            <div className="p-card__media">
              {image ? (
                <img src={image} alt={title} loading="lazy" />
              ) : (
                <div className="p-card__noimage">No Image</div>
              )}
              <div className="p-card__overlay" />
            </div>

            {/* Meta */}
            <div className="p-card__meta">
              <div className="p-card__cat">/{category}</div>

              <div className="p-card__titleRow">
                <div className="p-card__title">{title}</div>
                <div className="p-card__arrow" aria-hidden="true">
                  ↗
                </div>
              </div>

              <div className="p-card__underline" />
            </div>
          </Link>
        );
      })}
    </div>
  );
};

export default PortfolioGrid;
