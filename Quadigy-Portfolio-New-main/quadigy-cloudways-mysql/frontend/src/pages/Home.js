// src/pages/Home.jsx
import React from "react";
import PortfolioGrid from "../components/PortfolioGrid";
import { useProducts } from "../store/useProducts";

const Home = () => {
  const { apiStatus, apiMessage } = useProducts();

  return (
    <div className="home-page">
      {/* Offline / Error banner */}
      {apiStatus === "offline" && (
        <div className="api-banner api-banner--offline">
          <b>Server not connected.</b> {apiMessage}
        </div>
      )}

      {apiStatus === "error" && (
        <div className="api-banner api-banner--error">
          <b>Something went wrong.</b> {apiMessage}
        </div>
      )}

      {/* Hero + Grid */}
      <div className="portfolio-hero">
        <div className="portfolio-hero__inner">
          <div className="portfolio-hero__crumb">portfolio</div>
          <h1 className="portfolio-hero__title">Portfolio Grid</h1>
        </div>
      </div>

      <div className="portfolio-section">
        <div className="portfolio-section__inner">
          <div className="portfolio-topline">
            <span className="portfolio-topline__label">portfolio</span>
            <span className="portfolio-topline__rule" />
          </div>

          <PortfolioGrid />
        </div>
      </div>
    </div>
  );
};

export default Home;
