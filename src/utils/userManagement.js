import { doc, setDoc, getDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from './firebase';

// Available roles and their hierarchy
export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  VIEWER: 'viewer'
};

// Role permissions
export const ROLE_PERMISSIONS = {
  [USER_ROLES.ADMIN]: [
    'manage_users',
    'manage_roles',
    'manage_members',
    'manage_submissions',
    'view_reports',
    'export_data',
    'delete_records'
  ],
  [USER_ROLES.MANAGER]: [
    'manage_members',
    'manage_submissions',
    'view_reports',
    'export_data'
  ],
  [USER_ROLES.VIEWER]: [
    'view_members',
    'view_submissions',
    'view_reports'
  ]
};

// Create a new user with role
export const createUser = async (email, password, role = USER_ROLES.VIEWER) => {
  try {
    // Create auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      email: email,
      role: role,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      status: 'active'
    });

    // If role is admin, add to admins collection
    if (role === USER_ROLES.ADMIN) {
      await setDoc(doc(db, 'admins', user.uid), {
        email: email,
        createdAt: new Date().toISOString()
      });
    }

    return user;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

// Get user role and permissions
export const getUserRole = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    // Check if user is in admins collection
    const adminRef = doc(db, 'admins', userId);
    const adminDoc = await getDoc(adminRef);
    const isAdmin = adminDoc.exists();

    return {
      role: isAdmin ? 'admin' : (userDoc.data().role || 'viewer'),
      permissions: isAdmin ? ROLE_PERMISSIONS.ADMIN : ROLE_PERMISSIONS[userDoc.data().role || 'viewer']
    };
  } catch (error) {
    console.error('Error getting user role:', error);
    throw error;
  }
};

// Update user role
export const updateUserRole = async (userId, newRole) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const oldRole = userDoc.data().role;

    // Update user document
    await setDoc(userRef, {
      ...userDoc.data(),
      role: newRole,
      updatedAt: new Date().toISOString()
    });

    // Handle admin collection updates
    if (oldRole !== USER_ROLES.ADMIN && newRole === USER_ROLES.ADMIN) {
      // Add to admins collection
      await setDoc(doc(db, 'admins', userId), {
        email: userDoc.data().email,
        createdAt: new Date().toISOString()
      });
    } else if (oldRole === USER_ROLES.ADMIN && newRole !== USER_ROLES.ADMIN) {
      // Remove from admins collection
      await deleteDoc(doc(db, 'admins', userId));
    }

    return true;
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};

// Check if user is admin
export const isUserAdmin = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    return userDoc.exists() && userDoc.data().role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

// Get all users
export const getAllUsers = async () => {
  try {
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting users:', error);
    throw error;
  }
};

// Check if user has specific permission
export const hasPermission = async (userId, permission) => {
  try {
    const { permissions } = await getUserRole(userId);
    return permissions.includes(permission);
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}; 