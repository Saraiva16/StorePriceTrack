/**
 * FinanceService.js
 * Serviço para controle financeiro pessoal, faturas e cartões de crédito.
 */

const API_BASE = '/api/finance';

const getHeaders = () => ({
  'Content-Type': 'application/json'
});

const fetchOptions = {
  credentials: 'include'
};

export const fetchMonthlyTransactions = async (year, month) => {
  const url = `${API_BASE}/transactions?year=${year}&month=${month}`;
  const res = await fetch(url, {
    headers: getHeaders(),
    ...fetchOptions
  });
  if (!res.ok) throw new Error('Falha ao carregar transações do mês');
  const data = await res.json();
  // Normaliza campos snake_case para camelCase se necessário
  return data.map((tx) => ({
    ...tx,
    transactionDate: tx.transactionDate || tx.transaction_date,
    invoiceDate: tx.invoiceDate || tx.invoice_date,
    paymentMethod: tx.paymentMethod || tx.payment_method,
    creditCardId: tx.creditCardId ?? tx.credit_card_id,
    creditCardName: tx.creditCardName || tx.credit_card_name,
    creditCardBank: tx.creditCardBank || tx.credit_card_bank,
    creditCardColor: tx.creditCardColor || tx.credit_card_color,
    categoryId: tx.categoryId ?? tx.category_id,
    categoryName: tx.categoryName || tx.category_name,
    categoryColor: tx.categoryColor || tx.category_color,
    categoryIcon: tx.categoryIcon || tx.category_icon,
    installmentGroupId: tx.installmentGroupId || tx.installment_group_id,
    installmentNumber: tx.installmentNumber ?? tx.installment_number ?? 1,
    totalInstallments: tx.totalInstallments ?? tx.total_installments ?? 1,
    createdAt: tx.createdAt || tx.created_at
  }));
};

export const fetchMonthlySummary = async (year, month) => {
  const url = `${API_BASE}/transactions/summary?year=${year}&month=${month}`;
  const res = await fetch(url, {
    headers: getHeaders(),
    ...fetchOptions
  });
  if (!res.ok) throw new Error('Falha ao carregar resumo financeiro');
  const data = await res.json();
  const rawList = data.expenseByCategory || data.expense_by_category || [];
  const expenseByCategory = rawList.map((item) => ({
    categoryId: item.categoryId ?? item.category_id,
    categoryName: item.categoryName || item.category_name,
    color: item.color,
    icon: item.icon,
    totalAmount: item.totalAmount ?? item.total_amount ?? 0,
    percentage: item.percentage ?? 0
  }));

  return {
    year: data.year,
    month: data.month,
    totalIncome: data.totalIncome ?? data.total_income ?? 0,
    totalExpense: data.totalExpense ?? data.total_expense ?? 0,
    balance: data.balance ?? 0,
    expenseByCategory
  };
};

export const createTransaction = async (transactionData) => {
  const payload = {
    description: transactionData.description,
    amount: transactionData.amount,
    type: transactionData.type,
    transaction_date: transactionData.transactionDate || transactionData.transaction_date,
    payment_method: transactionData.paymentMethod || transactionData.payment_method,
    credit_card_id: transactionData.creditCardId || transactionData.credit_card_id,
    category_id: transactionData.categoryId || transactionData.category_id,
    total_installments: transactionData.totalInstallments || transactionData.total_installments || 1,
    observation: transactionData.observation
  };

  const res = await fetch(`${API_BASE}/transactions`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
    ...fetchOptions
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.message || 'Erro ao registrar lançamento.');
  }
  return await res.json();
};

export const updateTransaction = async (id, transactionData) => {
  const payload = {
    description: transactionData.description,
    amount: transactionData.amount,
    type: transactionData.type,
    transaction_date: transactionData.transactionDate || transactionData.transaction_date,
    payment_method: transactionData.paymentMethod || transactionData.payment_method,
    credit_card_id: transactionData.creditCardId || transactionData.credit_card_id,
    category_id: transactionData.categoryId || transactionData.category_id,
    observation: transactionData.observation
  };

  const res = await fetch(`${API_BASE}/transactions/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(payload),
    ...fetchOptions
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.message || 'Erro ao atualizar lançamento.');
  }
  return await res.json();
};

export const deleteTransaction = async (id, deleteAllInstallments = false) => {
  const url = `${API_BASE}/transactions/${id}?deleteAllInstallments=${deleteAllInstallments}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: getHeaders(),
    ...fetchOptions
  });
  if (!res.ok) throw new Error('Erro ao excluir lançamento.');
  return true;
};

export const fetchCreditCards = async () => {
  const res = await fetch(`${API_BASE}/cards`, {
    headers: getHeaders(),
    ...fetchOptions
  });
  if (!res.ok) throw new Error('Falha ao carregar cartões de crédito');
  const data = await res.json();
  return data.map((card) => ({
    ...card,
    creditLimit: card.creditLimit ?? card.credit_limit ?? 0,
    usedLimit: card.usedLimit ?? card.used_limit ?? 0,
    availableLimit: card.availableLimit ?? card.available_limit ?? 0,
    closingDay: card.closingDay ?? card.closing_day,
    dueDay: card.dueDay ?? card.due_day,
    createdAt: card.createdAt || card.created_at
  }));
};

export const createCreditCard = async (cardData) => {
  const payload = {
    name: cardData.name,
    bank: cardData.bank,
    credit_limit: cardData.creditLimit ?? cardData.credit_limit,
    closing_day: cardData.closingDay ?? cardData.closing_day,
    due_day: cardData.dueDay ?? cardData.due_day,
    color: cardData.color
  };

  const res = await fetch(`${API_BASE}/cards`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
    ...fetchOptions
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.message || 'Erro ao cadastrar cartão de crédito.');
  }
  return await res.json();
};

export const updateCreditCard = async (id, cardData) => {
  const payload = {
    name: cardData.name,
    bank: cardData.bank,
    credit_limit: cardData.creditLimit ?? cardData.credit_limit,
    closing_day: cardData.closingDay ?? cardData.closing_day,
    due_day: cardData.dueDay ?? cardData.due_day,
    color: cardData.color
  };

  const res = await fetch(`${API_BASE}/cards/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(payload),
    ...fetchOptions
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.message || 'Erro ao atualizar cartão de crédito.');
  }
  return await res.json();
};

export const deleteCreditCard = async (id) => {
  const res = await fetch(`${API_BASE}/cards/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
    ...fetchOptions
  });
  if (!res.ok) throw new Error('Erro ao excluir cartão de crédito.');
  return true;
};

export const fetchCategories = async () => {
  const res = await fetch(`${API_BASE}/categories`, {
    headers: getHeaders(),
    ...fetchOptions
  });
  if (!res.ok) throw new Error('Falha ao carregar categorias');
  return await res.json();
};

export const createCategory = async (categoryData) => {
  const res = await fetch(`${API_BASE}/categories`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(categoryData),
    ...fetchOptions
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.message || 'Erro ao cadastrar categoria.');
  }
  return await res.json();
};
