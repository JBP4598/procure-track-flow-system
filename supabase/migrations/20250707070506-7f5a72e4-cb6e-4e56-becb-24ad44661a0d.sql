
-- Create enum types for various status fields
CREATE TYPE user_role AS ENUM ('admin', 'encoder', 'inspector', 'bac', 'accountant');
CREATE TYPE pr_status AS ENUM ('pending', 'for_approval', 'approved', 'awarded', 'returned');
CREATE TYPE po_status AS ENUM ('pending', 'approved', 'cancelled');
CREATE TYPE delivery_status AS ENUM ('not_delivered', 'partially_delivered', 'fully_delivered');
CREATE TYPE inspection_result AS ENUM ('accepted', 'rejected', 'requires_reinspection');
CREATE TYPE dv_status AS ENUM ('for_signature', 'submitted', 'processed');

-- Departments table
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  department_id UUID REFERENCES public.departments(id),
  role user_role NOT NULL DEFAULT 'encoder',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- PPMP Files table
CREATE TABLE public.ppmp_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES public.departments(id),
  fiscal_year INTEGER NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT,
  total_budget DECIMAL(15,2) NOT NULL DEFAULT 0,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'archived')),
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(department_id, fiscal_year, version)
);

-- PPMP Items table
CREATE TABLE public.ppmp_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ppmp_file_id UUID NOT NULL REFERENCES public.ppmp_files(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  description TEXT,
  unit TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_cost DECIMAL(10,2) NOT NULL,
  total_cost DECIMAL(15,2) NOT NULL,
  budget_category TEXT NOT NULL,
  procurement_method TEXT,
  schedule_quarter TEXT,
  remaining_quantity INTEGER,
  remaining_budget DECIMAL(15,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Purchase Requests table
CREATE TABLE public.purchase_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pr_number TEXT NOT NULL UNIQUE,
  department_id UUID NOT NULL REFERENCES public.departments(id),
  ppmp_file_id UUID REFERENCES public.ppmp_files(id),
  requested_by UUID NOT NULL REFERENCES public.profiles(id),
  purpose TEXT NOT NULL,
  total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  status pr_status DEFAULT 'pending',
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  remarks TEXT,
  file_attachments TEXT[], -- Array of file URLs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Purchase Request Items table
CREATE TABLE public.pr_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pr_id UUID NOT NULL REFERENCES public.purchase_requests(id) ON DELETE CASCADE,
  ppmp_item_id UUID REFERENCES public.ppmp_items(id),
  item_name TEXT NOT NULL,
  description TEXT,
  unit TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_cost DECIMAL(10,2) NOT NULL,
  total_cost DECIMAL(15,2) NOT NULL,
  budget_category TEXT NOT NULL,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Purchase Orders table
CREATE TABLE public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number TEXT NOT NULL UNIQUE,
  supplier_name TEXT NOT NULL,
  supplier_address TEXT,
  supplier_contact TEXT,
  total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  status po_status DEFAULT 'pending',
  delivery_status delivery_status DEFAULT 'not_delivered',
  delivery_date DATE,
  terms_conditions TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  file_attachments TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Purchase Order Items table (links to PR items)
CREATE TABLE public.po_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  pr_item_id UUID NOT NULL REFERENCES public.pr_items(id),
  quantity INTEGER NOT NULL,
  unit_cost DECIMAL(10,2) NOT NULL,
  total_cost DECIMAL(15,2) NOT NULL,
  delivered_quantity INTEGER DEFAULT 0,
  remaining_quantity INTEGER,
  cancelled BOOLEAN DEFAULT FALSE,
  cancel_remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Inspection and Acceptance Reports table
CREATE TABLE public.inspection_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  iar_number TEXT NOT NULL UNIQUE,
  po_id UUID NOT NULL REFERENCES public.purchase_orders(id),
  inspector_id UUID NOT NULL REFERENCES public.profiles(id),
  inspection_date DATE NOT NULL,
  overall_result inspection_result NOT NULL,
  remarks TEXT,
  image_attachments TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- IAR Items table
CREATE TABLE public.iar_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  iar_id UUID NOT NULL REFERENCES public.inspection_reports(id) ON DELETE CASCADE,
  po_item_id UUID NOT NULL REFERENCES public.po_items(id),
  inspected_quantity INTEGER NOT NULL,
  accepted_quantity INTEGER NOT NULL DEFAULT 0,
  rejected_quantity INTEGER NOT NULL DEFAULT 0,
  result inspection_result NOT NULL,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Disbursement Vouchers table
CREATE TABLE public.disbursement_vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dv_number TEXT NOT NULL UNIQUE,
  iar_id UUID NOT NULL REFERENCES public.inspection_reports(id),
  po_id UUID NOT NULL REFERENCES public.purchase_orders(id),
  payee_name TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  status dv_status DEFAULT 'for_signature',
  payment_method TEXT,
  check_number TEXT,
  payment_date DATE,
  receipt_attachments TEXT[],
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  processed_by UUID REFERENCES public.profiles(id),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Budget Savings tracking table
CREATE TABLE public.budget_savings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ppmp_item_id UUID REFERENCES public.ppmp_items(id),
  pr_item_id UUID REFERENCES public.pr_items(id),
  po_item_id UUID REFERENCES public.po_items(id),
  planned_amount DECIMAL(15,2) NOT NULL,
  obligated_amount DECIMAL(15,2) NOT NULL,
  actual_amount DECIMAL(15,2) NOT NULL,
  savings_amount DECIMAL(15,2) GENERATED ALWAYS AS (planned_amount - actual_amount) STORED,
  savings_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE 
      WHEN planned_amount > 0 THEN ((planned_amount - actual_amount) / planned_amount * 100)
      ELSE 0 
    END
  ) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Activity Logs for audit trail
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ppmp_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ppmp_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pr_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.po_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iar_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disbursement_vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_savings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Create function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id AND role = _role
  )
