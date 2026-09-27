import React from 'react';
import './CategoryBadge.css';

export const getCategoryColorClass = (category) => {
  const norm = category ? category.toLowerCase() : '';
  if (norm.includes('açougue')) return 'cat-acougue';
  if (norm.includes('laticínios')) return 'cat-laticinios';
  if (norm.includes('padaria')) return 'cat-padaria';
  if (norm.includes('hortifruti')) return 'cat-hortifruti';
  if (norm.includes('mercearia')) return 'cat-mercearia';
  if (norm.includes('bebidas')) return 'cat-bebidas';
  if (norm.includes('limpeza')) return 'cat-limpeza';
  if (norm.includes('higiene')) return 'cat-higiene';
  if (norm.includes('congelados')) return 'cat-congelados';
  if (norm.includes('doces')) return 'cat-doces';
  return 'cat-outros';
};

export default function CategoryBadge({ category }) {
  if (!category) return null;
  return (
    <span className={`category-badge ${getCategoryColorClass(category)}`}>
      {category}
    </span>
  );
}
