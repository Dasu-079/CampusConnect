import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

export const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        student: true,
        teacher: true,
      },
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated. Please contact admin.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    let profileName = 'Admin';
    let details = null;

    if (user.role === 'STUDENT') {
      profileName = user.student?.name || '';
      details = user.student;
    } else if (user.role === 'TEACHER') {
      profileName = user.teacher?.name || '';
      details = user.teacher;
    }

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        isPasswordTemp: user.isPasswordTemp,
        name: profileName,
        details,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current password and new password are required.' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password.' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newHash,
        isPasswordTemp: false,
      },
    });

    return res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

export const verifyToken = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        student: true,
        teacher: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    let profileName = 'Admin';
    let details = null;

    if (user.role === 'STUDENT') {
      profileName = user.student?.name || '';
      details = user.student;
    } else if (user.role === 'TEACHER') {
      profileName = user.teacher?.name || '';
      details = user.teacher;
    }

    return res.json({
      id: user.id,
      username: user.username,
      role: user.role,
      isPasswordTemp: user.isPasswordTemp,
      name: profileName,
      details,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};
