import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ShoppingCartPage from '../pages/ShoppingCart';

vi.mock('../services/ShoppingListService', () => ({
  fetchActiveCart: vi.fn(),
  addItemToCart: vi.fn(),
  closeCart: vi.fn()
}));

vi.mock('../services/EstimateService', () => ({
  fetchProducts: vi.fn()
}));

import { fetchActiveCart } from '../services/ShoppingListService';
import { fetchProducts } from '../services/EstimateService';

describe('ShoppingCartPage Rendering & Accordion Grouping', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar a lista de compras agrupada por seção/categoria e permitir colapsar', async () => {
    fetchActiveCart.mockResolvedValueOnce({
      id: 1,
      status: 'OPEN',
      items: [
        {
          id: 101,
          quantity: 2,
          product: { id: 1, normalizedName: 'Arroz Branco 5kg', category: { name: 'Mercearia' } }
        },
        {
          id: 102,
          quantity: 3,
          product: { id: 2, normalizedName: 'Feijão Carioca 1kg', category: { name: 'Mercearia' } }
        },
        {
          id: 103,
          quantity: 1,
          product: { id: 3, normalizedName: 'Maçã Gala', category: { name: 'Hortifrúti' } }
        }
      ]
    });

    fetchProducts.mockResolvedValueOnce([
      { id: 1, name: 'Arroz Branco 5kg', category: 'Mercearia' },
      { id: 2, name: 'Feijão Carioca 1kg', category: 'Mercearia' }
    ]);

    render(<ShoppingCartPage />);

    expect(await screen.findByText('Planejar Próxima Compra')).toBeInTheDocument();

    // Valida que os cabeçalhos das categorias agrupadas foram renderizados
    const merceariaElements = await screen.findAllByText('Mercearia');
    expect(merceariaElements.length).toBeGreaterThanOrEqual(1);

    const hortifrutiElements = await screen.findAllByText('Hortifrúti');
    expect(hortifrutiElements.length).toBeGreaterThanOrEqual(1);

    // Valida que os itens da categoria estão visíveis inicialmente
    expect(screen.getByText('Arroz Branco 5kg')).toBeInTheDocument();
    expect(screen.getByText('Feijão Carioca 1kg')).toBeInTheDocument();
    expect(screen.getByText('Maçã Gala')).toBeInTheDocument();

    // Clica no cabeçalho de Mercearia para colapsar
    const merceariaHeader = screen.getByRole('button', { name: /Mercearia/i });
    fireEvent.click(merceariaHeader);

    // Os itens de Mercearia devem ter sido colapsados
    expect(screen.queryByText('Arroz Branco 5kg')).not.toBeInTheDocument();
    // Mas Maçã Gala continua visível
    expect(screen.getByText('Maçã Gala')).toBeInTheDocument();

    // Clica novamente para reabrir
    fireEvent.click(merceariaHeader);
    expect(screen.getByText('Arroz Branco 5kg')).toBeInTheDocument();
  });
});
