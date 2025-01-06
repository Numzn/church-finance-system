import React, { useState, useEffect } from 'react';
import emailjs from '@emailjs/browser';
import { collection, getDocs, onSnapshot, query, where, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import toast from 'react-hot-toast';
import { EnvelopeIcon, BellIcon } from '@heroicons/react/24/outline';

const BroadcastEmail = () => {
  const [members, setMembers] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [lastEmailSent, setLastEmailSent] = useState(0);
  const RATE_LIMIT_DELAY = 1000; // 1 second between emails

  // Listen for email replies
  useEffect(() => {
    const q = query(
      collection(db, 'emailReplies'),
      where('read', '==', false),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newNotifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setNotifications(newNotifications);
      setUnreadCount(newNotifications.length);
    });

    return () => unsubscribe();
  }, []);

  // Initialize EmailJS with your public key
  useEffect(() => {
    try {
  emailjs.init("fFctA0gcbCZCd26xp");
      console.log("EmailJS initialized successfully");
    } catch (error) {
      console.error("EmailJS initialization error:", error);
      toast.error("Failed to initialize email system");
    }
  }, []);

  // Fetch members from Firestore
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'members'));
        const membersList = querySnapshot.docs.map(doc => {
          const data = doc.data();
          
          // Construct full name from firstName and lastName
          const fullName = data.firstName && data.lastName 
            ? `${data.firstName} ${data.lastName}`.trim()
            : 'Unknown Member';
          
          // Ensure all required fields are present
          const member = {
          id: doc.id,
            ...data,
            name: fullName,
            email: data.email,
            age: data.age || 0,
            gender: (data.gender || '').toLowerCase()
          };

          console.log('Processed member data:', member);
          return member;
        });
        setMembers(membersList);
      } catch (error) {
        console.error('Error fetching members:', error);
        toast.error('Failed to fetch members');
      }
    };

    fetchMembers();
  }, []);

  // Filter members based on category
  const getFilteredMembers = () => {
    console.log('Current members:', members);
    console.log('Selected category:', selectedCategory);

    if (selectedCategory === 'all') return members;

    return members.filter(member => {
      // Debug log for each member
      console.log('Filtering member:', {
        name: member.name,
        gender: member.gender,
        age: member.age
      });

      // Make sure we handle undefined/null values
      const age = parseInt(member.age) || 0;
      const gender = (member.gender || '').toLowerCase();

      switch (selectedCategory) {
        case 'men':
          return gender === 'male' && age >= 25;
        case 'women':
          return gender === 'female' && age >= 25;
        case 'youth':
          return age >= 16 && age <= 30;
        case 'children':
          return age < 15;
        default:
          return true;
      }
    });
  };

  // Enhanced email sending function with detailed error handling
  const sendEmailWithRetry = async (member, retryCount = 0) => {
    const MAX_RETRIES = 3;
    const now = Date.now();
    
    // Check rate limiting
    if (now - lastEmailSent < RATE_LIMIT_DELAY) {
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
    }

    try {
      if (!member.firstName || !member.lastName || !member.email) {
        throw new Error(`Invalid member data: Missing required fields`);
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(member.email)) {
        throw new Error(`Invalid email format: ${member.email}`);
      }

      const templateParams = {
        to_name: `${member.firstName} ${member.lastName}`,
        from_name: "Church Finance Department",
        email_subject: subject,
        message: message,
        organization_name: "L.H.G-BIGOCA",
        to_email: member.email,
        reply_to: "bigocalhg@gmail.com"
      };

      console.log('Sending email with params:', templateParams);

      const response = await emailjs.send(
        "service_church_finance", // Update this with your actual service ID
        "template_q64xn9r",
        templateParams,
        "fFctA0gcbCZCd26xp"
      );

      console.log("Email sent successfully:", {
        to: member.email,
        response: response
      });

      setLastEmailSent(Date.now());
      return true;
    } catch (error) {
      const errorDetails = {
        error: error.message,
        code: error.code,
        status: error.status,
        text: error.text,
        member: member.email,
        attempt: retryCount + 1
      };
      
      console.error('Error sending email:', errorDetails);

      // Handle specific EmailJS errors
      if (error.status === 400) {
        toast.error("Email configuration error. Please check service and template IDs.");
        throw new Error("Email configuration error");
      }

      if (error.status === 401 || error.status === 403) {
        toast.error("Email service authentication failed. Please check your API keys.");
        throw new Error("Authentication failed");
      }
      
      if (error.status === 429) {
        const retryAfter = parseInt(error.headers?.get('retry-after') || '5');
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        return sendEmailWithRetry(member, retryCount);
      }

      if (retryCount < MAX_RETRIES && error.status !== 401 && error.status !== 403) {
        const delay = Math.pow(2, retryCount) * 1000;
        console.log(`Retrying after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return sendEmailWithRetry(member, retryCount + 1);
      }

      throw error;
    }
  };

  // Modified handleSubmit function
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!subject.trim() || !message.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    const filteredMembers = getFilteredMembers();
    if (filteredMembers.length === 0) {
      toast.error('No members found in selected category');
      return;
    }

    setSending(true);
    setStatus('Preparing to send emails...');
    let successCount = 0;
    let failCount = 0;
    let failedEmails = [];

    try {
      for (const member of filteredMembers) {
        try {
          setStatus(`Sending email to ${member.email}...`);
          await sendEmailWithRetry(member);
          successCount++;
          setStatus(`Sent ${successCount} of ${filteredMembers.length} emails...`);
        } catch (error) {
          console.error('Failed to send email after retries:', {
            email: member.email,
            error: error.message
          });
          failCount++;
          failedEmails.push(member.email);
          toast.error(`Failed to send email to ${member.email}`);
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully sent ${successCount} emails`);
      }
      
      if (failCount > 0) {
        console.error('Failed emails:', failedEmails);
        setStatus(`Completed with errors: ${successCount} sent, ${failCount} failed`);
        toast.error(`Failed to send ${failCount} emails. Check console for details.`);
      } else {
        setStatus(`Successfully sent all ${successCount} emails`);
      }
    } catch (error) {
      console.error('Error in email broadcast:', error);
      toast.error('Failed to complete email broadcast');
    } finally {
      setSending(false);
    }
  };

  const handleNotificationClick = async (notificationId) => {
    try {
      await updateDoc(doc(db, 'emailReplies', notificationId), {
        read: true
      });
      toast.success('Marked as read');
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark as read');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white/60 dark:bg-dark-bg-secondary backdrop-blur-sm rounded-lg shadow-lg p-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
          <div className="rounded-md bg-primary-500 p-3 mr-4">
            <EnvelopeIcon className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-dark-fg">Broadcast Email</h2>
          </div>
          
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-600 hover:text-gray-900 dark:text-dark-fg-alt dark:hover:text-dark-fg"
            >
              <BellIcon className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 -mt-1 -mr-1 px-2 py-1 text-xs font-bold text-white bg-red-500 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && notifications.length > 0 && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-dark-bg-secondary rounded-lg shadow-lg z-50">
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-4">Email Replies</h3>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {notifications.map(notification => (
                      <div 
                        key={notification.id} 
                        className="p-3 bg-gray-50 dark:bg-dark-bg rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-bg-alt"
                        onClick={() => handleNotificationClick(notification.id)}
                      >
                        <p className="font-medium">{notification.from}</p>
                        <p className="text-sm text-gray-600 dark:text-dark-fg-alt">{notification.subject}</p>
                        <p className="text-sm text-gray-600 dark:text-dark-fg-alt mt-1">{notification.message}</p>
                        <p className="text-xs text-gray-500 dark:text-dark-fg-alt mt-1">
                          {new Date(notification.timestamp?.toDate()).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-fg-alt mb-2">
                Select Category
              </label>
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2.5 text-base border border-gray-300 dark:border-dark-border rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-bg dark:text-dark-fg text-gray-900 sm:text-sm"
                >
                  <option value="all">All Members</option>
                  <option value="men">Men</option>
                  <option value="women">Women</option>
                  <option value="youth">Youth</option>
                  <option value="children">Children</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-fg-alt mb-2">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="block w-full px-3 py-2.5 border border-gray-300 dark:border-dark-border rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-bg dark:text-dark-fg text-gray-900 sm:text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-fg-alt mb-2">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                className="block w-full px-3 py-2.5 border border-gray-300 dark:border-dark-border rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-bg dark:text-dark-fg text-gray-900 sm:text-sm"
                required
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={sending}
              className={`w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                sending ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {sending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </>
              ) : (
                'Send Broadcast'
              )}
            </button>
          </div>

          {status && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-md">
              <p className="text-sm text-gray-700 dark:text-dark-fg">{status}</p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default BroadcastEmail; 