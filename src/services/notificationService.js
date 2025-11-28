import { firestore } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const createNotification = async (userId, type, title, message, orderId = null) => {
    try {
        const notificationsRef = collection(firestore, 'notifications');

        const notificationData = {
            userId,
            type,
            title,
            message,
            orderId,
            read: false,
            createdAt: serverTimestamp()
        };

        await addDoc(notificationsRef, notificationData);
        console.log('Notification created successfully');
    } catch (error) {
        console.error('Error creating notification:', error);
    }
};

export const notifyOrderStatusUpdate = async (order, newStatus) => {
    const { userId, orderNumber, shippingInfo } = order;
    const customerName = shippingInfo?.fullName || 'Customer';

    let title, message, type;

    switch (newStatus) {
        case 'cancelled':
            type = 'order_cancelled';
            title = 'Order Cancelled';
            message = `Your order #${orderNumber} has been cancelled.`;
            break;
        case 'confirmed':
            type = 'order_confirmed';
            title = 'Order Confirmed';
            message = `Your order #${orderNumber} has been confirmed and is being processed.`;
            break;
        case 'processing':
            type = 'order_processing';
            title = 'Order Processing';
            message = `Your order #${orderNumber} is now being processed.`;
            break;
        case 'shipped':
            type = 'order_shipped';
            title = 'Order Shipped!';
            message = `Great news! Your order #${orderNumber} has been shipped.`;
            break;
        case 'delivered':
            type = 'order_delivered';
            title = 'Order Delivered!';
            message = `Your order #${orderNumber} has been delivered. Thank you for shopping with us!`;
            break;
        default:
            type = 'order_update';
            title = 'Order Updated';
            message = `Your order #${orderNumber} status has been updated to ${newStatus}.`;
    }

    await createNotification(userId, type, title, message, order.id);
};

export const notifyAdminOrderUpdate = async (order, newStatus, adminName) => {
    try {
        // Get all admin users
        const usersRef = collection(firestore, 'users');
        const adminUsers = []; // You'll need to query users with role 'admin'

        // For each admin, create a notification
        for (const admin of adminUsers) {
            await createNotification(
                admin.id,
                'admin_order_update',
                `Order ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
                `Order #${order.orderNumber} for ${order.shippingInfo?.fullName} has been ${newStatus} by ${adminName}.`,
                order.id
            );
        }
    } catch (error) {
        console.error('Error notifying admins:', error);
    }
};