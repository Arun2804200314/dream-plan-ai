-- Create saved_plans table for storing user-generated building plans
CREATE TABLE public.saved_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Untitled Plan',
  plot_length INTEGER NOT NULL,
  plot_width INTEGER NOT NULL,
  floors INTEGER NOT NULL DEFAULT 1,
  bedrooms INTEGER NOT NULL DEFAULT 2,
  bathrooms INTEGER NOT NULL DEFAULT 2,
  kitchens INTEGER NOT NULL DEFAULT 1,
  living_rooms INTEGER NOT NULL DEFAULT 1,
  dining_rooms INTEGER NOT NULL DEFAULT 1,
  garage BOOLEAN NOT NULL DEFAULT false,
  balcony BOOLEAN NOT NULL DEFAULT false,
  garden BOOLEAN NOT NULL DEFAULT false,
  style TEXT NOT NULL DEFAULT 'modern',
  budget_range TEXT NOT NULL DEFAULT 'medium',
  vastu_compliant BOOLEAN NOT NULL DEFAULT false,
  generated_layout JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.saved_plans ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own plans" 
ON public.saved_plans 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own plans" 
ON public.saved_plans 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own plans" 
ON public.saved_plans 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own plans" 
ON public.saved_plans 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_saved_plans_updated_at
BEFORE UPDATE ON public.saved_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();