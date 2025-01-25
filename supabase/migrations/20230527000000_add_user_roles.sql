-- Create an enum type for user roles
CREATE TYPE user_role AS ENUM ('admin', 'provider', 'billing_staff');

-- Add a role column to the auth.users table
ALTER TABLE auth.users ADD COLUMN role user_role DEFAULT 'billing_staff';

-- Create a function to get the current user's role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM auth.users WHERE id = auth.uid();
$$;

-- Create policies for role-based access
CREATE POLICY "Allow read access based on user role" ON public.patients
FOR SELECT
USING (
  CASE
    WHEN public.get_current_user_role() = 'admin' THEN TRUE
    WHEN public.get_current_user_role() = 'provider' THEN TRUE
    WHEN public.get_current_user_role() = 'billing_staff' THEN TRUE
    ELSE FALSE
  END
);

CREATE POLICY "Allow insert access based on user role" ON public.patients
FOR INSERT
WITH CHECK (
  CASE
    WHEN public.get_current_user_role() = 'admin' THEN TRUE
    WHEN public.get_current_user_role() = 'provider' THEN TRUE
    ELSE FALSE
  END
);

CREATE POLICY "Allow update access based on user role" ON public.patients
FOR UPDATE
USING (
  CASE
    WHEN public.get_current_user_role() = 'admin' THEN TRUE
    WHEN public.get_current_user_role() = 'provider' THEN TRUE
    ELSE FALSE
  END
);

-- Create similar policies for providers table
CREATE POLICY "Allow read access based on user role" ON public.providers
FOR SELECT
USING (
  CASE
    WHEN public.get_current_user_role() = 'admin' THEN TRUE
    WHEN public.get_current_user_role() = 'provider' THEN TRUE
    WHEN public.get_current_user_role() = 'billing_staff' THEN TRUE
    ELSE FALSE
  END
);

CREATE POLICY "Allow insert access based on user role" ON public.providers
FOR INSERT
WITH CHECK (
  CASE
    WHEN public.get_current_user_role() = 'admin' THEN TRUE
    ELSE FALSE
  END
);

CREATE POLICY "Allow update access based on user role" ON public.providers
FOR UPDATE
USING (
  CASE
    WHEN public.get_current_user_role() = 'admin' THEN TRUE
    ELSE FALSE
  END
);

-- Create similar policies for claims table
CREATE POLICY "Allow read access based on user role" ON public.claims
FOR SELECT
USING (
  CASE
    WHEN public.get_current_user_role() = 'admin' THEN TRUE
    WHEN public.get_current_user_role() = 'provider' THEN TRUE
    WHEN public.get_current_user_role() = 'billing_staff' THEN TRUE
    ELSE FALSE
  END
);

CREATE POLICY "Allow insert access based on user role" ON public.claims
FOR INSERT
WITH CHECK (
  CASE
    WHEN public.get_current_user_role() = 'admin' THEN TRUE
    WHEN public.get_current_user_role() = 'billing_staff' THEN TRUE
    ELSE FALSE
  END
);

CREATE POLICY "Allow update access based on user role" ON public.claims
FOR UPDATE
USING (
  CASE
    WHEN public.get_current_user_role() = 'admin' THEN TRUE
    WHEN public.get_current_user_role() = 'billing_staff' THEN TRUE
    ELSE FALSE
  END
);
