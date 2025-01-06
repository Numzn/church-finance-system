import { useState, useEffect, useCallback } from 'react';
import { collection, addDoc, query, getDocs, doc, deleteDoc, updateDoc, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '../../utils/firebase';
import toast from 'react-hot-toast';
import Papa from 'papaparse';

const DEPARTMENTS = [
  'Worship',
  'Media',
  'Ushering',
  'Prayer',
  'Outreach',
  'None'
];

const SOCIAL_STATUS = [
  'Student',
  'Employed',
  'Self-Employed',
  'Unemployed',
  'Retired'
];

const MEMBERSHIP_STATUS = [
  'Active',
  'Inactive',
  'Pending'
];

const MARITAL_STATUS = [
  'Single',
  'Married',
  'Divorced',
  'Widowed'
];

const DEFAULT_MINISTRY_ROLES = [
  { value: '', label: 'None' },
  { value: 'senior_pastor', label: 'Senior Pastor' },
  { value: 'assistant_pastor', label: 'Assistant Pastor' },
  { value: 'youth_leader', label: 'Youth Ministry Leader' },
  { value: 'worship_leader', label: 'Worship Leader' },
  { value: 'sunday_school', label: 'Sunday School Leader' },
  { value: 'women_ministry', label: "Women's Ministry Leader" },
  { value: 'men_ministry', label: "Men's Ministry Leader" },
  { value: 'children_ministry', label: "Children's Ministry Leader" },
  { value: 'evangelism', label: 'Evangelism Leader' },
  { value: 'prayer_ministry', label: 'Prayer Ministry Leader' }
];

function Members() {
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    dateJoined: new Date().toISOString().split('T')[0],
    gender: '',
    department: 'None',
    membershipStatus: 'Active',
    maritalStatus: '',
    socialStatus: '',
    baptized: false,
  });
  const [saving, setSaving] = useState(false);
  const [leadershipRole, setLeadershipRole] = useState('');
  const [ministryRoles, setMinistryRoles] = useState(DEFAULT_MINISTRY_ROLES);
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [newRole, setNewRole] = useState({ value: '', label: '' });
  const [touched, setTouched] = useState({});

  const validateField = (name, value) => {
    if (!value && name !== 'email' && name !== 'address') {
      return false;
    }
    return true;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const allFields = Object.keys(formData);
    const touchedFields = allFields.reduce((acc, field) => ({
      ...acc,
      [field]: true
    }), {});
    setTouched(touchedFields);

    const invalidFields = allFields.filter(
      field => !validateField(field, formData[field])
    );

    if (invalidFields.length > 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);

    try {
      if (!auth.currentUser) {
        toast.error('You must be logged in to perform this action');
        return;
      }

      const memberData = {
        ...formData,
        leadershipRole,
        updatedAt: new Date(),
        updatedBy: auth.currentUser.uid
      };

      if (editingMember) {
        await updateDoc(doc(db, 'members', editingMember.id), memberData);
        toast.success('Member updated successfully');
      } else {
        memberData.createdAt = new Date();
        memberData.createdBy = auth.currentUser.uid;
        await addDoc(collection(db, 'members'), memberData);
        toast.success('Member added successfully');
      }

      setShowForm(false);
      resetForm();
      await fetchMembers();
    } catch (error) {
      console.error('Error saving member:', error);
      toast.error(error.message || 'Error saving member');
    } finally {
      setSaving(false);
    }
  };

  const generateCSVTemplate = () => {
    // Create template data with one empty row
    const templateData = [{
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      dateOfBirth: 'YYYY-MM-DD',
      dateJoined: 'YYYY-MM-DD',
      gender: 'Male/Female',
      department: DEPARTMENTS.join('/'),
      membershipStatus: MEMBERSHIP_STATUS.join('/'),
      maritalStatus: MARITAL_STATUS.join('/'),
      socialStatus: SOCIAL_STATUS.join('/'),
      baptized: 'true/false',
      leadershipRole: ministryRoles.map(role => role.label).join('/')
    }];

    // Convert to CSV
    const csv = Papa.unparse(templateData);
    
    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().split('T')[0];
    link.href = URL.createObjectURL(blob);
    link.download = `member_import_template_${timestamp}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    
    toast.success('Template downloaded successfully');
  };

  const handleCSVUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Show confirmation dialog for template download
    const wantTemplate = window.confirm('Would you like to download a new template before importing?');
    if (wantTemplate) {
      generateCSVTemplate();
      event.target.value = ''; // Clear the file input
      return;
    }

    setLoading(true);
    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        const members = results.data;
        let successCount = 0;
        let errorCount = 0;

        try {
          for (const member of members) {
            try {
              // Skip empty rows
              if (!member.firstName || !member.lastName) continue;

              // Convert baptized string to boolean
              const baptized = member.baptized?.toLowerCase() === 'true';

              // Find leadership role value from label
              const leadershipRole = ministryRoles.find(
                role => role.label === member.leadershipRole
              )?.value || '';

              // Process the member data
              const processedMember = {
                ...member,
                baptized,
                leadershipRole,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: auth.currentUser?.uid || 'unknown'
              };

              await addDoc(collection(db, 'members'), processedMember);
              successCount++;
            } catch (error) {
              console.error('Error adding member from CSV:', error);
              errorCount++;
            }
          }

          if (successCount > 0) {
            toast.success(`Successfully imported ${successCount} members`);
            await fetchMembers();
          }
          
          if (errorCount > 0) {
            toast.error(`Failed to import ${errorCount} members`);
          }
        } catch (error) {
          console.error('Error processing CSV:', error);
          toast.error('Error processing CSV file');
        } finally {
          setLoading(false);
          event.target.value = ''; // Clear the file input
        }
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
        toast.error('Error parsing CSV file');
        setLoading(false);
        event.target.value = ''; // Clear the file input
      }
    });
  };

  const handleEdit = (member) => {
    setFormData({
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email || '',
      phone: member.phone || '',
      address: member.address || '',
      dateOfBirth: member.dateOfBirth || '',
      dateJoined: member.dateJoined || new Date().toISOString().split('T')[0],
      gender: member.gender || '',
      department: member.department || 'None',
      membershipStatus: member.membershipStatus || 'Active',
      maritalStatus: member.maritalStatus || '',
      socialStatus: member.socialStatus || '',
      baptized: member.baptized || false,
    });
    setLeadershipRole(member.leadershipRole || '');
    setEditingMember(member);
    setShowForm(true);
  };

  const handleDelete = async (memberId) => {
    if (window.confirm('Are you sure you want to delete this member?')) {
      setLoading(true);
      try {
        await deleteDoc(doc(db, 'members', memberId));
        toast.success('Member deleted successfully');
        await fetchMembers();
      } catch (error) {
        console.error('Error deleting member:', error);
        toast.error('Error deleting member');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAddRole = () => {
    if (!newRole.label.trim()) {
      toast.error('Please enter a role name');
      return;
    }

    // Create a value from the label (lowercase, replace spaces with underscores)
    const value = newRole.label.toLowerCase().replace(/\s+/g, '_');

    // Check if role already exists
    if (ministryRoles.some(role => role.value === value)) {
      toast.error('This role already exists');
      return;
    }

    setMinistryRoles(prev => [...prev, { value, label: newRole.label }]);
    setNewRole({ value: '', label: '' });
    setShowAddRoleModal(false);
    toast.success('New role added successfully');
  };

  const handleRemoveRole = (roleValue) => {
    // Don't allow removing the 'None' option
    if (roleValue === '') {
      toast.error('Cannot remove the default role');
      return;
    }

    setMinistryRoles(prev => prev.filter(role => role.value !== roleValue));
    toast.success('Role removed successfully');
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      dateOfBirth: '',
      dateJoined: new Date().toISOString().split('T')[0],
      gender: '',
      department: 'None',
      membershipStatus: 'Active',
      maritalStatus: '',
      socialStatus: '',
      baptized: false,
    });
    setLeadershipRole('');
    setEditingMember(null);
    setTouched({});
  };

  const getInputClassName = (name) => {
    const baseClass = "mt-1 block w-full rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-dark-bg-primary dark:text-dark-fg-primary";
    const isInvalid = touched[name] && !validateField(name, formData[name]);
    const borderClass = isInvalid 
      ? "border-red-300 dark:border-red-700" 
      : "border-gray-300 dark:border-dark-border";
    return `${baseClass} ${borderClass}`;
  };

  const fetchMembers = useCallback(async () => {
    try {
      const membersRef = collection(db, 'members');
      let membersList = [];
      
      try {
        const q = query(
          membersRef,
          orderBy('lastName'),
          orderBy('firstName'),
          limit(50)
        );
        const querySnapshot = await getDocs(q);
        membersList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } catch (indexError) {
        if (indexError.code === 'failed-precondition') {
          console.log('Index not found, falling back to simple query');
          const q = query(membersRef, orderBy('lastName'), limit(50));
          const querySnapshot = await getDocs(q);
          membersList = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
        } else {
          throw indexError;
        }
      }
      
      setMembers(membersList);
    } catch (error) {
      console.error('Error fetching members:', error);
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleError = (error) => {
    console.error('Operation error:', error);
    if (error.code === 'permission-denied') {
      toast.error('Permission denied. Please make sure you have the right permissions.');
    } else if (error.code === 'not-found') {
      toast.error('Database not found. Please make sure the Firestore database is created.');
    } else {
      toast.error(error.message || 'An error occurred');
    }
  };

  const calculateAge = (dateOfBirth) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  if (loading && members.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Members</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all church members including their name, email, and contact information.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none space-x-4">
          <input
            type="file"
            accept=".csv"
            onChange={handleCSVUpload}
            className="hidden"
            id="csvUpload"
          />
          <button
            type="button"
            onClick={generateCSVTemplate}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 sm:w-auto"
          >
            Download Template
          </button>
          <label
            htmlFor="csvUpload"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 sm:w-auto cursor-pointer"
          >
            Import CSV
          </label>
          <button
            type="button"
            onClick={() => {
              setShowForm(true);
              resetForm();
            }}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:w-auto"
          >
            Add member
          </button>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-dark-bg-secondary rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-medium mb-4 text-gray-900 dark:text-dark-fg-primary">
              {editingMember ? 'Edit Member' : 'Add New Member'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-dark-fg-secondary">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    id="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    onBlur={() => setTouched(prev => ({ ...prev, firstName: true }))}
                    className={getInputClassName('firstName')}
                  />
                  {touched.firstName && !validateField('firstName', formData.firstName) && (
                    <p className="mt-1 text-sm text-red-600">First name is required</p>
                  )}
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-dark-fg-secondary">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    id="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    onBlur={() => setTouched(prev => ({ ...prev, lastName: true }))}
                    className={getInputClassName('lastName')}
                  />
                  {touched.lastName && !validateField('lastName', formData.lastName) && (
                    <p className="mt-1 text-sm text-red-600">Last name is required</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-dark-fg-secondary">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                    className={getInputClassName('email')}
                  />
                  {touched.email && !validateField('email', formData.email) && (
                    <p className="mt-1 text-sm text-red-600">Email is required</p>
                  )}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-dark-fg-secondary">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    id="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    onBlur={() => setTouched(prev => ({ ...prev, phone: true }))}
                    className={getInputClassName('phone')}
                  />
                  {touched.phone && !validateField('phone', formData.phone) && (
                    <p className="mt-1 text-sm text-red-600">Phone is required</p>
                  )}
                </div>

                <div>
                  <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 dark:text-dark-fg-secondary">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    id="dateOfBirth"
                    required
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    onBlur={() => setTouched(prev => ({ ...prev, dateOfBirth: true }))}
                    className={getInputClassName('dateOfBirth')}
                  />
                  {touched.dateOfBirth && !validateField('dateOfBirth', formData.dateOfBirth) && (
                    <p className="mt-1 text-sm text-red-600">Date of birth is required</p>
                  )}
                </div>

                <div>
                  <label htmlFor="dateJoined" className="block text-sm font-medium text-gray-700 dark:text-dark-fg-secondary">
                    Date Joined <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="dateJoined"
                    id="dateJoined"
                    required
                    value={formData.dateJoined}
                    onChange={handleChange}
                    onBlur={() => setTouched(prev => ({ ...prev, dateJoined: true }))}
                    className={getInputClassName('dateJoined')}
                  />
                  {touched.dateJoined && !validateField('dateJoined', formData.dateJoined) && (
                    <p className="mt-1 text-sm text-red-600">Date joined is required</p>
                  )}
                </div>

                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-dark-fg-secondary">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="gender"
                    id="gender"
                    required
                    value={formData.gender}
                    onChange={handleChange}
                    onBlur={() => setTouched(prev => ({ ...prev, gender: true }))}
                    className={getInputClassName('gender')}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                  {touched.gender && !validateField('gender', formData.gender) && (
                    <p className="mt-1 text-sm text-red-600">Gender is required</p>
                  )}
                </div>

                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-gray-700 dark:text-dark-fg-secondary">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="department"
                    id="department"
                    value={formData.department}
                    onChange={handleChange}
                    onBlur={() => setTouched(prev => ({ ...prev, department: true }))}
                    className={getInputClassName('department')}
                  >
                    {DEPARTMENTS.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                  {touched.department && !validateField('department', formData.department) && (
                    <p className="mt-1 text-sm text-red-600">Department is required</p>
                  )}
                </div>

                <div>
                  <label htmlFor="maritalStatus" className="block text-sm font-medium text-gray-700 dark:text-dark-fg-secondary">
                    Marital Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="maritalStatus"
                    id="maritalStatus"
                    required
                    value={formData.maritalStatus}
                    onChange={handleChange}
                    onBlur={() => setTouched(prev => ({ ...prev, maritalStatus: true }))}
                    className={getInputClassName('maritalStatus')}
                  >
                    <option value="">Select Marital Status</option>
                    {MARITAL_STATUS.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                  {touched.maritalStatus && !validateField('maritalStatus', formData.maritalStatus) && (
                    <p className="mt-1 text-sm text-red-600">Marital status is required</p>
                  )}
                </div>

                <div>
                  <label htmlFor="socialStatus" className="block text-sm font-medium text-gray-700 dark:text-dark-fg-secondary">
                    Social Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="socialStatus"
                    id="socialStatus"
                    value={formData.socialStatus}
                    onChange={handleChange}
                    onBlur={() => setTouched(prev => ({ ...prev, socialStatus: true }))}
                    className={getInputClassName('socialStatus')}
                  >
                    <option value="">Select Social Status</option>
                    {SOCIAL_STATUS.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                  {touched.socialStatus && !validateField('socialStatus', formData.socialStatus) && (
                    <p className="mt-1 text-sm text-red-600">Social status is required</p>
                  )}
                </div>

                <div>
                  <label htmlFor="membershipStatus" className="block text-sm font-medium text-gray-700 dark:text-dark-fg-secondary">
                    Membership Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="membershipStatus"
                    id="membershipStatus"
                    value={formData.membershipStatus}
                    onChange={handleChange}
                    onBlur={() => setTouched(prev => ({ ...prev, membershipStatus: true }))}
                    className={getInputClassName('membershipStatus')}
                  >
                    {MEMBERSHIP_STATUS.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                  {touched.membershipStatus && !validateField('membershipStatus', formData.membershipStatus) && (
                    <p className="mt-1 text-sm text-red-600">Membership status is required</p>
                  )}
                </div>

                <div className="flex items-center mt-4">
                  <input
                    type="checkbox"
                    name="baptized"
                    id="baptized"
                    checked={formData.baptized}
                    onChange={(e) => handleChange({
                      target: {
                        name: 'baptized',
                        value: e.target.checked
                      }
                    })}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="baptized" className="ml-2 block text-sm text-gray-700 dark:text-dark-fg-secondary">
                    Baptized
                  </label>
                </div>

                <div className="col-span-2">
                  <div className="flex justify-between items-center mb-1">
                    <label htmlFor="leadershipRole" className="block text-sm font-medium text-gray-700 dark:text-dark-fg-alt">
                      Leadership Role
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowAddRoleModal(true)}
                      className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                    >
                      Manage Roles
                    </button>
                  </div>
                  <select
                    id="leadershipRole"
                    name="leadershipRole"
                    value={leadershipRole}
                    onChange={(e) => setLeadershipRole(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-dark-border shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-dark-bg-primary dark:text-dark-fg-primary"
                  >
                    {ministryRoles.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-sm text-gray-500 dark:text-dark-fg-alt">
                    Select a leadership role if this member holds a position in the church
                  </p>
                </div>
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-dark-fg-secondary">
                  Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="address"
                  id="address"
                  rows={3}
                  value={formData.address}
                  onChange={handleChange}
                  onBlur={() => setTouched(prev => ({ ...prev, address: true }))}
                  className={getInputClassName('address')}
                />
                {touched.address && !validateField('address', formData.address) && (
                  <p className="mt-1 text-sm text-red-600">Address is required</p>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn-secondary"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddRoleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-dark-bg-secondary rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 dark:text-dark-fg-primary mb-4">
              Manage Leadership Roles
            </h3>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-fg-alt mb-2">
                Add New Role
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newRole.label}
                  onChange={(e) => setNewRole({ ...newRole, label: e.target.value })}
                  placeholder="Enter role name"
                  className="flex-1 rounded-md border-gray-300 dark:border-dark-border shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-dark-bg-primary dark:text-dark-fg-primary"
                />
                <button
                  type="button"
                  onClick={handleAddRole}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-800"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-fg-alt mb-2">
                Existing Roles
              </label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {ministryRoles.map((role) => (
                  role.value !== '' && (
                    <div key={role.value} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-dark-bg-alt rounded">
                      <span className="text-sm text-gray-900 dark:text-dark-fg-primary">{role.label}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveRole(role.value)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Remove
                      </button>
                    </div>
                  )
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowAddRoleModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-dark-fg-alt bg-white dark:bg-dark-bg-primary border border-gray-300 dark:border-dark-border rounded-md hover:bg-gray-50 dark:hover:bg-dark-bg-alt focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50 dark:bg-dark-bg-secondary">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-dark-fg-primary sm:pl-6">
                      Name
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-dark-fg-primary">
                      Contact
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-dark-fg-primary">
                      Department
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-dark-fg-primary">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-dark-fg-primary">
                      Leadership Role
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white dark:bg-dark-bg-primary">
                  {members.map((member) => (
                    <tr key={member.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                        <div className="flex items-center">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-dark-fg-primary">
                              {member.firstName} {member.lastName}
                            </div>
                            <div className="text-gray-500 dark:text-dark-fg-alt">
                              {member.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-dark-fg-alt">
                        <div>{member.phone}</div>
                        <div className="text-gray-500 dark:text-dark-fg-alt">{member.address}</div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-dark-fg-alt">
                        {member.department}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          member.membershipStatus === 'Active'
                            ? 'bg-green-100 text-green-800'
                            : member.membershipStatus === 'Inactive'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {member.membershipStatus}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-dark-fg-alt">
                        {ministryRoles.find(role => role.value === member.leadershipRole)?.label || 'None'}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <button
                          onClick={() => handleEdit(member)}
                          className="text-primary-600 hover:text-primary-900 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(member.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Members; 