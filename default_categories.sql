-- Insert default categories for the app
-- Expense categories
INSERT INTO public.categories (name, type, color, icon) VALUES
('groceries', 'expense', '#FF6B6B', 'basket'),
('transport', 'expense', '#4ECDC4', 'car'),
('entertainment', 'expense', '#45B7D1', 'game-controller'),
('utilities', 'expense', '#FFA07A', 'flash'),
('healthcare', 'expense', '#98D8C8', 'medical'),
('shopping', 'expense', '#F7DC6F', 'bag'),
('restaurant', 'expense', '#BB8FCE', 'restaurant'),
('education', 'expense', '#85C1E9', 'school'),
('other_expense', 'expense', '#B0B0B0', 'ellipsis-horizontal')
ON CONFLICT DO NOTHING;

-- Income categories  
INSERT INTO public.categories (name, type, color, icon) VALUES
('salary', 'income', '#52C41A', 'cash'),
('freelance', 'income', '#1890FF', 'laptop'),
('investment', 'income', '#722ED1', 'trending-up'),
('business', 'income', '#13C2C2', 'business'),
('gift', 'income', '#EB2F96', 'gift'),
('other_income', 'income', '#52C41A', 'add-circle')
ON CONFLICT DO NOTHING;