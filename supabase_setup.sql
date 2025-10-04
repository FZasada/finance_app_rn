-- Enable Row Level Security
ALTER TABLE IF EXISTS public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.categories ENABLE ROW LEVEL SECURITY;

-- Create households table
CREATE TABLE IF NOT EXISTS public.households (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create household_members table
CREATE TABLE IF NOT EXISTS public.household_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    household_id UUID REFERENCES public.households(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(household_id, user_id)
);

-- Create budgets table
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    household_id UUID REFERENCES public.households(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    month VARCHAR(7) NOT NULL, -- YYYY-MM format
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(household_id, month)
);

-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
    color VARCHAR(7) NOT NULL, -- hex color
    icon VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    household_id UUID REFERENCES public.households(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES public.categories(id),
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_households_updated_at 
    BEFORE UPDATE ON public.households 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at 
    BEFORE UPDATE ON public.budgets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at 
    BEFORE UPDATE ON public.transactions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default categories
INSERT INTO public.categories (name, type, color, icon) VALUES
    ('Groceries', 'expense', '#FF6384', 'basket'),
    ('Transport', 'expense', '#36A2EB', 'car'),
    ('Entertainment', 'expense', '#FFCE56', 'musical-notes'),
    ('Utilities', 'expense', '#4BC0C0', 'flash'),
    ('Healthcare', 'expense', '#9966FF', 'medical'),
    ('Shopping', 'expense', '#FF9F40', 'bag'),
    ('Salary', 'income', '#28A745', 'card'),
    ('Freelance', 'income', '#17A2B8', 'laptop'),
    ('Investment', 'income', '#6C757D', 'trending-up'),
    ('Other', 'expense', '#DC3545', 'ellipsis-horizontal'),
    ('Other Income', 'income', '#28A745', 'add-circle')
ON CONFLICT DO NOTHING;

-- Row Level Security Policies

-- Households: Users can only see households they're members of
CREATE POLICY "Users can view their households" ON public.households
    FOR SELECT USING (
        id IN (
            SELECT household_id FROM public.household_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create households" ON public.households
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Household admins can update households" ON public.households
    FOR UPDATE USING (
        id IN (
            SELECT household_id FROM public.household_members 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Household admins can delete households" ON public.households
    FOR DELETE USING (
        id IN (
            SELECT household_id FROM public.household_members 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Household Members: Users can only see members of their households
CREATE POLICY "Users can view household members" ON public.household_members
    FOR SELECT USING (
        household_id IN (
            SELECT household_id FROM public.household_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can join households" ON public.household_members
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave households" ON public.household_members
    FOR DELETE USING (user_id = auth.uid());

-- Budgets: Users can only see budgets for their households
CREATE POLICY "Users can view household budgets" ON public.budgets
    FOR SELECT USING (
        household_id IN (
            SELECT household_id FROM public.household_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Household members can manage budgets" ON public.budgets
    FOR ALL USING (
        household_id IN (
            SELECT household_id FROM public.household_members 
            WHERE user_id = auth.uid()
        )
    );

-- Transactions: Users can only see transactions for their households
CREATE POLICY "Users can view household transactions" ON public.transactions
    FOR SELECT USING (
        household_id IN (
            SELECT household_id FROM public.household_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Household members can manage transactions" ON public.transactions
    FOR ALL USING (
        household_id IN (
            SELECT household_id FROM public.household_members 
            WHERE user_id = auth.uid()
        )
    );

-- Categories: All users can view categories
CREATE POLICY "Everyone can view categories" ON public.categories
    FOR SELECT USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_household_members_user_id ON public.household_members(user_id);
CREATE INDEX IF NOT EXISTS idx_household_members_household_id ON public.household_members(household_id);
CREATE INDEX IF NOT EXISTS idx_transactions_household_id ON public.transactions(household_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date);
CREATE INDEX IF NOT EXISTS idx_budgets_household_month ON public.budgets(household_id, month);