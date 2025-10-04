import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Household, HouseholdMember, supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface HouseholdContextType {
  household: Household | null;
  members: HouseholdMember[];
  loading: boolean;
  createHousehold: (name: string) => Promise<void>;
  joinHousehold: (inviteCode: string) => Promise<void>;
  leaveHousehold: () => Promise<void>;
  deleteHousehold: () => Promise<void>;
  refreshHousehold: () => Promise<void>;
}

const HouseholdContext = createContext<HouseholdContextType | undefined>(undefined);

export const useHousehold = () => {
  const context = useContext(HouseholdContext);
  if (context === undefined) {
    throw new Error('useHousehold must be used within a HouseholdProvider');
  }
  return context;
};

interface HouseholdProviderProps {
  children: React.ReactNode;
}

export const HouseholdProvider: React.FC<HouseholdProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [household, setHousehold] = useState<Household | null>(null);
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHousehold = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Get user's household membership
      const { data: membershipData, error: membershipError } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', user.id)
        .single();

      if (membershipError || !membershipData) {
        setHousehold(null);
        setMembers([]);
        return;
      }

      // Get household details
      const { data: householdData, error: householdError } = await supabase
        .from('households')
        .select('*')
        .eq('id', membershipData.household_id)
        .single();

      if (householdError) {
        throw householdError;
      }

      // Get all members
      const { data: membersData, error: membersError } = await supabase
        .from('household_members')
        .select('*')
        .eq('household_id', membershipData.household_id);

      if (membersError) {
        throw membersError;
      }

      setHousehold(householdData);
      setMembers(membersData || []);
    } catch (error) {
      console.error('Error loading household:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadHousehold();
    } else {
      setHousehold(null);
      setMembers([]);
      setLoading(false);
    }
  }, [user, loadHousehold]);

  const createHousehold = async (name: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Create household
      const { data: householdData, error: householdError } = await supabase
        .from('households')
        .insert({
          name,
          created_by: user.id,
        })
        .select()
        .single();

      if (householdError) throw householdError;

      // Add user as admin member
      const { error: memberError } = await supabase
        .from('household_members')
        .insert({
          household_id: householdData.id,
          user_id: user.id,
          role: 'admin',
        });

      if (memberError) throw memberError;

      await loadHousehold();
    } catch (error) {
      console.error('Error creating household:', error);
      throw error;
    }
  };

  const joinHousehold = async (inviteCode: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Find household by invite code (you might want to implement a proper invite system)
      const { data: householdData, error: householdError } = await supabase
        .from('households')
        .select('*')
        .eq('id', inviteCode)
        .single();

      if (householdError) throw householdError;

      // Add user as member
      const { error: memberError } = await supabase
        .from('household_members')
        .insert({
          household_id: householdData.id,
          user_id: user.id,
          role: 'member',
        });

      if (memberError) throw memberError;

      await loadHousehold();
    } catch (error) {
      console.error('Error joining household:', error);
      throw error;
    }
  };

  const leaveHousehold = async () => {
    if (!user || !household) return;

    try {
      const { error } = await supabase
        .from('household_members')
        .delete()
        .eq('household_id', household.id)
        .eq('user_id', user.id);

      if (error) throw error;

      setHousehold(null);
      setMembers([]);
    } catch (error) {
      console.error('Error leaving household:', error);
      throw error;
    }
  };

  const deleteHousehold = async () => {
    if (!user || !household) return;

    try {
      // Only allow admin to delete
      const isAdmin = members.find(m => m.user_id === user.id)?.role === 'admin';
      if (!isAdmin) {
        throw new Error('Only admin can delete household');
      }

      const { error } = await supabase
        .from('households')
        .delete()
        .eq('id', household.id);

      if (error) throw error;

      setHousehold(null);
      setMembers([]);
    } catch (error) {
      console.error('Error deleting household:', error);
      throw error;
    }
  };

  const refreshHousehold = async () => {
    await loadHousehold();
  };

  const value = useMemo(
    () => ({
      household,
      members,
      loading,
      createHousehold,
      joinHousehold,
      leaveHousehold,
      deleteHousehold,
      refreshHousehold,
    }),
    [household, members, loading]
  );

  return (
    <HouseholdContext.Provider value={value}>
      {children}
    </HouseholdContext.Provider>
  );
};