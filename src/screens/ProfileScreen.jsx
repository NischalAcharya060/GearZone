import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,
    ScrollView,
    Alert,
    ActivityIndicator,
    Modal,
    FlatList,
    SafeAreaView,
    StatusBar,
    Vibration,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { firestore, storage, auth } from '../firebase/config';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';

const PRIMARY_COLOR = '#1D4ED8';
const ACCENT_COLOR = '#34D399';
const TEXT_COLOR = '#1F2937';
const SUB_TEXT_COLOR = '#6B7280';
const BORDER_COLOR = '#E5E7EB';
const BG_COLOR = '#F9FAFB';

const getPasswordStrength = (password) => {
    let strength = 0;
    const checks = [
        /(?=.*[a-z])/,
        /(?=.*[A-Z])/,
        /(?=.*\d)/,
        /(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/
    ];

    if (password.length >= 8) strength += 1;

    checks.forEach(regex => {
        if (regex.test(password)) {
            strength += 1;
        }
    });

    if (password.length > 12) strength += 1;

    if (strength <= 1) return { status: 'Weak', color: '#EF4444', score: 1 };
    if (strength <= 3) return { status: 'Fair', color: '#F59E0B', score: 2 };
    if (strength <= 5) return { status: 'Good', color: '#3B82F6', score: 3 };
    return { status: 'Strong', color: ACCENT_COLOR, score: 4 };
};

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return 'N/A';
    }
};

const PasswordStrengthIndicator = React.memo(({ strength }) => (
    <View style={styles.strengthContainer}>
        <Text style={styles.strengthLabel}>Strength:</Text>
        <View style={styles.strengthBarContainer}>
            {[1, 2, 3, 4].map(score => (
                <View
                    key={score}
                    style={[
                        styles.strengthBarSegment,
                        { backgroundColor: score <= strength.score ? strength.color : BORDER_COLOR },
                        score === 4 && { borderTopRightRadius: 8, borderBottomRightRadius: 8 },
                    ]}
                />
            ))}
        </View>
        <Text style={[styles.strengthStatus, { color: strength.color }]}>{strength.status}</Text>
    </View>
));

const CustomInputField = React.memo(({
                                         label,
                                         field,
                                         placeholder,
                                         keyboardType = 'default',
                                         autoCapitalize = 'sentences',
                                         secureTextEntry = false,
                                         icon,
                                         isEditable = true,
                                         value,
                                         onChangeText,
                                         isPassword,
                                         passwordStrength,
                                         showPassword,
                                         handleTogglePassword,
                                     }) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <View style={styles.inputGroup}>
            <Text style={styles.label}>{label}</Text>
            <View style={[
                styles.inputContainer,
                !isEditable && styles.inputDisabledContainer,
                isFocused && styles.inputFocused,
            ]}>
                <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={SUB_TEXT_COLOR + '80'}
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
                    editable={isEditable}
                    secureTextEntry={isPassword ? !showPassword : secureTextEntry}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                />
                {(icon && !isEditable) && (
                    <Ionicons name={icon} size={20} color={SUB_TEXT_COLOR} style={styles.inputIcon} />
                )}
                {isPassword && (
                    <TouchableOpacity onPress={handleTogglePassword} style={styles.passwordToggle}>
                        <Ionicons
                            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                            size={20}
                            color={SUB_TEXT_COLOR}
                        />
                    </TouchableOpacity>
                )}
            </View>
            {field === 'newPassword' && value?.length > 0 && (
                <PasswordStrengthIndicator strength={passwordStrength} />
            )}
        </View>
    );
});

const InfoItem = React.memo(({ label, value, valueColor = TEXT_COLOR }) => (
    <View style={styles.infoItem}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, { color: valueColor }]}>
            {value}
        </Text>
    </View>
));

