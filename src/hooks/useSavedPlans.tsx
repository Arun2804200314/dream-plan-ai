import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { SavedPlan, FormData, GeneratedLayout } from '@/types/floorPlan';
import { toast } from 'sonner';

export function useSavedPlans() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<SavedPlan[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPlans = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('saved_plans')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPlans((data || []) as unknown as SavedPlan[]);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('Failed to load saved plans');
    } finally {
      setLoading(false);
    }
  };

  const savePlan = async (
    name: string,
    formData: FormData,
    generatedLayout: GeneratedLayout | null
  ) => {
    if (!user) {
      toast.error('Please sign in to save plans');
      return null;
    }

    try {
      const insertData = {
        user_id: user.id,
        name,
        plot_length: parseInt(formData.plotLength) || 0,
        plot_width: parseInt(formData.plotWidth) || 0,
        floors: parseInt(formData.floors) || 1,
        bedrooms: formData.bedrooms,
        bathrooms: formData.bathrooms,
        kitchens: formData.kitchens,
        living_rooms: formData.livingRooms,
        dining_rooms: formData.diningRooms,
        garage: formData.garage,
        balcony: formData.balcony,
        garden: formData.garden,
        style: formData.style,
        budget_range: formData.budgetRange,
        vastu_compliant: formData.vastuCompliant,
        generated_layout: generatedLayout as unknown as Record<string, unknown>,
      };
      
      const { data, error } = await supabase
        .from('saved_plans')
        .insert(insertData as never)
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Plan saved successfully!');
      await fetchPlans();
      return data;
    } catch (error) {
      console.error('Error saving plan:', error);
      toast.error('Failed to save plan');
      return null;
    }
  };

  const deletePlan = async (planId: string) => {
    try {
      const { error } = await supabase
        .from('saved_plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;
      
      toast.success('Plan deleted');
      await fetchPlans();
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast.error('Failed to delete plan');
    }
  };

  const updatePlanName = async (planId: string, newName: string) => {
    try {
      const { error } = await supabase
        .from('saved_plans')
        .update({ name: newName })
        .eq('id', planId);

      if (error) throw error;
      
      toast.success('Plan renamed');
      await fetchPlans();
    } catch (error) {
      console.error('Error updating plan:', error);
      toast.error('Failed to rename plan');
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [user]);

  return {
    plans,
    loading,
    savePlan,
    deletePlan,
    updatePlanName,
    refetch: fetchPlans,
  };
}
