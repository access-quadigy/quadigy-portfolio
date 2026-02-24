import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './PortfolioDetail.css';
import { useProducts } from '../store/useProducts';
import FilePreview from './FilePreview';

export default function PortfolioDetail() {
  const { id } = useParams();
  const getById = useProducts(s => s.getById);
  const load = useProducts(s => s.load);
  const item = getById(id);

  useEffect(() => {
    if (!item) load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!item) {
    return (
      <div className="wrapper" style={{ padding: '80px 0' }}>
        <h2>Product not found</h2>
        <p>
          <Link className="sans-button default-button" to="/portfolio">
            ← Back to Portfolio
          </Link>
        </p>
      </div>
    );
  }

  const {
    title,
    image,
    client,
    services,
    url,
    description,
    video,        // ✅ in scope
    docs = [],    // ✅ in scope
    similar = []
  } = item;

  // full-width previews
  const mediaGrid = {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: 16
  };

  const hasAnyMedia = Boolean(video) || (Array.isArray(docs) && docs.length > 0); // ✅ in scope

  return (
    <div className="sans-page">
      {/* Title */}
      <section className="sans-page-title">
        <div className="wrapper">
          <div className="sans-page-title-inner">
            <hgroup>
              <h1>{title}</h1>
            </hgroup>
          </div>
        </div>
      </section>

      <div className="sans-content">
        <section className="sans-articles">
          <div className="wrapper">
            {/* Feature image */}
            {image && (
              <div className="sans-portfolio-feature">
                <img src={image} alt={title} title={title} />
              </div>
            )}

            {/* Sidebar (left) + Description/Media (right) */}
            <div className="sans-articles-container">
              {/* LEFT SIDEBAR */}
              <aside className="sans-case-aside aside-widgets">
                {client && (
                  <div className="aside-widget">
                    <h3>Client</h3>
                    <p>{client}</p>
                  </div>
                )}

                {services && (
                  <div className="aside-widget">
                    <h3>Services Provided</h3>
                    <p>{services}</p>
                  </div>
                )}

                {url && (
                  <div className="aside-widget">
                    <h3>Production URL</h3>
                    <p>
                      <a href={url} target="_blank" rel="noreferrer">
                        {url}
                      </a>
                    </p>
                  </div>
                )}

                {Array.isArray(similar) && similar.length > 0 && (
                  <div className="aside-widget">
                    <h3>Similar Projects</h3>
                    <ul className="related-cases">
                      {similar.map(sp => (
                        <li key={sp.id}>
                          <Link to={`/portfolio/${sp.id}`} title={sp.title}>
                            {sp.thumb && <img src={sp.thumb} alt={sp.title} />}
                          </Link>
                          <Link
                            className="related-title"
                            to={`/portfolio/${sp.id}`}
                          >
                            {sp.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="aside-widget last-widget">
                  <p>
                    <Link
                      className="sans-button default-button"
                      to="/portfolio"
                    >
                      ← Portfolio
                    </Link>
                  </p>
                </div>
              </aside>

              {/* RIGHT CONTENT */}
              <article className="sans-case-study">
                {/* Description */}
                {description && (
                  <div
                    className="product-description"
                    dangerouslySetInnerHTML={{ __html: description }}
                  />
                )}

                {/* MEDIA SECTION */}
                {hasAnyMedia && (
                  <section style={{ marginTop: 24 }}>
                    <h2 style={{ margin: '0 0 12px' }}>Media</h2>

                    {/* Video first */}
                    {video && (
                      <div style={{ marginBottom: 16 }}>
                        <FilePreview fileUrl={video} label="Video" aspect="16/9" />
                      </div>
                    )}

                    {/* Documents */}
                    {Array.isArray(docs) && docs.length > 0 && (
                      <div style={mediaGrid}>
                        {docs.map((d, idx) => (
                          <FilePreview
                            key={idx}
                            fileUrl={d.url}
                            label={d.label || d.type || 'Document'}
                            aspect="16/9"
                          />
                        ))}
                      </div>
                    )}
                  </section>
                )}
              </article>
            </div>
          </div>
        </section>
      </div>

      {/* Quick Contact CTA */}
      <section className="sans-quick-contact">
        <div className="wrapper">
          <div className="sans-quick-contact-info">
            <h2>Have a question?</h2>
            <p>
              Interested in working with us or just want to say “Hello”? We’d
              love to hear from you.
            </p>
            <p className="last-p">
              <Link
                className="sans-button brown-button"
                to={`/portfolio/${id}`}
              >
                Get in touch <i className="fa fa-arrow-right"></i>
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
