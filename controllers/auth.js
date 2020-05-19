const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const crypto = require('crypto');
const { validationResult } = require('express-validator');

const sendEmail = require('../utils/sendEmail');
const User = require('../models/User');
const Token = require('../models/Token');

exports.register = async (req, res) => {
  // Validate
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password } = req.body;

  try {
    // If email exists
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ errors: [{ msg: 'User already exists' }] });
    }

    // Hash password and create user
    const salt = await bcrypt.genSalt(10);
    user = await User.create({
      name,
      email,
      password: await bcrypt.hash(password, salt),
    });

    // Create a verification token for this user
    const token = crypto.randomBytes(16).toString('hex');

    await Token.create({
      user: user._id,
      email: user.email,
      token: crypto.createHash('sha256').update(token).digest('hex'),
      tokenExpire: Date.now() + 24 * 60 * 60 * 1000,
    });

    // Send email
    const tokenUrl = `${req.protocol}://${req.get(
      'host'
    )}/api/auth/confirmation/${token}`;

    const message = `Hello ${user.name},\n\n Please verify your account by clicking the link below: \n\n ${tokenUrl}`;

    await sendEmail({
      email: user.email,
      subject: 'Account verification token',
      message,
    });

    res.status(200).json({
      msg: `A verification email has been sent to ${user.email}.`,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.confirmationEmail = async (req, res) => {
  // Get hashed token
  const confirmationToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  try {
    // Check token
    const token = await Token.findOne({
      token: confirmationToken,
      tokenExpire: { $gt: Date.now() },
    });

    if (!token) {
      return res.status(400).json({ msg: 'Invalid token' });
    }

    // Update status verified and email
    const user = await User.findByIdAndUpdate(
      token.user,
      { isVerified: true, email: token.email },
      { new: true }
    );

    // Delete token
    await Token.findByIdAndDelete(token._id);

    // Return jsonwebtoken
    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(
      payload,
      config.get('jwtSecret'),
      { expiresIn: 360000 },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