const ProfileScreen = () => {
    const { user, updateUserProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [editing, setEditing] = useState(false);
    const [showAvatarModal, setShowAvatarModal] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [userData, setUserData] = useState(null);

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [formData, setFormData] = useState({
        displayName: '',
        email: '',
        phone: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const passwordStrength = useMemo(() =>
        getPasswordStrength(formData.newPassword), [formData.newPassword]
    );

    const avatarOptions = [
        { id: '1', uri: 'https://i.postimg.cc/hvzjr5hT/Image.jpg' },
        { id: '2', uri: 'https://i.postimg.cc/nh8CXqkL/1.png' },
        { id: '3', uri: 'https://i.postimg.cc/rw6KD5JV/2.png' },
        { id: '4', uri: 'https://i.postimg.cc/52c6X83b/3.png' },
        { id: '5', uri: 'https://i.postimg.cc/BnWXj2gf/4.png' },
        { id: '6', uri: 'https://i.postimg.cc/T38pKncz/5.png' },
        { id: '7', uri: 'https://i.postimg.cc/0ygbz7fs/6.png' },
    ];

    useEffect(() => {
        if (user) {
            loadUserData();
        }
    }, [user]);

    const loadUserData = async () => {
        if (!user || !user.uid) return;
        try {
            const userDoc = await getDoc(doc(firestore, 'users', user.uid));
            if (userDoc.exists()) {
                const data = userDoc.data();
                setUserData(data);
                setFormData({
                    displayName: data.displayName || user.displayName || data.fullName || '',
                    email: user.email || '',
                    phone: data.phone || '',
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                });
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleUpdateProfile = async () => {
        if (!formData.displayName.trim()) {
            Alert.alert('Error', 'Please enter your name');
            return;
        }

        setLoading(true);
        Vibration.vibrate(50);
        try {
            const displayNameUpdate = formData.displayName.trim();
            const phoneUpdate = formData.phone.trim();

            const updates = {
                displayName: displayNameUpdate,
            };

            if (displayNameUpdate !== user.displayName) {
                await updateUserProfile(updates);
            }

            await updateDoc(doc(firestore, 'users', user.uid), {
                fullName: displayNameUpdate,
                phone: phoneUpdate,
                updatedAt: new Date().toISOString(),
            });

            if (formData.email !== user.email) {
                console.warn("Email change is complex and requires re-auth. Skipping for this simplified update.");
            }

            Alert.alert('Success', 'Profile updated successfully!');
            setEditing(false);
        } catch (error) {
            console.error('Error updating profile:', error);
            Alert.alert('Error', error.message || 'Failed to update profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
            Alert.alert('Error', 'Please fill in all password fields.');
            return;
        }

        if (formData.newPassword.length < 6) {
            Alert.alert('Error', 'New password must be at least 6 characters long.');
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            Alert.alert('Error', 'New passwords do not match.');
            return;
        }

        if (passwordStrength.score < 2) {
            Alert.alert('Warning', 'Your new password is too weak. Please choose a stronger one.');
            return;
        }

        setLoading(true);
        Vibration.vibrate(50);
        try {
            const credential = EmailAuthProvider.credential(
                user.email,
                formData.currentPassword
            );

            await reauthenticateWithCredential(auth.currentUser, credential);

            await updatePassword(auth.currentUser, formData.newPassword);

            Alert.alert('Success', 'Password updated successfully!');
            setFormData(prev => ({
                ...prev,
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            }));

        } catch (error) {
            console.error('Error changing password:', error);
            if (error.code === 'auth/wrong-password') {
                Alert.alert('Error', 'Incorrect current password. Please try again.');
            } else {
                Alert.alert('Error', error.message || 'Failed to change password. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const uploadImage = async (uri) => {
        setUploading(true);
        try {
            const response = await fetch(uri);
            const blob = await response.blob();

            const storageRef = ref(storage, `avatars/${user.uid}/${Date.now()}`);
            const snapshot = await uploadBytes(storageRef, blob);
            const downloadURL = await getDownloadURL(snapshot.ref);

            await updateDoc(doc(firestore, 'users', user.uid), {
                photoURL: downloadURL,
                updatedAt: new Date().toISOString(),
            });

            await updateUserProfile({
                photoURL: downloadURL,
            });

            Alert.alert('Success', 'Profile picture updated successfully!');
            setShowAvatarModal(false);
        } catch (error) {
            console.error('Error uploading image:', error);
            Alert.alert('Error', 'Failed to upload image. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const selectAvatar = async (avatarUri) => {
        setUploading(true);
        try {
            await updateDoc(doc(firestore, 'users', user.uid), {
                photoURL: avatarUri,
                updatedAt: new Date().toISOString(),
            });

            await updateUserProfile({
                photoURL: avatarUri,
            });

            setShowAvatarModal(false);
            Vibration.vibrate(50);
            Alert.alert('Success', 'Profile picture updated successfully!');
        } catch (error) {
            console.error('Error selecting avatar:', error);
            Alert.alert('Error', 'Failed to update profile picture. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const AvatarModal = () => (
        <Modal
            visible={showAvatarModal}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowAvatarModal(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Choose Avatar</Text>
                        <TouchableOpacity
                            onPress={() => setShowAvatarModal(false)}
                            style={styles.closeButton}
                        >
                            <Ionicons name="close" size={24} color={TEXT_COLOR} />
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={avatarOptions}
                        numColumns={4}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.avatarGrid}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.avatarOption}
                                onPress={() => selectAvatar(item.uri)}
                                disabled={uploading}
                            >
                                <Image
                                    source={{ uri: item.uri }}
                                    style={styles.avatarImage}
                                />
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </View>
        </Modal>
    );

    const handleToggleCurrentPassword = () => setShowCurrentPassword(p => !p);
    const handleToggleNewPassword = () => setShowNewPassword(p => !p);
    const handleToggleConfirmPassword = () => setShowConfirmPassword(p => !p);

    if (!user) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
                <View style={styles.notSignedIn}>
                    <Ionicons name="lock-closed-outline" size={80} color={BORDER_COLOR} />
                    <Text style={styles.notSignedInTitle}>Access Denied</Text>
                    <Text style={styles.notSignedInText}>
                        Please **sign in** to view and edit your profile information.
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            <AvatarModal />

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25}
            >
                <ScrollView
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="always"
                >
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>My Profile</Text>
                        <TouchableOpacity
                            onPress={() => setEditing(!editing)}
                            style={[styles.editButton, editing && styles.cancelButton]}
                        >
                            <Ionicons name={editing ? 'close-circle-outline' : 'create-outline'} size={20} color={editing ? TEXT_COLOR : PRIMARY_COLOR} />
                            <Text style={[styles.editButtonText, { color: editing ? TEXT_COLOR : PRIMARY_COLOR }]}>
                                {editing ? 'Cancel Edit' : 'Edit Profile'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {editing && (
                        <View style={styles.editingBanner}>
                            <Ionicons name="alert-circle-outline" size={18} color={PRIMARY_COLOR} />
                            <Text style={styles.editingBannerText}>You are currently editing your profile.</Text>
                        </View>
                    )}

                    <View style={styles.photoSection}>
                        <View style={styles.photoContainer}>
                            <Image
                                source={{
                                    uri: user.photoURL || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
                                }}
                                style={styles.profilePhoto}
                            />
                            <TouchableOpacity
                                style={styles.changePhotoButton}
                                onPress={() => setShowAvatarModal(true)}
                                disabled={uploading}
                            >
                                {uploading ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Ionicons name="camera" size={20} color="#FFFFFF" />
                                )}
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.userName}>
                            {user.displayName || userData?.fullName || 'User'}
                        </Text>
                        <Text style={styles.userEmail}>{user.email}</Text>
                        {userData?.role && (
                            <View style={styles.roleBadge}>
                                <Text style={styles.roleText}>
                                    {userData.role.charAt(0).toUpperCase() + userData.role.slice(1)}
                                </Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Personal Information</Text>

                        <CustomInputField
                            label="Full Name"
                            field="displayName"
                            placeholder="Enter your full name"
                            isEditable={editing}
                            icon="person-outline"
                            value={formData.displayName}
                            onChangeText={(text) => handleInputChange('displayName', text)}
                        />

                        <CustomInputField
                            label="Email Address"
                            field="email"
                            placeholder="Enter your email"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            isEditable={false}
                            icon="mail-outline"
                            value={formData.email}
                            onChangeText={(text) => handleInputChange('email', text)}
                        />

                        <CustomInputField
                            label="Phone Number"
                            field="phone"
                            placeholder="Enter your phone number"
                            keyboardType="phone-pad"
                            isEditable={editing}
                            icon="call-outline"
                            value={formData.phone}
                            onChangeText={(text) => handleInputChange('phone', text)}
                        />

                        {editing && (
                            <TouchableOpacity
                                style={[styles.actionButton, loading && styles.actionButtonDisabled]}
                                onPress={handleUpdateProfile}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.actionButtonText}>Save Profile Changes</Text>
                                )}
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Security Settings</Text>

                        <CustomInputField
                            label="Current Password"
                            field="currentPassword"
                            placeholder="Enter current password"
                            isPassword
                            value={formData.currentPassword}
                            onChangeText={(text) => handleInputChange('currentPassword', text)}
                            showPassword={showCurrentPassword}
                            handleTogglePassword={handleToggleCurrentPassword}
                        />

                        <CustomInputField
                            label="New Password"
                            field="newPassword"
                            placeholder="Enter new password (min 6 characters)"
                            isPassword
                            value={formData.newPassword}
                            onChangeText={(text) => handleInputChange('newPassword', text)}
                            showPassword={showNewPassword}
                            handleTogglePassword={handleToggleNewPassword}
                            passwordStrength={passwordStrength}
                        />

                        <CustomInputField
                            label="Confirm New Password"
                            field="confirmPassword"
                            placeholder="Confirm new password"
                            isPassword
                            value={formData.confirmPassword}
                            onChangeText={(text) => handleInputChange('confirmPassword', text)}
                            showPassword={showConfirmPassword}
                            handleTogglePassword={handleToggleConfirmPassword}
                        />

                        <TouchableOpacity
                            style={[styles.actionButton, styles.secondaryButton, loading && styles.actionButtonDisabled]}
                            onPress={handleChangePassword}
                            disabled={loading || !formData.currentPassword || !formData.newPassword || !formData.confirmPassword}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.actionButtonText}>Update Password</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Account Overview</Text>
                        <InfoItem label="User ID" value={user.uid} />
                        <InfoItem label="Account Created" value={formatDate(userData?.createdAt)} />

                        {userData?.role && (
                            <InfoItem
                                label="User Role"
                                value={userData.role.charAt(0).toUpperCase() + userData.role.slice(1)}
                                valueColor={PRIMARY_COLOR}
                            />
                        )}
                    </View>

                    <View style={styles.bottomSpacer} />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 20,
    },
    notSignedIn: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        backgroundColor: '#FFFFFF',
    },
    notSignedInTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: TEXT_COLOR,
        marginTop: 16,
        marginBottom: 8,
    },
    notSignedInText: {
        fontSize: 16,
        color: SUB_TEXT_COLOR,
        textAlign: 'center',
        lineHeight: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 18,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: BORDER_COLOR,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: TEXT_COLOR,
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: PRIMARY_COLOR + '10',
        borderRadius: 10,
    },
    cancelButton: {
        backgroundColor: BORDER_COLOR,
    },
    editButtonText: {
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 4,
    },
    editingBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: PRIMARY_COLOR + '10',
        padding: 12,
        marginHorizontal: 20,
        borderRadius: 12,
        marginBottom: 20,
    },
    editingBannerText: {
        marginLeft: 8,
        fontSize: 14,
        color: PRIMARY_COLOR,
        fontWeight: '600',
    },
    photoSection: {
        alignItems: 'center',
        paddingVertical: 30,
        paddingHorizontal: 20,
    },
    photoContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    profilePhoto: {
        width: 130,
        height: 130,
        borderRadius: 65,
        backgroundColor: BORDER_COLOR,
        borderWidth: 4,
        borderColor: '#FFFFFF',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 6,
    },
    changePhotoButton: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        backgroundColor: PRIMARY_COLOR,
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 4,
    },
    userName: {
        fontSize: 26,
        fontWeight: '800',
        color: TEXT_COLOR,
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 16,
        color: SUB_TEXT_COLOR,
        marginBottom: 10,
    },
    roleBadge: {
        backgroundColor: ACCENT_COLOR,
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        shadowColor: ACCENT_COLOR,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 3,
    },
    roleText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
    },
    card: {
        marginHorizontal: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 20,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 5,
        borderWidth: 1,
        borderColor: BORDER_COLOR,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: TEXT_COLOR,
        marginBottom: 20,
        borderBottomWidth: 2,
        borderBottomColor: PRIMARY_COLOR + '20',
        alignSelf: 'flex-start',
        paddingBottom: 5,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 15,
        fontWeight: '600',
        color: TEXT_COLOR,
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: BORDER_COLOR,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
    },
    inputFocused: {
        borderColor: PRIMARY_COLOR,
        borderWidth: 2,
        backgroundColor: PRIMARY_COLOR + '05',
    },
    inputDisabledContainer: {
        backgroundColor: BG_COLOR,
        borderColor: BORDER_COLOR,
    },
    input: {
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: TEXT_COLOR,
    },
    inputIcon: {
        paddingHorizontal: 16,
    },
    passwordToggle: {
        paddingHorizontal: 16,
    },
    actionButton: {
        backgroundColor: PRIMARY_COLOR,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
    },
    secondaryButton: {
        backgroundColor: ACCENT_COLOR,
    },
    actionButtonDisabled: {
        backgroundColor: '#9CA3AF',
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    infoItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: BORDER_COLOR,
    },
    infoLabel: {
        fontSize: 15,
        color: SUB_TEXT_COLOR,
        fontWeight: '500',
    },
    infoValue: {
        fontSize: 15,
        fontWeight: '600',
        textAlign: 'right',
        flex: 1,
        marginLeft: 10,
    },
    bottomSpacer: {
        height: 30,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        width: '100%',
        maxHeight: '75%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 25,
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: BORDER_COLOR,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: TEXT_COLOR,
    },
    closeButton: {
        padding: 5,
    },
    modalSection: {
        paddingHorizontal: 20,
        paddingTop: 20,
        alignItems: 'center',
    },
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: PRIMARY_COLOR,
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 12,
        marginBottom: 15,
        shadowColor: PRIMARY_COLOR,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 6,
    },
    uploadButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 10,
    },
    orText: {
        fontSize: 14,
        color: SUB_TEXT_COLOR,
        marginBottom: 15,
        fontWeight: '500',
    },
    avatarGrid: {
        paddingHorizontal: 15,
        paddingBottom: 25,
    },
    avatarOption: {
        flex: 1,
        margin: 5,
        aspectRatio: 1,
        borderWidth: 3,
        borderColor: 'transparent',
        borderRadius: 16,
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
        backgroundColor: BORDER_COLOR,
    },
    strengthContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
        paddingHorizontal: 5,
    },
    strengthLabel: {
        fontSize: 12,
        color: SUB_TEXT_COLOR,
        marginRight: 8,
    },
    strengthBarContainer: {
        flexDirection: 'row',
        flex: 1,
        height: 8,
        borderRadius: 8,
        backgroundColor: BORDER_COLOR,
        overflow: 'hidden',
    },
    strengthBarSegment: {
        flex: 1,
        height: '100%',
        marginRight: 2,
    },
    strengthStatus: {
        fontSize: 12,
        fontWeight: '700',
        marginLeft: 8,
        minWidth: 50,
        textAlign: 'right',
    }
});

export default ProfileScreen;