const express = require('express');
const router = express.Router();
const { getFirestore } = require('../config/firebaseAdmin');
const { verifyClerkToken } = require('../middleware/clerkAuth');

// Apply authentication middleware to all routes
router.use(verifyClerkToken);

/**
 * POST /api/cvs
 * Save a new CV version
 */
router.post('/', async (req, res) => {
    try {
        const { name, cvData, thumbnail } = req.body;
        const userId = req.userId;

        if (!name || !cvData) {
            return res.status(400).json({ error: 'Name and CV data are required' });
        }

        const db = getFirestore();
        const cvRef = db.collection('cvs').doc();

        const cvDocument = {
            userId,
            name,
            cvData,
            thumbnail: thumbnail || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        await cvRef.set(cvDocument);

        res.status(201).json({
            id: cvRef.id,
            ...cvDocument,
        });
    } catch (error) {
        if (error.code === 5) {
            console.error('\n!!! CRITICAL ERROR: Firestore Database Not Found !!!');
            console.error('Please go to the Firebase Console -> Build -> Firestore Database and click "Create database".\n');
        }
        console.error('Error saving CV:', error);
        res.status(500).json({ error: 'Failed to save CV' });
    }
});

/**
 * GET /api/cvs
 * Get all CVs for the authenticated user
 */
router.get('/', async (req, res) => {
    try {
        const userId = req.userId;
        const db = getFirestore();

        const snapshot = await db
            .collection('cvs')
            .where('userId', '==', userId)
            .orderBy('updatedAt', 'desc')
            .get();

        const cvs = [];
        snapshot.forEach((doc) => {
            cvs.push({
                id: doc.id,
                ...doc.data(),
            });
        });

        res.json(cvs);
    } catch (error) {
        if (error.code === 5) {
            console.error('\n!!! CRITICAL ERROR: Firestore Database Not Found !!!');
            console.error('Please go to the Firebase Console -> Build -> Firestore Database and click "Create database".\n');
        } else if (error.code === 9) {
            console.error('\n!!! ACTION REQUIRED: Firestore Index Required !!!');
            console.error('Firestore requires a composite index for this query. You can create it by clicking the link in the error trace above or below.\n');
        }
        console.error('Error fetching CVs:', error);
        res.status(500).json({ error: 'Failed to fetch CVs' });
    }
});

/**
 * GET /api/cvs/:id
 * Get a specific CV by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const db = getFirestore();

        const doc = await db.collection('cvs').doc(id).get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'CV not found' });
        }

        const cvData = doc.data();

        // Verify the CV belongs to the authenticated user
        if (cvData.userId !== userId) {
            return res.status(403).json({ error: 'Unauthorized access to this CV' });
        }

        res.json({
            id: doc.id,
            ...cvData,
        });
    } catch (error) {
        console.error('Error fetching CV:', error);
        res.status(500).json({ error: 'Failed to fetch CV' });
    }
});

/**
 * PUT /api/cvs/:id
 * Update an existing CV
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, cvData, thumbnail } = req.body;
        const userId = req.userId;
        const db = getFirestore();

        const docRef = db.collection('cvs').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'CV not found' });
        }

        const existingData = doc.data();

        // Verify the CV belongs to the authenticated user
        if (existingData.userId !== userId) {
            return res.status(403).json({ error: 'Unauthorized access to this CV' });
        }

        const updateData = {
            updatedAt: new Date().toISOString(),
        };

        if (name !== undefined) updateData.name = name;
        if (cvData !== undefined) updateData.cvData = cvData;
        if (thumbnail !== undefined) updateData.thumbnail = thumbnail;

        await docRef.update(updateData);

        const updatedDoc = await docRef.get();
        res.json({
            id: updatedDoc.id,
            ...updatedDoc.data(),
        });
    } catch (error) {
        console.error('Error updating CV:', error);
        res.status(500).json({ error: 'Failed to update CV' });
    }
});

/**
 * DELETE /api/cvs/:id
 * Delete a CV
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const db = getFirestore();

        const docRef = db.collection('cvs').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'CV not found' });
        }

        const cvData = doc.data();

        // Verify the CV belongs to the authenticated user
        if (cvData.userId !== userId) {
            return res.status(403).json({ error: 'Unauthorized access to this CV' });
        }

        await docRef.delete();

        res.json({ message: 'CV deleted successfully', id });
    } catch (error) {
        console.error('Error deleting CV:', error);
        res.status(500).json({ error: 'Failed to delete CV' });
    }
});

module.exports = router;
