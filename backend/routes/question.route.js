import express from 'express';
import { router } from 'express';
import Question from '../models/question.model.js';

// GET all questions
router.get('/', async (req, res) => {
    try {
        const questions = await Question.find();
        res.json(questions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST a new question
router.post('/', async (req, res) => {
    const question = new Question(req.body);
    try {
        const savedQuestion = await question.save();
        res.status(201).json(savedQuestion);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;