$$;

-- Create function to get user department
CREATE OR REPLACE FUNCTION public.get_user_department(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT department_id
  FROM public.profiles
  WHERE id = _user_id
$$;

-- Basic RLS policies for departments (readable by all authenticated users)
CREATE POLICY "Departments are viewable by authenticated users" ON public.departments
  FOR SELECT USING (auth.role() = 'authenticated');

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admin users can view all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- PPMP policies - users can only see their department's PPMPs
CREATE POLICY "Users can view department PPMPs" ON public.ppmp_files
  FOR SELECT USING (department_id = public.get_user_department(auth.uid()));

CREATE POLICY "Users can create PPMPs for their department" ON public.ppmp_files
  FOR INSERT WITH CHECK (department_id = public.get_user_department(auth.uid()));

CREATE POLICY "Users can update their department PPMPs" ON public.ppmp_files
  FOR UPDATE USING (department_id = public.get_user_department(auth.uid()));

-- PPMP Items policies
CREATE POLICY "Users can view PPMP items from accessible PPMPs" ON public.ppmp_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.ppmp_files 
      WHERE id = ppmp_file_id 
      AND department_id = public.get_user_department(auth.uid())
    )
  );

-- Purchase Request policies
CREATE POLICY "Users can view department PRs" ON public.purchase_requests
  FOR SELECT USING (department_id = public.get_user_department(auth.uid()));

CREATE POLICY "Users can create PRs for their department" ON public.purchase_requests
  FOR INSERT WITH CHECK (department_id = public.get_user_department(auth.uid()));

-- Add similar policies for other tables...
-- (Additional policies would follow similar patterns)

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all relevant tables
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ppmp_files_updated_at BEFORE UPDATE ON public.ppmp_files FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ppmp_items_updated_at BEFORE UPDATE ON public.ppmp_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_purchase_requests_updated_at BEFORE UPDATE ON public.purchase_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_pr_items_updated_at BEFORE UPDATE ON public.pr_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON public.purchase_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_po_items_updated_at BEFORE UPDATE ON public.po_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_inspection_reports_updated_at BEFORE UPDATE ON public.inspection_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_iar_items_updated_at BEFORE UPDATE ON public.iar_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_disbursement_vouchers_updated_at BEFORE UPDATE ON public.disbursement_vouchers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to automatically create user profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert some sample departments
INSERT INTO public.departments (name, code) VALUES
  ('Information Technology', 'IT'),
  ('Human Resources', 'HR'),
  ('Finance', 'FIN'),
  ('Operations', 'OPS'),
  ('Procurement', 'PROC');
