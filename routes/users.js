const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

const User = require('../models/User');
const { sendVerifyMail } = require("../service/mailService");
const multer = require("multer");

const FILE_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg',
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const isValid = FILE_TYPE_MAP[file.mimetype];
        let uploadError = new Error('Invalid Image Type');
        if(isValid){
            uploadError = null
        }
        cb(uploadError, 'uploads/images/avatars/')
    },
    filename: function (req, file, cb) {
        const fileName = file.originalname.split('').join('-');
        const extension = FILE_TYPE_MAP[file.mimetype];
        cb(null, `${fileName}-${Date.now()}.${extension}`)
    }
})

const upload  = multer({ storage: storage })

router.get('/', async (req, res) =>{
    const userList = await User.find({ role: 0, verified_at: { $ne: null } }).select('-password');

    if(!userList) {
        return res.status(500).json({ success: false, message: 'No users found' });
    }

    res.status(200).send(userList);
})

router.get ('/:id', async (req, res) => {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
        res.status(500).json({ success: false, message: 'The user with the given ID not exists' })
    }

    if (user.verified_at === null) {
        return res.status(400).json({ success: false, message: 'User has not been verified' });
    }

    res.status(200).send(user)
})

router.post('/register', upload.single('profile_image_url'),async (req, res) => {
    const email = req.body.email.trim();
    const existingUserByEmail = await User.findOne({ email: email });

    if (existingUserByEmail) {
        return res.status(400).send('Email already exists');
    }

    const randomNum = Math.floor(Math.random() * 9) + 1;
    const basePath = `${req.protocol}://${req.get('host')}/uploads/images/avatars/`;
    let profile_image_url = `${basePath}${randomNum}.jpg`;
    const file = req.file;

    if (file) {
        const fileName = file.filename;
        profile_image_url = `${basePath}${fileName}`;
    }

    const currentTime = new Date().toISOString();

    let user = new User({
        full_name: req.body.full_name,
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password, 10),
        phone_number: req.body.phone_number,
        role: 0,
        profile_image_url: profile_image_url,
        created_at: currentTime,
        updated_at: currentTime,
        verified_at: null,
    })

    user = await user.save();

    await sendVerifyMail(req.body.email, user._id)

    if (!user)
        return res.status(404).send('User cannot be created')
    res.send(user);
})

router.get('/verify/:id', async (req, res) => {
    const user = await User.findByIdAndUpdate(req.params.id, {
        verified_at: Date.now()
    }, {
        new: true
    })

    if (!user)
        return res.status(404).send('User not found or verification failed')
    res.status(200).send('User verified successfully');
})

router.delete('/:id', (req, res) => {
    User.findByIdAndRemove(req.params.id).then(user => {
        if (user) {
            return res.status(200).json({ success: true, message: 'User deleted successfully' })
        } else {
            return res.status(404).json({ success: false, message: 'User cannot find' })
        }
    }).catch(err => {
        return res.status(400).json({ success: false, error: err })
    })
})

router.post('/login', async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
    const secret = process.env.secret;

    if (!user) {
        return res.status(400).send('User with given Email not found');
    }

    if (!user.verified_at) {
        return res.status(400).send( 'User has not been verified');
    }

    if (user && bcrypt.compareSync(req.body.password, user.password)) {
        const token = jwt.sign({
            userID: user.id,
            isAdmin: user.role === 1
        }, secret, { expiresIn: '1d' });

        return res.status(200).send({ user: user.email, token: token });
    } else {
        return res.status(400).send('Password is incorrect');
    }
})

router.get('/get/count', async (req, res) => {
    const userCount = await User.countDocuments((count) => count);
    if (!userCount) {
        res.status(500), json({ success: false })
    }
    res.status(200).send({
        userCount: userCount
    });
})

module.exports = router;