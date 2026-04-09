const admin = require('firebase-admin');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

// Initialize Firebase Admin SDK
// Using GitHub Student Pack - Firebase free tier
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || path.join(__dirname, 'firebase-key.json');

try {
    const serviceAccount = require(serviceAccountPath);
    
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'imssa-student-pack.appspot.com'
    });
    
    console.log('✅ Firebase Admin SDK initialized');
} catch (error) {
    console.warn('⚠️ Firebase service account file not found. Set FIREBASE_SERVICE_ACCOUNT_PATH in .env');
    console.warn('Get your credentials from Firebase Console → Project Settings → Service Accounts');
}

const bucket = admin.storage().bucket();

// File upload function with validation
exports.uploadFile = async (file, folderPath = 'submissions') => {
    try {
        const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
        const ALLOWED_TYPES = [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/psd',
            'application/vnd.adobe.photoshop',
            'text/plain',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            throw new Error(`File size exceeds 50MB limit. Size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
        }

        // Validate file type
        if (!ALLOWED_TYPES.includes(file.mimetype)) {
            throw new Error(`File type not allowed. Allowed: PDF, JPEG, PNG, PSD, TXT, DOC, DOCX`);
        }

        // Generate unique filename
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 10);
        const filename = `${timestamp}-${randomStr}-${file.originalname}`;
        const filepath = `${folderPath}/${filename}`;

        // Create file reference
        const fileRef = bucket.file(filepath);

        // Upload file
        await fileRef.save(file.buffer, {
            metadata: {
                contentType: file.mimetype,
                custom_time: new Date().toISOString()
            }
        });

        // Generate signed URL (valid for 7 days)
        const [url] = await fileRef.getSignedUrl({
            version: 'v4',
            action: 'read',
            expires: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        console.log(`✅ File uploaded: ${filepath}`);

        return {
            success: true,
            filename: filename,
            filepath: filepath,
            url: url,
            size: file.size,
            mimetype: file.mimetype
        };
    } catch (error) {
        console.error('❌ Firebase upload error:', error.message);
        throw error;
    }
};

// Delete file function
exports.deleteFile = async (filepath) => {
    try {
        await bucket.file(filepath).delete();
        console.log(`✅ File deleted: ${filepath}`);
        return true;
    } catch (error) {
        console.error('❌ Firebase delete error:', error.message);
        return false;
    }
};

// Get signed URL for existing file
exports.getSignedUrl = async (filepath, expiresIn = 7) => {
    try {
        const [url] = await bucket.file(filepath).getSignedUrl({
            version: 'v4',
            action: 'read',
            expires: Date.now() + expiresIn * 24 * 60 * 60 * 1000
        });
        return url;
    } catch (error) {
        console.error('❌ Error generating signed URL:', error.message);
        throw error;
    }
};

module.exports = { uploadFile, deleteFile, getSignedUrl };
