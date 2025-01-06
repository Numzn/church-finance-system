import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, getDocs } from 'firebase/firestore';
import { db, auth } from '../../utils/firebase';
import { getCurrentWeekNumber } from '../../utils/helpers';
import toast from 'react-hot-toast';

function FinancialForm() {
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState([]);
  const [formData, setFormData] = useState({
    memberId: '',
    tithe: '',
    offering: '',
    weekNumber: getCurrentWeekNumber(),
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const q = query(collection(db, 'members'));
        const querySnapshot = await getDocs(q);
        const membersList = [];
        querySnapshot.forEach((doc) => {
          membersList.push({ id: doc.id, ...doc.data() });
        });
        setMembers(membersList);
      } catch (error) {
        console.error('Error fetching members:', error);
        toast.error('Error loading members');
      }
    };

    fetchMembers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      // Convert string amounts to numbers
      const tithe = parseFloat(formData.tithe) || 0;
      const offering = parseFloat(formData.offering) || 0;

      // Get member details
      const member = members.find((m) => m.id === formData.memberId);

      // Create submission document
      const submissionData = {
        memberId: formData.memberId,
        memberName: member ? `${member.firstName} ${member.lastName}` : 'Unknown',
        tithe,
        offering,
        weekNumber: parseInt(formData.weekNumber),
        date: new Date(formData.date),
        createdAt: new Date(),
        createdBy: auth.currentUser.uid
      };

      await addDoc(collection(db, 'submissions'), submissionData);

      toast.success('Financial submission recorded successfully');
      
      // Reset form
      setFormData({
        memberId: '',
        tithe: '',
        offering: '',
        weekNumber: getCurrentWeekNumber(),
        date: new Date().toISOString().split('T')[0],
      });
    } catch (error) {
      console.error('Error submitting financial data:', error);
      toast.error('Error recording submission');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-fg-primary">
            Financial Submission Form
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-dark-fg-alt">
            Record tithes and offerings for church members
          </p>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Member Selection */}
            <div className="space-y-1">
              <label htmlFor="memberId" className="block text-sm font-medium text-gray-700 dark:text-dark-fg-secondary">
                Member Name
              </label>
              <select
                id="memberId"
                name="memberId"
                required
                value={formData.memberId}
                onChange={handleChange}
                className="input-primary"
              >
                <option value="">Select a member</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.firstName} {member.lastName}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount Fields Container */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Tithe Amount */}
              <div className="space-y-1">
                <label htmlFor="tithe" className="block text-sm font-medium text-gray-700 dark:text-dark-fg-secondary">
                  Tithe Amount (ZMW)
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 dark:text-dark-fg-alt sm:text-sm">K</span>
                  </div>
                  <input
                    type="number"
                    name="tithe"
                    id="tithe"
                    step="0.01"
                    min="0"
                    value={formData.tithe}
                    onChange={handleChange}
                    className="input-primary pl-7"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Offering Amount */}
              <div className="space-y-1">
                <label htmlFor="offering" className="block text-sm font-medium text-gray-700 dark:text-dark-fg-secondary">
                  Offering Amount (ZMW)
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 dark:text-dark-fg-alt sm:text-sm">K</span>
                  </div>
                  <input
                    type="number"
                    name="offering"
                    id="offering"
                    step="0.01"
                    min="0"
                    value={formData.offering}
                    onChange={handleChange}
                    className="input-primary pl-7"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* Date and Week Container */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Week Number */}
              <div className="space-y-1">
                <label htmlFor="weekNumber" className="block text-sm font-medium text-gray-700 dark:text-dark-fg-secondary">
                  Week Number
                </label>
                <select
                  id="weekNumber"
                  name="weekNumber"
                  required
                  value={formData.weekNumber}
                  onChange={handleChange}
                  className="input-primary"
                >
                  {[1, 2, 3, 4, 5].map((week) => (
                    <option key={week} value={week}>
                      Week {week}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div className="space-y-1">
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-dark-fg-secondary">
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  id="date"
                  required
                  value={formData.date}
                  onChange={handleChange}
                  className="input-primary"
                />
              </div>
            </div>

            {/* Total Amount Display */}
            <div className="pt-4 border-t border-gray-200 dark:border-dark-border">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700 dark:text-dark-fg-secondary">
                  Total Amount:
                </span>
                <span className="text-lg font-semibold text-gray-900 dark:text-dark-fg-primary">
                  K {((parseFloat(formData.tithe) || 0) + (parseFloat(formData.offering) || 0)).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex justify-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  'Submit'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default FinancialForm; 