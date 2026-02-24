// src/pages/DetailPage.jsx
import React from 'react';
import { useParams } from 'react-router-dom';
import PortfolioDetail from '../components/PortfolioDetail';

const DetailPage = () => {
  const { id } = useParams();

  return (
    <div>
      <PortfolioDetail id={id} />
    </div>
  );
};

export default DetailPage;
