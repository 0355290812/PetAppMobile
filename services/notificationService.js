import {collection, query, where, orderBy, onSnapshot, doc, updateDoc, getDocs} from 'firebase/firestore';
import db from '@/config/firebase';

export const subscribeToNotifications = (userId, callback) => {
    console.log(userId);

    const notificationsRef = collection(db, 'notifications');
    const q = query(
        notificationsRef,
        where('userId', '==', userId),
        // orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
        const notifications = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date()
        }))
            .sort((a, b) => b.createdAt - a.createdAt);

        callback(notifications);
    });
};

export const markNotificationAsRead = async (notificationId) => {
    try {
        const notificationRef = doc(db, 'notifications', notificationId);
        await updateDoc(notificationRef, {
            isRead: true,
        });
        return true;
    } catch (error) {
        console.error('Error marking notification as read:', error);
        return false;
    }
};

export const markAllNotificationsAsRead = async (userId) => {
    try {
        const notificationsRef = collection(db, 'notifications');
        const q = query(
            notificationsRef,
            where('userId', '==', userId),
            where('isRead', '==', false)
        );

        const snapshot = await getDocs(q);
        const updatePromises = snapshot.docs.map(doc =>
            updateDoc(doc.ref, {
                isRead: true,
                readAt: new Date()
            })
        );

        await Promise.all(updatePromises);
        return true;
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        return false;
    }
};
