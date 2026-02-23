import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";
import { useProducts } from "../store/useProducts";
import logo from "../assets/quadigy-logo.webp";

export default function Navbar() {
  const { items } = useProducts();
  const navigate = useNavigate();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const wrapRef = useRef(null); // for outside-click

  const toggleMenu = () => setIsMenuOpen((v) => !v);

  const handleSearch = (e) => {
    const value = e.target.value;
    setQuery(value);
    if (!value.trim()) {
      setSearchResults([]);
      return;
    }
    const filtered = items.filter((p) =>
      (p.title || "").toLowerCase().includes(value.toLowerCase())
    );
    setSearchResults(filtered.slice(0, 8));
  };

  const goToProduct = (id) => {
    setIsMenuOpen(false);
    setQuery("");
    setSearchResults([]);
    navigate(`/portfolio/${id}`);
  };

  // Enter = open first result, Esc = clear
  const onSearchKeyDown = (e) => {
    if (e.key === "Enter" && searchResults.length > 0) {
      goToProduct(searchResults[0].id);
    } else if (e.key === "Escape") {
      setQuery("");
      setSearchResults([]);
    }
  };

  // close dropdown on outside click
  useEffect(() => {
    const onDocClick = (ev) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(ev.target)) {
        setSearchResults([]); // don't clear text, only dropdown
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <>
      <nav className="navbar">
        {/* === LOGO (only section changed) === */}
        <div className="logo">
          <span className="logo-badge">
            <img src={logo} alt="Quadigy" className="logo-img" />
          </span>
          <div className="logo-img">Quadigy<span>Portfolio</span></div>
        </div>

        {/* hamburger */}
        <div
          className="hamburger"
          onClick={toggleMenu}
          aria-label="Toggle menu"
          aria-expanded={isMenuOpen}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && toggleMenu()}
        >
          <span className="bar" />
          <span className="bar" />
          <span className="bar" />
        </div>

        {/* right side (links + search + cta) */}
        <ul className={`nav-links ${isMenuOpen ? "active" : ""}`}>
          <li><Link to="/home" onClick={() => setIsMenuOpen(false)}>Home</Link></li>
          <li><a href="#">Pages</a></li>
          <li><Link to="/portfolio" onClick={() => setIsMenuOpen(false)}>Portfolio</Link></li>
          <li><a href="#">Shop</a></li>
          <li><a href="#">Blog</a></li>
          <li><a href="#">Contacts</a></li>

          {/* Search inside nav so it collapses on mobile */}
          <li className="search-li" ref={wrapRef}>
            <input
              type="text"
              placeholder="Search products..."
              className="search-input"
              value={query}
              onChange={handleSearch}
              onKeyDown={onSearchKeyDown}
            />
            {query && (
              <div className="search-dropdown">
                {searchResults.length > 0 ? (
                  searchResults.map((p) => (
                    <button
                      key={p.id}
                      className="result-item"
                      onClick={() => goToProduct(p.id)}
                      type="button"
                    >
                      {p.title}
                    </button>
                  ))
                ) : (
                  <div className="result-empty">No products found.</div>
                )}
              </div>
            )}
          </li>

          {/* CTA inside nav so it collapses on mobile */}
          <li className="contact-li">
            <a href="#" className="contact-btn">Get in Touch</a>
          </li>
        </ul>
      </nav>
    </>
  );
}
