const db = require('../config/db');

exports.getAllSkills = async (req, res) => {
    try {
        const [skills] = await db.execute('SELECT tag_id, name FROM skill_tag ORDER BY name ASC');
        res.json(skills);
    } catch (err) {
        console.error("Error fetching skills:", err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.createSkill = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ message: 'Skill name is required' });

        // Check if skill exists
        const [existing] = await db.execute('SELECT tag_id, name FROM skill_tag WHERE LOWER(name) = LOWER(?)', [name.trim()]);
        if (existing.length > 0) {
            return res.status(409).json({ message: 'Skill already exists', skill: existing[0] });
        }

        const [result] = await db.execute('INSERT INTO skill_tag (name) VALUES (?)', [name.trim()]);
        res.status(201).json({ 
            message: 'Skill created successfully', 
            skill: { tag_id: result.insertId, name: name.trim() }
        });
    } catch (err) {
        console.error("Error creating skill:", err);
        res.status(500).json({ message: 'Server Error' });
    }
};
